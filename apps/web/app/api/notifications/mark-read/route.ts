import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      // Mark all notifications as read for current user
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Mark all as read error:', error);
        return NextResponse.json(
          { error: 'Failed to mark all as read' },
          { status: 500 }
        );
      }

      console.log('✅ All notifications marked as read for user:', user.id);

      return NextResponse.json(
        {
          success: true,
          message: 'All notifications marked as read',
        },
        { status: 200 }
      );
    }

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id or mark_all is required' },
        { status: 400 }
      );
    }

    // Mark single notification as read
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notification_id)
      .eq('recipient_id', user.id); // Ensure user owns this notification

    if (error) {
      console.error('Mark as read error:', error);
      return NextResponse.json(
        { error: 'Failed to mark as read' },
        { status: 500 }
      );
    }

    console.log('✅ Notification marked as read:', notification_id);

    return NextResponse.json(
      {
        success: true,
        message: 'Notification marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
