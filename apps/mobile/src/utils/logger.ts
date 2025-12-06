/**
 * Logger Utility
 * Tarih: 2025-12-06
 *
 * Development: Console'a yaz
 * Production: Sadece Sentry'ye gönder
 */

import * as Sentry from "@sentry/react-native";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  tag?: string;
  data?: Record<string, unknown>;
}

const isDev = __DEV__;

function formatMessage(level: LogLevel, message: string, tag?: string): string {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = tag ? `[${tag}]` : "";
  return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
}

export const logger = {
  /**
   * Debug log - Sadece development'ta görünür
   */
  debug(message: string, options?: LogOptions): void {
    if (isDev) {
      console.log(formatMessage("debug", message, options?.tag), options?.data ?? "");
    }
  },

  /**
   * Info log - Sadece development'ta görünür
   */
  info(message: string, options?: LogOptions): void {
    if (isDev) {
      console.info(formatMessage("info", message, options?.tag), options?.data ?? "");
    }
  },

  /**
   * Warning log - Development'ta console, Production'da Sentry breadcrumb
   */
  warn(message: string, options?: LogOptions): void {
    if (isDev) {
      console.warn(formatMessage("warn", message, options?.tag), options?.data ?? "");
    }
    Sentry.addBreadcrumb({
      category: options?.tag ?? "warning",
      message,
      level: "warning",
      data: options?.data
    });
  },

  /**
   * Error log - Her zaman Sentry'ye gönderilir
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    if (isDev) {
      console.error(formatMessage("error", message, options?.tag), error, options?.data ?? "");
    }
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: { component: options?.tag },
        extra: { message, ...options?.data }
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        tags: { component: options?.tag },
        extra: options?.data
      });
    }
  }
};

/**
 * Kısa yollar - Hızlı kullanım için
 */
export const log = {
  d: (msg: string, tag?: string, data?: Record<string, unknown>) => 
    logger.debug(msg, { tag, data }),
  i: (msg: string, tag?: string, data?: Record<string, unknown>) => 
    logger.info(msg, { tag, data }),
  w: (msg: string, tag?: string, data?: Record<string, unknown>) => 
    logger.warn(msg, { tag, data }),
  e: (msg: string, err?: Error | unknown, tag?: string) => 
    logger.error(msg, err, { tag })
};
