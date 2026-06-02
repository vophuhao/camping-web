/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ArrowLeft, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SiteDetails } from "@/components/host/site/site-details";
import { SiteAmenitiesRules } from "@/components/host/site/site-amenities-rules";
import { SiteLocation } from "@/components/host/site/site-location";
import { SitePhotos } from "@/components/host/site/site-photos";
import { SiteBookingSettings } from "@/components/host/site/site-booking-settings";
import { createSite, getPropertyById, getSitesByProperty } from "@/lib/property-site-api";
import { uploadMedia } from "@/lib/client-actions";
import { useQuery } from "@tanstack/react-query";

const STEPS = [
    { id: "details", title: "Thông tin & Giá" },
    { id: "amenities", title: "Tiện nghi & Quy định" },
    { id: "location", title: "Vị trí" },
    { id: "photos", title: "Hình ảnh" },
    { id: "settings", title: "Cài đặt & Đăng" },
];

export default function NewSitePage() {


    const params = useParams() as any;
    const router = useRouter();
    const propertyId = params?.id ?? params?.propertyId;
    const { data: sitesData } = useQuery({
        queryKey: ['property-sites', propertyId],
        queryFn: async () => {
            const response = await getSitesByProperty(propertyId);
            return response.data;
        },
        enabled: !!propertyId,
    });
    const defaultForm = {
        basic: { name: "", slug: "", description: "", siteClass: "basic" as "basic" | "vip" },
        accommodationType: "tent",
        lodgingProvided: undefined,
        terrain: undefined,
        capacity: { maxGuests: 1, maxConcurrentBookings: 1 },
        pricing: { basePrice: 0, currency: "VND", seasonalPricing: [] as any[] },
        siteLocation: null,
        amenities: [] as any[],
        rules: { guestsShouldBring: [] as string[], siteSpecificRules: [] as string[] },
        photos: [] as any[],
        bookingSettings: {
            minimumNights: 1,
            maximumNights: undefined,
            checkInTime: "14:00",
            checkOutTime: "11:00",
            instantBook: false,
            advanceNotice: 24,
            preparationTime: 0,
            allowSameDayBooking: false,
        },
    };

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<any>({ ...defaultForm });
    const [propertyLocation, setPropertyLocation] = useState<any | null>(null);

    useEffect(() => {
        if (!propertyId) return;
        let mounted = true;
        (async () => {
            try {
                const res = await getPropertyById(propertyId);
                if (mounted && (res as any)?.success) setPropertyLocation((res as any).data?.location ?? null);
            } catch (err) {
                console.error(err);
            }
        })();
        return () => { mounted = false; };
    }, [propertyId]);

    useEffect(() => {
        setForm((f: any) => ({ ...(defaultForm as any), ...(f ?? {}) }));
    }, []);

    const update = (patch: Partial<any>) => setForm((s: any) => ({ ...(s ?? {}), ...(patch ?? {}) }));

    const canNext = useMemo(() => {
        if (step === 0) return !!form.basic?.name;
        if (step === 2) return !!form.siteLocation?.coordinates;
        return true;
    }, [step, form]);

    const handleSubmit = async (publish = false) => {
        if (!propertyId) {
            toast.error("Missing property id");
            return;
        }
        setSaving(true);
        try {
            // Upload photos if any File objects
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
                    const url = Array.isArray(resp?.data) ? resp.data[0] : ((resp?.data as any)?.url ?? resp?.data);
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

            // normalize pricing seasonal dates
            const pricingForServer = { ...(form.pricing ?? {}) };
            if (Array.isArray(pricingForServer.seasonalPricing)) {
                pricingForServer.seasonalPricing = pricingForServer.seasonalPricing.map((s: any) => ({
                    name: s.name,
                    startDate: s.startDate instanceof Date ? s.startDate.toISOString() : s.startDate,
                    endDate: s.endDate instanceof Date ? s.endDate.toISOString() : s.endDate,
                    price: Number(s.price ?? 0),
                }));
            }

            // Build payload consistent with server validator/schema
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
                capacity: {
                    maxGuests: Number(form.capacity?.maxGuests ?? 1),
                    maxAdults: form.capacity?.maxAdults ? Number(form.capacity.maxAdults) : undefined,
                    maxChildren: form.capacity?.maxChildren ? Number(form.capacity.maxChildren) : undefined,
                    maxInfants: form.capacity?.maxInfants ? Number(form.capacity.maxInfants) : undefined,
                    maxPets: form.capacity?.maxPets ? Number(form.capacity.maxPets) : undefined,
                    maxVehicles: form.capacity?.maxVehicles ? Number(form.capacity.maxVehicles) : undefined,
                    maxTents: form.capacity?.maxTents ? Number(form.capacity.maxTents) : undefined,
                    maxRVs: form.capacity?.maxRVs ? Number(form.capacity.maxRVs) : undefined,
                    rvMaxLength: form.capacity?.rvMaxLength ? Number(form.capacity.rvMaxLength) : undefined,
                    maxConcurrentBookings: form.capacity?.maxConcurrentBookings ? Number(form.capacity.maxConcurrentBookings) : 1,
                },
                pricing: {
                    basePrice: Number(pricingForServer.basePrice ?? 0),
                    weekendPrice: pricingForServer.weekendPrice !== undefined ? Number(pricingForServer.weekendPrice) : undefined,
                    weeklyDiscount: pricingForServer.weeklyDiscount !== undefined ? Number(pricingForServer.weeklyDiscount) : undefined,
                    monthlyDiscount: pricingForServer.monthlyDiscount !== undefined ? Number(pricingForServer.monthlyDiscount) : undefined,
                    additionalGuestFee: pricingForServer.additionalGuestFee !== undefined ? Number(pricingForServer.additionalGuestFee) : undefined,
                    petFee: pricingForServer.petFee !== undefined ? Number(pricingForServer.petFee) : undefined,
                    vehicleFee: pricingForServer.vehicleFee !== undefined ? Number(pricingForServer.vehicleFee) : undefined,
                    cleaningFee: pricingForServer.cleaningFee !== undefined ? Number(pricingForServer.cleaningFee) : undefined,
                    depositAmount: pricingForServer.depositAmount !== undefined ? Number(pricingForServer.depositAmount) : undefined,
                    currency: pricingForServer.currency || "VND",
                    seasonalPricing: pricingForServer.seasonalPricing,
                },
                bookingSettings: {
                    minimumNights: Number(form.bookingSettings?.minimumNights ?? 1),
                    maximumNights: form.bookingSettings?.maximumNights ? Number(form.bookingSettings.maximumNights) : undefined,
                    checkInTime: form.bookingSettings?.checkInTime ?? "14:00",
                    checkOutTime: form.bookingSettings?.checkOutTime ?? "11:00",
                    instantBook: !!form.bookingSettings?.instantBook,
                    advanceNotice: Number(form.bookingSettings?.advanceNotice ?? 24),
                    preparationTime: form.bookingSettings?.preparationTime !== undefined ? Number(form.bookingSettings.preparationTime) : undefined,
                    allowSameDayBooking: !!form.bookingSettings?.allowSameDayBooking,
                },
                photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
                amenities: Array.isArray(form.amenities) ? form.amenities : undefined,
                guestsShouldBring: Array.isArray(form.rules?.guestsShouldBring) ? form.rules.guestsShouldBring : undefined,
                siteSpecificRules: Array.isArray(form.rules?.siteSpecificRules) ? form.rules.siteSpecificRules : undefined,
                status: publish ? "active" : "inactive",
                isActive: publish,
                isAvailableForBooking: publish,
                publish,
            };

            console.log("Creating site payload:", payload);
            const res = await createSite(payload);
            if (!res?.success) throw new Error(res?.message || "Tạo site thất bại");
            toast.success("Tạo site thành công");
            router.push(`/host/properties/${propertyId}/sites`);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Lỗi khi tạo site");
        } finally {
            setSaving(false);
        }
    };

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
                        onChange={(d: any) => update({ siteLocation: { ...(form.siteLocation ?? {}), ...(d ?? {}) } })}
                        existingSites={sitesData?.sites || []}
                    />
                )}

                {step === 3 && (
                    <SitePhotos
                        data={form.photos ?? []}
                        onChange={(p: any[]) => update({ photos: p })}
                    />
                )}

                {step === 4 && (
                    <>
                        <SiteBookingSettings
                            data={form.bookingSettings ?? defaultForm.bookingSettings}
                            onChange={(s: any) => update({ bookingSettings: { ...(form.bookingSettings ?? {}), ...(s ?? {}) } })}
                        />

                        <div className="flex gap-2 mt-4">
                            <Button disabled={saving} onClick={() => handleSubmit(false)} variant="outline">Lưu nháp</Button>
                            <Button disabled={saving} onClick={() => handleSubmit(true)}>Lưu & Đăng</Button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving} className="min-w-24">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Quay lại
                </Button>

                <div className="flex-1" />

                <Button variant="outline" disabled={!canNext || saving} onClick={() => handleSubmit(false)}>
                    Lưu nháp
                </Button>

                {step < 4 ? (
                    <Button disabled={!canNext || saving} onClick={() => setStep((s) => Math.min(4, s + 1))} className="min-w-24">
                        Tiếp theo
                        <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                    </Button>
                ) : (
                    <Button disabled={!canNext || saving} onClick={() => handleSubmit(true)}>
                        Lưu & Đăng
                    </Button>
                )}
            </div>
        </div>
    );
}