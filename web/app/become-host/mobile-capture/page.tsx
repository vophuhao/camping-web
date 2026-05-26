"use client";
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CheckCircle2, Loader2, RefreshCw, Smartphone } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

export default function MobileCapturePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("s") || "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "camera" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Liên kết không hợp lệ. Vui lòng quét lại mã QR.");
    }
  }, [sessionId]);

  async function startCamera() {
    try {
      setErrorMsg("");
      // Use environment (rear) camera for phone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setStatus("camera");
    } catch {
      setErrorMsg("Không thể mở camera. Vui lòng cấp quyền truy cập camera.");
      setStatus("error");
    }
  }

  function stopCamera() {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  }

  async function capture() {
    if (!videoRef.current || !cameraActive) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelfieUrl(dataUrl);
    stopCamera();
    await upload(dataUrl);
  }

  async function upload(selfie: string) {
    setStatus("uploading");
    try {
      const res = await fetch(`${API_URL}/mobile-selfie/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfie }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("done");
      } else {
        throw new Error(json.message || "Upload thất bại");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Lỗi kết nối. Vui lòng thử lại.");
    }
  }

  function retry() {
    setSelfieUrl("");
    setErrorMsg("");
    setStatus("idle");
    startCamera();
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center text-red-600">
          <p className="text-lg font-bold">Liên kết không hợp lệ</p>
          <p className="text-sm mt-2">Vui lòng quét lại mã QR từ máy tính.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Smartphone className="h-5 w-5" />
          <h1 className="text-lg font-bold">Chụp ảnh xác minh</h1>
        </div>
        <p className="text-emerald-100 text-xs">Chụp ảnh selfie để so khớp với CCCD</p>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${!cameraActive ? "hidden" : ""}`}
            autoPlay
            muted
            playsInline
          />
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="h-16 w-16 opacity-30" />
                  <p className="text-sm opacity-50">Camera chưa bật</p>
                </>
              )}
            </div>
          )}
          {/* Face guide overlay */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-emerald-400 rounded-full opacity-60 animate-pulse" />
            </div>
          )}
        </div>

        {/* Status messages */}
        {status === "uploading" && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 w-full max-w-sm">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-700">Đang gửi ảnh về máy tính...</p>
          </div>
        )}
        {status === "done" && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 w-full max-w-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm text-emerald-700 font-semibold">Đã gửi ảnh thành công!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Quay lại máy tính để hoàn tất xác minh. Bạn có thể đóng trang này.</p>
            </div>
          </div>
        )}
        {status === "error" && errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-xl px-4 py-3 w-full max-w-sm">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-2">
          {status === "idle" && (
            <button
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 active:bg-emerald-700 transition-colors shadow-lg"
              onClick={startCamera}
            >
              <Camera className="h-5 w-5" /> Mở camera & Chụp ảnh
            </button>
          )}
          {status === "camera" && cameraActive && (
            <button
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 active:bg-emerald-700 transition-colors shadow-lg animate-pulse"
              onClick={capture}
            >
              <Camera className="h-5 w-5" /> Chụp ngay
            </button>
          )}
          {(status === "error" || (status === "idle" && selfieUrl)) && (
            <button
              className="w-full py-3 rounded-xl border-2 border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 active:bg-emerald-50 transition-colors"
              onClick={retry}
            >
              <RefreshCw className="h-4 w-4" /> Thử lại
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 py-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-500 text-center">
          💡 Giữ khuôn mặt trong vùng khung oval • Đảm bảo đủ ánh sáng • Tháo kính/khẩu trang
        </p>
      </div>
    </div>
  );
}
