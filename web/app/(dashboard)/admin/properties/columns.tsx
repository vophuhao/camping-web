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
import { Property } from '@/types/property-site';
import { ColumnDef } from '@tanstack/react-table';
import { Building2, MapPin, MoreHorizontal, Tent } from 'lucide-react';

export type PropertyTableMeta = {
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onViewSites?: (property: Property) => void;
};

export const columns: ColumnDef<Property>[] = [
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
      <DataTableColumnHeader column={column} title="Tên Property" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <div className="flex items-start gap-3">
          {property.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.images[0]}
              alt={property.name}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
              <Building2 className="text-muted-foreground h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">{property.name}</span>
            {property.description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {property.description}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'location.address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Địa chỉ" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm">{property.location.address}</span>
            {property.location.city && (
              <span className="text-muted-foreground text-xs">
                {property.location.city}
                {property.location.state && `, ${property.location.state}`}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'sitesCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số Sites" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      const sitesCount = Array.isArray(property.sites)
        ? property.sites.length
        : 0;

      return (
        <div className="flex items-center gap-2">
          <Tent className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{sitesCount}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'host',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chủ sở hữu" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      const host =
        typeof property.host === 'object' ? (property.host as any) : undefined;

      return host ? (
        <div className="flex items-center gap-2">
          {host.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={host.avatar}
              alt={host.fullName}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-xs font-medium">
                {host.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{host.fullName}</span>
            <span className="text-muted-foreground text-xs">{host.email}</span>
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">N/A</span>
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
      const property = row.original;
      const meta = table.options.meta as PropertyTableMeta | undefined;

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
              onClick={() => navigator.clipboard.writeText(property._id)}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onViewSites?.(property)}>
              Quản lý Sites
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onEdit?.(property)}>
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(property)}
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
