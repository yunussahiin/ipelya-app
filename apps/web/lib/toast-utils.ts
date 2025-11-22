import { toast } from "sonner";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: "#10b981",
        color: "#ffffff",
        border: "1px solid #059669"
      }
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        background: "#ef4444",
        color: "#ffffff",
        border: "1px solid #dc2626"
      }
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      style: {
        background: "#f59e0b",
        color: "#ffffff",
        border: "1px solid #d97706"
      }
    });
  },

  info: (message: string) => {
    toast.info(message, {
      style: {
        background: "#3b82f6",
        color: "#ffffff",
        border: "1px solid #2563eb"
      }
    });
  }
};
