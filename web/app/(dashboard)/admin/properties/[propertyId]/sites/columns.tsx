'use client';

import { DataTableColumnHeader } from '@/components/admin/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { Site } from '@/types/property-site';
import { ColumnDef } from '@tanstack/react-table';
import { Tent, MoreHorizontal, Users, DollarSign } from 'lucide-react';

export type SiteTableMeta = {
  onEdit?: (site: Site) => void;
  onDelete?: (site: Site) => void;
};

export const columns: ColumnDef<Site>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên Site" />
    ),
    cell: ({ row }) => {
      const site = row.original;
      return (
        <div className="flex items-start gap-3">
          {site.images?.[0] ? (
            <div className="relative h-12 w-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.images[0]}
                alt={site.name}
                className="h-12 w-12 rounded object-cover"
              />
            </div>
          ) : (
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
              <Tent className="text-muted-foreground h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">{site.name}</span>
            {site.description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {site.description}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'siteType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại Site" />
    ),
    cell: ({ row }) => {
      const siteType = row.getValue('siteType') as string;
      const typeLabels: Record<string, string> = {
        tent: 'Lều',
        rv: 'RV',
        cabin: 'Cabin',
        glamping: 'Glamping',
        group: 'Nhóm',
        other: 'Khác',
      };
      return (
        <Badge variant="outline">{typeLabels[siteType] || siteType}</Badge>
      );
    },
  },
  {
    id: 'capacity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sức chứa" />
    ),
    cell: ({ row }) => {
      const site = row.original;
      return (
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <span>
            {((site.capacity as any).minGuests !== undefined && (site.capacity as any).minGuests !== null) ? `${(site.capacity as any).minGuests} - ` : ''}{site.capacity.maxGuests} khách
          </span>
        </div>
      );
    },
  },
  {
    id: 'pricing',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá cơ bản" />
    ),
    cell: ({ row }) => {
      const site = row.original;
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">
            {site.pricing.basePrice.toLocaleString('vi-VN')}đ/đêm
          </span>
        </div>
      );
    },
  },
  {
    id: 'amenities',
    header: 'Tiện nghi',
    cell: ({ row }) => {
      const site = row.original;
      const amenitiesCount = Array.isArray(site.amenities)
        ? site.amenities.length
        : 0;
      return (
        <span className="text-muted-foreground text-sm">
          {amenitiesCount} tiện nghi
        </span>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive');
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Hoạt động' : 'Tạm ngưng'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày tạo" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const site = row.original;
      const meta = table.options.meta as SiteTableMeta | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(site._id)}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onEdit?.(site)}>
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(site)}
              className="text-destructive"
            >
              Xoá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
