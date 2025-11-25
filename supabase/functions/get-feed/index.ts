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

    // Fetch polls with user profile
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select(`
        *,
        profiles!inner(user_id, username, display_name, avatar_url),
        poll_options(*)
      `)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (pollsError) {
      console.error('❌ Polls fetch error:', pollsError);
    }

    console.log('📊 Polls fetched:', polls?.length || 0);

    // Format post feed items
    const postItems = (posts || []).map((post) => ({
      id: `post_${post.id}`,
      content_type: 'post',
      content: {
        ...post,
        user: post.profiles,
        media: post.post_media
      },
      created_at: post.created_at
    }));

    // Format poll feed items
    const pollItems = (polls || []).map((poll) => ({
      id: `poll_${poll.id}`,
      content_type: 'poll',
      content: {
        ...poll,
        user: poll.profiles,
        options: poll.poll_options,
        total_votes: poll.poll_options?.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0) || 0
      },
      created_at: poll.created_at
    }));

    // Merge and sort by created_at
    const allItems = [...postItems, ...pollItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Remove created_at from final items (not needed in response)
    const feedItems = allItems.map(({ created_at, ...item }) => item);

    // Determine next cursor
    const hasMore = posts && posts.length === limit;
    const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : null;

    console.log('🎉 Feed generated:', { posts: postItems.length, polls: pollItems.length, total: feedItems.length, hasMore });

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
