"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FileImage, FileVideo, FileAudio, FileText, File } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./data-table-column-header";
import { formatFileSize } from "@ipelya/types";

export interface BucketStat {
  bucketId: string;
  bucketName: string;
  fileCount: number;
  totalSize: number;
  isPublic: boolean;
}

const getBucketIcon = (bucketName: string) => {
  if (bucketName.includes("avatar") || bucketName.includes("cover")) return FileImage;
  if (bucketName.includes("video") || bucketName.includes("media")) return FileVideo;
  if (bucketName.includes("audio") || bucketName.includes("voice")) return FileAudio;
  if (bucketName.includes("document")) return FileText;
  if (bucketName.includes("post") || bucketName.includes("story")) return FileImage;
  return File;
};

export const bucketColumns: ColumnDef<BucketStat>[] = [
  {
    accessorKey: "bucketName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bucket" />,
    cell: ({ row }) => {
      const bucketName = row.getValue("bucketName") as string;
      const BucketIcon = getBucketIcon(bucketName);

      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <BucketIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{bucketName}</span>
            <span className="text-xs text-muted-foreground font-mono">{row.original.bucketId}</span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "isPublic",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Erişim" />,
    cell: ({ row }) => {
      const isPublic = row.getValue("isPublic") as boolean;
      return isPublic ? (
        <Badge
          variant="secondary"
          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        >
          Public
        </Badge>
      ) : (
        <Badge variant="outline">Private</Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)));
    }
  },
  {
    accessorKey: "fileCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dosya Sayısı" />,
    cell: ({ row }) => {
      const count = row.getValue("fileCount") as number;
      return <div className="text-right font-medium">{count.toLocaleString("tr-TR")}</div>;
    }
  },
  {
    accessorKey: "totalSize",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Toplam Boyut" />,
    cell: ({ row }) => {
      const size = row.getValue("totalSize") as number;
      return <div className="text-right font-medium">{formatFileSize(size)}</div>;
    }
  },
  {
    id: "avgSize",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ort. Dosya Boyutu" />,
    cell: ({ row }) => {
      const fileCount = row.original.fileCount;
      const totalSize = row.original.totalSize;
      const avgSize = fileCount > 0 ? totalSize / fileCount : 0;
      return <div className="text-right text-muted-foreground">{formatFileSize(avgSize)}</div>;
    }
  }
];
