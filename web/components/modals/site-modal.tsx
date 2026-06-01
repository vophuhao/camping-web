'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { createSite, updateSite } from '@/lib/client-actions';
import { Site } from '@/types/property-site';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const siteFormSchema = z.object({
  name: z.string().min(3, 'Tên site phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').optional(),
  accommodationType: z.enum([
    'tent',
    'rv',
    'cabin',
    'yurt',
    'treehouse',
    'glamping',
    'vehicle',
  ]),
  siteType: z.enum(['designated', 'dispersed', 'walk_in', 'group']),
  maxGuests: z.coerce.number().min(1, 'Phải có ít nhất 1 khách'),
  maxPets: z.coerce.number().min(0).optional(),
  maxVehicles: z.coerce.number().min(0).optional(),
  basePrice: z.coerce.number().min(0, 'Giá phải lớn hơn 0'),
  additionalGuestFee: z.coerce.number().min(0).optional(),
  petFee: z.coerce.number().min(0).optional(),
  vehicleFee: z.coerce.number().min(0).optional(),
  minimumNights: z.coerce.number().min(1, 'Phải có ít nhất 1 đêm'),
  instantBook: z.boolean().default(false),
  firePit: z.boolean().default(false),
  picnicTable: z.boolean().default(false),
  electricalAvailable: z.boolean().default(false),
  electricalAmperage: z.coerce.number().optional(),
  waterHookup: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

interface SiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  site?: Site | null;
  onSuccess?: () => void;
}

export function SiteModal({
  open,
  onOpenChange,
  propertyId,
  site,
  onSuccess,
}: SiteModalProps) {
  const isEditMode = !!site;

  const form = useForm<any>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: '',
      description: '',
      accommodationType: 'tent',
      siteType: 'designated',
      maxGuests: 2,
      maxPets: 0,
      maxVehicles: 1,
      basePrice: 0,
      additionalGuestFee: 0,
      petFee: 0,
      vehicleFee: 0,
      minimumNights: 1,
      instantBook: false,
      firePit: false,
      picnicTable: false,
      electricalAvailable: false,
      electricalAmperage: 0,
      waterHookup: false,
      isActive: true,
    },
  });

  // Reset form when site changes or modal opens
  useEffect(() => {
    if (site) {
      const siteAmenities = (site.amenities || {}) as any;
      form.reset({
        name: site.name || '',
        description: site.description || '',
        accommodationType: site.accommodationType || 'tent',
        siteType: site.siteType || 'designated',
        maxGuests: site.capacity?.maxGuests || 2,
        maxPets: site.capacity?.maxPets || 0,
        maxVehicles: site.capacity?.maxVehicles || 1,
        basePrice: site.pricing?.basePrice || 0,
        additionalGuestFee: site.pricing?.additionalGuestFee || 0,
        petFee: site.pricing?.petFee || 0,
        vehicleFee: site.pricing?.vehicleFee || 0,
        minimumNights: site.bookingSettings?.minimumNights || 1,
        instantBook: site.bookingSettings?.instantBook || false,
        firePit: siteAmenities.firePit || false,
        picnicTable: siteAmenities.picnicTable || false,
        electricalAvailable: siteAmenities.electrical?.available || false,
        electricalAmperage: siteAmenities.electrical?.amperage || 0,
        waterHookup: siteAmenities.water?.hookup || false,
        isActive: site.isActive !== false,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        accommodationType: 'tent',
        siteType: 'designated',
        maxGuests: 2,
        maxPets: 0,
        maxVehicles: 1,
        basePrice: 0,
        additionalGuestFee: 0,
        petFee: 0,
        vehicleFee: 0,
        minimumNights: 1,
        instantBook: false,
        firePit: false,
        picnicTable: false,
        electricalAvailable: false,
        electricalAmperage: 0,
        waterHookup: false,
        isActive: true,
      });
    }
  }, [site, form]);

  const onSubmit = async (data: SiteFormValues) => {
    try {
      const payload = {
        property: propertyId,
        name: data.name,
        description: data.description,
        accommodationType: data.accommodationType,
        siteType: data.siteType,
        capacity: {
          maxGuests: data.maxGuests,
          maxPets: data.maxPets,
          maxVehicles: data.maxVehicles,
        },
        pricing: {
          basePrice: data.basePrice,
          currency: 'VND',
          additionalGuestFee: data.additionalGuestFee,
          petFee: data.petFee,
          vehicleFee: data.vehicleFee,
        },
        amenities: {
          firePit: data.firePit,
          picnicTable: data.picnicTable,
          electrical: {
            available: data.electricalAvailable,
            amperage: data.electricalAmperage,
          },
          water: {
            hookup: data.waterHookup,
          },
        },
        bookingSettings: {
          minimumNights: data.minimumNights,
          checkInTime: '14:00',
          checkOutTime: '11:00',
          instantBook: data.instantBook,
          advanceNotice: 24,
          allowSameDayBooking: true,
        },
        isActive: data.isActive,
      };

      let res;
      if (isEditMode && site) {
        res = await updateSite(site._id, payload as any);
      } else {
        res = await createSite(payload as any);
      }

      if (!res.success) {
        toast.error(res.message || 'Đã có lỗi xảy ra');
        return;
      }

      toast.success(
        res.message ||
          (isEditMode ? 'Cập nhật site thành công' : 'Tạo site thành công'),
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Chỉnh sửa Site' : 'Tạo Site mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Cập nhật thông tin site của bạn'
              : 'Điền thông tin để tạo site mới trong property này'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Site *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Site A1 - Hồ nước" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về site..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại chỗ ở *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tent">Lều</SelectItem>
                        <SelectItem value="rv">RV</SelectItem>
                        <SelectItem value="cabin">Cabin</SelectItem>
                        <SelectItem value="yurt">Yurt</SelectItem>
                        <SelectItem value="treehouse">Nhà trên cây</SelectItem>
                        <SelectItem value="glamping">Glamping</SelectItem>
                        <SelectItem value="vehicle">Xe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại Site *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="designated">Chỉ định</SelectItem>
                        <SelectItem value="dispersed">Phân tán</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                        <SelectItem value="group">Nhóm</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Sức chứa</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số khách *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxPets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số thú cưng</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxVehicles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số xe</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Giá cả</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá cơ bản (VNĐ/đêm) *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={10000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalGuestFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phí khách thêm (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={10000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="petFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phí thú cưng (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={10000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phí xe (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={10000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Booking Settings */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Cài đặt đặt chỗ</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumNights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số đêm tối thiểu *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instantBook"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Đặt ngay</FormLabel>
                        <FormDescription>
                          Cho phép khách đặt mà không cần xác nhận
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Tiện nghi</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firePit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Bếp lửa</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="picnicTable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Bàn picnic</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waterHookup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Điểm nước</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="electricalAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Điện</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('electricalAvailable') && (
                <FormField
                  control={form.control}
                  name="electricalAmperage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Công suất điện (A)</FormLabel>
                      <Select
                        onValueChange={val => field.onChange(Number(val))}
                        defaultValue={String(field.value || 0)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15A</SelectItem>
                          <SelectItem value="30">30A</SelectItem>
                          <SelectItem value="50">50A</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
