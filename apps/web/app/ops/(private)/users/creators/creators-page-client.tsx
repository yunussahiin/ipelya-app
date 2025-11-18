"use client";

import { useState } from "react";
import { IconUserPlus } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreatorsTableClient } from "./creators-table-client";
import { CreateCreatorModal } from "./create-creator-modal";

interface CreatorsPageClientProps {
  allCreators: any[];
  activeCreators: any[];
  verifiedCreators: any[];
  pendingCreators: any[];
  stats: {
    totalCreators: number;
    activeCount: number;
    verifiedCount: number;
    pendingCount: number;
  };
}

export function CreatorsPageClient({
  allCreators,
  activeCreators,
  verifiedCreators,
  pendingCreators,
  stats
}: CreatorsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatorCreated = () => {
    setIsModalOpen(false);
    location.href = location.href;
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div />
        <Button onClick={() => setIsModalOpen(true)}>
          <IconUserPlus className="mr-2 h-4 w-4" />
          Yeni Creator Ekle
        </Button>
      </div>

      <CreateCreatorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreatorCreated={handleCreatorCreated}
      />

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tümü{" "}
            <Badge className="ml-2" variant="secondary">
              {stats.totalCreators}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Aktif{" "}
            <Badge className="ml-2" variant="secondary">
              {stats.activeCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="verified">
            Doğrulanmış{" "}
            <Badge className="ml-2" variant="secondary">
              {stats.verifiedCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Bekleyen{" "}
            <Badge className="ml-2" variant="secondary">
              {stats.pendingCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Creators */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Creator&apos;lar</CardTitle>
              <CardDescription>Sistemdeki tüm içerik üreticileri</CardDescription>
            </CardHeader>
            <CardContent>
              <CreatorsTableClient data={allCreators} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Creators */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Creator&apos;lar</CardTitle>
              <CardDescription>Aktif durumda olan creator hesapları</CardDescription>
            </CardHeader>
            <CardContent>
              <CreatorsTableClient data={activeCreators} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified Creators */}
        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doğrulanmış Creator&apos;lar</CardTitle>
              <CardDescription>Verified badge sahibi creator&apos;lar</CardDescription>
            </CardHeader>
            <CardContent>
              <CreatorsTableClient data={verifiedCreators} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Creators */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen Creator&apos;lar</CardTitle>
              <CardDescription>Yönetici onayı bekleyen başvurular</CardDescription>
            </CardHeader>
            <CardContent>
              <CreatorsTableClient data={pendingCreators} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
