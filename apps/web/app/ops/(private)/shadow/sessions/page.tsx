"use client";

import { SessionsTable } from "@/components/ops/sessions-table";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Oturum İzleme</h1>
        <p className="text-muted-foreground mt-2">
          Aktif shadow mode oturumlarını izleyin ve yönetin
        </p>
      </div>

      <SessionsTable />
    </div>
  );
}
