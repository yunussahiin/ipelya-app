/**
 * API: POST /api/ops/live/livekit-token
 * Admin için hidden viewer token üretir
 * Referans: LIVEKIT_REACT_INTEGRATION.md → Admin Token Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { AccessToken } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY || '';
const apiSecret = process.env.LIVEKIT_API_SECRET || '';
const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not configured');
      return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 });
    }

    // Auth kontrolü
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminSupabaseClient();

    // Admin profil kontrolü
    const { data: adminProfile } = await adminSupabase
      .from('admin_profiles')
      .select('id, is_active, full_name, email')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admin için özel token oluştur
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `admin_${user.id}`,
      name: `Admin: ${adminProfile.full_name || adminProfile.email || 'Admin'}`,
      metadata: JSON.stringify({
        role: 'admin_viewer',
        adminId: user.id,
        isAdmin: true,
      }),
      ttl: '1h', // Admin için 1 saat yeterli
    });

    // Admin sadece izleyebilir, yayın yapamaz ve görünmez
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: false,        // ❌ Yayın yapamaz
      canSubscribe: true,       // ✅ İzleyebilir
      canPublishData: false,    // ❌ Data gönderemez
      hidden: true,             // ✅ Katılımcı listesinde görünmez
    });

    const token = await at.toJwt();

    // NOT: view_session logu kaldırıldı - token yenileme nedeniyle çok fazla log oluşuyordu
    // Sadece önemli aksiyonlar (terminate, kick, ban vb.) loglanmalı

    return NextResponse.json({
      token,
      wsUrl: livekitUrl,
    });

  } catch (error) {
    console.error('LiveKit token API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
