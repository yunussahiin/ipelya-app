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

    // Check if user is admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminProfile) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, body: notificationBody, data, recipient_id, recipient_segment, filter, scheduled_at } = body;

    // Validate required fields
    if (!type || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, body' },
        { status: 400 }
      );
    }

    if (!['single', 'bulk', 'scheduled'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: single, bulk, or scheduled' },
        { status: 400 }
      );
    }

    if (type === 'single' && !recipient_id) {
      return NextResponse.json(
        { error: 'recipient_id is required for single notifications' },
        { status: 400 }
      );
    }

    if (type === 'bulk' && !recipient_segment) {
      return NextResponse.json(
        { error: 'recipient_segment is required for bulk notifications' },
        { status: 400 }
      );
    }

    if (type === 'scheduled' && !scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required for scheduled notifications' },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('notification_campaigns')
      .insert({
        admin_id: user.id,
        type,
        title,
        body: notificationBody,
        data: data || {},
        recipient_segment,
        filter,
        scheduled_at,
        status: type === 'scheduled' ? 'scheduled' : 'draft',
        total_recipients: 0,
        sent_count: 0,
        failed_count: 0,
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // For single notifications, insert directly to notifications table
    if (type === 'single' && recipient_id) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          recipient_id,
          actor_id: user.id,
          type: 'admin_notification',
          title,
          body: notificationBody,
          data: {
            ...data,
            campaign_id: campaign.id,
          },
        });

      if (notifError) {
        console.error('Notification creation error:', notifError);
        return NextResponse.json(
          { error: 'Failed to create notification' },
          { status: 500 }
        );
      }

      // Update campaign status
      await supabase
        .from('notification_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_recipients: 1,
          sent_count: 1,
        })
        .eq('id', campaign.id);

      console.log('✅ Single notification sent:', campaign.id);
    }

    // For bulk/scheduled, they'll be processed by edge functions
    if (type === 'bulk' || type === 'scheduled') {
      console.log(`✅ ${type} notification campaign created:`, campaign.id);
    }

    return NextResponse.json(
      {
        success: true,
        campaign,
        message: `${type} notification ${type === 'single' ? 'sent' : 'scheduled'}`,
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
