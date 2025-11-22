"use client";

import { useState } from "react";
import { IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateUserModal } from "./create-user-modal";
import { DataTable } from "./data-table";
import { columns, UserProfile } from "./columns";

interface UsersPageClientProps {
  allProfiles: any[] | null;
  allAdminProfiles: any[] | null;
}

export function UsersPageClient({ allProfiles, allAdminProfiles }: UsersPageClientProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleUserCreated = () => {
    setCreateModalOpen(false);
    location.href = location.href;
  };

  const allTableData: UserProfile[] = (allProfiles || []).map((profile) => ({
    id: profile.id,
    user_id: profile.user_id,
    email: profile.email,
    display_name: profile.display_name,
    username: profile.username,
    avatar_url: profile.avatar_url,
    role: profile.role,
    is_creator: profile.is_creator,
    onboarding_step: profile.onboarding_step,
    onboarding_completed_at: profile.onboarding_completed_at,
    shadow_profile_active: profile.shadow_profile_active,
    shadow_pin_hash: profile.shadow_pin_hash,
    biometric_enabled: profile.biometric_enabled,
    biometric_type: profile.biometric_type,
    last_login_at: profile.last_login_at,
    created_at: profile.created_at,
    banned_until: profile.banned_until
  }));

  // Filter data by type
  const usersData = allTableData.filter((p) => p.role === "user" && !p.is_creator);
  const creatorsData = allTableData.filter((p) => p.is_creator);
  const adminsData = (allAdminProfiles || []).map((profile) => ({
    id: profile.id,
    user_id: profile.user_id || "",
    email: profile.email,
    display_name: profile.full_name,
    username: profile.full_name,
    avatar_url: profile.avatar_url,
    role: "admin" as const,
    is_creator: false,
    onboarding_step: 0,
    onboarding_completed_at: null,
    shadow_profile_active: false,
    shadow_pin_hash: null,
    biometric_enabled: false,
    biometric_type: null,
    last_login_at: null,
    created_at: profile.created_at,
    banned_until: null
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Kullanıcı Yönetimi</h2>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <IconUserPlus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-fit grid-cols-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="creators">Creator&apos;lar</TabsTrigger>
          <TabsTrigger value="admins">Yönetim</TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          <DataTable columns={columns} data={allTableData} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <DataTable columns={columns} data={usersData} />
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="space-y-4">
          <DataTable columns={columns} data={creatorsData} />
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <DataTable columns={columns} data={adminsData} />
        </TabsContent>
      </Tabs>

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onUserCreated={handleUserCreated}
      />
    </>
  );
}
