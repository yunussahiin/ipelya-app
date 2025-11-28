# Web Ops Mesajlaşma - UI Components

**Tarih:** 2025-11-28

---

## 🎨 Styling Kuralları

### CSS Variables (Zorunlu)

```tsx
// ✅ DOĞRU - CSS variables kullan
<div className="bg-background text-foreground border-border" />
<div className="bg-muted text-muted-foreground" />
<div className="bg-card text-card-foreground" />

// ❌ YANLIŞ - Hardcoded renkler
<div className="bg-gray-100 text-gray-900" />
<div className="bg-blue-500" />
```

### Dark Mode

```tsx
// Otomatik dark mode (CSS variables ile)
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Başlık</CardTitle>
  </CardHeader>
</Card>

// Semantic colors için dark: prefix
<Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
  Aktif
</Badge>
```

---

## 📦 Kullanıcı Mesajlaşma Yönetimi Components

### ConversationList

Kullanıcı sohbetlerini listeler.

```tsx
// components/messaging/ConversationList.tsx
interface ConversationListProps {
  conversations: Conversation[]
  isLoading: boolean
  onSelect: (id: string) => void
  selectedId?: string
}

export function ConversationList({ 
  conversations, 
  isLoading, 
  onSelect, 
  selectedId 
}: ConversationListProps) {
  if (isLoading) {
    return <ConversationListSkeleton />
  }

  if (conversations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Sohbet Bulunamadı</EmptyTitle>
          <EmptyDescription>
            Henüz kullanıcı sohbeti yok.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conversation={conv}
          isSelected={selectedId === conv.id}
          onClick={() => onSelect(conv.id)}
        />
      ))}
    </div>
  )
}
```

### ConversationListItem

Tek sohbet öğesi.

```tsx
// components/messaging/ConversationListItem.tsx
interface ConversationListItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export function ConversationListItem({ 
  conversation, 
  isSelected, 
  onClick 
}: ConversationListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={conversation.participants[0]?.avatar_url} />
        <AvatarFallback>
          {conversation.participants[0]?.display_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground truncate">
            {conversation.participants.map(p => p.display_name).join(', ')}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(conversation.last_message_at)}
          </span>
        </div>
        
        {conversation.last_message && (
          <p className="text-sm text-muted-foreground truncate">
            {conversation.last_message.content}
          </p>
        )}
      </div>
      
      {conversation.type === 'group' && (
        <Badge variant="secondary" className="shrink-0">
          Grup
        </Badge>
      )}
    </div>
  )
}
```

### MessageList

Mesaj listesi görüntüleme.

```tsx
// components/messaging/MessageList.tsx
interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function MessageList({ 
  messages, 
  isLoading, 
  hasMore, 
  onLoadMore 
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {hasMore && (
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Daha fazla yükle'}
        </Button>
      )}
      
      {messages.map((message, index) => (
        <MessageItem 
          key={message.id} 
          message={message}
          showDate={shouldShowDate(messages, index)}
        />
      ))}
    </div>
  )
}
```

### MessageItem

Tek mesaj görüntüleme.

```tsx
// components/messaging/MessageItem.tsx
interface MessageItemProps {
  message: Message
  showDate?: boolean
}

export function MessageItem({ message, showDate }: MessageItemProps) {
  return (
    <div className="space-y-2">
      {showDate && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            {formatDate(message.created_at)}
          </Badge>
        </div>
      )}
      
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender.avatar_url} />
          <AvatarFallback>
            {message.sender.display_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">
              {message.sender.display_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
            
            {message.is_shadow && (
              <Badge variant="outline" className="text-xs">
                <Ghost className="h-3 w-3 mr-1" />
                Shadow
              </Badge>
            )}
            
            {message.is_flagged && (
              <Badge variant="destructive" className="text-xs">
                <Flag className="h-3 w-3 mr-1" />
                Flagged
              </Badge>
            )}
          </div>
          
          {message.reply_to && (
            <div className="mt-1 p-2 rounded bg-muted border-l-2 border-border">
              <p className="text-xs text-muted-foreground">
                {message.reply_to.sender_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {message.reply_to.content}
              </p>
            </div>
          )}
          
          <div className="mt-1">
            {message.content_type === 'text' && (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {message.content}
              </p>
            )}
            
            {message.content_type === 'image' && (
              <div className="mt-2">
                <img 
                  src={message.media_url} 
                  alt="Mesaj görseli"
                  className="max-w-sm rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        </div>
        
        <ModerationActions message={message} />
      </div>
    </div>
  )
}
```

### ModerationActions

Moderasyon butonları.

```tsx
// components/messaging/ModerationActions.tsx
interface ModerationActionsProps {
  message: Message
}

export function ModerationActions({ message }: ModerationActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAction('flag')}>
          <Flag className="h-4 w-4 mr-2" />
          {message.is_flagged ? 'Flag Kaldır' : 'Flagle'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('hide')}>
          <EyeOff className="h-4 w-4 mr-2" />
          Gizle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAction('delete')}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### BroadcastChannelList

Broadcast kanalları listesi.

```tsx
// components/messaging/BroadcastChannelList.tsx
interface BroadcastChannelListProps {
  channels: BroadcastChannel[]
  isLoading: boolean
  onSelect: (id: string) => void
}

export function BroadcastChannelList({ 
  channels, 
  isLoading, 
  onSelect 
}: BroadcastChannelListProps) {
  return (
    <div className="space-y-2">
      {channels.map((channel) => (
        <Card 
          key={channel.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => onSelect(channel.id)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={channel.avatar_url} />
              <AvatarFallback>{channel.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {channel.name}
                </h3>
                <AccessTypeBadge type={channel.access_type} />
              </div>
              
              <p className="text-sm text-muted-foreground truncate">
                {channel.creator.display_name}
              </p>
            </div>
            
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {channel.member_count}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {channel.message_count}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## 💬 Admin Chat Components

### AdminChatSidebar

Admin sohbet listesi sidebar.

```tsx
// components/admin-chat/AdminChatSidebar.tsx
interface AdminChatSidebarProps {
  conversations: AdminConversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNewChat: () => void
}

export function AdminChatSidebar({ 
  conversations, 
  activeId, 
  onSelect, 
  onNewChat 
}: AdminChatSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Mesajlar</h2>
          <Button size="icon" variant="ghost" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <AdminChatItem
              key={conv.id}
              conversation={conv}
              isActive={activeId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

### AdminChatWindow

Admin sohbet penceresi.

```tsx
// components/admin-chat/AdminChatWindow.tsx
interface AdminChatWindowProps {
  conversationId: string
}

export function AdminChatWindow({ conversationId }: AdminChatWindowProps) {
  const { data: messages, isLoading } = useAdminMessages(conversationId)
  const { mutate: sendMessage } = useSendAdminMessage()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Realtime subscription
  useAdminChatRealtime(conversationId)

  return (
    <div className="flex flex-col h-full">
      <AdminChatHeader conversationId={conversationId} />
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <AdminChatSkeleton />
        ) : (
          messages?.map((message) => (
            <AdminMessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
      
      <AdminTypingIndicator conversationId={conversationId} />
      
      <AdminMessageInput 
        conversationId={conversationId}
        onSend={(content) => sendMessage({ conversationId, content })}
      />
    </div>
  )
}
```

### AdminMessageBubble

Admin mesaj balonu.

```tsx
// components/admin-chat/AdminMessageBubble.tsx
interface AdminMessageBubbleProps {
  message: AdminMessage
}

export function AdminMessageBubble({ message }: AdminMessageBubbleProps) {
  const { user } = useAuth()
  const isMine = message.sender.admin_id === user?.id

  return (
    <div className={cn(
      "flex gap-3",
      isMine && "flex-row-reverse"
    )}>
      {!isMine && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            {message.sender.full_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] space-y-1",
        isMine && "items-end"
      )}>
        {!isMine && (
          <span className="text-xs text-muted-foreground">
            {message.sender.full_name}
          </span>
        )}
        
        {message.reply_to && (
          <div className="p-2 rounded bg-muted border-l-2 border-primary text-sm">
            <p className="text-xs text-muted-foreground">
              {message.reply_to.sender_name}
            </p>
            <p className="text-muted-foreground truncate">
              {message.reply_to.content}
            </p>
          </div>
        )}
        
        <div className={cn(
          "rounded-lg px-4 py-2",
          isMine 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}>
          {message.content_type === 'text' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          {message.content_type === 'image' && (
            <img 
              src={message.media_url} 
              alt="Görsel"
              className="max-w-full rounded"
            />
          )}
          
          {message.content_type === 'file' && (
            <a 
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
            >
              <FileIcon className="h-4 w-4" />
              {message.media_metadata?.filename}
            </a>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isMine && "justify-end"
        )}>
          <span>{formatTime(message.created_at)}</span>
          {message.is_edited && <span>(düzenlendi)</span>}
        </div>
      </div>
    </div>
  )
}
```

### AdminMessageInput

Admin mesaj giriş alanı.

```tsx
// components/admin-chat/AdminMessageInput.tsx
interface AdminMessageInputProps {
  conversationId: string
  onSend: (content: string, options?: SendOptions) => void
  replyTo?: AdminMessage
  onCancelReply?: () => void
}

export function AdminMessageInput({ 
  conversationId, 
  onSend, 
  replyTo, 
  onCancelReply 
}: AdminMessageInputProps) {
  const [content, setContent] = useState('')
  const { setTyping } = useAdminTyping(conversationId)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setTyping(true)
  }

  const handleSend = () => {
    if (!content.trim()) return
    
    onSend(content, { replyToId: replyTo?.id })
    setContent('')
    setTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border p-4">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 p-2 rounded bg-muted">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {replyTo.sender.full_name}'a yanıt
            </p>
            <p className="text-sm truncate">{replyTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon">
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz..."
          className="min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />
        
        <Button 
          size="icon" 
          onClick={handleSend}
          disabled={!content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

### AdminTypingIndicator

Yazıyor göstergesi.

```tsx
// components/admin-chat/AdminTypingIndicator.tsx
interface AdminTypingIndicatorProps {
  conversationId: string
}

export function AdminTypingIndicator({ conversationId }: AdminTypingIndicatorProps) {
  const { typingAdmins } = useAdminChatStore()
  const typing = typingAdmins[conversationId] || []

  if (typing.length === 0) return null

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200" />
        </span>
        {typing.length === 1 
          ? `${typing[0]} yazıyor...`
          : `${typing.length} kişi yazıyor...`
        }
      </span>
    </div>
  )
}
```

### AdminOnlineIndicator

Online durumu göstergesi.

```tsx
// components/admin-chat/AdminOnlineIndicator.tsx
interface AdminOnlineIndicatorProps {
  adminId: string
  showText?: boolean
}

export function AdminOnlineIndicator({ adminId, showText }: AdminOnlineIndicatorProps) {
  const { onlineAdmins } = useAdminChatStore()
  const isOnline = onlineAdmins[adminId]

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500" : "bg-muted-foreground"
      )} />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
        </span>
      )}
    </div>
  )
}
```

---

## 🎨 Skeleton Components

### ConversationListSkeleton

```tsx
export function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### MessageListSkeleton

```tsx
export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-64 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

**Son Güncelleme:** 2025-11-28
