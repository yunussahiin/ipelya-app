"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SingleNotification from "./components/SingleNotification";
import BulkNotification from "./components/BulkNotification";
import ScheduledNotification from "./components/ScheduledNotification";

export default function SendNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "scheduled">("single");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Gönder</h1>
        <p className="text-muted-foreground mt-2">
          Kullanıcılara tekil, toplu veya zamanlanmış bildirimler gönderin
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "single" | "bulk" | "scheduled")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Tekil Bildirim</TabsTrigger>
          <TabsTrigger value="bulk">Toplu Bildirim</TabsTrigger>
          <TabsTrigger value="scheduled">Zamanlanmış</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <SingleNotification />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkNotification />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledNotification />
        </TabsContent>
      </Tabs>
    </div>
  );
}
