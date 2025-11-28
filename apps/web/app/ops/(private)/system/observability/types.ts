export interface DatabaseStats {
  database_size: string;
  database_size_bytes: number;
  active_connections: number;
  total_connections: number;
  cache_hit_ratio: number;
  uptime: string;
}

export interface TableSize {
  table_name: string;
  row_count: number;
  total_size: string;
  total_size_bytes: number;
  table_size: string;
  index_size: string;
}

export interface IndexUsage {
  table_name: string;
  index_name: string;
  index_size: string;
  index_scans: number;
  rows_read: number;
  rows_fetched: number;
}

export interface SlowQuery {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  idle_in_transaction: number;
  waiting: number;
  by_application: Record<string, number>;
}

export interface PerformanceAdvisor {
  name: string;
  title: string;
  level: string;
  detail: string;
  remediation: string;
}
