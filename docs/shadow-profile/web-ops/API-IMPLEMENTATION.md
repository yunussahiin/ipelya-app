# Shadow Profile - Web Ops API Implementation Guide

## Backend Setup

### Database Views & Functions

#### 1. Active Sessions View
```sql
CREATE VIEW ops_active_sessions AS
SELECT 
  s.id as session_id,
  s.user_id,
  s.started_at,
  s.last_activity,
  s.expires_at,
  s.status,
  al.ip_address,
  al.metadata->>'device_type' as device_type,
  COUNT(*) OVER (PARTITION BY s.user_id) as user_session_count
FROM sessions s
LEFT JOIN audit_logs al ON s.id = al.metadata->>'session_id'
WHERE s.status = 'active'
ORDER BY s.last_activity DESC;
```

#### 2. Audit Logs Summary
```sql
CREATE VIEW ops_audit_summary AS
SELECT 
  DATE(created_at) as date,
  action,
  COUNT(*) as count,
  COUNT(CASE WHEN metadata->>'success' = 'true' THEN 1 END) as successful,
  COUNT(CASE WHEN metadata->>'success' = 'false' THEN 1 END) as failed
FROM audit_logs
GROUP BY DATE(created_at), action
ORDER BY date DESC;
```

#### 3. Rate Limit Violations View
```sql
CREATE VIEW ops_rate_limit_violations AS
SELECT 
  user_id,
  action,
  COUNT(*) as violation_count,
  MAX(created_at) as last_violation,
  CASE 
    WHEN action LIKE '%pin%' THEN 'PIN'
    WHEN action LIKE '%biometric%' THEN 'Biometric'
    ELSE 'Other'
  END as violation_type
FROM audit_logs
WHERE action LIKE '%failed%' OR action LIKE '%rate_limit%'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, action
HAVING COUNT(*) >= 3;
```

#### 4. Anomaly Summary Function
```sql
CREATE OR REPLACE FUNCTION get_anomaly_summary(
  p_severity VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  alert_type VARCHAR,
  severity VARCHAR,
  message TEXT,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id,
    aa.user_id,
    aa.alert_type,
    aa.severity,
    aa.message,
    aa.created_at,
    aa.resolved_at
  FROM anomaly_alerts aa
  WHERE (p_severity IS NULL OR aa.severity = p_severity)
  AND aa.resolved_at IS NULL
  ORDER BY aa.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## API Implementation (Node.js/Express)

### 1. Sessions Endpoint

```typescript
// GET /api/ops/shadow/sessions
router.get('/ops/shadow/sessions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'active', sort = 'last_activity' } = req.query;
    
    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' });
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, count, error } = await query
      .order(sort, { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Audit Logs Endpoint

```typescript
// GET /api/ops/shadow/audit-logs
router.get('/ops/shadow/audit-logs', async (req, res) => {
  try {
    const { 
      user_id, 
      action, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });
    
    if (user_id) query = query.eq('user_id', user_id);
    if (action) query = query.eq('action', action);
    
    if (start_date) {
      query = query.gte('created_at', new Date(start_date).toISOString());
    }
    if (end_date) {
      query = query.lte('created_at', new Date(end_date).toISOString());
    }
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Anomalies Endpoint

```typescript
// GET /api/ops/shadow/anomalies
router.get('/ops/shadow/anomalies', async (req, res) => {
  try {
    const { severity, status = 'active', limit = 50 } = req.query;
    
    let query = supabase
      .from('anomaly_alerts')
      .select('*');
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    if (status === 'active') {
      query = query.is('resolved_at', null);
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    res.json({
      data,
      total: data.length,
      active: data.filter(a => !a.resolved_at).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Analytics Endpoint

```typescript
// GET /api/ops/shadow/analytics
router.get('/ops/shadow/analytics', async (req, res) => {
  try {
    const { period = '7d', metric = 'all' } = req.query;
    
    const periodDays = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[period] || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Get sessions data
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    if (sessionsError) throw sessionsError;
    
    // Get authentication data
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .in('action', ['pin_verified', 'pin_failed', 'biometric_verified', 'biometric_failed']);
    
    if (auditError) throw auditError;
    
    // Calculate metrics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const successfulAuths = auditLogs.filter(l => l.action.includes('verified')).length;
    const failedAuths = auditLogs.filter(l => l.action.includes('failed')).length;
    const failureRate = ((failedAuths / (successfulAuths + failedAuths)) * 100).toFixed(2);
    
    res.json({
      period,
      metrics: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        successful_authentications: successfulAuths,
        failed_authentications: failedAuths,
        failure_rate: parseFloat(failureRate),
        unique_users: new Set(sessions.map(s => s.user_id)).size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. User Lockout Endpoint

```typescript
// POST /api/ops/shadow/users/:userId/lockout
router.post('/ops/shadow/users/:userId/lockout', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration_minutes = 30, notification = true } = req.body;
    
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + duration_minutes);
    
    // Update user lockout status
    const { error } = await supabase
      .from('user_lockouts')
      .upsert({
        user_id: userId,
        reason,
        locked_until: lockedUntil.toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'user_locked_by_ops',
      profile_type: 'real',
      metadata: { reason, duration_minutes, ops_action: true }
    });
    
    // Send notification if enabled
    if (notification) {
      // Send email/push notification
      console.log(`User ${userId} locked until ${lockedUntil}`);
    }
    
    res.json({
      success: true,
      user_id: userId,
      locked_until: lockedUntil.toISOString(),
      reason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 6. Session Termination Endpoint

```typescript
// POST /api/ops/shadow/sessions/:sessionId/terminate
router.post('/ops/shadow/sessions/:sessionId/terminate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason, notification = true } = req.body;
    
    // Update session status
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'terminated', ended_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    if (error) throw error;
    
    // Log the action
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
    
    if (session) {
      await supabase.from('audit_logs').insert({
        user_id: session.user_id,
        action: 'session_terminated_by_ops',
        profile_type: 'shadow',
        metadata: { session_id: sessionId, reason, ops_action: true }
      });
    }
    
    res.json({
      success: true,
      session_id: sessionId,
      terminated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Real-time Updates with WebSocket

```typescript
// WebSocket setup for real-time monitoring
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Subscribe to real-time changes
supabase
  .channel('ops-sessions')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'sessions' },
    (payload) => {
      // Broadcast to all connected ops clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'session_update',
            data: payload.new
          }));
        }
      });
    }
  )
  .subscribe();

// Subscribe to anomalies
supabase
  .channel('ops-anomalies')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'anomaly_alerts' },
    (payload) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'anomaly_alert',
            data: payload.new,
            severity: payload.new.severity
          }));
        }
      });
    }
  )
  .subscribe();
```

---

## Error Handling

```typescript
// Centralized error handler
const handleOpsError = (error, res) => {
  console.error('Ops API Error:', error);
  
  if (error.code === 'PGRST116') {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  if (error.code === '42P01') {
    return res.status(500).json({ error: 'Database table not found' });
  }
  
  res.status(500).json({ 
    error: error.message || 'Internal server error',
    code: error.code
  });
};
```

---

## Rate Limiting for Ops API

```typescript
import rateLimit from 'express-rate-limit';

const opsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.use('/ops/', opsLimiter);
```

---

## Testing

```typescript
// Example test cases
describe('Ops API', () => {
  it('should fetch active sessions', async () => {
    const res = await request(app)
      .get('/api/ops/shadow/sessions')
      .query({ status: 'active' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });
  
  it('should lock a user', async () => {
    const res = await request(app)
      .post('/api/ops/shadow/users/test-user-id/lockout')
      .send({
        reason: 'excessive_failed_attempts',
        duration_minutes: 30
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

---

## Deployment Checklist

- [ ] Database views created
- [ ] API endpoints implemented
- [ ] WebSocket server configured
- [ ] Error handling in place
- [ ] Rate limiting enabled
- [ ] Authentication middleware added
- [ ] Logging configured
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Performance optimized
