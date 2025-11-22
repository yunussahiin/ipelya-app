"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function FailedAttemptsChart({ period = "7d" }: { period?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["failed-attempts", period],
    queryFn: async () => {
      const res = await fetch(`/api/ops/shadow/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return json.failed_attempts_by_day || [];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Başarısız Kimlik Doğrulama</CardTitle>
          <CardDescription>Günlük başarısız deneme sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Başarısız Kimlik Doğrulama</CardTitle>
        <CardDescription>Günlük başarısız deneme sayısı</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "8px"
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#ef4444" name="Başarısız Denemeler" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
