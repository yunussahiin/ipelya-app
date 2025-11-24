/**
 * Get Feed Edge Function
 * 
 * Amaç: Kullanıcıya özel algoritma tabanlı feed oluşturur
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

console.log('🚀 Get Feed Function Started');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', user.id);

    // Query parameters
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    console.log('🔍 Feed request:', { user_id: user.id, cursor, limit });

    // Fetch posts with user profile
    let postsQuery = supabase
      .from('posts')
      .select(`
        *,
        profiles!inner(user_id, username, display_name, avatar_url),
        post_media(*)
      `)
      .eq('is_hidden', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (cursor) {
      postsQuery = postsQuery.lt('created_at', cursor);
    }

    postsQuery = postsQuery.limit(limit);

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('❌ Posts fetch error:', postsError);
      return new Response(JSON.stringify({ success: false, error: postsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📝 Posts fetched:', posts?.length || 0);

    // Format feed items
    const feedItems = (posts || []).map((post) => ({
      id: `post_${post.id}`,
      content_type: 'post',
      content: {
        ...post,
        user: post.profiles,
        media: post.post_media
      }
    }));

    // Determine next cursor
    const hasMore = posts && posts.length === limit;
    const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : null;

    console.log('🎉 Feed generated:', { items: feedItems.length, hasMore });

    return new Response(JSON.stringify({
      success: true,
      data: {
        items: feedItems,
        next_cursor: nextCursor,
        has_more: hasMore
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in get-feed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
