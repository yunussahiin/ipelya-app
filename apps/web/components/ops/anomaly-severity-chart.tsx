"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6"
};

export function AnomalySeverityChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["anomaly-severity"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/analytics?period=7d");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return json.anomalies_by_severity || [];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anomali Önem Dağılımı</CardTitle>
          <CardDescription>Anomalilerin önem seviyelerine göre dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(data)
    ? data.map((item: any) => ({
        name:
          item.severity === "critical"
            ? "Kritik"
            : item.severity === "high"
              ? "Yüksek"
              : item.severity === "medium"
                ? "Orta"
                : "Düşük",
        value: item.count,
        severity: item.severity
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomali Önem Dağılımı</CardTitle>
        <CardDescription>Anomalilerin önem seviyelerine göre dağılımı</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "8px"
              }}
            />
            <Legend />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.severity as keyof typeof COLORS] || "#8884d8"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
