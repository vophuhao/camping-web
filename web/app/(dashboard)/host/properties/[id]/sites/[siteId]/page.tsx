/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SiteDetails } from "@/components/host/site/site-details";
import { SiteAmenitiesRules } from "@/components/host/site/site-amenities-rules";
import { SiteLocation } from "@/components/host/site/site-location";
import { SitePhotos } from "@/components/host/site/site-photos";
import { SiteBookingSettings } from "@/components/host/site/site-booking-settings";
import { getPropertyById, getSiteById, getSitesByProperty, updateSite, uploadMedia } from "@/lib/client-actions";
import { useQuery } from "@tanstack/react-query";

export default function EditSitePage() {
  const params = useParams() as any;
  const router = useRouter();
  const propertyId = params?.id ?? params?.propertyId;
  const siteId = params?.siteId ?? params?.site ?? null;

  const defaultForm = {
    basic: { name: "", slug: "", description: "", siteClass: "basic" as "basic" | "vip" },
    accommodationType: "tent",
    lodgingProvided: undefined,
    terrain: undefined,
    capacity: { maxGuests: 1, maxConcurrentBookings: 1 },
    pricing: { basePrice: 0, currency: "VND" },
    siteLocation: null,
    amenities: [] as any[],
    rules: { guestsShouldBring: [] as string[], siteSpecificRules: [] as string[] },
    photos: [] as any[],
    bookingSettings: { minimumNights: 1, checkInTime: "14:00", checkOutTime: "11:00", instantBook: false, advanceNotice: 24, allowSameDayBooking: false },
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [propertyLocation, setPropertyLocation] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...defaultForm });
  const [step, setStep] = useState(0);

  const { data: sitesData } = useQuery({
    queryKey: ['property-sites', propertyId],
    queryFn: async () => {
      const response = await getSitesByProperty(propertyId);
      return response.data;
    },
    enabled: !!propertyId,
  });


  useEffect(() => {
    if (!propertyId) return;
    let mounted = true;
    (async () => {
      try {
        const p = await getPropertyById(propertyId);
        if (mounted && p?.success) {
          // ensure we don't access 'location' on a boolean or non-object
          const loc = (p as any)?.data && typeof (p as any).data === "object" ? (p as any).data.location ?? null : null;
          setPropertyLocation(loc);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [propertyId]);

  useEffect(() => {
    setForm((f: any) => ({ ...(defaultForm as any), ...(f ?? {}) }));
    if (!propertyId || !siteId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const res = await getSiteById(siteId);
        const found = res?.data;

        if (found && typeof found === "object") {
          const normalizePhoto = (p: any, idx: number) => {
            if (!p) return null;
            return {
              _id: p._id ?? `photo-${idx}`,
              url: typeof p === "string" ? p : p.url ?? "",
              caption: p.caption ?? "",
              isCover: !!p.isCover,
              order: typeof p.order === "number" ? p.order : idx,
              uploadedAt: p.uploadedAt ?? null,
              __raw: p,
            };
          };

          const photos = Array.isArray(found.photos)
            ? found.photos.map((p: any, i: number) => normalizePhoto(p, i)).filter(Boolean)
            : defaultForm.photos;

          setForm({
            basic: { name: found.name ?? "", slug: found.slug ?? "", description: found.description ?? "", siteClass: found.siteClass ?? "basic" },
            accommodationType: found.accommodationType ?? defaultForm.accommodationType,
            lodgingProvided: found.lodgingProvided ?? undefined,
            terrain: found.terrain ?? undefined,
            capacity: { ...(defaultForm.capacity as any), ...(found.capacity ?? {}) },
            pricing: { ...(defaultForm.pricing as any), ...(found.pricing ?? {}) },
            siteLocation: found.siteLocation ?? defaultForm.siteLocation,
            amenities: Array.isArray(found.amenities) ? found.amenities : defaultForm.amenities,
            rules: {
              guestsShouldBring: Array.isArray(found.guestsShouldBring) ? found.guestsShouldBring : defaultForm.rules.guestsShouldBring,
              siteSpecificRules: Array.isArray(found.siteSpecificRules) ? found.siteSpecificRules : defaultForm.rules.siteSpecificRules,
            },
            photos,
            bookingSettings: { ...(defaultForm.bookingSettings as any), ...(found.bookingSettings ?? {}) },
          });
        } else {
          toast.error("Không tìm thấy site để chỉnh sửa.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi tải dữ liệu site.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [propertyId, siteId]);

  const update = (patch: Partial<any>) => setForm((s: any) => ({ ...(s ?? {}), ...(patch ?? {}) }));

  const canNext = useMemo(() => {
    if (step === 0) return !!form.basic?.name;
    if (step === 2) return !!(form.siteLocation?.coordinates ?? form.siteLocation?.lat);
    return true;
  }, [step, form]);

  const handleSave = async (publish = false) => {
    if (!propertyId || !siteId) return;
    setSaving(true);
    try {
      const photosInput = Array.isArray(form.photos) ? form.photos : [];
      const uploadedPhotos: any[] = [];

      for (let i = 0; i < photosInput.length; i++) {
        const p = photosInput[i];
        if (p instanceof File) {
          const fd = new FormData();
          fd.append("files", p);
          fd.append("folder", "sites");
          toast.info(`Đang upload ảnh ${i + 1}/${photosInput.length}...`);
          const resp = await uploadMedia(fd);
          const url = Array.isArray(resp?.data)
            ? resp.data[0]
            : ((resp?.data as any)?.url ?? resp?.data);
          const getMeta = (window as any).__sitePhotosMetadata;
          const metaArr = typeof getMeta === "function" ? getMeta() : [];
          const meta = metaArr[i] ?? { caption: "", isCover: i === 0, order: i };
          uploadedPhotos.push({
            url,
            caption: meta.caption || "",
            isCover: meta.isCover ?? (i === 0),
            order: meta.order ?? i,
          });
        } else if (p && p.url) {
          uploadedPhotos.push(p);
        }
      }

      // serialize pricing.seasonalPricing dates
      const pricingForServer = { ...(form.pricing ?? {}) };
      if (Array.isArray(pricingForServer.seasonalPricing)) {
        pricingForServer.seasonalPricing = pricingForServer.seasonalPricing.map((s: any) => ({
          name: s.name,
          startDate: s.startDate instanceof Date ? s.startDate.toISOString() : s.startDate,
          endDate: s.endDate instanceof Date ? s.endDate.toISOString() : s.endDate,
          price: Number(s.price ?? 0),
        }));
      }

      const payload: any = {
        property: propertyId,
        name: form.basic?.name?.trim(),
        slug: form.basic?.slug?.trim() || undefined,
        description: form.basic?.description?.trim() || undefined,
        siteClass: form.basic?.siteClass || "basic",
        accommodationType: typeof form.accommodationType === "string" ? form.accommodationType : form.accommodationType?.type,
        lodgingProvided: form.lodgingProvided || undefined,
        terrain: form.terrain || undefined,
        siteLocation: form.siteLocation?.coordinates
          ? {
            coordinates: {
              type: "Point",
              coordinates: [
                form.siteLocation.coordinates.coordinates?.[0],
                form.siteLocation.coordinates.coordinates?.[1],
              ],
            },
            mapPinLabel: form.siteLocation?.mapPinLabel || undefined,
            relativeDescription: form.siteLocation?.relativeDescription || undefined,
          }
          : form.siteLocation
            ? {
              mapPinLabel: form.siteLocation?.mapPinLabel || undefined,
              relativeDescription: form.siteLocation?.relativeDescription || undefined,
            }
            : undefined,
        capacity: form.capacity,
        pricing: pricingForServer,
        bookingSettings: form.bookingSettings,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : form.photos?.filter((p: any) => p?.url) ?? undefined,
        amenities: Array.isArray(form.amenities) ? form.amenities : undefined,
        guestsShouldBring: Array.isArray(form.rules?.guestsShouldBring) ? form.rules.guestsShouldBring : undefined,
        siteSpecificRules: Array.isArray(form.rules?.siteSpecificRules) ? form.rules.siteSpecificRules : undefined,
        isActive: form.bookingSettings?.status !== "unavailable",
        isAvailableForBooking: form.bookingSettings?.status !== "unavailable",
        publish,
      };
      const res = await updateSite(siteId, payload);
      if (!res?.success) throw new Error(res?.message || "Cập nhật thất bại");
      toast.success("Cập nhật site thành công");
      router.push(`/host/properties/${propertyId}/sites`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Lỗi khi lưu site");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu site...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="w-full">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            onClick={() => router.push(`/host/properties/${propertyId}/sites`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center gap-3">
            {[
              { label: "Chi tiết", icon: "1" },
              { label: "Tiện nghi", icon: "2" },
              { label: "Vị trí", icon: "3" },
              { label: "Hình ảnh", icon: "4" },
              { label: "Đặt chỗ", icon: "5" },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center">
                {/* Step */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setStep(idx)}
                    className={`h-10 w-10 rounded-full grid place-items-center text-sm font-medium transition-all ${step === idx
                      ? "bg-emerald-600 text-white shadow-lg scale-110"
                      : step > idx
                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-200"
                      }`}
                  >
                    {step > idx ? <Check className="h-5 w-5" /> : s.icon}
                  </button>

                  <span
                    className={`text-xs font-medium ${step === idx ? "text-emerald-700" : "text-gray-500"
                      }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Line giữa các step */}
                {idx < 4 && (
                  <div
                    className={`w-10 h-0.5 mx-2 ${step > idx ? "bg-emerald-400" : "bg-gray-300"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Spacer để căn giữa đối xứng */}
          <div className="w-20" />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        {step === 0 && (
          <SiteDetails
            data={{
              basic: form.basic,
              accommodationType: form.accommodationType,
              lodgingProvided: form.lodgingProvided,
              terrain: form.terrain,
              capacity: form.capacity,
              pricing: form.pricing,
            }}
            onChange={(patch) => update(patch)}
          />
        )}

        {step === 1 && (
          <SiteAmenitiesRules
            data={{ amenities: form.amenities, rules: form.rules }}
            onChange={(patch) => update(patch)}
          />
        )}

        {step === 2 && (
          <SiteLocation
            data={form.siteLocation}
            propertyLocation={propertyLocation}
            onChange={(d: any) =>
              update({ siteLocation: { ...(form.siteLocation ?? {}), ...(d ?? {}) } })
            }
            currentSiteId={siteId}
            existingSites={sitesData.sites || []}
          />
        )}

        {step === 3 && (
          <SitePhotos data={form.photos ?? []} onChange={(p: any[]) => update({ photos: p })} />
        )}

        {step === 4 && (
          <SiteBookingSettings
            data={form.bookingSettings ?? defaultForm.bookingSettings}
            onChange={(newSettings: any) => update({ bookingSettings: newSettings })}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
            className="min-w-24"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            disabled={!canNext || saving}
            onClick={() => handleSave(false)}
          >
            Lưu nháp
          </Button>

          {step < 4 ? (
            <Button
              disabled={!canNext || saving}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="min-w-24"
            >
              Tiếp theo
              <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
            </Button>
          ) : (
            <Button disabled={!canNext || saving} onClick={() => handleSave(true)}>
              {siteId ? "Cập nhật & Đăng" : "Tạo & Đăng"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}