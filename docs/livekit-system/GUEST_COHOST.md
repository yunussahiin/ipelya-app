# LiveKit Guest & Co-Host Feature

> Creator'ın izleyicileri yayına davet etmesi ve çoklu konuk yönetimi

## Genel Bakış

Bu döküman, canlı yayın sırasında izleyicilerin yayına video/ses ile katılmasını sağlayan Guest/Co-Host sistemini tanımlar.

### Desteklenen Modlar

| Mod                 | Açıklama                           | MVP | Örnek          |
| ------------------- | ---------------------------------- | --- | -------------- |
| **Invite Guest**    | Creator izleyiciyi davet eder      | ✅   | Instagram Live |
| **Request to Join** | İzleyici katılma talebinde bulunur | ✅   | TikTok Live    |
| **Multi-Guest**     | 2-4 kişi aynı anda yayında         | 🔜   | Clubhouse      |

---

## 1. Teknik Altyapı

### LiveKit Permission Sistemi

LiveKit, runtime'da participant permission değişikliğini destekler:

```typescript
// Server-side: UpdateParticipant API
await roomService.updateParticipant(roomName, participantIdentity, undefined, {
  canPublish: true,      // Video/audio gönderebilir
  canSubscribe: true,    // Diğerlerini izleyebilir
  canPublishData: true,  // Data channel kullanabilir
});
```

**Önemli:** Permission değiştiğinde:
- Client'a `ParticipantPermissionChanged` event'i gönderilir
- `canPublish: false` yapılırsa track'ler otomatik unpublish olur
- Yeni token gerekmez, mevcut bağlantı üzerinden çalışır

### Role Transitions

```
┌──────────┐  invite   ┌──────────┐  accept   ┌──────────┐
│  VIEWER  │─────────►│ INVITED  │─────────►│ CO_HOST  │
└──────────┘          └────┬─────┘          └────┬─────┘
      ▲                    │ reject/timeout      │ end guest
      │                    ▼                     │
      └────────────────────┴─────────────────────┘
```

---

## 2. Veritabanı Değişiklikleri

### 2.1 live_participants Güncelleme

```sql
-- Mevcut role enum'a yeni değerler ekle
ALTER TABLE live_participants 
DROP CONSTRAINT IF EXISTS live_participants_role_check;

ALTER TABLE live_participants 
ADD CONSTRAINT live_participants_role_check 
CHECK (role IN (
  'host',           -- Yayın sahibi
  'co_host',        -- Konuk (video/audio yayınlıyor)
  'invited_guest',  -- Davet edildi, cevap bekleniyor
  'speaker',        -- Sesli oda konuşmacı
  'viewer',         -- İzleyici
  'listener'        -- Sesli oda dinleyici
));

-- Davet bilgisi için yeni alanlar
ALTER TABLE live_participants ADD COLUMN IF NOT EXISTS
  invited_at timestamptz,
  invitation_expires_at timestamptz,
  invitation_response text CHECK (invitation_response IN ('pending', 'accepted', 'rejected', 'expired'));
```

### 2.2 live_guest_requests Tablosu (Request to Join için)

```sql
CREATE TABLE public.live_guest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  requester_profile_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  message text,                    -- İsteğe bağlı mesaj
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  responded_by uuid REFERENCES auth.users(id),
  expires_at timestamptz DEFAULT (now() + interval '60 seconds')
);

-- Indexes
CREATE INDEX idx_guest_requests_session ON live_guest_requests(session_id) WHERE status = 'pending';
CREATE INDEX idx_guest_requests_requester ON live_guest_requests(requester_id);

-- RLS
ALTER TABLE live_guest_requests ENABLE ROW LEVEL SECURITY;

-- Host tüm istekleri görebilir
CREATE POLICY "host_view_requests" ON live_guest_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.creator_id = (SELECT auth.uid())
    )
  );

-- Requester kendi isteğini görebilir
CREATE POLICY "requester_view_own" ON live_guest_requests
  FOR SELECT USING (requester_id = (SELECT auth.uid()));

-- Authenticated users request oluşturabilir
CREATE POLICY "create_request" ON live_guest_requests
  FOR INSERT WITH CHECK (requester_id = (SELECT auth.uid()));
```

---

## 3. Edge Functions

### 3.1 invite-guest (Creator → Viewer)

```typescript
// supabase/functions/invite-guest/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RoomServiceClient } from 'https://esm.sh/livekit-server-sdk';

const INVITATION_TIMEOUT_SECONDS = 60;

serve(async (req) => {
  const { sessionId, targetUserId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Auth kontrolü
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Session ve host kontrolü
  const { data: session } = await supabase
    .from('live_sessions')
    .select('*, creator:profiles!creator_profile_id(*)')
    .eq('id', sessionId)
    .eq('creator_id', user.id) // Sadece host davet edebilir
    .eq('status', 'live')
    .single();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authorized or session not found' }), { status: 403 });
  }

  // Mevcut co_host sayısını kontrol et (max 3)
  const { count: coHostCount } = await supabase
    .from('live_participants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('role', 'co_host');

  if (coHostCount >= 3) {
    return new Response(JSON.stringify({ error: 'Maximum co-hosts reached' }), { status: 400 });
  }

  // Target user'ı bul ve participant kaydını güncelle
  const expiresAt = new Date(Date.now() + INVITATION_TIMEOUT_SECONDS * 1000);
  
  const { data: participant, error: updateError } = await supabase
    .from('live_participants')
    .update({
      role: 'invited_guest',
      invited_at: new Date().toISOString(),
      invitation_expires_at: expiresAt.toISOString(),
      invitation_response: 'pending',
    })
    .eq('session_id', sessionId)
    .eq('user_id', targetUserId)
    .eq('role', 'viewer') // Sadece viewer davet edilebilir
    .select()
    .single();

  if (updateError || !participant) {
    return new Response(JSON.stringify({ error: 'User not found in session' }), { status: 404 });
  }

  // Realtime ile davet bilgisini gönder
  await supabase.channel(`user:${targetUserId}`).send({
    type: 'broadcast',
    event: 'guest_invitation',
    payload: {
      sessionId,
      hostName: session.creator.display_name,
      hostAvatar: session.creator.avatar_url,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return new Response(JSON.stringify({ success: true, expiresAt }));
});
```

### 3.2 respond-guest-invitation (Accept/Reject)

```typescript
// supabase/functions/respond-guest-invitation/index.ts
serve(async (req) => {
  const { sessionId, accept } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Participant kaydını al
  const { data: participant } = await supabase
    .from('live_participants')
    .select('*, session:live_sessions(*)')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('role', 'invited_guest')
    .single();

  if (!participant) {
    return new Response(JSON.stringify({ error: 'No pending invitation' }), { status: 404 });
  }

  // Timeout kontrolü
  if (new Date(participant.invitation_expires_at) < new Date()) {
    await supabase
      .from('live_participants')
      .update({ role: 'viewer', invitation_response: 'expired' })
      .eq('id', participant.id);
    
    return new Response(JSON.stringify({ error: 'Invitation expired' }), { status: 410 });
  }

  if (!accept) {
    // Reddet
    await supabase
      .from('live_participants')
      .update({ role: 'viewer', invitation_response: 'rejected' })
      .eq('id', participant.id);

    // Host'a bildir
    await supabase.channel(`session:${sessionId}:host`).send({
      type: 'broadcast',
      event: 'invitation_rejected',
      payload: { userId: user.id },
    });

    return new Response(JSON.stringify({ success: true, accepted: false }));
  }

  // Kabul et - LiveKit permission güncelle
  const roomService = new RoomServiceClient(
    Deno.env.get('LIVEKIT_URL')!,
    Deno.env.get('LIVEKIT_API_KEY')!,
    Deno.env.get('LIVEKIT_API_SECRET')!
  );

  await roomService.updateParticipant(
    participant.session.livekit_room_name,
    user.id, // participant identity
    undefined, // metadata (değişmiyor)
    {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    }
  );

  // DB güncelle
  await supabase
    .from('live_participants')
    .update({ role: 'co_host', invitation_response: 'accepted' })
    .eq('id', participant.id);

  // Herkese bildir
  await supabase.channel(`session:${sessionId}`).send({
    type: 'broadcast',
    event: 'new_cohost',
    payload: { userId: user.id, userName: participant.display_name },
  });

  return new Response(JSON.stringify({ success: true, accepted: true }));
});
```

### 3.3 request-to-join (Viewer → Host)

```typescript
// supabase/functions/request-to-join/index.ts
serve(async (req) => {
  const { sessionId, message } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Session kontrolü
  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('status', 'live')
    .single();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
  }

  // Mevcut pending request kontrolü
  const { data: existingRequest } = await supabase
    .from('live_guest_requests')
    .select('id')
    .eq('session_id', sessionId)
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return new Response(JSON.stringify({ error: 'Request already pending' }), { status: 400 });
  }

  // Profile bilgisi
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('user_id', user.id)
    .eq('type', 'real')
    .single();

  // Request oluştur
  const { data: request, error } = await supabase
    .from('live_guest_requests')
    .insert({
      session_id: sessionId,
      requester_id: user.id,
      requester_profile_id: profile.id,
      message,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to create request' }), { status: 500 });
  }

  // Host'a bildir
  await supabase.channel(`session:${sessionId}:host`).send({
    type: 'broadcast',
    event: 'join_request',
    payload: {
      requestId: request.id,
      userId: user.id,
      userName: profile.display_name,
      userAvatar: profile.avatar_url,
      message,
    },
  });

  return new Response(JSON.stringify({ success: true, requestId: request.id }));
});
```

### 3.4 respond-join-request (Host responds)

```typescript
// supabase/functions/respond-join-request/index.ts
serve(async (req) => {
  const { requestId, approve } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Request ve session kontrolü
  const { data: request } = await supabase
    .from('live_guest_requests')
    .select('*, session:live_sessions(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request || request.session.creator_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
  }

  // Timeout kontrolü
  if (new Date(request.expires_at) < new Date()) {
    await supabase
      .from('live_guest_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    
    return new Response(JSON.stringify({ error: 'Request expired' }), { status: 410 });
  }

  const newStatus = approve ? 'approved' : 'rejected';

  await supabase
    .from('live_guest_requests')
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
      responded_by: user.id,
    })
    .eq('id', requestId);

  if (approve) {
    // LiveKit permission güncelle
    const roomService = new RoomServiceClient(
      Deno.env.get('LIVEKIT_URL')!,
      Deno.env.get('LIVEKIT_API_KEY')!,
      Deno.env.get('LIVEKIT_API_SECRET')!
    );

    await roomService.updateParticipant(
      request.session.livekit_room_name,
      request.requester_id,
      undefined,
      { canPublish: true, canSubscribe: true, canPublishData: true }
    );

    // Participant rolünü güncelle
    await supabase
      .from('live_participants')
      .update({ role: 'co_host' })
      .eq('session_id', request.session_id)
      .eq('user_id', request.requester_id);
  }

  // Requester'a bildir
  await supabase.channel(`user:${request.requester_id}`).send({
    type: 'broadcast',
    event: 'join_request_response',
    payload: { approved: approve, sessionId: request.session_id },
  });

  return new Response(JSON.stringify({ success: true, approved: approve }));
});
```

### 3.5 end-guest (Host → Co-Host'u kaldır)

```typescript
// supabase/functions/end-guest/index.ts
serve(async (req) => {
  const { sessionId, guestUserId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Session ve host kontrolü
  const { data: session } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('creator_id', user.id)
    .single();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
  }

  // LiveKit permission kaldır
  const roomService = new RoomServiceClient(
    Deno.env.get('LIVEKIT_URL')!,
    Deno.env.get('LIVEKIT_API_KEY')!,
    Deno.env.get('LIVEKIT_API_SECRET')!
  );

  await roomService.updateParticipant(
    session.livekit_room_name,
    guestUserId,
    undefined,
    { canPublish: false, canSubscribe: true, canPublishData: true }
  );

  // DB güncelle
  await supabase
    .from('live_participants')
    .update({ role: 'viewer' })
    .eq('session_id', sessionId)
    .eq('user_id', guestUserId)
    .eq('role', 'co_host');

  // Herkese bildir
  await supabase.channel(`session:${sessionId}`).send({
    type: 'broadcast',
    event: 'guest_ended',
    payload: { userId: guestUserId },
  });

  return new Response(JSON.stringify({ success: true }));
});
```

---

## 4. Mobile Implementation

### 4.1 useGuestInvitation Hook

```typescript
// hooks/useGuestInvitation.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Room, RoomEvent } from 'livekit-client';

interface GuestInvitation {
  sessionId: string;
  hostName: string;
  hostAvatar: string;
  expiresAt: string;
}

export function useGuestInvitation(room: Room | null, userId: string) {
  const [invitation, setInvitation] = useState<GuestInvitation | null>(null);
  const [isCoHost, setIsCoHost] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Realtime subscription for invitations
    const channel = supabase.channel(`user:${userId}`)
      .on('broadcast', { event: 'guest_invitation' }, (payload) => {
        setInvitation(payload.payload);
      })
      .on('broadcast', { event: 'join_request_response' }, (payload) => {
        if (payload.payload.approved) {
          setIsCoHost(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // LiveKit permission change listener
  useEffect(() => {
    if (!room) return;

    const handlePermissionChange = () => {
      const canPublish = room.localParticipant.permissions?.canPublish;
      setIsCoHost(canPublish === true);
      
      if (canPublish) {
        // Kamera ve mikrofonu aç
        room.localParticipant.setCameraEnabled(true);
        room.localParticipant.setMicrophoneEnabled(true);
      }
    };

    room.on(RoomEvent.ParticipantPermissionsChanged, handlePermissionChange);

    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, handlePermissionChange);
    };
  }, [room]);

  const acceptInvitation = useCallback(async () => {
    if (!invitation) return;

    const { error } = await supabase.functions.invoke('respond-guest-invitation', {
      body: { sessionId: invitation.sessionId, accept: true },
    });

    if (!error) {
      setInvitation(null);
    }
    return !error;
  }, [invitation]);

  const rejectInvitation = useCallback(async () => {
    if (!invitation) return;

    await supabase.functions.invoke('respond-guest-invitation', {
      body: { sessionId: invitation.sessionId, accept: false },
    });

    setInvitation(null);
  }, [invitation]);

  const requestToJoin = useCallback(async (sessionId: string, message?: string) => {
    const { data, error } = await supabase.functions.invoke('request-to-join', {
      body: { sessionId, message },
    });

    return { success: !error, requestId: data?.requestId };
  }, []);

  return {
    invitation,
    isCoHost,
    acceptInvitation,
    rejectInvitation,
    requestToJoin,
  };
}
```

### 4.2 GuestInvitationModal Component

```typescript
// components/live/GuestInvitationModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  visible: boolean;
  hostName: string;
  hostAvatar: string;
  expiresAt: string;
  onAccept: () => void;
  onReject: () => void;
}

export function GuestInvitationModal({ 
  visible, 
  hostName, 
  hostAvatar, 
  expiresAt, 
  onAccept, 
  onReject 
}: Props) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        onReject();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt]);

  if (!visible) return null;

  return (
    <Animated.View 
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
    >
      <Animated.View 
        entering={SlideInDown}
        style={[styles.modal, { backgroundColor: colors.surface }]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="videocam" size={32} color={colors.accent} />
        </View>

        <Image source={{ uri: hostAvatar }} style={styles.hostAvatar} />
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Yayına Davet
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: 'bold' }}>{hostName}</Text> sizi canlı yayına 
          konuk olarak davet ediyor
        </Text>

        <View style={[styles.timer, { backgroundColor: colors.backgroundRaised }]}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.timerText, { color: colors.textMuted }]}>
            {timeLeft} saniye
          </Text>
        </View>

        <View style={styles.buttons}>
          <Pressable 
            style={[styles.button, styles.rejectButton, { borderColor: colors.border }]}
            onPress={onReject}
          >
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
              Reddet
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.button, styles.acceptButton, { backgroundColor: colors.accent }]}
            onPress={onAccept}
          >
            <Ionicons name="videocam" size={18} color="#fff" />
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              Katıl
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          Kabul ettiğinizde kameranız ve mikrofonunuz açılacaktır
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rejectButton: {
    borderWidth: 1,
  },
  acceptButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
  },
});
```

### 4.3 HostGuestControls (Creator için)

```typescript
// components/live/HostGuestControls.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { supabase } from '@/lib/supabase';

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  role: string;
}

interface JoinRequest {
  id: string;
  requester_id: string;
  requester_profile: {
    display_name: string;
    avatar_url: string;
  };
  message?: string;
}

interface Props {
  sessionId: string;
  participants: Participant[];
  onInviteGuest: (userId: string) => void;
  onEndGuest: (userId: string) => void;
}

export function HostGuestControls({ sessionId, participants, onInviteGuest, onEndGuest }: Props) {
  const { colors } = useTheme();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'participants' | 'requests'>('participants');

  // Fetch and subscribe to join requests
  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('live_guest_requests')
        .select('*, requester_profile:profiles!requester_profile_id(*)')
        .eq('session_id', sessionId)
        .eq('status', 'pending');
      
      setJoinRequests(data || []);
    };

    fetchRequests();

    const channel = supabase.channel(`session:${sessionId}:host`)
      .on('broadcast', { event: 'join_request' }, (payload) => {
        setJoinRequests(prev => [...prev, payload.payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleApproveRequest = async (requestId: string) => {
    await supabase.functions.invoke('respond-join-request', {
      body: { requestId, approve: true },
    });
    setJoinRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.functions.invoke('respond-join-request', {
      body: { requestId, approve: false },
    });
    setJoinRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const viewers = participants.filter(p => p.role === 'viewer');
  const coHosts = participants.filter(p => p.role === 'co_host');

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'participants' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('participants')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'participants' ? colors.accent : colors.textMuted }]}>
            Katılımcılar ({viewers.length})
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'requests' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.accent : colors.textMuted }]}>
            İstekler ({joinRequests.length})
          </Text>
          {joinRequests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{joinRequests.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Co-Hosts Section */}
      {coHosts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Yayındaki Konuklar
          </Text>
          {coHosts.map(coHost => (
            <View key={coHost.id} style={styles.participantRow}>
              <Image source={{ uri: coHost.avatar_url }} style={styles.avatar} />
              <Text style={[styles.name, { color: colors.textPrimary }]}>{coHost.display_name}</Text>
              <Pressable 
                style={[styles.endButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => onEndGuest(coHost.user_id)}
              >
                <Text style={[styles.endButtonText, { color: colors.error }]}>Çıkar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Content based on tab */}
      {activeTab === 'participants' ? (
        <FlatList
          data={viewers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.participantRow}>
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              <Text style={[styles.name, { color: colors.textPrimary }]}>{item.display_name}</Text>
              {coHosts.length < 3 && (
                <Pressable 
                  style={[styles.inviteButton, { backgroundColor: colors.accent }]}
                  onPress={() => onInviteGuest(item.user_id)}
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.inviteButtonText}>Davet Et</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={joinRequests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              <Image source={{ uri: item.requester_profile.avatar_url }} style={styles.avatar} />
              <View style={styles.requestInfo}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {item.requester_profile.display_name}
                </Text>
                {item.message && (
                  <Text style={[styles.requestMessage, { color: colors.textMuted }]}>
                    "{item.message}"
                  </Text>
                )}
              </View>
              <View style={styles.requestActions}>
                <Pressable 
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => handleRejectRequest(item.id)}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={() => handleApproveRequest(item.id)}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="hand-left-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Henüz katılma isteği yok
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
```

---

## 5. UI/UX States

### Viewer States (Davet alan)

| State          | UI                              | Aksiyon                                 |
| -------------- | ------------------------------- | --------------------------------------- |
| `VIEWING`      | Normal izleme                   | "Katılmak İstiyorum" butonu (opsiyonel) |
| `REQUEST_SENT` | "İstek gönderildi" badge        | Bekleme                                 |
| `INVITED`      | Modal: "Yayına davet edildiniz" | Accept/Reject (60sn timeout)            |
| `ACCEPTING`    | Loading                         | Kamera/mic izni                         |
| `CO_HOST`      | Split screen, kendi video       | Mic/Cam kontrolleri                     |
| `ENDED_GUEST`  | Toast: "Konukluk sona erdi"     | Normal izlemeye dön                     |

### Host States

| State              | UI                           | Aksiyon                   |
| ------------------ | ---------------------------- | ------------------------- |
| `BROADCASTING`     | Normal yayın                 | Katılımcı listesi erişimi |
| `VIEWING_REQUESTS` | Request list panel           | Approve/Reject            |
| `INVITING`         | Participant seçimi           | "Davet Et" butonu         |
| `WAITING_RESPONSE` | "Cevap bekleniyor" indicator | -                         |
| `WITH_GUEST`       | Split/Mosaic view            | "Çıkar" butonu            |

---

## 6. Layout Modları

### Single Guest (1+1)

```
┌─────────────────────────────────┐
│                                 │
│         HOST (Büyük)            │
│                                 │
├─────────────────────────────────┤
│    GUEST (Küçük, alt köşe)      │
└─────────────────────────────────┘
```

### Multi-Guest (1+2, 1+3) - İleride

```
┌─────────────────────────────────┐
│         HOST (Büyük)            │
├─────────────────────────────────┤
│  GUEST 1  │  GUEST 2  │ GUEST 3 │
└─────────────────────────────────┘
```

---

## 7. Timeout & Error Handling

### Timeout Değerleri

| Aksiyon             | Timeout              | Sonuç                    |
| ------------------- | -------------------- | ------------------------ |
| Invitation response | 60 saniye            | Auto-reject, rol: viewer |
| Join request        | 60 saniye            | Auto-expire              |
| Guest session       | Yok (host kontrollü) | -                        |

### Error Scenarios

| Hata                     | UI                                        | Aksiyon               |
| ------------------------ | ----------------------------------------- | --------------------- |
| Kamera izni yok          | Alert: "Kamera izni gerekli"              | Settings'e yönlendir  |
| Max guest (3) aşıldı     | Toast: "Maksimum konuk sayısına ulaşıldı" | Davet engelle         |
| Guest disconnect         | Toast: "Konuk bağlantısı koptu"           | Auto-demote to viewer |
| Permission update failed | Toast: "Bir hata oluştu"                  | Retry veya iptal      |

---

## 8. Security & Abuse Prevention

- **Rate limit:** Aynı user 5 dakikada 1 request gönderebilir
- **Cooldown:** Reject sonrası 10 dakika bekleme
- **Ban kontrolü:** Banlı kullanıcılar davet edilemez/istek gönderemez
- **Max co-hosts:** Aynı anda maksimum 3 konuk

---

## 9. Roadmap

| Faz  | Özellik                   | Durum       |
| ---- | ------------------------- | ----------- |
| MVP  | Invite Guest (1+1)        | 🔴 Planlandı |
| MVP  | Request to Join           | 🔴 Planlandı |
| v1.1 | Multi-Guest (1+2)         | 🔜 Roadmap   |
| v1.2 | Multi-Guest (1+3)         | 🔜 Roadmap   |
| v2.0 | Screen sharing for guests | 🔜 Roadmap   |
