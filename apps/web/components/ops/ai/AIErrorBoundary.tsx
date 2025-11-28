"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Tool call args hatası için özel handling
    if (error.message.includes("Tool call argsText can only be appended")) {
      console.warn(
        "[AIErrorBoundary] Tool call streaming error - will auto-recover:",
        error.message
      );
    } else {
      console.error("[AIErrorBoundary] Error caught:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Tool call args hatası için basit retry
      const isToolCallError = this.state.error?.message.includes(
        "Tool call argsText can only be appended"
      );

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isToolCallError ? "Geçici Bir Hata Oluştu" : "Bir Hata Oluştu"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {isToolCallError
                ? "AI yanıtı işlenirken bir sorun oluştu. Lütfen tekrar deneyin."
                : "Chat yüklenirken bir sorun oluştu. Sayfayı yenilemeyi deneyin."}
            </p>
            {!isToolCallError && (
              <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded mt-2">
                {this.state.error?.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="size-4 mr-2" />
              Tekrar Dene
            </Button>
            <Button onClick={this.handleRefresh}>Sayfayı Yenile</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
