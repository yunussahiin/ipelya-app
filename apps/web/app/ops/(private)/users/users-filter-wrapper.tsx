"use client";

import { useState, useMemo } from "react";
import { IconFilter, IconSearch } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UsersTableClient } from "./users-table-client";

interface UsersFilterWrapperProps {
  allProfiles: any[] | null;
  allAdminProfiles: any[] | null;
}

export function UsersFilterWrapper({ allProfiles, allAdminProfiles }: UsersFilterWrapperProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filtreleme ve arama
  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return null;

    let filtered = allProfiles;

    // Tab'a göre filtrele
    if (activeTab === "users") {
      // Kullanıcılar: role === "user"
      filtered = filtered.filter((p) => p.role === "user");
    } else if (activeTab === "creators") {
      // Creator'lar: role === "creator"
      filtered = filtered.filter((p) => p.role === "creator");
    } else if (activeTab === "banned") {
      filtered = filtered.filter((p) => p.role === "banned");
    }

    // Arama terimine göre filtrele
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.email?.toLowerCase().includes(term) ||
          p.full_name?.toLowerCase().includes(term) ||
          p.user_id?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allProfiles, activeTab, searchTerm]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="creators">Creator'lar</TabsTrigger>
          <TabsTrigger value="admins">Adminler</TabsTrigger>
          <TabsTrigger value="banned">Yasaklılar</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kullanıcı ara..."
              className="w-[250px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <IconFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TabsContent value="all" className="space-y-4">
        <UsersTableClient
          profiles={searchTerm ? filteredProfiles : allProfiles}
          adminProfiles={allAdminProfiles}
          filter="all"
        />
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        <UsersTableClient profiles={filteredProfiles} adminProfiles={null} filter="users" />
      </TabsContent>

      <TabsContent value="creators" className="space-y-4">
        <UsersTableClient profiles={filteredProfiles} adminProfiles={null} filter="creators" />
      </TabsContent>

      <TabsContent value="admins" className="space-y-4">
        <UsersTableClient profiles={null} adminProfiles={allAdminProfiles} filter="admins" />
      </TabsContent>

      <TabsContent value="banned" className="space-y-4">
        <UsersTableClient profiles={filteredProfiles} adminProfiles={null} filter="banned" />
      </TabsContent>
    </Tabs>
  );
}
