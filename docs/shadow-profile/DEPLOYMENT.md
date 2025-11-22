# Shadow Profile - Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Review
- [ ] All Phase 5 services implemented and tested
- [ ] All Phase 4 integration complete
- [ ] No console errors or warnings
- [ ] TypeScript strict mode enabled
- [ ] All lints resolved

### ✅ Database
- [ ] All migrations applied
- [ ] RLS policies configured
- [ ] Indexes created for performance
- [ ] Audit logs table ready
- [ ] Sessions table ready

### ✅ Security
- [ ] Rate limiting configured
- [ ] Anomaly detection active
- [ ] Session timeout set to 30 minutes
- [ ] PIN hashing implemented
- [ ] Biometric authentication working

### ✅ Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Manual testing completed

---

## Database Migrations

### Required Migrations

```sql
-- 1. Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  profile_type VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  profile_type VARCHAR(20) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create anomaly_alerts table
CREATE TABLE anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
```

### Apply Migrations

```bash
# Using Supabase CLI
supabase migration new create_shadow_profile_tables
supabase migration up

# Or manually in Supabase Dashboard
# SQL Editor → Run migrations
```

---

## Environment Variables

### Required Variables

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
EXPO_PUBLIC_SHADOW_MODE_ENABLED=true
EXPO_PUBLIC_RATE_LIMITING_ENABLED=true
EXPO_PUBLIC_ANOMALY_DETECTION_ENABLED=true

# Session Configuration
EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES=30

# Rate Limiting Configuration
EXPO_PUBLIC_PIN_MAX_ATTEMPTS=5
EXPO_PUBLIC_PIN_WINDOW_MINUTES=15
EXPO_PUBLIC_BIOMETRIC_MAX_ATTEMPTS=3
EXPO_PUBLIC_BIOMETRIC_WINDOW_MINUTES=5
```

### Setup Instructions

1. **Create `.env.local` file:**
```bash
cp .env.example .env.local
```

2. **Update with your values:**
```bash
# Edit .env.local with your Supabase credentials
```

3. **Verify environment:**
```bash
npm run env:check
```

---

## Feature Flags

### Enable/Disable Features

```typescript
// In your app configuration
const FEATURES = {
  SHADOW_MODE: process.env.EXPO_PUBLIC_SHADOW_MODE_ENABLED === 'true',
  RATE_LIMITING: process.env.EXPO_PUBLIC_RATE_LIMITING_ENABLED === 'true',
  ANOMALY_DETECTION: process.env.EXPO_PUBLIC_ANOMALY_DETECTION_ENABLED === 'true',
};
```

### Gradual Rollout

```typescript
// Roll out to percentage of users
const isShadowModeEnabled = (userId: string) => {
  const hash = hashUserId(userId);
  const percentage = (hash % 100) + 1;
  return percentage <= ROLLOUT_PERCENTAGE; // e.g., 50 for 50% rollout
};
```

---

## Deployment Steps

### 1. Pre-Deployment

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build application
npm run build

# Check for errors
npm run lint
```

### 2. Database Deployment

```bash
# Apply migrations
supabase migration up

# Verify tables created
supabase db list

# Check RLS policies
supabase rls list
```

### 3. Application Deployment

```bash
# Deploy to EAS
eas build --platform ios
eas build --platform android

# Or deploy to web
npm run deploy:web
```

### 4. Post-Deployment

```bash
# Verify deployment
npm run health-check

# Monitor logs
supabase logs --service api

# Check performance
npm run performance:check
```

---

## Rollback Plan

### If Issues Occur

#### Option 1: Disable Feature Flag
```env
EXPO_PUBLIC_SHADOW_MODE_ENABLED=false
```

#### Option 2: Revert Migrations
```bash
# Revert last migration
supabase migration down

# Or revert to specific version
supabase migration reset --version 20250101000000
```

#### Option 3: Full Rollback
```bash
# Revert to previous build
eas builds --limit 5
eas builds:cancel <build-id>

# Deploy previous version
eas submit --build-id <previous-build-id>
```

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Check error logs
- [ ] Monitor rate limiting
- [ ] Review anomaly alerts
- [ ] Check session timeouts
- [ ] Verify audit logs

### Weekly Checks

- [ ] Review security logs
- [ ] Check performance metrics
- [ ] Analyze user feedback
- [ ] Update documentation

### Monthly Checks

- [ ] Security audit
- [ ] Performance optimization
- [ ] Database cleanup (old logs)
- [ ] Feature usage analysis

---

## Performance Optimization

### Database Optimization

```sql
-- Analyze tables
ANALYZE audit_logs;
ANALYZE sessions;

-- Vacuum tables
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE sessions;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

### Application Optimization

```typescript
// Implement caching
const auditLogsCache = new Map();

// Batch operations
const batchLogAudits = async (logs: AuditLogEntry[]) => {
  // Batch insert instead of individual inserts
};

// Cleanup old data
const cleanupOldLogs = async () => {
  await clearOldAuditLogs(90); // Keep 90 days
};
```

---

## Support & Troubleshooting

### Common Issues

**Issue: Rate limiting not working**
- Check environment variables
- Verify database connection
- Check RLS policies

**Issue: Session timeout not triggering**
- Verify session timeout configuration
- Check background task scheduling
- Monitor logs for errors

**Issue: Anomaly detection false positives**
- Adjust detection thresholds
- Review alert configuration
- Analyze user behavior patterns

### Contact Support

- 📧 Email: devops@ipelya.com
- 💬 Slack: #shadow-profile-deployment
- 🐛 Issues: GitHub Issues
