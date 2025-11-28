/**
 * AI Tools Definition
 * Web Ops AI için veritabanı sorgulama tool'ları
 * 
 * Bu tool'lar Vercel AI SDK ile kullanılır ve LLM'in
 * İpelya veritabanını sorgulamasını sağlar.
 * 
 * NOT: assistant-ui'den sadece shadcn uyumlu UI componentlerini kullanıyoruz.
 * Runtime veya hook'larını kullanmıyoruz.
 */

import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// ============================================
// Zod Schemas
// ============================================

export const lookupUserSchema = z.object({
  identifier: z.string().describe('User ID (UUID), email adresi veya username'),
  identifierType: z
    .enum(['id', 'email', 'username'])
    .default('id')
    .describe('Arama tipi: id, email veya username'),
});

export const getRecentPostsSchema = z.object({
  limit: z.number().min(1).max(50).default(10).describe('Getirilecek post sayısı (max 50)'),
  userId: z.string().optional().describe('Belirli bir kullanıcının postları için user_id'),
  contentType: z
    .enum(['all', 'post', 'mini_post', 'voice_moment', 'poll'])
    .default('all')
    .describe('İçerik tipi filtresi'),
});

export const getSystemStatsSchema = z.object({
  period: z
    .enum(['today', 'week', 'month', 'all'])
    .default('today')
    .describe('İstatistik dönemi: today, week, month veya all'),
});

// NOT: Key sırası LLM'in ürettiği sıraya göre olmalı: role → limit → query
// assistant-ui argsText streaming'de sıra değişirse hata verir
export const searchUsersSchema = z.object({
  role: z.enum(['all', 'user', 'creator', 'admin']).default('all').describe('Rol filtresi'),
  limit: z.number().min(1).max(50).default(20).describe('Maksimum sonuç sayısı'),
  query: z.string().default('').describe('Arama terimi (boş bırakılırsa tüm kullanıcılar)'),
});

export const getModerationQueueSchema = z.object({
  status: z
    .enum(['pending', 'approved', 'rejected', 'all'])
    .default('pending')
    .describe('Moderasyon durumu filtresi'),
  limit: z.number().min(1).max(50).default(20).describe('Maksimum sonuç sayısı'),
  reason: z.string().optional().describe('Rapor nedeni filtresi'),
});

export const getPostDetailsSchema = z.object({
  postId: z.string().describe('Post ID (UUID)'),
});

// ============================================
// Yeni Tool Schemas
// ============================================

export const getUserActivitySchema = z.object({
  userId: z.string().describe('Kullanıcı ID (UUID)'),
  activityType: z
    .enum(['all', 'posts', 'comments', 'likes', 'messages', 'logins'])
    .default('all')
    .describe('Aktivite tipi filtresi'),
  limit: z.number().min(1).max(100).default(20).describe('Maksimum sonuç sayısı'),
  period: z
    .enum(['today', 'week', 'month', 'all'])
    .default('week')
    .describe('Zaman dilimi'),
});

export const banUserSchema = z.object({
  userId: z.string().describe('Banlanacak kullanıcı ID'),
  reason: z.string().min(5).describe('Ban nedeni (min 5 karakter)'),
  duration: z
    .enum(['permanent', '1d', '7d', '30d', '90d'])
    .default('permanent')
    .describe('Ban süresi'),
});

export const unbanUserSchema = z.object({
  userId: z.string().describe('Banı kaldırılacak kullanıcı ID'),
  reason: z.string().min(5).describe('Unban nedeni'),
});

export const getContentReportsSchema = z.object({
  status: z
    .enum(['pending', 'reviewed', 'actioned', 'dismissed', 'all'])
    .default('pending')
    .describe('Rapor durumu'),
  reportType: z
    .enum(['spam', 'harassment', 'inappropriate', 'copyright', 'other', 'all'])
    .default('all')
    .describe('Rapor tipi'),
  limit: z.number().min(1).max(50).default(20).describe('Maksimum sonuç sayısı'),
});

export const reviewReportSchema = z.object({
  reportId: z.string().describe('Rapor ID'),
  action: z
    .enum(['dismiss', 'warn_user', 'hide_content', 'delete_content', 'ban_user'])
    .describe('Alınacak aksiyon'),
  notes: z.string().min(5).describe('İnceleme notları'),
});

export const sendNotificationSchema = z.object({
  userId: z.string().describe('Bildirim gönderilecek kullanıcı ID'),
  title: z.string().min(3).max(100).describe('Bildirim başlığı'),
  body: z.string().min(5).max(500).describe('Bildirim içeriği'),
  type: z
    .enum(['system', 'warning', 'info', 'promotion'])
    .default('system')
    .describe('Bildirim tipi'),
});

export const getUserTransactionsSchema = z.object({
  userId: z.string().describe('Kullanıcı ID'),
  transactionType: z
    .enum(['all', 'purchase', 'spend', 'earn', 'refund'])
    .default('all')
    .describe('İşlem tipi'),
  limit: z.number().min(1).max(100).default(20).describe('Maksimum sonuç sayısı'),
  period: z
    .enum(['today', 'week', 'month', 'all'])
    .default('month')
    .describe('Zaman dilimi'),
});

export const getUserBalanceSchema = z.object({
  userId: z.string().describe('Kullanıcı ID'),
});

export const getConversationsSchema = z.object({
  userId: z.string().optional().describe('Belirli kullanıcının sohbetleri'),
  limit: z.number().min(1).max(50).default(20).describe('Maksimum sonuç sayısı'),
  includeLastMessage: z.boolean().default(true).describe('Son mesajı dahil et'),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().describe('Sohbet ID'),
  limit: z.number().min(1).max(100).default(50).describe('Maksimum mesaj sayısı'),
});

export const getCreatorStatsSchema = z.object({
  creatorId: z.string().describe('Creator ID'),
  period: z
    .enum(['today', 'week', 'month', 'all'])
    .default('month')
    .describe('Zaman dilimi'),
});

export const getSecurityLogsSchema = z.object({
  userId: z.string().optional().describe('Belirli kullanıcının logları'),
  logType: z
    .enum(['all', 'login', 'password_change', 'shadow_mode', 'screenshot'])
    .default('all')
    .describe('Log tipi'),
  limit: z.number().min(1).max(100).default(50).describe('Maksimum sonuç sayısı'),
  period: z
    .enum(['today', 'week', 'month'])
    .default('week')
    .describe('Zaman dilimi'),
});

export const hidePostSchema = z.object({
  postId: z.string().describe('Gizlenecek post ID'),
  reason: z.string().min(5).describe('Gizleme nedeni'),
});

export const deletePostSchema = z.object({
  postId: z.string().describe('Silinecek post ID'),
  reason: z.string().min(5).describe('Silme nedeni'),
  notifyUser: z.boolean().default(true).describe('Kullanıcıyı bilgilendir'),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Hassas alanları maskele
 */
function maskSensitiveData(value: string | null, visibleChars = 3): string {
  if (!value) return 'N/A';
  if (value.length <= visibleChars * 2) return '***';
  return `${value.slice(0, visibleChars)}***${value.slice(-visibleChars)}`;
}

/**
 * Email'i maskele
 */
function maskEmail(email: string | null): string {
  if (!email) return 'N/A';
  const [local, domain] = email.split('@');
  if (!domain) return maskSensitiveData(email);
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Tarih formatla
 */
function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Zaman farkını hesapla
 */
function getTimeAgo(date: string | null): string {
  if (!date) return 'N/A';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return formatDate(date);
}

// ============================================
// Tool Execute Functions
// ============================================

/**
 * Kullanıcı bilgilerini sorgula
 */
export async function executeLookupUser({
  identifier,
  identifierType,
}: z.infer<typeof lookupUserSchema>) {
  const supabase = createAdminSupabaseClient();

  // Kullanıcıyı bul
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('type', 'real');

  if (identifierType === 'id') {
    query = query.eq('user_id', identifier);
  } else if (identifierType === 'email') {
    query = query.ilike('email', identifier);
  } else {
    query = query.ilike('username', identifier);
  }

  const { data: profile, error } = await query.single();

  if (error || !profile) {
    return {
      success: false,
      error: `Kullanıcı bulunamadı: ${identifier} (${identifierType})`,
    };
  }

  // Post sayısını al
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  // Takipçi sayısını al
  const { count: followerCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  // Takip edilen sayısını al
  const { count: followingCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  return {
    success: true,
    user: {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username || 'Belirlenmemiş',
      display_name: profile.display_name || 'Belirlenmemiş',
      email: maskEmail(profile.email),
      phone: maskSensitiveData(profile.phone),
      role: profile.role || 'user',
      is_creator: profile.is_creator,
      is_verified: profile.is_verified,
      is_active: profile.is_active,
      gender: profile.gender || 'Belirlenmemiş',
      bio: profile.bio || 'Bio yok',
      location: profile.location || 'Belirlenmemiş',
      mood: profile.mood,
      energy: profile.energy,
      personality: profile.personality,
      favorite_vibe: profile.favorite_vibe,
      vibe_preferences: profile.vibe_preferences,
      avatar_url: profile.avatar_url ? 'Mevcut' : 'Yok',
      cover_url: profile.cover_url ? 'Mevcut' : 'Yok',
      created_at: formatDate(profile.created_at),
      last_login_at: getTimeAgo(profile.last_login_at),
      banned_until: profile.banned_until ? formatDate(profile.banned_until) : null,
      onboarding_completed: !!profile.onboarding_completed_at,
      shadow_profile_active: profile.shadow_profile_active,
      biometric_enabled: profile.biometric_enabled,
    },
    stats: {
      post_count: postCount || 0,
      follower_count: followerCount || 0,
      following_count: followingCount || 0,
    },
    device_info: profile.last_device_info || null,
  };
}

/**
 * Son paylaşılan postları getir
 */
export async function executeGetRecentPosts({
  limit,
  userId,
  contentType,
}: z.infer<typeof getRecentPostsSchema>) {
  const supabase = createAdminSupabaseClient();

  // Profile type for the joined data
  interface PostProfile {
    username: string;
    display_name: string;
    is_creator: boolean;
    is_verified: boolean;
  }

  let query = supabase
    .from('posts')
    .select(`
      id,
      content_type,
      caption,
      is_nsfw,
      is_premium,
      visibility,
      status,
      created_at,
      like_count,
      comment_count,
      share_count,
      view_count,
      profile:profiles!posts_profile_id_fkey (
        username,
        display_name,
        is_creator,
        is_verified
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();

    if (profile) {
      query = query.eq('profile_id', profile.id);
    }
  }

  if (contentType !== 'all') {
    query = query.eq('content_type', contentType);
  }

  const { data: posts, error } = await query;

  if (error) {
    return {
      success: false,
      error: `Postlar alınamadı: ${error.message}`,
    };
  }

  return {
    success: true,
    count: posts?.length || 0,
    posts: posts?.map((post) => {
      const profile = post.profile as unknown as PostProfile | null;
      return {
        id: post.id,
        content_type: post.content_type,
        caption: post.caption?.slice(0, 100) + (post.caption && post.caption.length > 100 ? '...' : ''),
        is_nsfw: post.is_nsfw,
        is_premium: post.is_premium,
        visibility: post.visibility,
        status: post.status,
        created_at: getTimeAgo(post.created_at),
        engagement: {
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          shares: post.share_count || 0,
          views: post.view_count || 0,
        },
        author: profile ? {
          username: profile.username,
          display_name: profile.display_name,
          is_creator: profile.is_creator,
          is_verified: profile.is_verified,
        } : null,
      };
    }),
  };
}

/**
 * Platform istatistiklerini getir
 */
export async function executeGetSystemStats({
  period,
}: z.infer<typeof getSystemStatsSchema>) {
  const supabase = createAdminSupabaseClient();

  // Tarih filtresi hesapla
  const now = new Date();
  let startDate: Date | null = null;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'all':
      startDate = null;
      break;
  }

  const dateFilter = startDate ? startDate.toISOString() : null;

  // Toplam kullanıcı sayısı
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'real');

  // Aktif kullanıcı sayısı (son 24 saat)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'real')
    .gte('last_login_at', yesterday);

  // Yeni kayıtlar
  let newUsersQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'real');

  if (dateFilter) {
    newUsersQuery = newUsersQuery.gte('created_at', dateFilter);
  }
  const { count: newUsers } = await newUsersQuery;

  // Creator sayısı
  const { count: creatorCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'real')
    .eq('is_creator', true);

  // Post sayısı
  let postsQuery = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (dateFilter) {
    postsQuery = postsQuery.gte('created_at', dateFilter);
  }
  const { count: postCount } = await postsQuery;

  // Yorum sayısı
  let commentsQuery = supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });

  if (dateFilter) {
    commentsQuery = commentsQuery.gte('created_at', dateFilter);
  }
  const { count: commentCount } = await commentsQuery;

  // Mesaj sayısı
  let messagesQuery = supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  if (dateFilter) {
    messagesQuery = messagesQuery.gte('created_at', dateFilter);
  }
  const { count: messageCount } = await messagesQuery;

  // Moderasyon kuyruğu
  const { count: pendingModeration } = await supabase
    .from('moderation_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    success: true,
    period,
    stats: {
      users: {
        total: totalUsers || 0,
        active_24h: activeUsers || 0,
        new_in_period: newUsers || 0,
        creators: creatorCount || 0,
      },
      content: {
        posts: postCount || 0,
        comments: commentCount || 0,
        messages: messageCount || 0,
      },
      moderation: {
        pending_queue: pendingModeration || 0,
      },
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * Kullanıcı ara veya listele (çoklu sonuç)
 */
export async function executeSearchUsers({
  query,
  limit = 20,
  role = 'all',
}: z.infer<typeof searchUsersSchema>) {
  const supabase = createAdminSupabaseClient();

  let dbQuery = supabase
    .from('profiles')
    .select('id, user_id, username, display_name, email, role, is_creator, is_verified, is_active, created_at, last_login_at')
    .eq('type', 'real')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Query varsa filtrele
  if (query && query.trim().length > 0) {
    dbQuery = dbQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  if (role !== 'all') {
    dbQuery = dbQuery.eq('role', role);
  }

  const { data: users, error } = await dbQuery;

  if (error) {
    return {
      success: false,
      error: `Arama başarısız: ${error.message}`,
    };
  }

  return {
    success: true,
    query: query || '(tüm kullanıcılar)',
    count: users?.length || 0,
    users: users?.map((user) => ({
      id: user.id,
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name,
      email: user.email || null,
      role: user.role,
      is_creator: user.is_creator,
      is_verified: user.is_verified,
      is_active: user.is_active,
      created_at: formatDate(user.created_at),
      last_login: getTimeAgo(user.last_login_at),
    })),
  };
}

/**
 * Moderasyon kuyruğunu getir
 */
export async function executeGetModerationQueue({
  status,
  limit,
  reason,
}: z.infer<typeof getModerationQueueSchema>) {
  const supabase = createAdminSupabaseClient();

  interface ReporterProfile {
    username: string;
  }

  interface ReviewerProfile {
    full_name: string;
  }

  let query = supabase
    .from('moderation_queue')
    .select(`
      id,
      content_type,
      content_id,
      reason,
      status,
      priority,
      created_at,
      reviewed_at,
      reporter:profiles!moderation_queue_reporter_id_fkey (
        username
      ),
      reviewed_by:admin_profiles!moderation_queue_reviewed_by_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (reason) {
    query = query.ilike('reason', `%${reason}%`);
  }

  const { data: items, error } = await query;

  if (error) {
    return {
      success: false,
      error: `Moderasyon kuyruğu alınamadı: ${error.message}`,
    };
  }

  return {
    success: true,
    status_filter: status,
    count: items?.length || 0,
    items: items?.map((item) => {
      const reporter = item.reporter as unknown as ReporterProfile | null;
      const reviewer = item.reviewed_by as unknown as ReviewerProfile | null;
      return {
        id: item.id,
        content_type: item.content_type,
        content_id: item.content_id,
        reason: item.reason,
        status: item.status,
        priority: item.priority,
        created_at: getTimeAgo(item.created_at),
        reviewed_at: item.reviewed_at ? formatDate(item.reviewed_at) : null,
        reporter: reporter?.username || 'Sistem',
        reviewed_by: reviewer?.full_name || null,
      };
    }),
  };
}

/**
 * Post detaylarını getir
 */
export async function executeGetPostDetails({
  postId,
}: z.infer<typeof getPostDetailsSchema>) {
  const supabase = createAdminSupabaseClient();

  interface PostAuthor {
    id: string;
    username: string;
    display_name: string;
    is_creator: boolean;
    is_verified: boolean;
  }

  interface CommentAuthor {
    username: string;
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_profile_id_fkey (
        id,
        username,
        display_name,
        is_creator,
        is_verified
      )
    `)
    .eq('id', postId)
    .single();

  if (error || !post) {
    return {
      success: false,
      error: `Post bulunamadı: ${postId}`,
    };
  }

  // Son yorumları al
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      profile:profiles!comments_profile_id_fkey (
        username
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Moderasyon geçmişi
  const { data: moderationHistory } = await supabase
    .from('moderation_actions')
    .select('action_type, reason, created_at')
    .eq('content_id', postId)
    .eq('content_type', 'post')
    .order('created_at', { ascending: false })
    .limit(5);

  const author = post.profile as unknown as PostAuthor | null;

  return {
    success: true,
    post: {
      id: post.id,
      content_type: post.content_type,
      caption: post.caption,
      is_nsfw: post.is_nsfw,
      is_premium: post.is_premium,
      visibility: post.visibility,
      status: post.status,
      created_at: formatDate(post.created_at),
      updated_at: post.updated_at ? formatDate(post.updated_at) : null,
      engagement: {
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        shares: post.share_count || 0,
        views: post.view_count || 0,
        saves: post.save_count || 0,
      },
      author: author ? {
        id: author.id,
        username: author.username,
        display_name: author.display_name,
        is_creator: author.is_creator,
        is_verified: author.is_verified,
      } : null,
    },
    recent_comments: comments?.map((c) => {
      const commentAuthor = c.profile as unknown as CommentAuthor | null;
      return {
        id: c.id,
        content: c.content?.slice(0, 100),
        author: commentAuthor?.username || 'Anonim',
        created_at: getTimeAgo(c.created_at),
      };
    }) || [],
    moderation_history: moderationHistory || [],
  };
}

// ============================================
// Yeni Execute Fonksiyonları
// ============================================

/**
 * Kullanıcı aktivitesini getir
 */
export async function executeGetUserActivity({
  userId,
  activityType,
  limit,
  period,
}: z.infer<typeof getUserActivitySchema>) {
  const supabase = createAdminSupabaseClient();
  
  const periodFilter = getPeriodFilter(period);
  const activities: Array<{type: string; description: string; created_at: string}> = [];

  // Posts
  if (activityType === 'all' || activityType === 'posts') {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, caption, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    posts?.forEach(p => activities.push({
      type: 'post',
      description: p.caption?.slice(0, 50) || 'Post paylaşıldı',
      created_at: p.created_at,
    }));
  }

  // Likes
  if (activityType === 'all' || activityType === 'likes') {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    likes?.forEach(l => activities.push({
      type: 'like',
      description: 'Post beğenildi',
      created_at: l.created_at,
    }));
  }

  // Messages
  if (activityType === 'all' || activityType === 'messages') {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('sender_id', userId)
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    messages?.forEach(m => activities.push({
      type: 'message',
      description: 'Mesaj gönderildi',
      created_at: m.created_at,
    }));
  }

  // Sort by date
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    success: true,
    userId,
    period,
    activityType,
    count: activities.length,
    activities: activities.slice(0, limit).map(a => ({
      ...a,
      created_at: getTimeAgo(a.created_at),
    })),
  };
}

/**
 * Period filter helper
 */
function getPeriodFilter(period: string): string {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case 'week':
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    default:
      return '1970-01-01T00:00:00.000Z';
  }
}

/**
 * Kullanıcıyı banla
 */
export async function executeBanUser({
  userId,
  reason,
  duration,
}: z.infer<typeof banUserSchema>) {
  const supabase = createAdminSupabaseClient();

  // Kullanıcıyı kontrol et
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, username, is_active')
    .eq('user_id', userId)
    .single();

  if (userError || !user) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }

  // Ban süresini hesapla
  let lockedUntil: string | null = null;
  if (duration !== 'permanent') {
    const days = parseInt(duration.replace('d', ''));
    const until = new Date();
    until.setDate(until.getDate() + days);
    lockedUntil = until.toISOString();
  }

  // User lock kaydı oluştur
  const { error: lockError } = await supabase
    .from('user_locks')
    .insert({
      user_id: userId,
      reason,
      locked_until: lockedUntil,
      status: 'active',
    });

  if (lockError) {
    return { success: false, error: `Ban işlemi başarısız: ${lockError.message}` };
  }

  // Profili deaktif et
  await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('user_id', userId);

  return {
    success: true,
    message: `${user.username} başarıyla banlandı`,
    userId,
    duration,
    lockedUntil,
    reason,
  };
}

/**
 * Kullanıcının banını kaldır
 */
export async function executeUnbanUser({
  userId,
  reason,
}: z.infer<typeof unbanUserSchema>) {
  const supabase = createAdminSupabaseClient();

  // Aktif ban'ı bul
  const { data: lock, error: lockError } = await supabase
    .from('user_locks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (lockError || !lock) {
    return { success: false, error: 'Aktif ban bulunamadı' };
  }

  // Ban'ı kaldır
  await supabase
    .from('user_locks')
    .update({ status: 'unlocked' })
    .eq('id', lock.id);

  // Profili aktif et
  await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('user_id', userId);

  return {
    success: true,
    message: 'Ban başarıyla kaldırıldı',
    userId,
    reason,
  };
}

/**
 * İçerik raporlarını getir
 */
export async function executeGetContentReports({
  status,
  reportType,
  limit,
}: z.infer<typeof getContentReportsSchema>) {
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('content_reports')
    .select(`
      id,
      content_type,
      content_id,
      reason,
      description,
      status,
      created_at,
      reporter:profiles!content_reports_reporter_id_fkey (
        username
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (reportType !== 'all') {
    query = query.eq('reason', reportType);
  }

  const { data: reports, error } = await query;

  if (error) {
    return { success: false, error: `Raporlar alınamadı: ${error.message}` };
  }

  return {
    success: true,
    count: reports?.length || 0,
    reports: reports?.map(r => ({
      id: r.id,
      content_type: r.content_type,
      content_id: r.content_id,
      reason: r.reason,
      description: r.description?.slice(0, 100),
      status: r.status,
      reporter: (r.reporter as unknown as { username: string } | null)?.username || 'Anonim',
      created_at: getTimeAgo(r.created_at),
    })),
  };
}

/**
 * Bildirim gönder
 */
export async function executeSendNotification({
  userId,
  title,
  body,
  type,
}: z.infer<typeof sendNotificationSchema>) {
  const supabase = createAdminSupabaseClient();

  // Kullanıcıyı kontrol et
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('user_id', userId)
    .single();

  if (userError || !user) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }

  // Bildirim oluştur
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: userId,
      type: type === 'system' ? 'system_alert' : type,
      title,
      body,
      data: { admin_sent: true },
    });

  if (notifError) {
    return { success: false, error: `Bildirim gönderilemedi: ${notifError.message}` };
  }

  return {
    success: true,
    message: `Bildirim ${user.username} kullanıcısına gönderildi`,
    userId,
    title,
    type,
  };
}

/**
 * Kullanıcı işlemlerini getir
 */
export async function executeGetUserTransactions({
  userId,
  transactionType,
  limit,
  period,
}: z.infer<typeof getUserTransactionsSchema>) {
  const supabase = createAdminSupabaseClient();
  const periodFilter = getPeriodFilter(period);

  let query = supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', periodFilter)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (transactionType !== 'all') {
    query = query.eq('transaction_type', transactionType);
  }

  const { data: transactions, error } = await query;

  if (error) {
    return { success: false, error: `İşlemler alınamadı: ${error.message}` };
  }

  const totalSpent = transactions?.filter(t => t.transaction_type === 'spend').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalEarned = transactions?.filter(t => t.transaction_type === 'earn').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return {
    success: true,
    userId,
    period,
    count: transactions?.length || 0,
    summary: {
      total_spent: totalSpent,
      total_earned: totalEarned,
    },
    transactions: transactions?.map(t => ({
      id: t.id,
      type: t.transaction_type,
      amount: t.amount,
      description: t.description,
      created_at: getTimeAgo(t.created_at),
    })),
  };
}

/**
 * Kullanıcı bakiyesini getir
 */
export async function executeGetUserBalance({
  userId,
}: z.infer<typeof getUserBalanceSchema>) {
  const supabase = createAdminSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, coin_balance')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }

  // Son işlemleri al
  const { data: recentTransactions } = await supabase
    .from('coin_transactions')
    .select('transaction_type, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    success: true,
    userId,
    username: profile.username,
    balance: profile.coin_balance || 0,
    recent_transactions: recentTransactions?.map(t => ({
      type: t.transaction_type,
      amount: t.amount,
      created_at: getTimeAgo(t.created_at),
    })) || [],
  };
}

/**
 * Sohbetleri getir
 */
export async function executeGetConversations({
  userId,
  limit,
  includeLastMessage,
}: z.infer<typeof getConversationsSchema>) {
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      updated_at,
      participant1:profiles!conversations_participant1_id_fkey (username),
      participant2:profiles!conversations_participant2_id_fkey (username)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);
  }

  const { data: conversations, error } = await query;

  if (error) {
    return { success: false, error: `Sohbetler alınamadı: ${error.message}` };
  }

  // Son mesajları al
  const conversationsWithMessages = await Promise.all(
    (conversations || []).map(async (conv) => {
      let lastMessage = null;
      if (includeLastMessage) {
        const { data: msg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        lastMessage = msg ? {
          content: msg.content?.slice(0, 50),
          created_at: getTimeAgo(msg.created_at),
        } : null;
      }

      return {
        id: conv.id,
        participant1: (conv.participant1 as unknown as { username: string } | null)?.username,
        participant2: (conv.participant2 as unknown as { username: string } | null)?.username,
        updated_at: getTimeAgo(conv.updated_at),
        last_message: lastMessage,
      };
    })
  );

  return {
    success: true,
    count: conversationsWithMessages.length,
    conversations: conversationsWithMessages,
  };
}

/**
 * Mesajları getir
 */
export async function executeGetMessages({
  conversationId,
  limit,
}: z.infer<typeof getMessagesSchema>) {
  const supabase = createAdminSupabaseClient();

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      content_type,
      created_at,
      is_read,
      sender:profiles!messages_sender_id_fkey (username)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: `Mesajlar alınamadı: ${error.message}` };
  }

  return {
    success: true,
    conversationId,
    count: messages?.length || 0,
    messages: messages?.map(m => ({
      id: m.id,
      content: m.content?.slice(0, 200),
      content_type: m.content_type,
      sender: (m.sender as unknown as { username: string } | null)?.username || 'Bilinmiyor',
      is_read: m.is_read,
      created_at: getTimeAgo(m.created_at),
    })),
  };
}

/**
 * Creator istatistiklerini getir
 */
export async function executeGetCreatorStats({
  creatorId,
  period,
}: z.infer<typeof getCreatorStatsSchema>) {
  const supabase = createAdminSupabaseClient();
  const periodFilter = getPeriodFilter(period);

  // Creator profili
  const { data: creator, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_creator, is_verified')
    .eq('user_id', creatorId)
    .single();

  if (error || !creator || !creator.is_creator) {
    return { success: false, error: 'Creator bulunamadı' };
  }

  // Abone sayısı
  const { count: subscriberCount } = await supabase
    .from('creator_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('status', 'active');

  // Post sayısı
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', creatorId)
    .gte('created_at', periodFilter);

  // Toplam etkileşim
  const { data: posts } = await supabase
    .from('posts')
    .select('likes_count, comments_count, views_count')
    .eq('user_id', creatorId)
    .gte('created_at', periodFilter);

  const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
  const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
  const totalViews = posts?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

  return {
    success: true,
    creator: {
      id: creator.id,
      username: creator.username,
      display_name: creator.display_name,
      is_verified: creator.is_verified,
    },
    period,
    stats: {
      subscribers: subscriberCount || 0,
      posts: postCount || 0,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_views: totalViews,
      engagement_rate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) + '%' : '0%',
    },
  };
}

/**
 * Güvenlik loglarını getir
 */
export async function executeGetSecurityLogs({
  userId,
  logType,
  limit,
  period,
}: z.infer<typeof getSecurityLogsSchema>) {
  const supabase = createAdminSupabaseClient();
  const periodFilter = getPeriodFilter(period);
  
  const logs: Array<{type: string; description: string; created_at: string; metadata?: object}> = [];

  // Shadow mode logs
  if (logType === 'all' || logType === 'shadow_mode') {
    let query = supabase
      .from('shadow_mode_logs')
      .select('*')
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    data?.forEach(l => logs.push({
      type: 'shadow_mode',
      description: `Shadow mode ${l.action}`,
      created_at: l.created_at,
    }));
  }

  // Screenshot logs
  if (logType === 'all' || logType === 'screenshot') {
    let query = supabase
      .from('screenshot_logs')
      .select('*')
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    data?.forEach(l => logs.push({
      type: 'screenshot',
      description: `Screenshot ${l.action_taken}`,
      created_at: l.created_at,
    }));
  }

  // Sort and limit
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    success: true,
    userId: userId || 'all',
    period,
    logType,
    count: logs.length,
    logs: logs.slice(0, limit).map(l => ({
      ...l,
      created_at: getTimeAgo(l.created_at),
    })),
  };
}

/**
 * Postu gizle
 */
export async function executeHidePost({
  postId,
  reason,
}: z.infer<typeof hidePostSchema>) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('posts')
    .update({ is_hidden: true })
    .eq('id', postId);

  if (error) {
    return { success: false, error: `Post gizlenemedi: ${error.message}` };
  }

  // Moderasyon kaydı
  await supabase
    .from('moderation_actions')
    .insert({
      content_type: 'post',
      content_id: postId,
      action_type: 'hide',
      reason,
    });

  return {
    success: true,
    message: 'Post başarıyla gizlendi',
    postId,
    reason,
  };
}

/**
 * Postu sil
 */
export async function executeDeletePost({
  postId,
  reason,
  notifyUser,
}: z.infer<typeof deletePostSchema>) {
  const supabase = createAdminSupabaseClient();

  // Post sahibini bul
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  // Postu sil (soft delete)
  const { error } = await supabase
    .from('posts')
    .update({ is_hidden: true, moderation_status: 'rejected' })
    .eq('id', postId);

  if (error) {
    return { success: false, error: `Post silinemedi: ${error.message}` };
  }

  // Moderasyon kaydı
  await supabase
    .from('moderation_actions')
    .insert({
      content_type: 'post',
      content_id: postId,
      action_type: 'delete',
      reason,
    });

  // Kullanıcıyı bilgilendir
  if (notifyUser && post?.user_id) {
    await supabase
      .from('notifications')
      .insert({
        recipient_id: post.user_id,
        type: 'content_update',
        title: 'İçeriğiniz kaldırıldı',
        body: `Paylaşımınız topluluk kurallarına aykırı bulunduğu için kaldırıldı. Neden: ${reason}`,
      });
  }

  return {
    success: true,
    message: 'Post başarıyla silindi',
    postId,
    reason,
    userNotified: notifyUser,
  };
}

// ============================================
// Tools Configuration for Vercel AI SDK
// ============================================

/**
 * AI Tools objesi - streamText'te kullanılır
 * 
 * Kullanım:
 * ```typescript
 * import { aiTools } from '@/lib/ai/tools';
 * 
 * const result = streamText({
 *   model: openrouter.chat('model-id'),
 *   messages,
 *   tools: aiTools,
 * });
 * ```
 */
export const aiTools = {
  // Mevcut Tool'lar
  lookupUser: {
    description: `Kullanıcı bilgilerini ID, email veya username ile sorgula. 
      Kullanıcının profil bilgileri, kayıt tarihi, son giriş, ban durumu ve istatistiklerini döndürür.`,
    inputSchema: lookupUserSchema,
    execute: executeLookupUser,
  },
  getRecentPosts: {
    description: `Son paylaşılan postları getir. 
      Opsiyonel olarak belirli bir kullanıcının postlarını filtreleyebilir.
      Post içeriği, etkileşim sayıları ve moderasyon durumunu döndürür.`,
    inputSchema: getRecentPostsSchema,
    execute: executeGetRecentPosts,
  },
  getSystemStats: {
    description: `Platform istatistiklerini getir.
      Kullanıcı sayıları, içerik istatistikleri ve aktivite metriklerini döndürür.
      Belirli bir zaman dilimi için filtrelenebilir.`,
    inputSchema: getSystemStatsSchema,
    execute: executeGetSystemStats,
  },
  searchUsers: {
    description: `Kullanıcıları ara veya listele. Username, display name veya email ile arama yapar.
      Boş query ile tüm kullanıcıları listeler. Rol filtresi ile creator/user/admin filtrelenebilir.`,
    inputSchema: searchUsersSchema,
    execute: executeSearchUsers,
  },
  getModerationQueue: {
    description: `Moderasyon kuyruğundaki içerikleri getir.
      Bekleyen, onaylanan veya reddedilen içerikleri listeler.`,
    inputSchema: getModerationQueueSchema,
    execute: executeGetModerationQueue,
  },
  getPostDetails: {
    description: `Belirli bir postun detaylı bilgilerini getir.
      Post içeriği, medya, etkileşimler ve moderasyon geçmişini döndürür.`,
    inputSchema: getPostDetailsSchema,
    execute: executeGetPostDetails,
  },
  
  // Kullanıcı Yönetimi Tool'ları
  getUserActivity: {
    description: `Kullanıcının aktivite geçmişini getir.
      Post, yorum, beğeni, mesaj ve giriş aktivitelerini listeler.
      Zaman dilimi ve aktivite tipi ile filtrelenebilir.`,
    inputSchema: getUserActivitySchema,
    execute: executeGetUserActivity,
  },
  banUser: {
    description: `Kullanıcıyı banla. Hesabı deaktif eder ve user_locks tablosuna kayıt ekler.
      Süre: permanent, 1d, 7d, 30d, 90d. DİKKAT: Bu aksiyon geri alınabilir ama ciddi bir işlemdir.`,
    inputSchema: banUserSchema,
    execute: executeBanUser,
  },
  unbanUser: {
    description: `Kullanıcının banını kaldır. Hesabı tekrar aktif eder.`,
    inputSchema: unbanUserSchema,
    execute: executeUnbanUser,
  },
  
  // Moderasyon Tool'ları
  getContentReports: {
    description: `İçerik raporlarını getir. Kullanıcılar tarafından bildirilen içerikleri listeler.
      Durum ve rapor tipi ile filtrelenebilir.`,
    inputSchema: getContentReportsSchema,
    execute: executeGetContentReports,
  },
  hidePost: {
    description: `Postu gizle. Post silinmez ama kullanıcılara gösterilmez.
      Moderasyon kaydı oluşturulur.`,
    inputSchema: hidePostSchema,
    execute: executeHidePost,
  },
  deletePost: {
    description: `Postu sil (soft delete). Post gizlenir ve moderation_status rejected olur.
      Opsiyonel olarak kullanıcıya bildirim gönderilebilir.`,
    inputSchema: deletePostSchema,
    execute: executeDeletePost,
  },
  
  // Bildirim Tool'ları
  sendNotification: {
    description: `Kullanıcıya bildirim gönder. Push notification olarak iletilir.
      Tip: system, warning, info, promotion.`,
    inputSchema: sendNotificationSchema,
    execute: executeSendNotification,
  },
  
  // Finansal Tool'lar
  getUserTransactions: {
    description: `Kullanıcının coin işlemlerini getir.
      Satın alma, harcama, kazanç ve iade işlemlerini listeler.`,
    inputSchema: getUserTransactionsSchema,
    execute: executeGetUserTransactions,
  },
  getUserBalance: {
    description: `Kullanıcının coin bakiyesini getir.
      Mevcut bakiye ve son işlemleri döndürür.`,
    inputSchema: getUserBalanceSchema,
    execute: executeGetUserBalance,
  },
  
  // Mesajlaşma Tool'ları
  getConversations: {
    description: `Sohbetleri listele. Tüm sohbetler veya belirli kullanıcının sohbetleri.
      Son mesaj dahil edilebilir.`,
    inputSchema: getConversationsSchema,
    execute: executeGetConversations,
  },
  getMessages: {
    description: `Bir sohbetin mesajlarını getir.
      Mesaj içeriği, gönderen ve okunma durumunu döndürür.`,
    inputSchema: getMessagesSchema,
    execute: executeGetMessages,
  },
  
  // Creator Tool'ları
  getCreatorStats: {
    description: `Creator istatistiklerini getir.
      Abone sayısı, post sayısı, etkileşim metrikleri ve engagement rate.`,
    inputSchema: getCreatorStatsSchema,
    execute: executeGetCreatorStats,
  },
  
  // Güvenlik Tool'ları
  getSecurityLogs: {
    description: `Güvenlik loglarını getir.
      Shadow mode, screenshot ve diğer güvenlik olaylarını listeler.`,
    inputSchema: getSecurityLogsSchema,
    execute: executeGetSecurityLogs,
  },
};

/**
 * Tool adları listesi
 */
export const toolNames = Object.keys(aiTools) as Array<keyof typeof aiTools>;

/**
 * Tool açıklamaları (UI için)
 */
export const toolDescriptions: Record<keyof typeof aiTools, string> = {
  // Mevcut
  lookupUser: 'Kullanıcı bilgilerini sorgula',
  getRecentPosts: 'Son postları getir',
  getSystemStats: 'Platform istatistikleri',
  searchUsers: 'Kullanıcı ara/listele',
  getModerationQueue: 'Moderasyon kuyruğu',
  getPostDetails: 'Post detayları',
  // Kullanıcı Yönetimi
  getUserActivity: 'Kullanıcı aktivitesi',
  banUser: 'Kullanıcı banla',
  unbanUser: 'Ban kaldır',
  // Moderasyon
  getContentReports: 'İçerik raporları',
  hidePost: 'Post gizle',
  deletePost: 'Post sil',
  // Bildirim
  sendNotification: 'Bildirim gönder',
  // Finansal
  getUserTransactions: 'Coin işlemleri',
  getUserBalance: 'Coin bakiyesi',
  // Mesajlaşma
  getConversations: 'Sohbetleri listele',
  getMessages: 'Mesajları getir',
  // Creator
  getCreatorStats: 'Creator istatistikleri',
  // Güvenlik
  getSecurityLogs: 'Güvenlik logları',
};
