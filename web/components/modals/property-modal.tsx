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
import { createProperty, updateProperty } from '@/lib/client-actions';
import { Property } from '@/types/property-site';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const propertyFormSchema = z.object({
  name: z.string().min(3, 'Tên property phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  city: z.string().min(2, 'Thành phố không được để trống'),
  state: z.string().optional(),
  country: z.string().min(2, 'Quốc gia không được để trống'),
  zipCode: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  contactPhone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 ký tự'),
  contactEmail: z.string().email('Email không hợp lệ'),
  propertyType: z.enum([
    'private',
    'shared',
    'campground',
    'glamping',
    'rv-park',
    'cabin',
    'other',
  ]),
  isActive: z.boolean().default(true),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSuccess?: () => void;
}

export function PropertyModal({
  open,
  onOpenChange,
  property,
  onSuccess,
}: PropertyModalProps) {
  const isEditMode = !!property;

  const form = useForm<any>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'Vietnam',
      zipCode: '',
      latitude: 0,
      longitude: 0,
      contactPhone: '',
      contactEmail: '',
      propertyType: 'campground',
      isActive: true,
    },
  });

  // Reset form when property changes or modal opens
  useEffect(() => {
    if (property) {
      form.reset({
        name: property.name || '',
        description: property.description || '',
        address: property.location.address || '',
        city: property.location.city || '',
        state: property.location.state || '',
        country: property.location.country || 'Vietnam',
        zipCode: property.location.zipCode || '',
        latitude: property.location.coordinates?.coordinates[1] || 0,
        longitude: property.location.coordinates?.coordinates[0] || 0,
        contactPhone: property.contactInfo?.phone || '',
        contactEmail: property.contactInfo?.email || '',
        propertyType: (property.propertyType as any) || 'campground',
        isActive: property.isActive !== false,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: 'Vietnam',
        zipCode: '',
        latitude: 0,
        longitude: 0,
        contactPhone: '',
        contactEmail: '',
        propertyType: 'campground',
        isActive: true,
      });
    }
  }, [property, form]);

  const onSubmit = async (data: PropertyFormValues) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        location: {
          address: data.address,
          city: data.city,
          state: data.state || '',
          country: data.country,
          zipCode: data.zipCode || '',
          coordinates: [data.longitude, data.latitude],
        },
        contactInfo: {
          phone: data.contactPhone,
          email: data.contactEmail,
        },
        propertyType: data.propertyType,
        isActive: data.isActive,
      };

      let res;
      if (isEditMode && property) {
        res = await updateProperty(property._id, payload as any);
      } else {
        res = await createProperty(payload as any);
      }

      if (!res.success) {
        toast.error(res.message || 'Đã có lỗi xảy ra');
        return;
      }

      toast.success(
        res.message ||
          (isEditMode
            ? 'Cập nhật property thành công'
            : 'Tạo property thành công'),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Chỉnh sửa Property' : 'Tạo Property mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Cập nhật thông tin property của bạn'
              : 'Điền thông tin để tạo property mới'}
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
                  <FormLabel>Tên Property *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Khu cắm trại Đà Lạt" {...field} />
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
                  <FormLabel>Mô tả *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về property..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại Property *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private Land</SelectItem>
                      <SelectItem value="shared">Shared Land</SelectItem>
                      <SelectItem value="campground">Campground</SelectItem>
                      <SelectItem value="glamping">Glamping Site</SelectItem>
                      <SelectItem value="rv-park">RV Park</SelectItem>
                      <SelectItem value="cabin">Cabin</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Địa chỉ</h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: 123 Đường Trần Hưng Đạo"
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thành phố *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Đà Lạt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tỉnh/Bang</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Lâm Đồng" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quốc gia *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Vietnam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã bưu điện</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 670000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vĩ độ (Latitude) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="VD: 11.9404"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Giá trị từ -90 đến 90</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kinh độ (Longitude) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="VD: 108.4583"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Giá trị từ -180 đến 180</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold">Thông tin liên hệ</h3>

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại *</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 0901234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="VD: contact@property.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
