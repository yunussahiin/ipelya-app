# Shadow Profile - Web Ops Dashboard UI Guide

## Technology Stack

- **Framework:** React 19 / Next.js 14
- **UI Components:** shadcn/ui
- **Charts:** Recharts / Chart.js
- **State Management:** TanStack Query (React Query)
- **Real-time:** Socket.io / WebSocket
- **Styling:** Tailwind CSS
- **Tables:** TanStack Table (React Table)

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│                     HEADER / NAVBAR                      │
│  Logo | Dashboard | Sessions | Audit | Analytics | Ops  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    MAIN DASHBOARD                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Active Users │  │ Failed Auths  │  │ Anomalies    │  │
│  │     45       │  │      12       │  │      8       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Sessions Over Time (Last 7 Days)               │   │
│  │  [Line Chart showing trend]                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Auth Success     │  │ Recent Anomalies         │   │
│  │ [Pie Chart]      │  │ [Alert List]             │   │
│  └──────────────────┘  └──────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Structure

### 1. Dashboard Home Page

```typescript
// pages/ops/dashboard.tsx
export default function OpsDashboard() {
  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Sessions"
          value={45}
          trend="+12%"
          icon={<Users />}
        />
        <MetricCard 
          title="Failed Auth"
          value={12}
          trend="-5%"
          icon={<AlertTriangle />}
        />
        <MetricCard 
          title="Anomalies"
          value={8}
          trend="+2"
          icon={<AlertCircle />}
        />
        <MetricCard 
          title="Locked Users"
          value={3}
          trend="0"
          icon={<Lock />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionsChart period="7d" />
        <AuthSuccessChart />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAnomalies limit={5} />
        <RecentSessions limit={5} />
      </div>
    </div>
  );
}
```

### 2. Metric Card Component

```typescript
// components/ops/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: number;
  trend: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function MetricCard({ title, value, trend, icon, onClick }: MetricCardProps) {
  const isPositive = trend.startsWith('+');
  
  return (
    <Card className="cursor-pointer hover:shadow-lg transition" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className={`text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Sessions Chart Component

```typescript
// components/ops/SessionsChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function SessionsChart({ period }: { period: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sessions-chart', period],
    queryFn: () => fetchAnalytics({ period, metric: 'sessions' })
  });

  if (isLoading) return <ChartSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions Over Time</CardTitle>
        <CardDescription>Last {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <LineChart data={data?.hourly_breakdown || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sessions" stroke="#3b82f6" />
          <Line type="monotone" dataKey="authentications" stroke="#10b981" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

### 4. Sessions Table Component

```typescript
// components/ops/SessionsTable.tsx
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';

export function SessionsTable() {
  const { data, isLoading, pagination, setPagination } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions({ limit: 50, offset: 0 })
  });

  const columns = [
    {
      accessorKey: 'session_id',
      header: 'Session ID',
      cell: ({ row }) => <code className="text-xs">{row.getValue('session_id').slice(0, 8)}...</code>
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ row }) => <code className="text-xs">{row.getValue('user_id').slice(0, 8)}...</code>
    },
    {
      accessorKey: 'started_at',
      header: 'Started',
      cell: ({ row }) => formatDate(row.getValue('started_at'))
    },
    {
      accessorKey: 'last_activity',
      header: 'Last Activity',
      cell: ({ row }) => formatRelativeTime(row.getValue('last_activity'))
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === 'active' ? 'default' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      )
    },
    {
      accessorKey: 'device_type',
      header: 'Device',
      cell: ({ row }) => <span>{row.getValue('device_type') || 'Unknown'}</span>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">⋮</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => viewSessionDetails(row.original)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => terminateSession(row.original.session_id)}
              className="text-red-600"
            >
              Terminate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data?.data || []}
      isLoading={isLoading}
      pagination={{
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        pageCount: Math.ceil((data?.total || 0) / pagination.pageSize)
      }}
      onPaginationChange={setPagination}
    />
  );
}
```

### 5. Anomalies Alert Component

```typescript
// components/ops/AnomaliesAlert.tsx
export function AnomaliesAlert() {
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => fetchAnomalies({ limit: 10 }),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const severityColors = {
    critical: 'bg-red-100 border-red-300',
    high: 'bg-orange-100 border-orange-300',
    medium: 'bg-yellow-100 border-yellow-300',
    low: 'bg-blue-100 border-blue-300'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Anomalies</CardTitle>
        <CardDescription>Real-time security alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies?.data?.map((anomaly) => (
          <div 
            key={anomaly.id}
            className={`p-4 border rounded-lg ${severityColors[anomaly.severity]}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{anomaly.alert_type}</p>
                <p className="text-sm mt-1">{anomaly.message}</p>
                <p className="text-xs mt-2 text-gray-600">
                  {formatRelativeTime(anomaly.created_at)}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => resolveAnomaly(anomaly.id)}
              >
                Resolve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 6. Audit Logs Viewer

```typescript
// components/ops/AuditLogsViewer.tsx
export function AuditLogsViewer() {
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    start_date: null,
    end_date: null
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters)
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input 
          placeholder="User ID"
          value={filters.user_id}
          onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
        />
        <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            <SelectItem value="shadow_mode_enabled">Shadow Mode Enabled</SelectItem>
            <SelectItem value="pin_verified">PIN Verified</SelectItem>
            <SelectItem value="pin_failed">PIN Failed</SelectItem>
            <SelectItem value="biometric_verified">Biometric Verified</SelectItem>
            <SelectItem value="biometric_failed">Biometric Failed</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker 
          value={filters.start_date}
          onChange={(v) => setFilters({ ...filters, start_date: v })}
          placeholder="Start Date"
        />
        <DatePicker 
          value={filters.end_date}
          onChange={(v) => setFilters({ ...filters, end_date: v })}
          placeholder="End Date"
        />
      </div>

      {/* Logs Table */}
      <AuditLogsTable data={data?.data || []} isLoading={isLoading} />
    </div>
  );
}
```

---

## Real-time Updates

```typescript
// hooks/useOpsRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOpsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_OPS_WS_URL);

    socket.on('session_update', (data) => {
      queryClient.setQueryData(['sessions'], (old) => ({
        ...old,
        data: old.data.map(s => s.session_id === data.session_id ? data : s)
      }));
    });

    socket.on('anomaly_alert', (data) => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      // Show toast notification
      toast({
        title: 'New Anomaly Alert',
        description: data.message,
        variant: data.severity === 'critical' ? 'destructive' : 'default'
      });
    });

    return () => socket.disconnect();
  }, [queryClient]);
}
```

---

## Key Features Implementation

### 1. Session Termination
```typescript
async function terminateSession(sessionId: string, reason: string) {
  const response = await fetch(`/api/ops/shadow/sessions/${sessionId}/terminate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, notification: true })
  });
  
  if (response.ok) {
    toast.success('Session terminated');
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  }
}
```

### 2. User Lockout
```typescript
async function lockoutUser(userId: string, duration: number) {
  const response = await fetch(`/api/ops/shadow/users/${userId}/lockout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      reason: 'excessive_failed_attempts',
      duration_minutes: duration,
      notification: true 
    })
  });
  
  if (response.ok) {
    toast.success(`User locked for ${duration} minutes`);
  }
}
```

### 3. Configuration Management
```typescript
async function updateRateLimitConfig(config: RateLimitConfig) {
  const response = await fetch('/api/ops/shadow/config/rate-limits', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  
  if (response.ok) {
    toast.success('Configuration updated');
    queryClient.invalidateQueries({ queryKey: ['config'] });
  }
}
```

---

## Responsive Design

- **Mobile:** Single column, stacked cards
- **Tablet:** 2-column grid
- **Desktop:** 3-4 column grid with sidebars

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Screen reader friendly tables
- Focus indicators

---

## Performance Optimization

- Virtual scrolling for large tables
- Debounced search/filter inputs
- Query caching with React Query
- Lazy loading of charts
- Image optimization

---

## Security

- CSRF token validation
- XSS protection
- SQL injection prevention (parameterized queries)
- Rate limiting on API calls
- Sensitive data masking (partial user IDs)
