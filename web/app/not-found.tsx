import { MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <MapPin className="h-8 w-8 text-slate-600 dark:text-slate-400" />
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">404 - Không tìm thấy trang</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Địa điểm cắm trại hoặc trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">Quay về trang chủ</Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/search">
            <Search className="h-4 w-4" />
            Tìm địa điểm
          </Link>
        </Button>
      </div>
    </div>
  );
}
