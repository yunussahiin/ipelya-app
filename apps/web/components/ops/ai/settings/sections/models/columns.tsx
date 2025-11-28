"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Wrench, FileJson, Sparkles, ImageIcon, Mic } from "lucide-react";

export interface ModelData {
  id: string;
  name: string;
  description: string;
  context_length: number | null;
  pricing: {
    prompt: string;
    completion: string;
    is_free: boolean;
  };
  capabilities: {
    tools: boolean;
    structured_outputs: boolean;
    input_modalities: string[];
    output_modalities: string[];
  };
  defaults: {
    temperature: number;
    top_p: number;
  };
  supported_parameters: string[];
}

const formatContextLength = (length: number | null) => {
  if (!length) return "-";
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
  return length.toString();
};

export const columns: ColumnDef<ModelData>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Model
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium text-sm font-mono">{row.original.id}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{row.original.name}</div>
      </div>
    )
  },
  {
    accessorKey: "pricing.is_free",
    id: "pricing",
    header: "Fiyat",
    cell: ({ row }) => {
      const model = row.original;
      return model.pricing.is_free ? (
        <Badge
          variant="secondary"
          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Free
        </Badge>
      ) : (
        <div className="text-xs space-y-0.5">
          <div>In: {model.pricing.prompt}</div>
          <div>Out: {model.pricing.completion}</div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "all") return true;
      if (value === "free") return row.original.pricing.is_free;
      if (value === "paid") return !row.original.pricing.is_free;
      return true;
    }
  },
  {
    accessorKey: "context_length",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Context
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-mono">{formatContextLength(row.original.context_length)}</span>
    )
  },
  {
    accessorKey: "capabilities.tools",
    id: "capabilities",
    header: "Özellikler",
    cell: ({ row }) => {
      const model = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {model.capabilities.tools && (
            <Badge variant="outline" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Tools
            </Badge>
          )}
          {model.capabilities.structured_outputs && (
            <Badge variant="outline" className="text-xs">
              <FileJson className="h-3 w-3 mr-1" />
              JSON
            </Badge>
          )}
          {model.capabilities.input_modalities.includes("image") && (
            <Badge variant="outline" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              Vision
            </Badge>
          )}
          {model.capabilities.input_modalities.includes("audio") && (
            <Badge variant="outline" className="text-xs">
              <Mic className="h-3 w-3 mr-1" />
              Audio
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "all") return true;
      if (value === "tools") return row.original.capabilities.tools;
      if (value === "vision") return row.original.capabilities.input_modalities.includes("image");
      if (value === "audio") return row.original.capabilities.input_modalities.includes("audio");
      return true;
    }
  },
  {
    accessorKey: "defaults.temperature",
    id: "temperature",
    header: "Sıcaklık",
    cell: ({ row }) => (
      <span className="text-sm font-mono">{row.original.defaults.temperature.toFixed(1)}</span>
    )
  }
];
