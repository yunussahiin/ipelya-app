# Shadow Profile - Web Operations Dashboard

## Overview

Web Operations Dashboard, Shadow Profile sisteminin backend yönetimi, monitoring, analytics ve kontrol paneli için tasarlanmıştır. Ops tarafı tüm shadow profile aktivitelerini izleyebilir, anomalileri tespit edebilir ve gerekli aksiyonları alabilir.

## Dashboard Features

### 1. **Real-time Monitoring**
- Aktif shadow mode sessions
- Concurrent users
- Failed authentication attempts
- Rate limit violations
- Anomaly alerts

### 2. **Analytics & Reporting**
- User activity trends
- Authentication success/failure rates
- Peak usage times
- Geographic distribution
- Device types

### 3. **Security Management**
- Audit log viewer
- Rate limit configuration
- Anomaly detection settings
- Session management
- User lockout controls

### 4. **Performance Metrics**
- API response times
- Database query performance
- Storage usage
- Session duration statistics
- Avatar upload success rates

---

## API Endpoints Required

### Monitoring Endpoints

#### GET `/api/ops/shadow/sessions`
Aktif shadow mode sessions'ları listele

**Query Parameters:**
```
- limit: number (default: 50)
- offset: number (default: 0)
- status: "active" | "expired" | "all" (default: "active")
- sort: "created_at" | "last_activity" (default: "last_activity")
```

**Response:**
```json
{
  "data": [
    {
      "session_id": "uuid",
      "user_id": "uuid",
      "started_at": "2025-11-22T06:00:00Z",
      "last_activity": "2025-11-22T06:15:00Z",
      "expires_at": "2025-11-22T06:30:00Z",
      "status": "active",
      "ip_address": "192.168.1.1",
      "device_type": "mobile"
    }
  ],
  "total": 150,
  "page": 1
}
```

#### GET `/api/ops/shadow/audit-logs`
Audit logs'ları filtrele ve görüntüle

**Query Parameters:**
```
- user_id: uuid (optional)
- action: string (optional)
- start_date: ISO8601 (optional)
- end_date: ISO8601 (optional)
- limit: number (default: 100)
- offset: number (default: 0)
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "shadow_mode_enabled",
      "profile_type": "shadow",
      "ip_address": "192.168.1.1",
      "metadata": {
        "biometric_verified": true,
        "device_type": "iOS"
      },
      "created_at": "2025-11-22T06:00:00Z"
    }
  ],
  "total": 5000,
  "page": 1
}
```

#### GET `/api/ops/shadow/anomalies`
Tespit edilen anomalileri listele

**Query Parameters:**
```
- severity: "low" | "medium" | "high" | "critical" (optional)
- status: "active" | "resolved" | "all" (default: "active")
- limit: number (default: 50)
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "alert_type": "excessive_failed_attempts",
      "severity": "high",
      "message": "5 failed PIN attempts in 15 minutes",
      "metadata": {
        "attempts": 5,
        "window_minutes": 15,
        "last_attempt": "2025-11-22T06:15:00Z"
      },
      "created_at": "2025-11-22T06:15:00Z",
      "resolved_at": null
    }
  ],
  "total": 23,
  "page": 1
}
```

#### GET `/api/ops/shadow/rate-limits`
Rate limit istatistikleri

**Response:**
```json
{
  "pin_attempts": {
    "total_violations": 45,
    "locked_users": 12,
    "violations_last_24h": 8
  },
  "biometric_attempts": {
    "total_violations": 23,
    "locked_users": 5,
    "violations_last_24h": 2
  }
}
```

#### GET `/api/ops/shadow/analytics`
Genel analytics metrikleri

**Query Parameters:**
```
- period: "24h" | "7d" | "30d" | "90d" (default: "7d")
- metric: "sessions" | "authentications" | "failures" | "all" (default: "all")
```

**Response:**
```json
{
  "period": "7d",
  "metrics": {
    "total_sessions": 1250,
    "active_sessions": 45,
    "successful_authentications": 1200,
    "failed_authentications": 50,
    "failure_rate": 4.0,
    "average_session_duration_minutes": 23,
    "peak_concurrent_users": 12,
    "unique_users": 450
  },
  "hourly_breakdown": [
    {
      "hour": "2025-11-22T00:00:00Z",
      "sessions": 45,
      "authentications": 50,
      "failures": 2
    }
  ]
}
```

---

### Management Endpoints

#### POST `/api/ops/shadow/users/:userId/lockout`
Kullanıcıyı kilitlemek

**Request Body:**
```json
{
  "reason": "excessive_failed_attempts",
  "duration_minutes": 30,
  "notification": true
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "uuid",
  "locked_until": "2025-11-22T06:30:00Z",
  "reason": "excessive_failed_attempts"
}
```

#### POST `/api/ops/shadow/users/:userId/unlock`
Kullanıcının kilidini açmak

**Response:**
```json
{
  "success": true,
  "user_id": "uuid",
  "message": "User unlocked successfully"
}
```

#### POST `/api/ops/shadow/sessions/:sessionId/terminate`
Session'ı sonlandırmak

**Request Body:**
```json
{
  "reason": "suspicious_activity",
  "notification": true
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "terminated_at": "2025-11-22T06:15:00Z"
}
```

#### POST `/api/ops/shadow/anomalies/:anomalyId/resolve`
Anomaliyi çözmek

**Request Body:**
```json
{
  "resolution": "false_positive",
  "notes": "User confirmed legitimate access"
}
```

**Response:**
```json
{
  "success": true,
  "anomaly_id": "uuid",
  "resolved_at": "2025-11-22T06:15:00Z"
}
```

---

### Configuration Endpoints

#### GET `/api/ops/shadow/config/rate-limits`
Rate limit konfigürasyonunu al

**Response:**
```json
{
  "pin": {
    "max_attempts": 5,
    "window_minutes": 15,
    "lockout_minutes": 30
  },
  "biometric": {
    "max_attempts": 3,
    "window_minutes": 5,
    "lockout_minutes": 15
  }
}
```

#### PUT `/api/ops/shadow/config/rate-limits`
Rate limit konfigürasyonunu güncelle

**Request Body:**
```json
{
  "pin": {
    "max_attempts": 6,
    "window_minutes": 20,
    "lockout_minutes": 45
  }
}
```

#### GET `/api/ops/shadow/config/anomaly-detection`
Anomaly detection ayarlarını al

**Response:**
```json
{
  "excessive_failed_attempts": {
    "enabled": true,
    "threshold": 10,
    "window_minutes": 60,
    "severity": "high"
  },
  "multiple_ips": {
    "enabled": true,
    "threshold": 2,
    "window_minutes": 60,
    "severity": "medium"
  },
  "long_sessions": {
    "enabled": true,
    "threshold_minutes": 120,
    "severity": "low"
  },
  "unusual_access_time": {
    "enabled": true,
    "normal_hours": "08:00-23:00",
    "severity": "low"
  }
}
```

#### PUT `/api/ops/shadow/config/anomaly-detection`
Anomaly detection ayarlarını güncelle

---

## Dashboard Pages

### 1. **Dashboard Home**
- Real-time metrics cards
- Active sessions chart
- Authentication trends
- Recent anomalies
- Quick actions

### 2. **Sessions Monitor**
- Active sessions table
- Session details modal
- Session termination
- User info
- Activity timeline

### 3. **Audit Logs Viewer**
- Filterable logs table
- Advanced search
- Export functionality
- Log details modal
- Timeline view

### 4. **Anomaly Management**
- Anomaly alerts list
- Severity filtering
- Resolution workflow
- Bulk actions
- Alert history

### 5. **Rate Limiting**
- Current violations
- Locked users list
- Configuration editor
- Violation history
- Unlock users

### 6. **Analytics**
- Time period selector
- Multiple chart types
- Custom date range
- Data export
- Trend analysis

### 7. **Configuration**
- Rate limit settings
- Anomaly detection rules
- Session timeout
- Feature flags
- Audit settings

### 8. **User Management**
- User search
- Shadow profile status
- Session history
- Activity logs
- Lockout management

---

## Data Visualization

### Charts Required

1. **Sessions Over Time**
   - Line chart
   - Hourly/Daily/Weekly granularity
   - Active vs Total sessions

2. **Authentication Success Rate**
   - Pie chart
   - Success/Failure breakdown
   - Trend line

3. **Failed Attempts Distribution**
   - Bar chart
   - By action type (PIN, Biometric)
   - Time-based distribution

4. **Anomaly Severity Distribution**
   - Donut chart
   - Critical/High/Medium/Low breakdown

5. **Geographic Distribution**
   - Map visualization
   - User locations
   - Anomaly hotspots

6. **Device Type Distribution**
   - Pie chart
   - iOS/Android/Web breakdown

7. **Peak Usage Times**
   - Heatmap
   - Hour of day vs Day of week

---

## Alerts & Notifications

### Alert Types

1. **Critical Alerts**
   - Multiple failed authentication attempts
   - Suspicious IP access
   - Session anomalies
   - Rate limit violations

2. **Warning Alerts**
   - Unusual access times
   - Long session durations
   - Multiple device access

3. **Info Alerts**
   - New shadow mode activations
   - Configuration changes
   - Routine maintenance

### Notification Channels
- In-app notifications
- Email alerts
- Slack integration (optional)
- SMS alerts (optional)

---

## Security Considerations

1. **Access Control**
   - Role-based access (Admin, Moderator, Viewer)
   - IP whitelisting
   - 2FA for sensitive operations

2. **Audit Trail**
   - All ops actions logged
   - Who made what changes
   - When and why

3. **Data Privacy**
   - Sensitive data masking (partial user IDs)
   - GDPR compliance
   - Data retention policies

4. **Rate Limiting**
   - API rate limits for ops endpoints
   - Prevent brute force on admin panel

---

## Implementation Checklist

- [ ] API endpoints implementation
- [ ] Database queries optimization
- [ ] Real-time WebSocket setup
- [ ] Dashboard UI components
- [ ] Charts and visualizations
- [ ] Authentication & authorization
- [ ] Logging and audit trail
- [ ] Alert system
- [ ] Performance optimization
- [ ] Testing and QA
- [ ] Documentation
- [ ] Deployment

---

## Next Steps

1. Create detailed API specifications
2. Design database schema for ops data
3. Implement WebSocket for real-time updates
4. Build React dashboard components
5. Set up monitoring and alerting
6. Create admin user management
7. Implement audit logging for ops actions
