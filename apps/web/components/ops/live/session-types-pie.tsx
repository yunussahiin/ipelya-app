"use client";

/**
 * Oturum Türü Dağılımı Pasta Grafiği
 * Video, audio ve çağrı oranlarını gösterir
 */

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Mic, Phone } from "lucide-react";

interface TypeDistribution {
  video: number;
  audio_room: number;
  calls: number;
}

interface SessionTypesPieProps {
  data: TypeDistribution;
}

const COLORS = {
  video: "hsl(var(--chart-1))",
  audio_room: "hsl(var(--chart-2))",
  calls: "hsl(var(--chart-3))"
};

const LABELS = {
  video: "Video Yayınları",
  audio_room: "Sesli Odalar",
  calls: "1-1 Çağrılar"
};

export function SessionTypesPie({ data }: SessionTypesPieProps) {
  const total = data.video + data.audio_room + data.calls;

  const chartData = [
    { name: LABELS.video, value: data.video, fill: COLORS.video },
    { name: LABELS.audio_room, value: data.audio_room, fill: COLORS.audio_room },
    { name: LABELS.calls, value: data.calls, fill: COLORS.calls }
  ].filter((item) => item.value > 0);

  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oturum Türü Dağılımı</CardTitle>
        <CardDescription>Bu ayki tür bazlı oturum dağılımı</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{data.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {data.value} oturum ({getPercentage(data.value as number)}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: COLORS.video }}
              >
                <Video className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{LABELS.video}</p>
                <p className="text-xs text-muted-foreground">
                  {data.video} oturum ({getPercentage(data.video)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: COLORS.audio_room }}
              >
                <Mic className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{LABELS.audio_room}</p>
                <p className="text-xs text-muted-foreground">
                  {data.audio_room} oturum ({getPercentage(data.audio_room)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: COLORS.calls }}
              >
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{LABELS.calls}</p>
                <p className="text-xs text-muted-foreground">
                  {data.calls} çağrı ({getPercentage(data.calls)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Toplam Oturum</p>
        </div>
      </CardContent>
    </Card>
  );
}
