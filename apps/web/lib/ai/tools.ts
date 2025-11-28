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

export const searchUsersSchema = z.object({
  query: z.string().min(2).describe('Arama terimi (min 2 karakter)'),
  limit: z.number().min(1).max(20).default(10).describe('Maksimum sonuç sayısı'),
  role: z
    .enum(['all', 'user', 'creator', 'admin'])
    .default('all')
    .describe('Rol filtresi'),
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
 * Kullanıcı ara (çoklu sonuç)
 */
export async function executeSearchUsers({
  query,
  limit,
  role,
}: z.infer<typeof searchUsersSchema>) {
  const supabase = createAdminSupabaseClient();

  let dbQuery = supabase
    .from('profiles')
    .select('id, user_id, username, display_name, role, is_creator, is_verified, is_active, created_at, last_login_at')
    .eq('type', 'real')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

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
    query,
    count: users?.length || 0,
    users: users?.map((user) => ({
      id: user.id,
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name,
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
  lookupUser: {
    description: `Kullanıcı bilgilerini ID, email veya username ile sorgula. 
      Kullanıcının profil bilgileri, kayıt tarihi, son giriş, ban durumu ve istatistiklerini döndürür.
      Hassas bilgiler (email, telefon) maskelenir.`,
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
    description: `Kullanıcıları ara. Username, display name veya email ile arama yapar.
      Çoklu sonuç döndürür, detaylı bilgi için lookupUser kullanın.`,
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
};

/**
 * Tool adları listesi
 */
export const toolNames = Object.keys(aiTools) as Array<keyof typeof aiTools>;

/**
 * Tool açıklamaları (UI için)
 */
export const toolDescriptions: Record<keyof typeof aiTools, string> = {
  lookupUser: 'Kullanıcı bilgilerini sorgula',
  getRecentPosts: 'Son postları getir',
  getSystemStats: 'Platform istatistikleri',
  searchUsers: 'Kullanıcı ara',
  getModerationQueue: 'Moderasyon kuyruğu',
  getPostDetails: 'Post detayları',
};
