'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Lỗi hệ thống nghiêm trọng</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Ứng dụng đã gặp lỗi không thể tự phục hồi. Vui lòng tải lại trang.
          </p>
        </div>
        <Button onClick={reset} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </Button>
      </body>
    </html>
  );
}
