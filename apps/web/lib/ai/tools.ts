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

// NOT: Key sırası LLM'in ürettiği sıraya göre olmalı
// assistant-ui argsText streaming'de sıra değişirse hata verir
// LLM genelde hasMedia → limit → postType → userId sırasında üretiyor
export const getRecentPostsSchema = z.object({
  hasMedia: z
    .boolean()
    .optional()
    .describe('Sadece medya (fotoğraf/video) içeren postları getir'),
  limit: z.number().min(1).max(50).default(10).describe('Getirilecek post sayısı (max 50)'),
  postType: z
    .enum(['all', 'standard', 'time_capsule', 'anon', 'vibe'])
    .default('all')
    .describe('Post tipi filtresi'),
  userId: z.string().optional().describe('Belirli bir kullanıcının postları için user_id veya username'),
});

export const getSystemStatsSchema = z.object({
  period: z
    .enum(['today', 'week', 'month', 'all'])
    .default('today')
    .describe('İstatistik dönemi: today, week, month veya all'),
});

// NOT: Key sırası LLM'in ürettiği sıraya göre olmalı: role → query → limit
// assistant-ui argsText streaming'de sıra değişirse hata verir
export const searchUsersSchema = z.object({
  query: z.string()
    .default('')
    .describe('Arama terimi (boş bırakılırsa tüm kullanıcılar)'),

  role: z.enum(['all', 'user', 'creator', 'admin'])
    .default('all')
    .describe('Rol filtresi'),

  limit: z.number()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maksimum sonuç sayısı'),
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
  limit: z.number().min(1).max(100).default(50).describe('Maksimum mesaj sayısı'),
  conversationId: z.string().describe('Sohbet ID'),
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

// Yeni Tool Schema'ları - V2
export const approvePostSchema = z.object({
  postId: z.string().describe('Onaylanacak post ID'),
});

export const rejectPostSchema = z.object({
  postId: z.string().describe('Reddedilecek post ID'),
  reason: z.string().min(5).describe('Red nedeni'),
  notifyUser: z.boolean().default(true).describe('Kullanıcıyı bilgilendir'),
});

export const adjustCoinBalanceSchema = z.object({
  userId: z.string().describe('Kullanıcı ID veya username'),
  amount: z.number().describe('Eklenecek/çıkarılacak miktar (negatif = çıkar)'),
  reason: z.string().min(5).describe('İşlem sebebi'),
});

export const getDashboardSummarySchema = z.object({
  period: z.enum(['today', 'yesterday', 'week']).default('today').describe('Özet dönemi'),
});

export const verifyUserSchema = z.object({
  userId: z.string().describe('Doğrulanacak kullanıcı ID veya username'),
  verified: z.boolean().default(true).describe('Doğrulama durumu (true=doğrula, false=kaldır)'),
});

// V2 Phase 2 - Yüksek Öncelikli Tool'lar
export const getTrendingContentSchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('today').describe('Trend dönemi'),
  limit: z.number().min(1).max(50).default(10).describe('Maksimum sonuç sayısı'),
  sortBy: z.enum(['likes', 'comments', 'views', 'engagement']).default('likes').describe('Sıralama kriteri'),
});

export const getTopCreatorsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('month').describe('Dönem'),
  limit: z.number().min(1).max(50).default(10).describe('Maksimum sonuç sayısı'),
  sortBy: z.enum(['subscribers', 'earnings', 'engagement', 'posts']).default('subscribers').describe('Sıralama kriteri'),
});

export const resolveReportSchema = z.object({
  reportId: z.string().describe('Rapor ID'),
  action: z.enum(['warn', 'hide', 'delete', 'ban']).describe('Alınacak aksiyon'),
  notes: z.string().optional().describe('Moderatör notu'),
});

export const dismissReportSchema = z.object({
  reportId: z.string().describe('Rapor ID'),
  reason: z.string().min(5).describe('Reddetme sebebi'),
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

  // Post sayısını al (posts tablosunda user_id var, profile_id yok)
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.user_id);

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
  hasMedia,
  limit,
  postType,
  userId,
}: z.infer<typeof getRecentPostsSchema>) {
  const supabase = createAdminSupabaseClient();

  // hasMedia filtresi için önce medya içeren post ID'lerini al
  let mediaPostIds: string[] | null = null;
  if (hasMedia) {
    const { data: mediaData } = await supabase
      .from('post_media')
      .select('post_id')
      .limit(500); // Performans için limit
    mediaPostIds = [...new Set(mediaData?.map(m => m.post_id) || [])];
    
    if (mediaPostIds.length === 0) {
      return { success: true, count: 0, posts: [], message: 'Medya içeren post bulunamadı' };
    }
  }

  // Postları al - veritabanındaki gerçek alan adlarıyla
  let query = supabase
    .from('posts')
    .select(`
      id,
      user_id,
      post_type,
      caption,
      visibility,
      is_exclusive,
      is_hidden,
      is_flagged,
      is_anon,
      moderation_status,
      created_at,
      likes_count,
      comments_count,
      shares_count,
      views_count
    `)
    .order('created_at', { ascending: false });

  // hasMedia filtresi uygula
  if (mediaPostIds) {
    query = query.in('id', mediaPostIds);
  }
  
  query = query.limit(limit);

  // Belirli kullanıcının postları için filtrele
  // userId UUID veya username olabilir
  if (userId) {
    // UUID formatı kontrolü
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUUID) {
      // Direkt user_id ile filtrele
      query = query.eq('user_id', userId);
    } else {
      // Username'den user_id bul
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', userId)
        .eq('type', 'real')
        .single();

      if (profile) {
        query = query.eq('user_id', profile.user_id);
      } else {
        return {
          success: false,
          error: `Kullanıcı bulunamadı: ${userId}`,
        };
      }
    }
  }

  if (postType !== 'all') {
    query = query.eq('post_type', postType);
  }

  const { data: posts, error } = await query;

  if (error) {
    return {
      success: false,
      error: `Postlar alınamadı: ${error.message}`,
    };
  }

  if (!posts || posts.length === 0) {
    return {
      success: true,
      count: 0,
      posts: [],
    };
  }

  // Profile bilgilerini ayrı sorgula (user_id üzerinden)
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, is_creator, is_verified')
    .in('user_id', userIds)
    .eq('type', 'real');

  // Profile map oluştur (user_id -> profile)
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  // Medya bilgilerini al (post_media tablosu)
  const postIds = posts.map(p => p.id);
  const { data: mediaItems } = await supabase
    .from('post_media')
    .select('post_id, media_type, media_url, thumbnail_url, duration')
    .in('post_id', postIds)
    .order('display_order', { ascending: true });

  // Media map oluştur (post_id -> media[])
  const mediaMap = new Map<string, typeof mediaItems>();
  mediaItems?.forEach(m => {
    const existing = mediaMap.get(m.post_id) || [];
    existing.push(m);
    mediaMap.set(m.post_id, existing);
  });

  // Anket bilgilerini al (post_polls tablosu)
  const { data: pollItems } = await supabase
    .from('post_polls')
    .select('post_id, question, options, expires_at')
    .in('post_id', postIds);

  // Poll map oluştur (post_id -> poll)
  const pollMap = new Map(pollItems?.map(p => [p.post_id, p]) || []);

  // Anket oylarını al
  const pollIds = pollItems?.map(p => p.post_id) || [];
  const voteCountMap = new Map<string, number>();
  if (pollIds.length > 0) {
    const { data: voteCounts } = await supabase
      .from('post_poll_votes')
      .select('poll_id')
      .in('poll_id', pollIds);
    
    // Her anket için oy sayısını hesapla
    voteCounts?.forEach(v => {
      voteCountMap.set(v.poll_id, (voteCountMap.get(v.poll_id) || 0) + 1);
    });
  }

  return {
    success: true,
    count: posts.length,
    posts: posts.map((post) => {
      const profile = profileMap.get(post.user_id);
      const media = mediaMap.get(post.id) || [];
      const poll = pollMap.get(post.id);
      return {
        id: post.id,
        post_type: post.post_type,
        caption: post.caption?.slice(0, 100) + (post.caption && post.caption.length > 100 ? '...' : ''),
        is_exclusive: post.is_exclusive,
        is_anon: post.is_anon,
        visibility: post.visibility,
        is_hidden: post.is_hidden,
        is_flagged: post.is_flagged,
        moderation_status: post.moderation_status,
        created_at: getTimeAgo(post.created_at),
        engagement: {
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          views: post.views_count || 0,
        },
        media: media.map(m => ({
          type: m.media_type,
          url: m.media_url || null,
          thumbnail: m.thumbnail_url || null,
          duration: m.duration, // Video için saniye cinsinden süre
        })),
        media_count: media.length,
        author: profile ? {
          username: profile.username,
          display_name: profile.display_name,
          is_creator: profile.is_creator,
          is_verified: profile.is_verified,
        } : null,
        poll: poll ? {
          question: poll.question,
          options: poll.options,
          expires_at: poll.expires_at,
          total_votes: voteCountMap.get(post.id) || 0,
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

  // Yorum sayısı (post_comments tablosu)
  let commentsQuery = supabase
    .from('post_comments')
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

  // moderation_queue: id, content_type, content_id, user_id, priority, reason, 
  // toxicity_score, nsfw_score, spam_score, report_count, report_reasons, status,
  // reviewed_by, reviewed_at, resolution, notes, created_at
  // NOT: reporter_id yok, user_id var (içerik sahibi)
  let query = supabase
    .from('moderation_queue')
    .select(`
      id,
      content_type,
      content_id,
      user_id,
      reason,
      status,
      priority,
      report_count,
      toxicity_score,
      nsfw_score,
      created_at,
      reviewed_at,
      reviewed_by,
      resolution
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

  // İçerik sahiplerinin profillerini al
  const userIds = [...new Set(items?.map(i => i.user_id).filter(Boolean) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', userIds)
    .eq('type', 'real');
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

  // Reviewer'ları al (admin_profiles)
  const reviewerIds = [...new Set(items?.map(i => i.reviewed_by).filter(Boolean) || [])];
  let reviewerMap = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from('admin_profiles')
      .select('id, full_name')
      .in('id', reviewerIds);
    reviewerMap = new Map(reviewers?.map(r => [r.id, r.full_name]) || []);
  }

  return {
    success: true,
    status_filter: status,
    count: items?.length || 0,
    items: items?.map((item) => ({
      id: item.id,
      content_type: item.content_type,
      content_id: item.content_id,
      reason: item.reason,
      status: item.status,
      priority: item.priority,
      report_count: item.report_count || 0,
      scores: {
        toxicity: item.toxicity_score,
        nsfw: item.nsfw_score,
      },
      content_owner: profileMap.get(item.user_id) || 'Bilinmiyor',
      created_at: getTimeAgo(item.created_at),
      reviewed_at: item.reviewed_at ? formatDate(item.reviewed_at) : null,
      reviewed_by: item.reviewed_by ? reviewerMap.get(item.reviewed_by) || null : null,
      resolution: item.resolution,
    })),
  };
}

/**
 * Post detaylarını getir
 */
export async function executeGetPostDetails({
  postId,
}: z.infer<typeof getPostDetailsSchema>) {
  const supabase = createAdminSupabaseClient();

  // Post'u al (foreign key olmadan)
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) {
    return {
      success: false,
      error: `Post bulunamadı: ${postId}`,
    };
  }

  // Author bilgisini ayrı sorgula
  const { data: author } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_creator, is_verified')
    .eq('user_id', post.user_id)
    .eq('type', 'real')
    .single();

  // Son yorumları al (post_comments tablosu)
  const { data: comments } = await supabase
    .from('post_comments')
    .select('id, content, created_at, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Yorum yazarlarını al
  let commentAuthors: Map<string, { username: string }> = new Map();
  if (comments && comments.length > 0) {
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', userIds)
      .eq('type', 'real');
    commentAuthors = new Map(profiles?.map(p => [p.user_id, { username: p.username }]) || []);
  }

  // Moderasyon geçmişi (moderation_actions tablosu yoksa boş döndür)
  let moderationHistory: { action_type: string; reason: string; created_at: string }[] = [];
  try {
    const { data } = await supabase
      .from('moderation_actions')
      .select('action_type, reason, created_at')
      .eq('content_id', postId)
      .eq('content_type', 'post')
      .order('created_at', { ascending: false })
      .limit(5);
    moderationHistory = data || [];
  } catch {
    // Tablo yoksa boş array
  }

  return {
    success: true,
    post: {
      id: post.id,
      post_type: post.post_type,
      caption: post.caption,
      is_exclusive: post.is_exclusive,
      is_anon: post.is_anon,
      visibility: post.visibility,
      is_hidden: post.is_hidden,
      is_flagged: post.is_flagged,
      moderation_status: post.moderation_status,
      created_at: formatDate(post.created_at),
      updated_at: post.updated_at ? formatDate(post.updated_at) : null,
      engagement: {
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
        views: post.views_count || 0,
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
      const commentAuthor = commentAuthors.get(c.user_id);
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
  
  // UUID mi yoksa username mi kontrol et
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  // Kullanıcıyı bul
  let targetUserId: string;
  let username: string;

  if (isUUID) {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();

    if (!user) {
      return { success: false, error: `Kullanıcı bulunamadı (ID: ${userId})`, count: 0, activities: [] };
    }
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  } else {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('username', userId)
      .eq('type', 'real')
      .single();

    if (!user) {
      return { success: false, error: `Kullanıcı bulunamadı (username: ${userId})`, count: 0, activities: [] };
    }
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  }

  const periodFilter = getPeriodFilter(period);
  const activities: Array<{type: string; description: string; created_at: string}> = [];

  // Posts - targetUserId kullan
  if (activityType === 'all' || activityType === 'posts') {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, caption, created_at')
      .eq('user_id', targetUserId)
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    posts?.forEach(p => activities.push({
      type: 'post',
      description: p.caption?.slice(0, 50) || 'Post paylaşıldı',
      created_at: p.created_at,
    }));
  }

  // Likes - targetUserId kullan
  if (activityType === 'all' || activityType === 'likes') {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('id, created_at')
      .eq('user_id', targetUserId)
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    likes?.forEach(l => activities.push({
      type: 'like',
      description: 'Post beğenildi',
      created_at: l.created_at,
    }));
  }

  // Messages - targetUserId kullan
  if (activityType === 'all' || activityType === 'messages') {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('sender_id', targetUserId)
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
    userId: targetUserId,
    username,
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

  // UUID mi yoksa username mi kontrol et
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  // Kullanıcıyı kontrol et
  let user;
  let targetUserId: string;

  if (isUUID) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, is_active')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();

    if (error || !data) {
      return { success: false, error: `Kullanıcı bulunamadı (ID: ${userId})` };
    }
    user = data;
    targetUserId = data.user_id;
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, is_active')
      .eq('username', userId)
      .eq('type', 'real')
      .single();

    if (error || !data) {
      return { success: false, error: `Kullanıcı bulunamadı (username: ${userId})` };
    }
    user = data;
    targetUserId = data.user_id;
  }

  // Ban süresini hesapla
  let lockedUntil: string | null = null;
  if (duration !== 'permanent') {
    const days = parseInt(duration.replace('d', ''));
    const until = new Date();
    until.setDate(until.getDate() + days);
    lockedUntil = until.toISOString();
  }

  // User lock kaydı oluştur - targetUserId kullan
  const { error: lockError } = await supabase
    .from('user_locks')
    .insert({
      user_id: targetUserId,
      reason,
      locked_until: lockedUntil,
      status: 'active',
    });

  if (lockError) {
    return { success: false, error: `Ban işlemi başarısız: ${lockError.message}` };
  }

  // Profili deaktif et - targetUserId kullan
  await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('user_id', targetUserId);

  return {
    success: true,
    message: `${user.username} başarıyla banlandı`,
    userId: targetUserId,
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

  // UUID mi yoksa username mi kontrol et
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  // Kullanıcıyı bul
  let targetUserId: string;
  let username: string;

  if (isUUID) {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();

    if (!user) {
      return { success: false, error: `Kullanıcı bulunamadı (ID: ${userId})` };
    }
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  } else {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('username', userId)
      .eq('type', 'real')
      .single();

    if (!user) {
      return { success: false, error: `Kullanıcı bulunamadı (username: ${userId})` };
    }
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  }

  // Aktif ban'ı bul
  const { data: lock, error: lockError } = await supabase
    .from('user_locks')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('status', 'active')
    .single();

  if (lockError || !lock) {
    return { success: false, error: `${username} için aktif ban bulunamadı` };
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
    .eq('user_id', targetUserId);

  return {
    success: true,
    message: `${username} için ban başarıyla kaldırıldı`,
    userId: targetUserId,
    username,
    reason,
  };
}

/**
 * İçerik raporlarını getir
 * NOT: content_reports tablosu yok, user_reports tablosu var (kullanıcı raporları)
 */
export async function executeGetContentReports({
  status,
  reportType,
  limit,
}: z.infer<typeof getContentReportsSchema>) {
  const supabase = createAdminSupabaseClient();

  // user_reports: id, reporter_id, reported_user_id, reason, description, status, reviewed_by, reviewed_at, resolution_notes, created_at
  let query = supabase
    .from('user_reports')
    .select('id, reporter_id, reported_user_id, reason, description, status, created_at, reviewed_at')
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

  // Reporter ve reported user profillerini al
  const allUserIds = [
    ...new Set([
      ...(reports?.map(r => r.reporter_id).filter(Boolean) || []),
      ...(reports?.map(r => r.reported_user_id).filter(Boolean) || []),
    ])
  ];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', allUserIds)
    .eq('type', 'real');

  const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

  return {
    success: true,
    count: reports?.length || 0,
    reports: reports?.map(r => ({
      id: r.id,
      report_type: 'user', // Kullanıcı raporu
      reason: r.reason,
      description: r.description?.slice(0, 100),
      status: r.status,
      reporter: profileMap.get(r.reporter_id) || 'Anonim',
      reported_user: profileMap.get(r.reported_user_id) || 'Bilinmiyor',
      created_at: getTimeAgo(r.created_at),
      reviewed_at: r.reviewed_at ? formatDate(r.reviewed_at) : null,
    })),
  };
}

/**
 * Bildirim gönder
 * userId: UUID veya username olabilir
 */
export async function executeSendNotification({
  userId,
  title,
  body,
  type,
}: z.infer<typeof sendNotificationSchema>) {
  const supabase = createAdminSupabaseClient();

  // UUID formatı kontrolü
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  
  let targetUserId = userId;
  let username = '';

  if (isUUID) {
    // UUID ile kullanıcıyı bul
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();

    if (userError || !user) {
      return { success: false, error: `Kullanıcı bulunamadı (UUID: ${userId})` };
    }
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  } else {
    // Username ile kullanıcıyı bul
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('username', userId)
      .eq('type', 'real')
      .single();

    if (userError || !user) {
      return { success: false, error: `Kullanıcı bulunamadı (username: ${userId})` };
    }
    targetUserId = user.user_id;
    username = user.username || userId;
  }

  // Bildirim oluştur
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: targetUserId,
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
    message: `Bildirim ${username} kullanıcısına gönderildi`,
    notificationId: 'sent',
    recipient: username,
    userId: targetUserId,
    title,
    type,
    sentAt: new Date().toISOString(),
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
    .select('id, user_id, type, amount, balance_after, description, created_at')
    .eq('user_id', userId)
    .gte('created_at', periodFilter)
    .order('created_at', { ascending: false })
    .limit(limit);

  // type alanı: purchase, spend, earn, refund
  if (transactionType !== 'all') {
    query = query.eq('type', transactionType);
  }

  const { data: transactions, error } = await query;

  if (error) {
    return { success: false, error: `İşlemler alınamadı: ${error.message}` };
  }

  const totalSpent = transactions?.filter(t => t.type === 'spend').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0;
  const totalEarned = transactions?.filter(t => t.type === 'earn' || t.type === 'purchase').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

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
      type: t.type,
      amount: t.amount,
      balance_after: t.balance_after,
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

  // Profil bilgisi
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('user_id', userId)
    .eq('type', 'real')
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }

  // Bakiye bilgisi coin_balances tablosundan
  const { data: balanceData } = await supabase
    .from('coin_balances')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('user_id', userId)
    .single();

  // Son işlemleri al
  const { data: recentTransactions } = await supabase
    .from('coin_transactions')
    .select('type, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    success: true,
    userId,
    username: profile.username,
    balance: balanceData?.balance || 0,
    lifetime_earned: balanceData?.lifetime_earned || 0,
    lifetime_spent: balanceData?.lifetime_spent || 0,
    recent_transactions: recentTransactions?.map(t => ({
      type: t.type,
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

  // Conversations tablosu: id, type, name, created_by, last_message_at, is_archived
  // Katılımcılar conversation_participants tablosunda
  let conversationIds: string[] = [];

  if (userId) {
    // Kullanıcının katıldığı sohbetleri bul
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);
    
    conversationIds = participations?.map(p => p.conversation_id) || [];
    
    if (conversationIds.length === 0) {
      return { success: true, count: 0, conversations: [] };
    }
  }

  let query = supabase
    .from('conversations')
    .select('id, type, name, created_at, last_message_at, is_archived')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (conversationIds.length > 0) {
    query = query.in('id', conversationIds);
  }

  const { data: conversations, error } = await query;

  if (error) {
    return { success: false, error: `Sohbetler alınamadı: ${error.message}` };
  }

  // Her sohbet için katılımcıları ve son mesajı al
  const conversationsWithDetails = await Promise.all(
    (conversations || []).map(async (conv) => {
      // Katılımcıları al
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id);

      const userIds = participants?.map(p => p.user_id) || [];
      
      // Katılımcı profillerini al
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds)
        .eq('type', 'real');

      const participantNames = profiles?.map(p => p.username).filter(Boolean) || [];

      // Son mesaj
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
        type: conv.type,
        name: conv.name || participantNames.join(', ') || 'Sohbet',
        participants: participantNames,
        participant_count: participantNames.length,
        is_archived: conv.is_archived,
        last_message_at: conv.last_message_at ? getTimeAgo(conv.last_message_at) : null,
        last_message: lastMessage,
      };
    })
  );

  return {
    success: true,
    count: conversationsWithDetails.length,
    conversations: conversationsWithDetails,
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

  // messages tablosu: id, conversation_id, sender_id, content, content_type, status, is_deleted, created_at
  // is_read yok - conversation_participants.last_read_message_id ile takip ediliyor
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, content_type, status, is_deleted, created_at')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: `Mesajlar alınamadı: ${error.message}` };
  }

  // Gönderici profillerini al
  const senderIds = [...new Set(messages?.map(m => m.sender_id).filter(Boolean) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', senderIds)
    .eq('type', 'real');

  const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

  return {
    success: true,
    conversationId,
    count: messages?.length || 0,
    messages: messages?.map(m => ({
      id: m.id,
      content: m.content?.slice(0, 200),
      content_type: m.content_type,
      sender: profileMap.get(m.sender_id) || 'Bilinmiyor',
      status: m.status,
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

  // UUID mi yoksa username mi kontrol et
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorId);

  // Creator profili - hem UUID hem username ile arama yap
  let creator;
  let targetUserId: string;

  if (isUUID) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, is_creator, is_verified')
      .eq('user_id', creatorId)
      .eq('type', 'real')
      .single();
    
    if (error || !data) {
      return { success: false, error: `Creator bulunamadı (ID: ${creatorId}). Hata: ${error?.message || 'Kayıt yok'}` };
    }
    creator = data;
    targetUserId = data.user_id;
  } else {
    // Username ile ara
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, is_creator, is_verified')
      .eq('username', creatorId)
      .eq('type', 'real')
      .single();
    
    if (error || !data) {
      return { success: false, error: `Creator bulunamadı (username: ${creatorId}). Hata: ${error?.message || 'Kayıt yok'}` };
    }
    creator = data;
    targetUserId = data.user_id;
  }

  if (!creator.is_creator) {
    return { success: false, error: `${creator.username} bir creator değil (is_creator: false)` };
  }

  // Abone sayısı - targetUserId kullan
  const { count: subscriberCount } = await supabase
    .from('creator_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', targetUserId)
    .eq('status', 'active');

  // Post sayısı - targetUserId kullan
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetUserId)
    .gte('created_at', periodFilter);

  // Toplam etkileşim - targetUserId kullan
  const { data: posts } = await supabase
    .from('posts')
    .select('likes_count, comments_count, views_count')
    .eq('user_id', targetUserId)
    .gte('created_at', periodFilter);

  const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
  const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
  const totalViews = posts?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

  // Kazanç bilgisi (opsiyonel)
  const { data: earnings } = await supabase
    .from('coin_transactions')
    .select('amount')
    .eq('user_id', targetUserId)
    .eq('type', 'subscription_earning')
    .gte('created_at', periodFilter);

  const totalEarnings = earnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  return {
    success: true,
    creator: {
      id: targetUserId,
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
      total_earnings: totalEarnings,
      engagement_rate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) + '%' : '0%',
    },
  };
}

/**
 * Güvenlik loglarını getir
 * NOT: shadow_mode_logs tablosu yok, sadece screenshot_logs ve user_sessions var
 */
export async function executeGetSecurityLogs({
  userId,
  logType,
  limit,
  period,
}: z.infer<typeof getSecurityLogsSchema>) {
  const supabase = createAdminSupabaseClient();
  const periodFilter = getPeriodFilter(period);
  
  const logs: Array<{type: string; user_id?: string; description: string; created_at: string; ip_address?: string}> = [];

  // Screenshot logs (screenshot_logs tablosu mevcut)
  if (logType === 'all' || logType === 'screenshot') {
    let query = supabase
      .from('screenshot_logs')
      .select('id, user_id, action_taken, ip_address, created_at')
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    data?.forEach(l => logs.push({
      type: 'screenshot',
      user_id: l.user_id,
      description: `Screenshot algılandı: ${l.action_taken || 'Bilinmiyor'}`,
      created_at: l.created_at,
      ip_address: l.ip_address,
    }));
  }

  // Login logs (profiles.last_login_at kullanılabilir ama detaylı log yok)
  // user_sessions veya user_lockouts tabloları kullanılabilir
  if (logType === 'all' || logType === 'login') {
    let query = supabase
      .from('user_lockouts')
      .select('id, user_id, reason, created_at')
      .gte('created_at', periodFilter)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    data?.forEach(l => logs.push({
      type: 'login_failed',
      user_id: l.user_id,
      description: `Başarısız giriş: ${l.reason || 'Bilinmiyor'}`,
      created_at: l.created_at,
    }));
  }

  // Sort and limit
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Kullanıcı bilgilerini al
  const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
  let profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', userIds)
      .eq('type', 'real');
    profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
  }

  return {
    success: true,
    userId: userId || 'all',
    period,
    logType,
    count: logs.length,
    logs: logs.slice(0, limit).map(l => ({
      type: l.type,
      username: l.user_id ? profileMap.get(l.user_id) || 'Bilinmiyor' : 'Sistem',
      description: l.description,
      ip_address: l.ip_address || null,
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
// V2 Execute Functions - Yeni Tool'lar
// ============================================

/**
 * Postu onayla
 */
export async function executeApprovePost({
  postId,
}: z.infer<typeof approvePostSchema>) {
  const supabase = createAdminSupabaseClient();

  // Post bilgisini al
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, user_id, caption, moderation_status')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return { success: false, error: 'Post bulunamadı' };
  }

  if (post.moderation_status === 'approved') {
    return { success: false, error: 'Post zaten onaylı' };
  }

  // Postu onayla
  const { error } = await supabase
    .from('posts')
    .update({ moderation_status: 'approved' })
    .eq('id', postId);

  if (error) {
    return { success: false, error: `Post onaylanamadı: ${error.message}` };
  }

  return {
    success: true,
    message: 'Post başarıyla onaylandı',
    postId,
    previousStatus: post.moderation_status,
  };
}

/**
 * Postu reddet
 */
export async function executeRejectPost({
  postId,
  reason,
  notifyUser,
}: z.infer<typeof rejectPostSchema>) {
  const supabase = createAdminSupabaseClient();

  // Post bilgisini al
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, user_id, caption, moderation_status')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return { success: false, error: 'Post bulunamadı' };
  }

  // Postu reddet
  const { error } = await supabase
    .from('posts')
    .update({ moderation_status: 'rejected', is_hidden: true })
    .eq('id', postId);

  if (error) {
    return { success: false, error: `Post reddedilemedi: ${error.message}` };
  }

  // Kullanıcıyı bilgilendir
  if (notifyUser && post.user_id) {
    await supabase.from('notifications').insert({
      recipient_id: post.user_id,
      type: 'content_update',
      title: 'Paylaşımınız reddedildi',
      body: `Paylaşımınız moderasyon tarafından reddedildi. Neden: ${reason}`,
    });
  }

  return {
    success: true,
    message: 'Post başarıyla reddedildi',
    postId,
    reason,
    userNotified: notifyUser,
  };
}

/**
 * Coin bakiyesi ayarla
 */
export async function executeAdjustCoinBalance({
  userId,
  amount,
  reason,
}: z.infer<typeof adjustCoinBalanceSchema>) {
  const supabase = createAdminSupabaseClient();

  // UUID formatı kontrolü
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  
  let targetUserId = userId;
  let username = '';

  // Kullanıcıyı bul
  if (isUUID) {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı' };
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  } else {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('username', userId)
      .eq('type', 'real')
      .single();
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı' };
    targetUserId = user.user_id;
    username = user.username || userId;
  }

  // Mevcut bakiyeyi al
  const { data: balance } = await supabase
    .from('coin_balances')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('user_id', targetUserId)
    .single();

  const currentBalance = balance?.balance || 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    return { success: false, error: `Yetersiz bakiye. Mevcut: ${currentBalance}, İstenen çıkarma: ${Math.abs(amount)}` };
  }

  // Bakiyeyi güncelle
  let updateError;
  if (balance) {
    // Mevcut kayıt varsa güncelle
    const { error } = await supabase
      .from('coin_balances')
      .update({
        balance: newBalance,
        ...(amount > 0 ? { lifetime_earned: (balance.lifetime_earned || 0) + amount } : {}),
        ...(amount < 0 ? { lifetime_spent: (balance.lifetime_spent || 0) + Math.abs(amount) } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId);
    updateError = error;
  } else {
    // Yeni kayıt oluştur
    const { error } = await supabase
      .from('coin_balances')
      .insert({
        user_id: targetUserId,
        balance: newBalance,
        lifetime_earned: amount > 0 ? amount : 0,
        lifetime_spent: amount < 0 ? Math.abs(amount) : 0,
      });
    updateError = error;
  }

  if (updateError) {
    return { success: false, error: `Bakiye güncellenemedi: ${updateError.message}` };
  }

  // Transaction kaydı oluştur
  await supabase.from('coin_transactions').insert({
    user_id: targetUserId,
    type: amount > 0 ? 'admin_credit' : 'admin_debit',
    amount: Math.abs(amount),
    balance_after: newBalance,
    description: `Admin işlemi: ${reason}`,
  });

  return {
    success: true,
    message: `${username} kullanıcısının bakiyesi ${amount > 0 ? 'artırıldı' : 'azaltıldı'}`,
    username,
    previousBalance: currentBalance,
    adjustment: amount,
    newBalance,
    reason,
  };
}

/**
 * Dashboard özeti
 */
export async function executeGetDashboardSummary({
  period,
}: z.infer<typeof getDashboardSummarySchema>) {
  const supabase = createAdminSupabaseClient();

  // Tarih hesapla
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    default: // today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  const startDateStr = startDate.toISOString();

  // Paralel sorgular
  const [
    { count: newUsers },
    { count: newPosts },
    { count: pendingModeration },
    { count: activeReports },
    { count: totalCreators },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr).eq('type', 'real'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
    supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_creator', true).eq('type', 'real'),
    supabase.from('coin_transactions').select('amount, type').gte('created_at', startDateStr).eq('type', 'purchase'),
  ]);

  // Gelir hesapla
  const totalRevenue = recentTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return {
    success: true,
    period,
    periodLabel: period === 'today' ? 'Bugün' : period === 'yesterday' ? 'Dün' : 'Son 7 Gün',
    summary: {
      newUsers: newUsers || 0,
      newPosts: newPosts || 0,
      pendingModeration: pendingModeration || 0,
      activeReports: activeReports || 0,
      totalCreators: totalCreators || 0,
      totalRevenue,
    },
    alerts: [
      ...(pendingModeration && pendingModeration > 0 ? [`⚠️ ${pendingModeration} post moderasyon bekliyor`] : []),
      ...(activeReports && activeReports > 0 ? [`🚨 ${activeReports} aktif rapor var`] : []),
    ],
  };
}

/**
 * Kullanıcı doğrula
 */
export async function executeVerifyUser({
  userId,
  verified,
}: z.infer<typeof verifyUserSchema>) {
  const supabase = createAdminSupabaseClient();

  // UUID formatı kontrolü
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  
  let targetUserId = userId;
  let username = '';

  // Kullanıcıyı bul
  if (isUUID) {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username, is_verified')
      .eq('user_id', userId)
      .eq('type', 'real')
      .single();
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı' };
    targetUserId = user.user_id;
    username = user.username || 'Bilinmiyor';
  } else {
    const { data: user } = await supabase
      .from('profiles')
      .select('user_id, username, is_verified')
      .eq('username', userId)
      .eq('type', 'real')
      .single();
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı' };
    targetUserId = user.user_id;
    username = user.username || userId;
  }

  // Doğrulama durumunu güncelle
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: verified })
    .eq('user_id', targetUserId);

  if (error) {
    return { success: false, error: `Doğrulama güncellenemedi: ${error.message}` };
  }

  return {
    success: true,
    message: verified 
      ? `✅ ${username} kullanıcısı doğrulandı (mavi tik eklendi)`
      : `${username} kullanıcısının doğrulaması kaldırıldı`,
    username,
    verified,
  };
}

// ============================================
// V2 Phase 2 - Yüksek Öncelikli Execute Functions
// ============================================

/**
 * Trend içerikleri getir
 */
export async function executeGetTrendingContent({
  period,
  limit,
  sortBy,
}: z.infer<typeof getTrendingContentSchema>) {
  const supabase = createAdminSupabaseClient();

  // Tarih hesapla
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default: // today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  // Sıralama alanı
  const orderField = sortBy === 'engagement' 
    ? 'likes_count' // engagement için likes + comments toplamı yapılabilir
    : `${sortBy}_count`;

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      caption,
      post_type,
      likes_count,
      comments_count,
      shares_count,
      views_count,
      created_at
    `)
    .gte('created_at', startDate.toISOString())
    .eq('is_hidden', false)
    .eq('moderation_status', 'approved')
    .order(orderField, { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: `Trend içerikler alınamadı: ${error.message}` };
  }

  if (!posts || posts.length === 0) {
    return { success: true, count: 0, posts: [], message: 'Bu dönemde trend içerik bulunamadı' };
  }

  // Profil bilgilerini al
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, is_creator, is_verified')
    .in('user_id', userIds)
    .eq('type', 'real');

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  // Medya bilgilerini al
  const postIds = posts.map(p => p.id);
  const { data: mediaData } = await supabase
    .from('post_media')
    .select('post_id, media_type, media_url, thumbnail_url, duration')
    .in('post_id', postIds);

  const mediaMap = new Map<string, typeof mediaData>();
  mediaData?.forEach(m => {
    const existing = mediaMap.get(m.post_id) || [];
    existing.push(m);
    mediaMap.set(m.post_id, existing);
  });

  return {
    success: true,
    period,
    sortBy,
    count: posts.length,
    posts: posts.map((post, index) => {
      const profile = profileMap.get(post.user_id);
      const media = mediaMap.get(post.id) || [];
      const engagement = (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.shares_count || 0) * 3;
      return {
        rank: index + 1,
        id: post.id,
        caption: post.caption?.slice(0, 80) + (post.caption && post.caption.length > 80 ? '...' : ''),
        author: profile?.username || 'Anonim',
        is_verified: profile?.is_verified || false,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
        views: post.views_count || 0,
        engagement_score: engagement,
        created_at: getTimeAgo(post.created_at),
        // Medya bilgileri
        media_count: media.length,
        media: media.map(m => ({
          type: m.media_type,
          url: m.media_url,
          thumbnail: m.thumbnail_url,
          duration: m.duration,
        })),
      };
    }),
  };
}

/**
 * Top creator'ları getir
 */
export async function executeGetTopCreators({
  period,
  limit,
  sortBy,
}: z.infer<typeof getTopCreatorsSchema>) {
  const supabase = createAdminSupabaseClient();

  // Creator'ları al
  const { data: creators, error } = await supabase
    .from('profiles')
    .select(`
      user_id,
      username,
      display_name,
      avatar_url,
      is_verified,
      created_at
    `)
    .eq('is_creator', true)
    .eq('type', 'real')
    .eq('is_active', true)
    .limit(100); // Daha fazla al, sonra sırala

  if (error) {
    return { success: false, error: `Creator'lar alınamadı: ${error.message}` };
  }

  if (!creators || creators.length === 0) {
    return { success: true, count: 0, creators: [] };
  }

  // Her creator için istatistikleri al
  const creatorStats = await Promise.all(
    creators.map(async (creator) => {
      // Abone sayısı
      const { count: subscriberCount } = await supabase
        .from('creator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.user_id)
        .eq('status', 'active');

      // Post sayısı
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', creator.user_id)
        .eq('is_hidden', false);

      // Toplam etkileşim
      const { data: engagement } = await supabase
        .from('posts')
        .select('likes_count, comments_count')
        .eq('user_id', creator.user_id)
        .eq('is_hidden', false);

      const totalLikes = engagement?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
      const totalComments = engagement?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;

      return {
        ...creator,
        subscribers: subscriberCount || 0,
        posts: postCount || 0,
        totalLikes,
        totalComments,
        engagement: totalLikes + totalComments * 2,
      };
    })
  );

  // Sıralama
  const sortedCreators = creatorStats.sort((a, b) => {
    switch (sortBy) {
      case 'subscribers': return b.subscribers - a.subscribers;
      case 'posts': return b.posts - a.posts;
      case 'engagement': return b.engagement - a.engagement;
      default: return b.subscribers - a.subscribers;
    }
  }).slice(0, limit);

  return {
    success: true,
    period,
    sortBy,
    count: sortedCreators.length,
    creators: sortedCreators.map((c, index) => ({
      rank: index + 1,
      username: c.username,
      display_name: c.display_name,
      is_verified: c.is_verified,
      subscribers: c.subscribers,
      posts: c.posts,
      total_likes: c.totalLikes,
      total_comments: c.totalComments,
      engagement_score: c.engagement,
    })),
  };
}

/**
 * Raporu çöz
 */
export async function executeResolveReport({
  reportId,
  action,
  notes,
}: z.infer<typeof resolveReportSchema>) {
  const supabase = createAdminSupabaseClient();

  // Raporu bul
  const { data: report, error: reportError } = await supabase
    .from('user_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return { success: false, error: 'Rapor bulunamadı' };
  }

  if (report.status === 'resolved') {
    return { success: false, error: 'Bu rapor zaten çözülmüş' };
  }

  // Aksiyonu uygula
  let actionResult = '';
  
  switch (action) {
    case 'warn':
      // Kullanıcıya uyarı bildirimi gönder
      await supabase.from('notifications').insert({
        recipient_id: report.reported_id,
        type: 'warning',
        title: 'Uyarı',
        body: 'İçeriğiniz topluluk kurallarına aykırı bulundu. Lütfen kurallara uyun.',
      });
      actionResult = 'Kullanıcıya uyarı gönderildi';
      break;
      
    case 'hide':
      if (report.content_type === 'post') {
        await supabase.from('posts').update({ is_hidden: true }).eq('id', report.content_id);
        actionResult = 'İçerik gizlendi';
      }
      break;
      
    case 'delete':
      if (report.content_type === 'post') {
        await supabase.from('posts').update({ is_hidden: true, moderation_status: 'rejected' }).eq('id', report.content_id);
        actionResult = 'İçerik silindi';
      }
      break;
      
    case 'ban':
      await supabase.from('user_bans').insert({
        user_id: report.reported_id,
        reason: `Rapor sonucu: ${report.reason}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün
      });
      actionResult = 'Kullanıcı 7 gün banlandı';
      break;
  }

  // Raporu güncelle
  await supabase
    .from('user_reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes: notes || actionResult,
    })
    .eq('id', reportId);

  return {
    success: true,
    message: `Rapor çözüldü: ${actionResult}`,
    reportId,
    action,
    actionResult,
  };
}

/**
 * Raporu reddet
 */
export async function executeDismissReport({
  reportId,
  reason,
}: z.infer<typeof dismissReportSchema>) {
  const supabase = createAdminSupabaseClient();

  // Raporu bul
  const { data: report, error: reportError } = await supabase
    .from('user_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return { success: false, error: 'Rapor bulunamadı' };
  }

  if (report.status !== 'pending') {
    return { success: false, error: 'Bu rapor zaten işlenmiş' };
  }

  // Raporu reddet
  const { error } = await supabase
    .from('user_reports')
    .update({
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolution_notes: `Reddedildi: ${reason}`,
    })
    .eq('id', reportId);

  if (error) {
    return { success: false, error: `Rapor reddedilemedi: ${error.message}` };
  }

  return {
    success: true,
    message: 'Rapor reddedildi',
    reportId,
    reason,
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

  // ============================================
  // V2 Tool'ları - Yeni Eklenenler
  // ============================================
  
  // Post Moderasyon
  approvePost: {
    description: `Postu onayla. Moderasyon durumunu 'approved' yapar.`,
    inputSchema: approvePostSchema,
    execute: executeApprovePost,
  },
  rejectPost: {
    description: `Postu reddet. Moderasyon durumunu 'rejected' yapar ve kullanıcıyı bilgilendirir.`,
    inputSchema: rejectPostSchema,
    execute: executeRejectPost,
  },
  
  // Finans
  adjustCoinBalance: {
    description: `Kullanıcının coin bakiyesini ayarla. Pozitif değer ekler, negatif değer çıkarır.`,
    inputSchema: adjustCoinBalanceSchema,
    execute: executeAdjustCoinBalance,
  },
  
  // Dashboard
  getDashboardSummary: {
    description: `Günlük özet dashboard. Yeni kullanıcılar, postlar, moderasyon ve gelir bilgisi.`,
    inputSchema: getDashboardSummarySchema,
    execute: executeGetDashboardSummary,
  },
  
  // Kullanıcı Doğrulama
  verifyUser: {
    description: `Kullanıcıyı doğrula veya doğrulamayı kaldır. Mavi tik ekler/kaldırır.`,
    inputSchema: verifyUserSchema,
    execute: executeVerifyUser,
  },

  // ============================================
  // V2 Phase 2 - Yüksek Öncelikli Tool'lar
  // ============================================
  
  // Trend & Analytics
  getTrendingContent: {
    description: `Trend içerikleri getir. En popüler postları beğeni, yorum, görüntülenme veya engagement'a göre sıralar.`,
    inputSchema: getTrendingContentSchema,
    execute: executeGetTrendingContent,
  },
  getTopCreators: {
    description: `En başarılı creator'ları getir. Abone sayısı, post sayısı veya engagement'a göre sıralar.`,
    inputSchema: getTopCreatorsSchema,
    execute: executeGetTopCreators,
  },
  
  // Rapor Yönetimi
  resolveReport: {
    description: `Raporu çöz ve aksiyon al. Uyarı gönder, içerik gizle/sil veya kullanıcıyı banla.`,
    inputSchema: resolveReportSchema,
    execute: executeResolveReport,
  },
  dismissReport: {
    description: `Raporu reddet. Geçersiz veya hatalı raporları kapatır.`,
    inputSchema: dismissReportSchema,
    execute: executeDismissReport,
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
  // V2 - Yeni Tool'lar
  approvePost: 'Post onayla',
  rejectPost: 'Post reddet',
  adjustCoinBalance: 'Coin bakiyesi ayarla',
  getDashboardSummary: 'Dashboard özeti',
  verifyUser: 'Kullanıcı doğrula',
  // V2 Phase 2 - Yüksek Öncelikli
  getTrendingContent: 'Trend içerikler',
  getTopCreators: 'Top creator\'lar',
  resolveReport: 'Raporu çöz',
  dismissReport: 'Raporu reddet',
};
