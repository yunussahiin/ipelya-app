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

export function DeviceTypeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["device-type-distribution"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/analytics?period=7d");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return json.sessions_by_device || [];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Türü Dağılımı</CardTitle>
          <CardDescription>Oturumların cihaz türlerine göre dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(data)
    ? data.map((item: any) => ({
        name: item.device_type || "Bilinmiyor",
        count: item.count
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Türü Dağılımı</CardTitle>
        <CardDescription>Oturumların cihaz türlerine göre dağılımı</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "8px"
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Oturum Sayısı" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
