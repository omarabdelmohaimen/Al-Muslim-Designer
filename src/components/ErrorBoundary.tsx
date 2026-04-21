import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Application crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
            <h1 className="mb-3 text-2xl font-black">حدث خطأ أثناء تشغيل الموقع</h1>
            <p className="mb-4 text-muted-foreground">
              ظهر خطأ runtime منع الصفحة من الظهور بشكل صحيح. افتح Console لمعرفة التفاصيل، أو جرّب إعادة التحميل بعد مسح الكاش.
            </p>
            {this.state.error ? (
              <pre className="overflow-auto rounded-lg border border-border bg-background p-4 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
