# React Native Gifted Chat - Entegrasyon Dokümantasyonu

## Genel Bakış

`react-native-gifted-chat` React Native için en kapsamlı chat UI kütüphanesidir. Mesaj listesi, input alanı, typing indicator, media desteği ve daha fazlasını hazır olarak sunar.

**GitHub:** https://github.com/FaridSafi/react-native-gifted-chat

## Neden Gifted Chat?

---

## Özellik Durumu

| Özellik                | Durum      | Açıklama                                 |
| ---------------------- | ---------- | ---------------------------------------- |
| ✅ System Messages      | Tamamlandı | `renderSystemMessage` eklendi            |
| ✅ Typing Indicator     | Tamamlandı | `useTypingIndicator` hook'u kullanılıyor |
| ✅ Türkçe Tarih         | Tamamlandı | "Bugün", "Dün", "25 Kasım" formatı       |
| ✅ Safe Area            | Tamamlandı | KeyboardAvoidingView ile                 |
| ✅ Skeleton Loading     | Tamamlandı | Animasyonlu skeleton bubble'lar          |
| ✅ Reply to Message     | Tamamlandı | Context menu + reply preview in bubble   |
| ✅ Long Press Actions   | Tamamlandı | Copy, reply, edit, delete menüsü         |
| ✅ Image/Video Messages | Tamamlandı | MediaPicker + Storage upload + render    |
| ✅ Image Viewer         | Tamamlandı | WhatsApp tarzı swipe gallery + toolbar   |
| ✅ Read Receipts        | Tamamlandı | useMarkAsRead hook + edge function       |
| ✅ Audio Messages       | Tamamlandı | AudioRecorder + AudioPlayer components   |
| ✅ Message Reactions    | Tamamlandı | ReactionBar + Emoji picker modal         |

---

### FlashList Sorunları
- Mesajlar tek tek yükleniyor (kötü UX)
- `inverted` prop ile scroll sorunları
- `initialScrollIndex` animasyon problemleri
- Karmaşık state yönetimi gerekiyor

### Gifted Chat Avantajları
- ✅ Chat için optimize edilmiş (inverted list built-in)
- ✅ Keyboard handling otomatik
- ✅ Typing indicator built-in
- ✅ Message status (sent/received/pending) built-in
- ✅ Media (image/video/audio) desteği
- ✅ Quick replies desteği
- ✅ System messages desteği
- ✅ Load earlier messages built-in
- ✅ Customizable (renderBubble, renderInputToolbar, vb.)

---
Quick Replies - Hızlı yanıt butonları
System Messages - Sistem mesajları
Message Status - Gönderildi/Okundu tikleri
Reply to Message - Mesaja yanıt
Long Press Actions - Uzun basma menüsü
Image/Video Messages - Medya desteği
Audio Messages - Ses mesajları
Custom Message Types - Özel mesaj tipleri

Swipe to Reply - Mesaja kaydırarak yanıt
Image/Video Messages - Medya mesajları
Audio Messages - Ses mesajları
Typing Indicator - Yazıyor göstergesi (zaten var)
Read Receipts - Okundu bilgisi (zaten var - ticks)
Message Reactions - Emoji tepkileri
Reply Preview - Yanıtlanan mesaj önizlemesi


## Kurulum

```bash
npx expo install react-native-gifted-chat react-native-reanimated react-native-keyboard-controller
```

> Not: `react-native-reanimated` ve `react-native-keyboard-controller` zaten projede yüklü olabilir.

---

## Mesaj Veri Yapısı

```typescript
interface IMessage {
  _id: string | number;           // Benzersiz mesaj ID
  text: string;                   // Mesaj içeriği
  createdAt: Date | number;       // Oluşturulma tarihi
  user: {
    _id: string | number;         // Kullanıcı ID
    name?: string;                // Kullanıcı adı
    avatar?: string;              // Avatar URL
  };
  image?: string;                 // Resim URL
  video?: string;                 // Video URL
  audio?: string;                 // Ses URL
  system?: boolean;               // Sistem mesajı mı?
  sent?: boolean;                 // Gönderildi (tek tik)
  received?: boolean;             // Alındı (çift tik)
  pending?: boolean;              // Beklemede (saat ikonu)
  quickReplies?: QuickReplies;    // Hızlı cevaplar
}
```

---

## Temel Kullanım

```tsx
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

function ChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Mesaj gönderme
  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: 1 }}
    />
  );
}
```

---

## Props Referansı

### Core Configuration
| Prop                 | Tip                 | Varsayılan  | Açıklama                                   |
| -------------------- | ------------------- | ----------- | ------------------------------------------ |
| `messages`           | `IMessage[]`        | `[]`        | Gösterilecek mesajlar                      |
| `user`               | `User`              | -           | Gönderen kullanıcı `{ _id, name, avatar }` |
| `onSend`             | `Function`          | -           | Mesaj gönderildiğinde callback             |
| `messageIdGenerator` | `Function`          | -           | Yeni mesajlar için ID üretici              |
| `locale`             | `string`            | -           | Tarih lokalizasyonu                        |
| `colorScheme`        | `'light' \| 'dark'` | `undefined` | Renk şeması                                |

### Keyboard & Layout
| Prop                        | Tip       | Varsayılan | Açıklama                         |
| --------------------------- | --------- | ---------- | -------------------------------- |
| `isInverted`                | `boolean` | `true`     | Mesaj sıralamasını tersine çevir |
| `isAlignedTop`              | `boolean` | `false`    | Mesajları üstten hizala          |
| `keyboardAvoidingViewProps` | `object`  | -          | KeyboardAvoidingView props       |

### Text Input & Composer
| Prop                        | Tip        | Varsayılan | Açıklama                      |
| --------------------------- | ---------- | ---------- | ----------------------------- |
| `text`                      | `string`   | -          | Input text (controlled)       |
| `initialText`               | `string`   | -          | Başlangıç text                |
| `isSendButtonAlwaysVisible` | `boolean`  | `false`    | Send butonu her zaman görünür |
| `minComposerHeight`         | `number`   | -          | Min composer yüksekliği       |
| `maxComposerHeight`         | `number`   | -          | Max composer yüksekliği       |
| `renderInputToolbar`        | `Function` | -          | Custom input toolbar          |
| `renderComposer`            | `Function` | -          | Custom text input             |
| `renderSend`                | `Function` | -          | Custom send button            |
| `renderActions`             | `Function` | -          | Custom action button (sol)    |
| `textInputProps`            | `object`   | -          | TextInput props               |

### Message Bubbles
| Prop                 | Tip        | Varsayılan | Açıklama                   |
| -------------------- | ---------- | ---------- | -------------------------- |
| `renderBubble`       | `Function` | -          | Custom mesaj balonu        |
| `renderMessageText`  | `Function` | -          | Custom mesaj text          |
| `renderMessageImage` | `Function` | -          | Custom mesaj resim         |
| `renderMessageVideo` | `Function` | -          | Custom mesaj video         |
| `renderCustomView`   | `Function` | -          | Balon içinde custom view   |
| `onPressMessage`     | `Function` | -          | Mesaja tıklama callback    |
| `onLongPressMessage` | `Function` | -          | Mesaja uzun basma callback |

### Avatars
| Prop                  | Tip        | Varsayılan | Açıklama                     |
| --------------------- | ---------- | ---------- | ---------------------------- |
| `renderAvatar`        | `Function` | -          | Custom avatar (null = gizle) |
| `isUserAvatarVisible` | `boolean`  | `false`    | Kendi avatarını göster       |
| `onPressAvatar`       | `Function` | -          | Avatara tıklama callback     |

### Date & Time
| Prop         | Tip        | Varsayılan | Açıklama          |
| ------------ | ---------- | ---------- | ----------------- |
| `timeFormat` | `string`   | `'LT'`     | Saat formatı      |
| `dateFormat` | `string`   | `'D MMMM'` | Tarih formatı     |
| `renderDay`  | `Function` | -          | Custom gün ayracı |
| `renderTime` | `Function` | -          | Custom saat       |

### Load Earlier Messages
| Prop                                               | Tip        | Varsayılan | Açıklama          |
| -------------------------------------------------- | ---------- | ---------- | ----------------- |
| `loadEarlierMessagesProps.isAvailable`             | `boolean`  | `false`    | Buton görünürlüğü |
| `loadEarlierMessagesProps.onPress`                 | `Function` | -          | Tıklama callback  |
| `loadEarlierMessagesProps.isLoading`               | `boolean`  | `false`    | Loading göster    |
| `loadEarlierMessagesProps.isInfiniteScrollEnabled` | `boolean`  | `false`    | Infinite scroll   |
| `renderLoadEarlier`                                | `Function` | -          | Custom buton      |

### Typing Indicator
| Prop                    | Tip        | Varsayılan | Açıklama                |
| ----------------------- | ---------- | ---------- | ----------------------- |
| `isTyping`              | `boolean`  | `false`    | Typing indicator göster |
| `renderTypingIndicator` | `Function` | -          | Custom typing indicator |
| `renderFooter`          | `Function` | -          | Custom footer           |

---

## İpelya Entegrasyonu

### Mesaj Dönüşümü

```typescript
// İpelya Message -> Gifted Chat IMessage
function toGiftedMessage(message: Message): IMessage {
  return {
    _id: message.id,
    text: message.content || '',
    createdAt: new Date(message.created_at),
    user: {
      _id: message.sender_id,
      name: message.sender_profile?.display_name,
      avatar: message.sender_profile?.avatar_url,
    },
    image: message.content_type === 'image' ? message.media_url : undefined,
    video: message.content_type === 'video' ? message.media_url : undefined,
    sent: message.status === 'sent',
    received: message.status === 'delivered' || message.status === 'read',
    pending: message.status === 'sending',
  };
}

// Gifted Chat IMessage -> İpelya CreateMessageRequest
function toCreateRequest(message: IMessage, conversationId: string): CreateMessageRequest {
  return {
    conversation_id: conversationId,
    content: message.text,
    content_type: message.image ? 'image' : message.video ? 'video' : 'text',
    media_url: message.image || message.video,
  };
}
```

### ChatScreen Entegrasyonu

```tsx
import { GiftedChat, IMessage, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import { useMessages, useSendMessage, useMessageRealtime } from '@/hooks/messaging';

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { mutate: sendMessage } = useSendMessage();
  
  // Realtime subscription
  useMessageRealtime(conversationId);

  // Mesajları Gifted Chat formatına dönüştür
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .flatMap(page => page.data)
      .map(toGiftedMessage);
  }, [data?.pages]);

  // Mesaj gönder
  const onSend = useCallback((newMessages: IMessage[] = []) => {
    const message = newMessages[0];
    sendMessage(toCreateRequest(message, conversationId));
  }, [conversationId, sendMessage]);

  // Eski mesajları yükle
  const onLoadEarlier = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{
        _id: user?.id || '',
        name: user?.user_metadata?.display_name,
        avatar: user?.user_metadata?.avatar_url,
      }}
      loadEarlierMessagesProps={{
        isAvailable: hasNextPage,
        onPress: onLoadEarlier,
        isLoading: isFetchingNextPage,
      }}
      // Customization
      renderBubble={renderBubble}
      renderInputToolbar={renderInputToolbar}
      renderSend={renderSend}
      // Styling
      timeFormat="HH:mm"
      dateFormat="D MMMM"
    />
  );
}
```

### Custom Bubble

```tsx
const renderBubble = (props: BubbleProps<IMessage>) => {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: colors.surface,
        },
        right: {
          backgroundColor: colors.accent,
        },
      }}
      textStyle={{
        left: {
          color: colors.textPrimary,
        },
        right: {
          color: '#fff',
        },
      }}
    />
  );
};
```

### Custom Input Toolbar

```tsx
const renderInputToolbar = (props: InputToolbarProps<IMessage>) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      }}
    />
  );
};
```

### Custom Send Button

```tsx
const renderSend = (props: SendProps<IMessage>) => {
  return (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Ionicons name="send" size={20} color={colors.accent} />
      </View>
    </Send>
  );
};
```

---

## Migrasyon Planı

### Adım 1: Kütüphaneyi Kur
```bash
npx expo install react-native-gifted-chat
```

### Adım 2: Mesaj Dönüşüm Fonksiyonları Oluştur
- `toGiftedMessage()` - API mesajını Gifted Chat formatına
- `toCreateRequest()` - Gifted Chat mesajını API formatına

### Adım 3: ChatScreen'i Güncelle
- FlashList'i kaldır
- GiftedChat component'ini ekle
- Custom bubble, input toolbar, send button ekle

### Adım 4: Realtime Entegrasyonu
- `useMessageRealtime` hook'unu güncelle
- Yeni mesajları `GiftedChat.append()` ile ekle

### Adım 5: Test
- Mesaj gönderme/alma
- Eski mesajları yükleme
- Typing indicator
- Media mesajları

---

## Audio Messages

### AudioRecorder Component
- Mikrofon ikonuna tıklayınca otomatik kayıt başlar
- Kayıt sırasında: İptal (X), Süre göstergesi, Durdur butonu
- Önizleme: Sil, Play/Pause, Gönder butonu
- `expo-av` kullanılıyor

### AudioPlayer Component
- Play/Pause butonu
- Progress bar (animasyonlu)
- Süre göstergesi (position / duration)
- Ses bittikten sonra tekrar oynatılabilir

### Kullanım
```tsx
// GiftedChat'e renderMessageAudio prop'u geçir
<GiftedChat
  renderMessageAudio={renderMessageAudio}
  ...
/>

// IMessage'da audio property'si kullan
const message = {
  _id: 1,
  audio: 'https://example.com/audio.m4a',
  audioDuration: 13, // saniye
  ...
};
```

---

## Message Reactions

### ReactionBar Component
- Mevcut tepkileri gösterir (emoji + count)
- Tıklayınca tepki ekler/kaldırır
- "+" butonu ile emoji picker açılır
- WhatsApp tarzı default emojiler: ❤️ 😂 😮 😢 😡 👍

### Kullanım
```tsx
// ChatBubble'a onReact ve onRemoveReaction prop'ları geçir
<ChatBubble
  onReact={(messageId, emoji) => addReaction({ messageId, emoji })}
  onRemoveReaction={(messageId, emoji) => removeReaction({ messageId, emoji })}
  ...
/>

// IMessageWithReply'da reactions property'si
interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}
```

---

## Notlar

- Gifted Chat kendi FlatList'ini kullanır (inverted)
- Keyboard handling otomatik
- `GiftedChat.append()` mesajları doğru sıraya ekler
- `isInverted={true}` varsayılan (en yeni mesaj altta)
