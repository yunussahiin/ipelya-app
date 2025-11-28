"use client";

import { useState } from "react";
import {
  ChevronRight,
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  MoreHorizontal,
  Download,
  Trash2,
  Link,
  Eye,
  HardDrive
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StorageNode, FileCategory } from "@ipelya/types";
import { formatFileSize, getFileCategory } from "@ipelya/types";

export interface StorageFileItemProps {
  node: StorageNode;
  animated?: boolean;
  level?: number;
  onSelect?: (node: StorageNode) => void;
  onPreview?: (node: StorageNode) => void;
  onDownload?: (node: StorageNode) => void;
  onDelete?: (node: StorageNode) => void;
  onCopyUrl?: (node: StorageNode) => void;
  onNavigate?: (node: StorageNode) => void;
  selectedId?: string;
}

// File type icon mapping
function getFileIcon(mimetype?: string) {
  if (!mimetype) return File;
  const category = getFileCategory(mimetype);
  switch (category) {
    case "image":
      return Image;
    case "video":
      return Video;
    case "audio":
      return Music;
    case "document":
      return FileText;
    case "archive":
      return Archive;
    default:
      return File;
  }
}

// File type color mapping
function getFileColor(category: FileCategory): string {
  switch (category) {
    case "image":
      return "text-green-500";
    case "video":
      return "text-purple-500";
    case "audio":
      return "text-orange-500";
    case "document":
      return "text-blue-500";
    case "archive":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
}

export function StorageFileItem({
  node,
  animated = true,
  level = 0,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  onCopyUrl,
  onNavigate,
  selectedId
}: StorageFileItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === "folder";
  const isBucket = node.type === "bucket";
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (isBucket || isFolder) {
      if (onNavigate) {
        onNavigate(node);
      } else {
        setIsOpen(!isOpen);
      }
    } else {
      onSelect?.(node);
    }
  };

  const handleDoubleClick = () => {
    if (!isBucket && !isFolder) {
      onPreview?.(node);
    }
  };

  const fileCategory = node.metadata?.mimetype ? getFileCategory(node.metadata.mimetype) : "other";

  const iconColor = isBucket
    ? "text-primary"
    : isFolder
      ? "text-sky-500"
      : getFileColor(fileCategory);

  // Render file icon
  const renderFileIcon = () => {
    const iconClassName = cn("size-5 shrink-0", iconColor, isFolder && "fill-sky-500/20");

    if (isBucket) {
      return <HardDrive className={iconClassName} />;
    }
    if (isFolder) {
      return <Folder className={iconClassName} />;
    }

    const IconComponent = getFileIcon(node.metadata?.mimetype);
    return <IconComponent className={iconClassName} />;
  };

  // Render chevron icon
  const renderChevronIcon = () => {
    if (!hasChildren && !isBucket && !isFolder) return null;

    if (animated) {
      return (
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="flex"
        >
          <ChevronRight className="size-4 text-muted-foreground" />
        </motion.span>
      );
    }

    return (
      <ChevronRight
        className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-90")}
      />
    );
  };

  // Render children list
  const renderChildrenList = () => {
    if (!node.children || node.children.length === 0) return null;

    const children = node.children.map((child) => (
      <StorageFileItem
        key={child.id}
        node={child}
        animated={animated}
        level={level + 1}
        onSelect={onSelect}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onCopyUrl={onCopyUrl}
        onNavigate={onNavigate}
        selectedId={selectedId}
      />
    ));

    if (animated) {
      return (
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="overflow-hidden"
            >
              {children}
            </motion.ul>
          )}
        </AnimatePresence>
      );
    }

    return isOpen ? <ul>{children}</ul> : null;
  };

  return (
    <li className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent",
          isSelected && "bg-accent",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: level > 0 ? `${level * 16 + 8}px` : undefined }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "p-0.5 -m-0.5 rounded hover:bg-muted",
            !hasChildren && !isBucket && !isFolder && "invisible"
          )}
        >
          {renderChevronIcon()}
        </button>

        {/* File/Folder icon */}
        {renderFileIcon()}

        {/* Name */}
        <span className="flex-1 truncate text-sm text-foreground">{node.name}</span>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {isBucket && node.isPublic && (
            <Badge variant="secondary" className="text-xs">
              Public
            </Badge>
          )}
          {node.metadata?.size !== undefined && node.metadata.size > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(node.metadata.size)}
            </span>
          )}
        </div>

        {/* Actions dropdown */}
        {!isBucket && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isFolder && (
                <>
                  <DropdownMenuItem onClick={() => onPreview?.(node)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Önizle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload?.(node)}>
                    <Download className="mr-2 h-4 w-4" />
                    İndir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyUrl?.(node)}>
                    <Link className="mr-2 h-4 w-4" />
                    URL Kopyala
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(node)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {renderChildrenList()}
    </li>
  );
}

// Legacy export for backward compatibility
export { StorageFileItem as FilesystemItem };
