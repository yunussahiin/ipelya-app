import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  Square,
  AtSign,
  Users,
  Search,
  FileText,
  BarChart3,
  Shield,
  Database,
  Activity,
  Ban,
  UserCheck,
  Flag,
  EyeOff,
  Trash2,
  Bell,
  Coins,
  Wallet,
  MessageSquare,
  MessagesSquare,
  Star,
  Lock,
  type LucideIcon
} from "lucide-react";

import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerRuntime
} from "@assistant-ui/react";

import { useState, useEffect, type FC } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments
} from "@/components/assistant-ui/attachment";

import { cn } from "@/lib/utils";

// Tool definitions for @ mention
interface ToolDef {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: LucideIcon;
  category: string;
}

const AI_TOOLS: ToolDef[] = [
  // Kullanıcı Yönetimi
  {
    id: "lookupUser",
    name: "Kullanıcı Detayı",
    description: "ID/email/username ile kullanıcı bul",
    example: "yunussahin38 kullanıcısını bul",
    icon: Users,
    category: "Kullanıcı"
  },
  {
    id: "searchUsers",
    name: "Kullanıcı Ara",
    description: "Kullanıcıları ara veya listele",
    example: "Tüm creator'ları listele",
    icon: Search,
    category: "Kullanıcı"
  },
  {
    id: "getUserActivity",
    name: "Aktivite Geçmişi",
    description: "Kullanıcı aktivitelerini göster",
    example: "X'in bu haftaki aktivitesi",
    icon: Activity,
    category: "Kullanıcı"
  },
  {
    id: "banUser",
    name: "Kullanıcı Banla",
    description: "Kullanıcıyı banla",
    example: "X'i 7 gün banla",
    icon: Ban,
    category: "Kullanıcı"
  },
  {
    id: "unbanUser",
    name: "Ban Kaldır",
    description: "Kullanıcının banını kaldır",
    example: "X'in banını kaldır",
    icon: UserCheck,
    category: "Kullanıcı"
  },

  // İçerik
  {
    id: "getRecentPosts",
    name: "Son Postlar",
    description: "Son paylaşımları listele",
    example: "Son 20 postu göster",
    icon: FileText,
    category: "İçerik"
  },
  {
    id: "getPostDetails",
    name: "Post Detayları",
    description: "Post detaylarını getir",
    example: "X postunun detayları",
    icon: Database,
    category: "İçerik"
  },
  {
    id: "hidePost",
    name: "Post Gizle",
    description: "Postu gizle",
    example: "X postunu gizle",
    icon: EyeOff,
    category: "İçerik"
  },
  {
    id: "deletePost",
    name: "Post Sil",
    description: "Postu sil",
    example: "X postunu sil",
    icon: Trash2,
    category: "İçerik"
  },

  // Moderasyon
  {
    id: "getModerationQueue",
    name: "Moderasyon Kuyruğu",
    description: "Bekleyen moderasyonlar",
    example: "Bekleyen moderasyonları göster",
    icon: Shield,
    category: "Moderasyon"
  },
  {
    id: "getContentReports",
    name: "İçerik Raporları",
    description: "Bildirilen içerikler",
    example: "Spam raporlarını göster",
    icon: Flag,
    category: "Moderasyon"
  },

  // Sistem
  {
    id: "getSystemStats",
    name: "Sistem İstatistikleri",
    description: "Platform istatistikleri",
    example: "Bu haftanın istatistikleri",
    icon: BarChart3,
    category: "Sistem"
  },

  // Bildirim
  {
    id: "sendNotification",
    name: "Bildirim Gönder",
    description: "Kullanıcıya bildirim gönder",
    example: "X'e uyarı bildirimi gönder",
    icon: Bell,
    category: "Bildirim"
  },

  // Finansal
  {
    id: "getUserTransactions",
    name: "Coin İşlemleri",
    description: "Kullanıcının coin işlemleri",
    example: "X'in bu ayki işlemleri",
    icon: Coins,
    category: "Finansal"
  },
  {
    id: "getUserBalance",
    name: "Coin Bakiyesi",
    description: "Kullanıcının coin bakiyesi",
    example: "X'in bakiyesi ne kadar?",
    icon: Wallet,
    category: "Finansal"
  },

  // Mesajlaşma
  {
    id: "getConversations",
    name: "Sohbet Listesi",
    description: "Sohbetleri listele",
    example: "X'in sohbetlerini göster",
    icon: MessagesSquare,
    category: "Mesajlaşma"
  },
  {
    id: "getMessages",
    name: "Mesajları Getir",
    description: "Sohbet mesajlarını getir",
    example: "X sohbetinin mesajları",
    icon: MessageSquare,
    category: "Mesajlaşma"
  },

  // Creator
  {
    id: "getCreatorStats",
    name: "Creator İstatistikleri",
    description: "Creator performans metrikleri",
    example: "Creator X'in istatistikleri",
    icon: Star,
    category: "Creator"
  },

  // Güvenlik
  {
    id: "getSecurityLogs",
    name: "Güvenlik Logları",
    description: "Güvenlik olayları",
    example: "X'in güvenlik logları",
    icon: Lock,
    category: "Güvenlik"
  }
];

// Group tools by category
const TOOL_CATEGORIES = AI_TOOLS.reduce(
  (acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  },
  {} as Record<string, ToolDef[]>
);

// ComposerAction props interface
interface ComposerActionProps {
  onToolClick?: () => void;
}

export const Thread: FC = () => {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <ThreadPrimitive.Root
          className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
          style={{
            ["--thread-max-width" as string]: "44rem"
          }}
        >
          <ThreadPrimitive.Viewport
            turnAnchor="top"
            className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
          >
            <ThreadPrimitive.If empty>
              <ThreadWelcome />
            </ThreadPrimitive.If>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                EditComposer,
                AssistantMessage
              }}
            />

            <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
              <ThreadScrollToBottom />
              <Composer />
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </MotionConfig>
    </LazyMotion>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="En alta kaydır"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
      <div className="aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-8">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="aui-thread-welcome-message-motion-1 text-2xl font-semibold"
          >
            İpelya AI Asistan
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.1 }}
            className="aui-thread-welcome-message-motion-2 text-2xl text-muted-foreground/65"
          >
            Size nasıl yardımcı olabilirim?
          </m.div>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full gap-2 pb-4 @md:grid-cols-2">
      {[
        {
          title: "📊 Sistem İstatistikleri",
          label: "Kullanıcı, post, mesaj sayıları",
          action: "Sistem istatistiklerini göster"
        },
        {
          title: "👥 Kullanıcıları Listele",
          label: "Tüm kullanıcılar veya rol filtresi",
          action: "Tüm kullanıcıları listele"
        },
        {
          title: "🛡️ Moderasyon Kuyruğu",
          label: "Bekleyen içerik raporları",
          action: "Moderasyon kuyruğunu göster"
        },
        {
          title: "💬 Sohbetleri Göster",
          label: "Tüm DM sohbetlerini listele",
          action: "Tüm sohbetleri listele"
        },
        {
          title: "⭐ Creator İstatistikleri",
          label: "Creator performans metrikleri",
          action: "Creator'ları listele"
        },
        {
          title: "🔒 Güvenlik Logları",
          label: "Shadow mode ve screenshot logları",
          action: "Bu haftanın güvenlik loglarını göster"
        }
      ].map((suggestedAction, index) => (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="aui-thread-welcome-suggestion-display [&:nth-child(n+5)]:hidden @md:[&:nth-child(n+5)]:block"
        >
          <ThreadPrimitive.Suggestion prompt={suggestedAction.action} send asChild>
            <Button
              variant="ghost"
              className="aui-thread-welcome-suggestion h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-3xl border px-5 py-4 text-left text-sm @md:flex-col dark:hover:bg-accent/60"
              aria-label={suggestedAction.action}
            >
              <span className="aui-thread-welcome-suggestion-text-1 font-medium">
                {suggestedAction.title}
              </span>
              <span className="aui-thread-welcome-suggestion-text-2 text-muted-foreground">
                {suggestedAction.label}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </m.div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const composerRuntime = useComposerRuntime();

  const handleToolSelect = (tool: ToolDef) => {
    // Tool'u seç ve badge olarak göster
    console.log("[Composer] 🔧 Tool selected:", {
      id: tool.id,
      name: tool.name,
      category: tool.category
    });
    setSelectedTool(tool);
    setToolDialogOpen(false);
    // Input'a focus ver
    setTimeout(() => {
      const input = document.querySelector(".aui-composer-input") as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }, 50);
  };

  const handleRemoveTool = () => {
    console.log("[Composer] ❌ Tool removed:", selectedTool?.name);
    setSelectedTool(null);
  };

  // Mesaj gönderildiğinde tool ile birlikte logla
  useEffect(() => {
    const unsubscribe = composerRuntime.subscribe(() => {
      const state = composerRuntime.getState();
      // Mesaj gönderildiğinde (text boşaldığında ve önceden doluydu)
      if (state.text === "" && selectedTool) {
        console.log("[Composer] 📤 Message sent with tool:", {
          tool: {
            id: selectedTool.id,
            name: selectedTool.name,
            category: selectedTool.category,
            description: selectedTool.description
          },
          timestamp: new Date().toISOString()
        });
        // Tool'u temizle
        setSelectedTool(null);
      }
    });
    return unsubscribe;
  }, [composerRuntime, selectedTool]);

  // Global keyboard shortcut: Shift + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "/") {
        e.preventDefault();
        setToolDialogOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
        <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone group/input-group flex w-full flex-col rounded-3xl border border-input bg-background px-1 pt-2 shadow-xs transition-[color,box-shadow] outline-none has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/50 data-[dragging=true]:border-dashed data-[dragging=true]:border-ring data-[dragging=true]:bg-accent/50 dark:bg-background">
          <ComposerAttachments />

          {/* Selected Tool Badge */}
          {selectedTool && (
            <div className="px-3 pt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-sm">
                    {(() => {
                      const Icon = selectedTool.icon;
                      return <Icon className="size-3.5 text-primary" />;
                    })()}
                    <span className="font-medium text-primary">{selectedTool.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveTool}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                    >
                      <svg
                        className="size-3 text-primary/70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium">{selectedTool.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <ComposerPrimitive.Input
            placeholder={
              selectedTool
                ? `${selectedTool.name} için sorgunuzu yazın...`
                : "Mesajınızı yazın... Shift + / ile tool seçebilrsiniz."
            }
            className="aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            rows={1}
            autoFocus
            aria-label="Mesaj girişi"
          />
          <ComposerAction onToolClick={() => setToolDialogOpen(true)} />
        </ComposerPrimitive.AttachmentDropzone>
      </ComposerPrimitive.Root>

      {/* Tool Selection Dialog - Shift+/ ile açılır */}
      <CommandDialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
        <CommandInput placeholder="Tool ara... (örn: kullanıcı, post, ban)" />
        <CommandList>
          <CommandEmpty>Tool bulunamadı.</CommandEmpty>
          {Object.entries(TOOL_CATEGORIES).map(([category, tools]) => (
            <CommandGroup key={category} heading={category}>
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <CommandItem
                    key={tool.id}
                    value={`${tool.id} ${tool.name} ${tool.description}`}
                    onSelect={() => handleToolSelect(tool)}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tool.name}</span>
                        <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                          {tool.id}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ComposerAction: FC<ComposerActionProps> = ({ onToolClick }) => {
  return (
    <div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <ComposerAddAttachment />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-2 text-muted-foreground hover:text-foreground"
          onClick={onToolClick}
        >
          <AtSign className="size-4" />
          <span className="text-xs">Tool</span>
          <span className="ml-1 flex items-center gap-0.5">
            <Kbd>Shift</Kbd>
            <span className="text-muted-foreground/50">+</span>
            <Kbd>/</Kbd>
          </span>
        </Button>
      </div>

      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Mesaj gönder"
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-[34px] rounded-full p-1"
            aria-label="Mesaj gönder"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-5" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90"
            aria-label="Yanıtı durdur"
          >
            <Square className="aui-composer-cancel-icon size-3.5 fill-white dark:fill-black" />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-4 duration-150 ease-out fade-in slide-in-from-bottom-1"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content mx-2 leading-7 break-words text-foreground">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { Fallback: ToolFallback }
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-2 ml-2 flex">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Kopyala">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Yeniden oluştur">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-4 duration-150 ease-out fade-in slide-in-from-bottom-1 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content rounded-3xl bg-muted px-5 py-2.5 break-words text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Düzenle" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-2">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none"
          autoFocus
        />

        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="İptal">
              İptal
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Güncelle">
              Güncelle
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Önceki">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Sonraki">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
