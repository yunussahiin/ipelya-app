"use client";

import { useState } from "react";
import { IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { CreateUserModal } from "./create-user-modal";
import { UsersFilterWrapper } from "./users-filter-wrapper";

interface UsersPageClientProps {
  allProfiles: any[] | null;
  allAdminProfiles: any[] | null;
}

export function UsersPageClient({ allProfiles, allAdminProfiles }: UsersPageClientProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserCreated = () => {
    setCreateModalOpen(false);
    // Router refresh yerine sayfayı yenile
    location.href = location.href;
  };

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

      <UsersFilterWrapper
        key={refreshKey}
        allProfiles={allProfiles}
        allAdminProfiles={allAdminProfiles}
      />

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onUserCreated={handleUserCreated}
      />
    </>
  );
}
