/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

// Import steps
import { Step1BasicInfo } from "@/components/host/campsite/BasicInfo";
import { Step2Images } from '@/components/host/campsite/Images';
import { Step3PricingRules } from '@/components/host/campsite/PricingRules';
import { Step4Amenities } from '@/components/host/campsite/aminites';
import { uploadMedia } from '@/lib/client-actions';
import { toast } from 'sonner';

const campsiteSchema = z.object({
    name: z.string().min(1, 'Tên địa điểm là bắt buộc'),
    tagline: z.string().optional(),
    description: z.string().min(0, 'Mô tả phải có ít nhất 10 ký tự'),
    location: z.object({
        address: z.string().min(1, 'Địa chỉ là bắt buộc'),
        city: z.string().min(1, 'Thành phố là bắt buộc'),
        state: z.string().min(1, 'Tỉnh/thành là bắt buộc'),
        country: z.string().default('Vietnam'),
        lng: z.number().min(-180).max(180),
        lat: z.number().min(-90).max(90),
        accessInstructions: z.string().optional(),
    }),
    propertyType: z.enum(['tent', 'rv', 'cabin', 'glamping', 'treehouse', 'yurt', 'other']),
    capacity: z.object({
        maxGuests: z.number().min(1, 'Ít nhất 1 khách'),
        maxVehicles: z.number().min(0).optional(),
        maxPets: z.number().min(0).optional(),
    }),
    pricing: z.object({
        basePrice: z.number().min(0, 'Giá phải >= 0'),
        weekendPrice: z.number().min(0).optional(),
        cleaningFee: z.number().min(0).optional(),
        petFee: z.number().min(0).optional(),
        extraGuestFee: z.number().min(0).optional(),
        currency: z.string().default('VND'),
    }),
    rules: z.object({
        checkIn: z.string().min(1, 'Giờ check-in là bắt buộc'),
        checkOut: z.string().min(1, 'Giờ check-out là bắt buộc'),
        minNights: z.number().min(1),
        maxNights: z.number().min(1).optional(),
        allowPets: z.boolean(),
        allowChildren: z.boolean(),
        allowSmoking: z.boolean(),
        quietHours: z.string().optional(),
        customRules: z.array(z.string()).default([]),
    }),
    isActive: z.boolean(),
    isInstantBook: z.boolean(),
});

type CampsiteFormValues = z.infer<typeof campsiteSchema>;

interface Amenity {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    category: 'basic' | 'comfort' | 'safety' | 'outdoor' | 'special';
    isActive: boolean;
}

interface Activity {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    category: 'water' | 'hiking' | 'wildlife' | 'winter' | 'adventure' | 'relaxation' | 'other';
    isActive: boolean;
}

interface CampsiteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    initialData?: any;
  onSubmit: (data: unknown) => void;
  amenities?: Amenity[];
}

export default function CampsiteFormModal({
    isOpen,
    onClose,
    mode,
    initialData,
    onSubmit,
    amenities = [],
}: CampsiteFormModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [oldImages, setOldImages] = useState<string[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    const form = useForm<any>({
        resolver: zodResolver(campsiteSchema) as Resolver<any>,
        defaultValues: {
            name: '',
            tagline: '',
            description: '',
            location: {
                address: '',
                city: '',
                state: '',
                country: 'Vietnam',
                lng: 0,
                lat: 0,
                accessInstructions: '',
            },
            propertyType: 'tent',
            capacity: {
                maxGuests: 2,
                maxVehicles: 1,
                maxPets: 0,
            },
            pricing: {
                basePrice: 0,
                weekendPrice: 0,
                cleaningFee: 0,
                petFee: 0,
                extraGuestFee: 0,
                currency: 'VND',
            },
            rules: {
                checkIn: '14:00',
                checkOut: '11:00',
                minNights: 1,
                maxNights: 7,
                allowPets: false,
                allowChildren: true,
                allowSmoking: false,
                quietHours: '22:00 - 07:00',
                customRules: [],
            },
            isActive: true,
            isInstantBook: false,
        },
    });

    const {
        fields: customRulesFields,
        append: appendCustomRule,
        remove: removeCustomRule,
    } = useFieldArray({
        control: form.control,
        name: 'rules.customRules',
    });

    // Load initial data
    useEffect(() => {
        if (isOpen && initialData && mode === 'edit') {
            form.reset({
                name: initialData.name,
                tagline: initialData.tagline || '',
                description: initialData.description || '',
                location: {
                    address: initialData.location.address,
                    city: initialData.location.city,
                    state: initialData.location.state,
                    country: initialData.location.country || 'Vietnam',
                    lng: initialData.location.coordinates?.coordinates[0] || 0,
                    lat: initialData.location.coordinates?.coordinates[1] || 0,
                    accessInstructions: initialData.location.accessInstructions || '',
                },
                propertyType: initialData.propertyType,
                capacity: initialData.capacity,
                pricing: initialData.pricing,
                rules: {
                    checkIn: initialData.rules.checkIn || '14:00',
                    checkOut: initialData.rules.checkOut || '11:00',
                    minNights: initialData.rules.minNights,
                    maxNights: initialData.rules.maxNights,
                    allowPets: initialData.rules.allowPets,
                    allowChildren: initialData.rules.allowChildren,
                    allowSmoking: initialData.rules.allowSmoking,
                    quietHours: initialData.rules.quietHours,
                    customRules: initialData.rules.customRules || [],
                },
                isActive: initialData.isActive,
                isInstantBook: initialData.isInstantBook,
            });
            setOldImages(initialData.images || []);
            setPreviewUrls(initialData.images || []);
            setSelectedAmenities(
                Array.isArray(initialData.amenities)
                    ? initialData.amenities.map((a: any) => typeof a === 'string' ? a : a._id)
                    : []
            );
            setCurrentStep(1);
        } else if (isOpen && mode === 'create') {
            form.reset();
            setOldImages([]);
            setPreviewUrls([]);
            setNewImages([]);
            setSelectedAmenities([]);
            setCurrentStep(1);
        }
    }, [isOpen, initialData, mode, form]);

    // Dropzone
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newObjectUrls = acceptedFiles.map(f => URL.createObjectURL(f));
            setNewImages(prev => [...prev, ...acceptedFiles]);
            setPreviewUrls(prev => [...prev, ...newObjectUrls]);
            setCurrentImageIndex(previewUrls.length + newObjectUrls.length - 1);
        },
        [previewUrls.length],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 20,
    });

    const removeImage = (index: number) => {
        const oldCount = oldImages.length;
        if (index < oldCount) {
            setOldImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setNewImages(prev => prev.filter((_, i) => i !== index - oldCount));
        }
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setCurrentImageIndex(prev => Math.max(0, Math.min(prev, previewUrls.length - 2)));
    };

    const handleFormSubmit = async (values: CampsiteFormValues) => {

        try {
            // Upload images
            let uploadedImageUrls: string[] = [];
            if (newImages.length > 0) {
                const imageFormData = new FormData();
                newImages.forEach(file => imageFormData.append('files', file));
                const uploadRes = await uploadMedia(imageFormData);
                if (!uploadRes.success) {
                    toast.error('Upload ảnh thất bại');
                    return;
                }
                uploadedImageUrls = uploadRes.data as string[];
            }

            const payload: any = {
                name: values.name,
                tagline: values.tagline || '',
                description: values.description,

                location: {
                    address: values.location.address,
                    city: values.location.city,
                    state: values.location.state,
                    country: values.location.country || 'Vietnam',
                    coordinates: {
                        type: 'Point' as const,
                        coordinates: [
                            Number(values.location.lng) || 0,
                            Number(values.location.lat) || 0,
                        ] as [number, number],
                    },
                    accessInstructions: values.location.accessInstructions || '',
                },

                propertyType: values.propertyType,

                capacity: {
                    maxGuests: values.capacity.maxGuests,
                    maxVehicles: values.capacity.maxVehicles || 0,
                    maxPets: values.capacity.maxPets || 0,
                },

                pricing: {
                    basePrice: values.pricing.basePrice,
                    weekendPrice: values.pricing.weekendPrice || 0,
                    cleaningFee: values.pricing.cleaningFee || 0,
                    petFee: values.pricing.petFee || 0,
                    extraGuestFee: values.pricing.extraGuestFee || 0,
                    currency: 'VND',
                },

                amenities: selectedAmenities,

                rules: {
                    checkIn: values.rules.checkIn || '14:00',
                    checkOut: values.rules.checkOut || '11:00',
                    minNights: values.rules.minNights || 1,
                    maxNights: values.rules.maxNights || 7,
                    allowPets: values.rules.allowPets ?? false,
                    allowChildren: values.rules.allowChildren ?? true,
                    allowSmoking: values.rules.allowSmoking ?? false,
                    quietHours: values.rules.quietHours || '',
                    customRules: values.rules.customRules || [],
                },

                images: [...oldImages, ...uploadedImageUrls],
                videos: [],
                isActive: values.isActive ?? true,
                isInstantBook: values.isInstantBook ?? false,
            };

            if (mode === 'edit' && initialData?._id) {
                payload._id = initialData._id;
            }

            await onSubmit(payload);

        } catch (error: any) {
            console.error('❌ Error:', error);
            toast.error(error.message || 'Có lỗi xảy ra');
        }
    };

    const canGoNext = () => {
        if (currentStep === 1) {
            const values = form.getValues();
            return values.name && values.description && values.location.address;
        }
        if (currentStep === 2) {
            return previewUrls.length > 0;
        }
        return true;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {mode === 'edit' ? 'Chỉnh sửa địa điểm' : 'Tạo địa điểm mới'}
                    </DialogTitle>
                    <DialogDescription>
                        Điền thông tin địa điểm cắm trại, thêm ảnh và quy định
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between w-full relative mb-8 px-4 mt-4">
                    {[
                        { number: 1, label: "Thông tin cơ bản" },
                        { number: 2, label: "Hình ảnh" },
                        { number: 3, label: "Giá & Quy định" },
                        { number: 4, label: "Tiện nghi" },
                    ].map((step, idx, arr) => {
                        const isCompleted = currentStep > step.number;
                        const isActive = currentStep === step.number;
                        return (
                            <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                                    isActive ? 'bg-background border-primary text-primary font-semibold shadow-md ring-2 ring-primary/20' :
                                    'bg-muted border-muted-foreground/30 text-muted-foreground'
                                }`}>
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : step.number}
                                </div>
                                <span className={`mt-2 text-xs text-center font-medium transition-all duration-300 ${
                                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                                }`}>
                                    {step.label}
                                </span>
                                {idx < arr.length - 1 && (
                                    <div className="absolute top-5 left-[50%] right-[-50%] h-[2px] bg-muted -z-10">
                                        <div className="h-full bg-primary transition-all duration-500" style={{
                                            width: currentStep > step.number ? '100%' : '0%'
                                        }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                        {currentStep === 1 &&
                            <Step1BasicInfo form={form as any} />}
                        {currentStep === 2 && (
                            <Step2Images
                                getRootProps={getRootProps}
                                getInputProps={getInputProps}
                                isDragActive={isDragActive}
                                previewUrls={previewUrls}
                                currentImageIndex={currentImageIndex}
                                setCurrentImageIndex={setCurrentImageIndex}
                                removeImage={removeImage}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3PricingRules
                                form={form}
                                customRulesFields={customRulesFields}
                                appendCustomRule={appendCustomRule}
                                removeCustomRule={removeCustomRule}
                            />
                        )}
                        {currentStep === 4 && (
                            <Step4Amenities
                                amenities={amenities}
                                selectedAmenities={selectedAmenities}
                                setSelectedAmenities={setSelectedAmenities}
                            />
                        )}

                        <DialogFooter className="mt-8 gap-2">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    disabled={form.formState.isSubmitting}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Quay lại
                                </Button>
                            )}

                            {currentStep < 4 ? (
                                <Button
                                    type="button" // ✅ QUAN TRỌNG: phải là "button" không phải "submit"
                                    onClick={(e) => {
                                        e.preventDefault(); // ✅ Ngăn form submit
                                        e.stopPropagation(); // ✅ Ngăn event bubbling

                                        console.log('➡️ Next clicked, current step:', currentStep);

                                        if (currentStep === 1) {
                                            const values = form.getValues();
                                            if (!values.name || !values.description || !values.location.address) {
                                                toast.warning('Vui lòng điền đầy đủ thông tin cơ bản');
                                                return;
                                            }
                                        }
                                        if (currentStep === 2) {
                                            if (previewUrls.length === 0) {
                                                toast.warning('Vui lòng thêm ít nhất 1 ảnh');
                                                return;
                                            }
                                        }

                                        setCurrentStep(prev => prev + 1);
                                    }}
                                    disabled={form.formState.isSubmitting}
                                >
                                    Tiếp tục
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit" // ✅ Chỉ step 4 mới submit
                                    size="lg"
                                    disabled={form.formState.isSubmitting}
                                    onClick={() => {
                                        // debug removed
                                    }}
                                >
                                    {form.formState.isSubmitting
                                        ? 'Đang xử lý...'
                                        : mode === 'edit'
                                            ? 'Cập nhật địa điểm'
                                            : 'Tạo địa điểm'}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}