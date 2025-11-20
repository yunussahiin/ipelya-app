import { createClient } from 'npm:@supabase/supabase-js@2'

console.log('Push Notification Function Started')

interface Notification {
  id: string
  recipient_id: string
  actor_id: string | null
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Notification
  schema: 'public'
  old_record: null | Notification
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    console.log('Webhook payload received:', payload)

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ success: false, message: 'Only INSERT events are processed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const notification = payload.record

    // Get recipient's device token and notification preferences
    const { data: deviceData, error: deviceError } = await supabase
      .from('device_tokens')
      .select('token, device_type')
      .eq('user_id', notification.recipient_id)
      .single()

    if (deviceError || !deviceData) {
      console.log('No device token found for user:', notification.recipient_id)
      return new Response(JSON.stringify({ success: false, message: 'No device token found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Get notification preferences
    const { data: preferencesData, error: prefError } = await supabase
      .from('notification_preferences')
      .select('push_enabled, notification_types')
      .eq('user_id', notification.recipient_id)
      .single()

    if (prefError || !preferencesData?.push_enabled) {
      console.log('Push notifications disabled for user:', notification.recipient_id)
      return new Response(JSON.stringify({ success: false, message: 'Push notifications disabled' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Check if this notification type is enabled
    const notificationTypes = preferencesData.notification_types || {}
    if (notificationTypes[notification.type] === false) {
      console.log(`Notification type ${notification.type} is disabled for user:`, notification.recipient_id)
      return new Response(JSON.stringify({ success: false, message: `Notification type ${notification.type} disabled` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Send push notification via Expo
    const expoToken = deviceData.token
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')

    if (!expoAccessToken) {
      console.error('EXPO_ACCESS_TOKEN not set')
      return new Response(JSON.stringify({ success: false, message: 'EXPO_ACCESS_TOKEN not configured' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('Sending push notification to:', expoToken)

    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expoAccessToken}`,
      },
      body: JSON.stringify({
        to: expoToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: 1,
      }),
    })

    const pushResult = await pushResponse.json()
    console.log('Expo push response:', pushResult)

    return new Response(JSON.stringify({ success: true, result: pushResult }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-notification function:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
