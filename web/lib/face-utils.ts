/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Face comparison utility using @vladmandic/face-api (browser-side)
 * Models are loaded from CDN on first use.
 */

let faceApiLoaded = false;
let faceapi: any = null;

const MODEL_URL = 'https://vladmandic.github.io/face-api/model';

export async function loadFaceApi(): Promise<any> {
  if (faceApiLoaded && faceapi) return faceapi;

  // Dynamic import to avoid SSR issues
  const fa = await import('@vladmandic/face-api');
  faceapi = fa;

  await Promise.all([
    fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  faceApiLoaded = true;
  return faceapi;
}

/**
 * Compare two image sources and return similarity score (0–1).
 * 1.0 = identical, 0.0 = completely different.
 * Uses euclidean distance; threshold typically < 0.6 for same person.
 */
export async function compareFaces(
  img1: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  img2: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<{ score: number; matched: boolean; error?: string }> {
  try {
    const fa = await loadFaceApi();

    const detect = async (el: any) => {
      const detection = await fa
        .detectSingleFace(el, new fa.SsdMobilenetv1Options({ minConfidence: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      return detection;
    };

    const [d1, d2] = await Promise.all([detect(img1), detect(img2)]);

    if (!d1) return { score: 0, matched: false, error: 'Không phát hiện khuôn mặt trong ảnh CCCD' };
    if (!d2) return { score: 0, matched: false, error: 'Không phát hiện khuôn mặt trong ảnh selfie' };

    const distance = fa.euclideanDistance(d1.descriptor, d2.descriptor);
    // Convert distance to similarity score (lower distance = higher similarity)
    const score = Math.max(0, 1 - distance);
    const matched = distance < 0.55; // Threshold

    return { score, matched };
  } catch (err: any) {
    return { score: 0, matched: false, error: err?.message || 'Lỗi phân tích khuôn mặt' };
  }
}

/** Convert a data URL to an HTMLImageElement */
export function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Capture current video frame as data URL */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Parse birth year from Vietnamese CCCD 12-digit number */
export function parseBirthYearFromCCCD(cccd: string): number | null {
  const cleaned = cccd.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) return null;

  const decadeCode = parseInt(cleaned[3], 10);
  const yearSuffix = parseInt(cleaned.slice(4, 6), 10);

  // decadeCode: 0,1=male born 19xx; 2=male 20xx; 3,4=female 19xx; 5=female 20xx; 6,7=201x
  if (decadeCode <= 1) return 1900 + yearSuffix;
  if (decadeCode === 2) return 2000 + yearSuffix;
  if (decadeCode <= 4) return 1900 + yearSuffix;
  if (decadeCode === 5) return 2000 + yearSuffix;
  return 2000 + yearSuffix;
}
