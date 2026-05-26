/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { verifyKycAndBecomeHost } from "@/lib/client-actions";
import { parseBirthYearFromCCCD, captureVideoFrame, compareFaces, dataUrlToImage, loadFaceApi } from "@/lib/face-utils";
import { CheckCircle2, Camera, Upload, ArrowRight, Shield, AlertCircle, Loader2, RefreshCw, User, CreditCard, Smartphone, QrCode } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  name: string; gmail: string; phone: string; idNumber: string; agreeToTerms: boolean;
}

export default function HostRegisterPage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({ name: "", gmail: "", phone: "", idNumber: "", agreeToTerms: false });
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});

  // Step 2 – ID card
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idFrontUrl, setIdFrontUrl] = useState<string>("");

  // Step 3 – face scan
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string>("");
  const [faceStatus, setFaceStatus] = useState<"idle" | "loading" | "scanning" | "matched" | "failed">("idle");
  const [faceScore, setFaceScore] = useState<number>(0);
  const [faceError, setFaceError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // QR mobile capture
  const [captureMode, setCaptureMode] = useState<"choose" | "webcam" | "qr">("choose");
  const [qrSessionId, setQrSessionId] = useState("");
  const [qrPolling, setQrPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

  // Generate session ID for QR
  function generateSessionId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Start QR mode
  function startQrMode() {
    const sid = generateSessionId();
    setQrSessionId(sid);
    setCaptureMode("qr");
    setFaceStatus("idle");
    setFaceError("");
    setSelfieUrl("");
    setQrPolling(true);
  }

  // Build QR URL
  const qrUrl = qrSessionId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/become-host/mobile-capture?s=${qrSessionId}`
    : "";

  // Poll for selfie from mobile
  useEffect(() => {
    if (!qrPolling || !qrSessionId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/mobile-selfie/${qrSessionId}`);
        const json = await res.json();
        if (json.success && json.data?.ready && json.data?.selfie) {
          setQrPolling(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setSelfieUrl(json.data.selfie);
          toast.success("📱 Đã nhận ảnh từ điện thoại!");
          // Run face comparison
          await runFaceComparison(json.data.selfie);
        }
      } catch { /* ignore polling errors */ }
    }, 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrPolling, qrSessionId]);

  /* ─── Validation step 1 ─── */
  function validateStep1() {
    const e: any = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Họ tên phải có ít nhất 2 ký tự";
    if (!form.gmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) e.gmail = "Email không hợp lệ";
    if (!form.phone || !/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Số điện thoại không hợp lệ";
    if (!form.idNumber || !/^\d{12}$/.test(form.idNumber.replace(/\s/g, ""))) e.idNumber = "Số CCCD phải gồm đúng 12 chữ số";
    else {
      const birthYear = parseBirthYearFromCCCD(form.idNumber);
      if (!birthYear) { e.idNumber = "Số CCCD không hợp lệ"; }
      else {
        const age = new Date().getFullYear() - birthYear;
        if (age < 18) e.idNumber = `Bạn chưa đủ 18 tuổi (năm sinh ${birthYear} – hiện ${age} tuổi)`;
      }
    }
    if (!form.agreeToTerms) e.agreeToTerms = "Phải đồng ý điều khoản";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    if (!idFrontFile) { toast.error("Vui lòng upload ảnh mặt trước CCCD"); return false; }
    return true;
  }

  /* ─── Camera ─── */
  async function startCamera() {
    try {
      setFaceStatus("loading");
      setFaceError("");
      // Pre-load models while opening camera
      loadFaceApi().catch(() => {});
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true);
      setFaceStatus("scanning");
    } catch {
      setFaceError("Không thể mở camera. Vui lòng cấp quyền truy cập.");
      setFaceStatus("idle");
    }
  }

  function stopCamera() {
    const video = videoRef.current;
    if (video?.srcObject) { (video.srcObject as MediaStream).getTracks().forEach(t => t.stop()); video.srcObject = null; }
    setCameraActive(false);
  }

  async function captureSelfie() {
    if (!videoRef.current || !cameraActive) return;
    const dataUrl = captureVideoFrame(videoRef.current);
    setSelfieUrl(dataUrl);
    stopCamera();
    await runFaceComparison(dataUrl);
  }

  async function runFaceComparison(selfie: string) {
    setFaceStatus("loading");
    setFaceError("");
    try {
      const [selfieImg, idImg] = await Promise.all([dataUrlToImage(selfie), dataUrlToImage(idFrontUrl)]);
      const result = await compareFaces(idImg, selfieImg);
      setFaceScore(result.score);
      if (result.matched) {
        setFaceStatus("matched");
        toast.success(`✅ Khuôn mặt khớp (${Math.round(result.score * 100)}%)`);
      } else {
        setFaceStatus("failed");
        setFaceError(result.error || `Khuôn mặt không khớp (điểm: ${Math.round(result.score * 100)}%). Vui lòng thử lại.`);
      }
    } catch {
      setFaceStatus("failed");
      setFaceError("Lỗi phân tích. Thử lại hoặc đảm bảo ánh sáng đủ sáng.");
    }
  }

  function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Chỉ chấp nhận file ảnh"); return; }
    setIdFrontFile(file);
    const url = URL.createObjectURL(file);
    setIdFrontUrl(url);
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    if (faceStatus !== "matched") { toast.error("Vui lòng hoàn thành xác minh khuôn mặt"); return; }
    setSubmitting(true);
    try {
      const selfieBase64 = selfieUrl.split(",")[1] ?? selfieUrl;
      const res = await verifyKycAndBecomeHost({
        name: form.name, gmail: form.gmail, phone: form.phone,
        idNumber: form.idNumber.replace(/\s/g, ""),
        faceMatchScore: faceScore,
        selfieImage: selfieBase64,
      });
      if (!res.success) throw new Error((res as any).message || "Xác minh thất bại");
      // Update local auth state
      if (user) setUser({ ...user, role: "host" } as any);
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || "Xác minh thất bại, thử lại sau");
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── UI ─── */
  const STEPS = [
    { n: 1, label: "Thông tin", icon: User },
    { n: 2, label: "CCCD", icon: CreditCard },
    { n: 3, label: "Xác minh mặt", icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,white,transparent_60%)]" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 bg-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur">
            <Shield className="h-4 w-4" /> Xác minh danh tính tự động – Không cần chờ duyệt
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Trở thành Host ngay hôm nay</h1>
          <p className="text-emerald-100 text-lg">Xác minh CCCD + khuôn mặt → Tự động được cấp quyền Host</p>
        </div>
      </section>

      {/* Step form area */}
      {step < 4 && (
        <div className="max-w-xl mx-auto px-4 py-10">
          {/* Progress */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.n;
              const active = step === s.n;
              return (
                <div key={s.n} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm transition-all",
                      done ? "bg-emerald-600 border-emerald-600 text-white" :
                      active ? "bg-white border-emerald-600 text-emerald-600 shadow-md" :
                      "bg-white border-gray-200 text-gray-400"
                    )}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={cn("mt-1 text-xs font-medium", active ? "text-emerald-700" : "text-gray-400")}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-16 h-0.5 mx-1 mb-4", step > s.n ? "bg-emerald-500" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* ── Step 1 ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                {([
                  { field: "name", label: "Họ và tên", placeholder: "Nguyễn Văn A", type: "text", required: true },
                  { field: "gmail", label: "Email", placeholder: "example@gmail.com", type: "email", required: true },
                  { field: "phone", label: "Số điện thoại", placeholder: "0901234567", type: "tel", required: true },
                  { field: "idNumber", label: "Số CCCD (12 chữ số)", placeholder: "001199000001", type: "text", required: true },
                ] as any[]).map(f => (
                  <div key={f.field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <Input type={f.type} placeholder={f.placeholder}
                      value={(form as any)[f.field]}
                      onChange={e => { setForm(prev => ({ ...prev, [f.field]: e.target.value })); setErrors(prev => ({ ...prev, [f.field]: undefined })); }}
                      className={cn("h-11", (errors as any)[f.field] && "border-red-400 focus-visible:ring-red-300")}
                      maxLength={f.field === "idNumber" ? 12 : undefined}
                    />
                    {(errors as any)[f.field] && <p className="mt-1 text-xs text-red-500">{(errors as any)[f.field]}</p>}
                  </div>
                ))}

                {/* Terms */}
                <div className={cn("flex items-start gap-3 p-3 rounded-lg border", errors.agreeToTerms ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")}>
                  <Checkbox id="terms" checked={form.agreeToTerms} onCheckedChange={v => { setForm(p => ({ ...p, agreeToTerms: !!v })); setErrors(p => ({ ...p, agreeToTerms: undefined })); }} className="mt-0.5" />
                  <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    Tôi đồng ý với <a href="/terms" target="_blank" className="text-emerald-600 font-semibold hover:underline">Điều khoản dịch vụ</a> và <a href="/privacy" target="_blank" className="text-emerald-600 font-semibold hover:underline">Chính sách bảo mật</a>. Thông tin CCCD sẽ được mã hóa và bảo mật.
                  </label>
                </div>
                {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms}</p>}

                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold" onClick={() => { if (validateStep1()) setStep(2); }}>
                  Tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Upload ảnh CCCD</h2>
                <p className="text-sm text-gray-500">Ảnh mặt trước CCCD cần rõ nét để hệ thống có thể nhận diện khuôn mặt của bạn.</p>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                    idFrontFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                  )}
                  onClick={() => document.getElementById("id-upload")?.click()}
                >
                  <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
                  {idFrontUrl ? (
                    <div className="relative">
                      <Image src={idFrontUrl} alt="CCCD mặt trước" width={400} height={240} className="mx-auto rounded-lg object-contain max-h-48 w-auto" unoptimized />
                      <p className="mt-3 text-sm text-emerald-600 font-medium">✅ Đã upload – {idFrontFile?.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">Nhấn để chọn ảnh CCCD mặt trước</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG – ảnh rõ nét, đủ ánh sáng</p>
                    </>
                  )}
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Đảm bảo ảnh CCCD rõ nét, không bị che khuất khuôn mặt, đủ ánh sáng.</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>Quay lại</Button>
                  <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold" onClick={() => { if (validateStep2()) setStep(3); }}>
                    Tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900">Xác minh khuôn mặt</h2>
                <p className="text-sm text-gray-500">Hệ thống sẽ so sánh khuôn mặt của bạn với ảnh trên CCCD để xác minh danh tính.</p>

                {/* Mode chooser */}
                {captureMode === "choose" && faceStatus !== "matched" && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                      onClick={() => { setCaptureMode("webcam"); startCamera(); }}
                    >
                      <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <Camera className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-sm">Camera máy tính</p>
                        <p className="text-xs text-gray-400 mt-0.5">Webcam trực tiếp</p>
                      </div>
                    </button>
                    <button
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                      onClick={startQrMode}
                    >
                      <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Smartphone className="h-7 w-7 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-sm">Camera điện thoại</p>
                        <p className="text-xs text-gray-400 mt-0.5">Quét QR để chụp</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* QR Mode */}
                {captureMode === "qr" && faceStatus !== "matched" && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border-2 border-blue-200 p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <QrCode className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold text-gray-900">Quét mã QR bằng điện thoại</p>
                      </div>
                      {/* QR code image from API */}
                      {qrUrl && (
                        <div className="flex justify-center mb-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                            alt="QR Code"
                            width={200}
                            height={200}
                            className="rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mb-2">Mở ứng dụng camera trên điện thoại và quét mã QR này</p>
                      {qrPolling && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 mt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p className="text-sm">Đang chờ ảnh từ điện thoại...</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Hướng dẫn:</strong> Quét QR → Mở camera trên điện thoại → Chụp ảnh selfie → Hệ thống sẽ tự động nhận ảnh và xác minh.
                      </p>
                    </div>
                    <Button variant="outline" className="w-full h-11" onClick={() => { setCaptureMode("choose"); setQrPolling(false); }}>
                      ← Chọn cách khác
                    </Button>
                  </div>
                )}

                {/* Webcam Mode */}
                {captureMode === "webcam" && faceStatus !== "matched" && (
                  <>
                    {/* Camera */}
                    <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                      <video ref={videoRef} className={cn("w-full h-full object-cover", !cameraActive && "hidden")} autoPlay muted playsInline />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                          {selfieUrl ? (
                            <Image src={selfieUrl} alt="Selfie" fill className="object-cover" unoptimized />
                          ) : (
                            <>
                              <Camera className="h-12 w-12 opacity-40" />
                              <p className="text-sm opacity-60">Camera chưa bật</p>
                            </>
                          )}
                        </div>
                      )}
                      {cameraActive && faceStatus === "scanning" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-64 border-2 border-emerald-400 rounded-full opacity-70 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {!cameraActive && faceStatus !== "matched" && !selfieUrl && (
                        <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold" onClick={startCamera}>
                          <Camera className="mr-2 h-4 w-4" /> Bật camera và chụp ảnh
                        </Button>
                      )}
                      {cameraActive && (
                        <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold animate-pulse" onClick={captureSelfie}>
                          <Camera className="mr-2 h-4 w-4" /> Chụp ảnh ngay
                        </Button>
                      )}
                      {faceStatus === "failed" && selfieUrl && (
                        <Button variant="outline" className="w-full h-11" onClick={() => { setSelfieUrl(""); setFaceStatus("idle"); startCamera(); }}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                        </Button>
                      )}
                      {!cameraActive && faceStatus !== "matched" && (
                        <Button variant="outline" className="w-full h-11" onClick={() => { setCaptureMode("choose"); stopCamera(); }}>
                          ← Chọn cách khác
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Camera from phone (selfie received via QR) */}
                {captureMode === "qr" && selfieUrl && faceStatus !== "matched" && faceStatus !== "loading" && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                    <img src={selfieUrl} alt="Selfie từ điện thoại" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Status */}
                {faceStatus === "loading" && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-700">Đang tải model AI và phân tích khuôn mặt...</p>
                  </div>
                )}
                {faceStatus === "matched" && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-300 p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-semibold">Khuôn mặt khớp ({Math.round(faceScore * 100)}%) – Xác minh thành công!</p>
                  </div>
                )}
                {faceStatus === "failed" && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-300 p-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-700">{faceError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => { stopCamera(); setCaptureMode("choose"); setQrPolling(false); setStep(2); }}>Quay lại</Button>
                  <Button
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
                    disabled={faceStatus !== "matched" || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</> : <>Hoàn tất đăng ký <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4 – Success ── */}
      {step === 4 && (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Chúc mừng!</h2>
            <p className="text-gray-600 mb-6">Danh tính đã được xác minh thành công. Tài khoản của bạn đã được nâng cấp lên <strong className="text-emerald-600">Host</strong>!</p>
            <div className="space-y-3">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-semibold" onClick={() => router.push("/host")}>
                Vào trang quản lý Host <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={() => router.push("/host/properties/new")}>
                Tạo khu cắm trại đầu tiên
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}