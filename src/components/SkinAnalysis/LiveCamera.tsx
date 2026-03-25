// Prompt 1 + Prompt 2 — Live Camera + Capture Flow
// Beauty-app-grade live camera with face oval guide, smart crop, and compression.

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { useI18nStore, translations } from '@/store/i18nStore';

interface LiveCameraProps {
  onCapture: (imageBase64: string, imageBlob: Blob) => void;
  onClose: () => void;
}

type CameraState = 'starting' | 'live' | 'fallback';

const OVAL_WIDTH_PCT = 0.65; // 65% of viewport width
const OVAL_HEIGHT_PCT = 0.45; // 45% of viewport height
const CROP_PADDING = 0.15;   // 15% safety margin
const MAX_SIZE = 512;
const JPEG_QUALITY_PRIMARY = 0.8;

export default function LiveCamera({ onCapture, onClose }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [flashing, setFlashing] = useState(false);

  const { language } = useI18nStore();
  const t = translations[language];

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('live');
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError') {
        setErrorMsg(t.camera.permissionNeeded);
      } else if (name === 'NotFoundError') {
        setErrorMsg(t.camera.permissionNeeded);
      } else {
        setErrorMsg(t.camera.permissionNeeded);
      }
      setCameraState('fallback');
    }
  }, [t]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // ── Capture (iOS-safe: pre-resize to avoid 4K canvas silent fail) ──────────
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraState !== 'live') return;

    console.log('[Capture] 1. Button clicked');

    // Flash effect
    setFlashing(true);
    setTimeout(() => setFlashing(false), 300);

    // Stop tracks after capture to save battery
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    console.log('[Capture] 2. Video dimensions:', vw, vh);

    // ── iOS safety: pre-resize if source exceeds safe canvas area ──
    // iOS Safari canvas limit is ~16.7MP (4096×4096).
    // If video is 4K (4032×3024 = 12.2MP), direct drawImage can fail silently.
    const MAX_CAPTURE_SIZE = 1280;
    let sourceCanvas: HTMLCanvasElement | HTMLVideoElement = video;
    let srcW = vw, srcH = vh;

    if (vw > MAX_CAPTURE_SIZE || vh > MAX_CAPTURE_SIZE) {
      const scale = Math.min(MAX_CAPTURE_SIZE / vw, MAX_CAPTURE_SIZE / vh, 1);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = Math.round(vw * scale);
      tmpCanvas.height = Math.round(vh * scale);
      const tmpCtx = tmpCanvas.getContext('2d');
      if (!tmpCtx) {
        console.error('[Capture] Failed to create temp canvas context');
        return;
      }
      tmpCtx.drawImage(video, 0, 0, tmpCanvas.width, tmpCanvas.height);
      sourceCanvas = tmpCanvas;
      srcW = tmpCanvas.width;
      srcH = tmpCanvas.height;
      console.log('[Capture] 2b. Pre-resized to:', srcW, srcH);
    }

    // Map oval guide to video resolution
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const ovalW = viewW * OVAL_WIDTH_PCT;
    const ovalH = viewH * OVAL_HEIGHT_PCT;
    const ovalX = (viewW - ovalW) / 2;
    const ovalY = (viewH - ovalH) / 2;

    // Scale from viewport to (possibly pre-resized) source resolution
    const scaleX = srcW / viewW;
    const scaleY = srcH / viewH;

    const padX = ovalW * CROP_PADDING;
    const padY = ovalH * CROP_PADDING;

    const cropX = Math.max(0, (ovalX - padX) * scaleX);
    const cropY = Math.max(0, (ovalY - padY) * scaleY);
    const cropW = Math.min(srcW - cropX, (ovalW + 2 * padX) * scaleX);
    const cropH = Math.min(srcH - cropY, (ovalH + 2 * padY) * scaleY);

    // Resize to max 512×512 maintaining aspect ratio
    const aspect = cropW / cropH;
    let outW = MAX_SIZE;
    let outH = MAX_SIZE;
    if (aspect > 1) {
      outH = Math.round(MAX_SIZE / aspect);
    } else {
      outW = Math.round(MAX_SIZE * aspect);
    }

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Capture] Failed to get output canvas context');
      return;
    }

    console.log('[Capture] 3. Canvas dimensions:', outW, outH);

    // Draw raw (unflipped) frame — AI needs real orientation, not mirror
    ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    // Iterative compression loop — target ≤190KB (Supabase bucket limit: 200KB)
    const STORAGE_MAX_BYTES = 190_000;
    const tryExport = (q: number): { base64: string; sizeBytes: number } | null => {
      try {
        const dataURL = canvas.toDataURL('image/jpeg', q);
        if (!dataURL || dataURL === 'data:,') {
          console.error('[Capture] toDataURL returned empty at quality', q);
          return null;
        }
        const b64 = dataURL.split(',')[1];
        if (!b64) return null;
        const sizeBytes = Math.ceil(b64.length * 0.75);
        return { base64: b64, sizeBytes };
      } catch (e) {
        console.error('[Capture] toDataURL threw:', e);
        return null;
      }
    };

    let quality = JPEG_QUALITY_PRIMARY; // 0.8
    let result = tryExport(quality);
    while (result && result.sizeBytes > STORAGE_MAX_BYTES && quality > 0.3) {
      quality -= 0.1;
      result = tryExport(quality);
    }
    if (!result) {
      console.error('[Capture] All export attempts failed — canvas too large?');
      return;
    }

    console.log('[Capture] 4. Image captured, size:', result.sizeBytes, 'bytes');

    // Build a Blob for the onCapture signature (still needed by callers)
    const binaryStr = atob(result.base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    onCapture(result.base64, blob);
    console.log('[Capture] 5. onCapture called successfully');
  }, [cameraState, onCapture]);

  // ── File input fallback (KakaoTalk, LINE in-app browsers) ─────────────────
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const aspect = img.width / img.height;
        let w = MAX_SIZE, h = MAX_SIZE;
        if (aspect > 1) h = Math.round(MAX_SIZE / aspect);
        else w = Math.round(MAX_SIZE * aspect);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onload = () => {
              const b64 = (reader.result as string).split(',')[1];
              onCapture(b64, blob);
            };
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          JPEG_QUALITY_PRIMARY,
        );
      };
      img.src = url;
    },
    [onCapture],
  );

  // ── Render: fallback ──────────────────────────────────────────────────────
  if (cameraState === 'fallback') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
        style={{
          background: 'linear-gradient(160deg, #0d0d12 0%, #1a1520 100%)',
          touchAction: 'none',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rounded-full p-2"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
          }}
        >
          <X size={20} />
        </button>

        <div
          className="w-full max-w-sm rounded-3xl p-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(201,169,110,0.15)' }}
          >
            <ImageIcon size={28} color="#c9a96e" />
          </div>

          <p
            className="mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: '#fff',
            }}
          >
            {t.camera.permissionNeeded}
          </p>
          <p
            className="mb-1"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {errorMsg || t.camera.selectPhoto}
          </p>
          <p
            className="mb-6"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {t.camera.browserHint}
          </p>

          <label
            className="block w-full rounded-2xl py-3 text-center cursor-pointer transition-all"
            style={{
              background: 'rgba(201,169,110,0.15)',
              border: '1px solid rgba(201,169,110,0.4)',
              color: '#c9a96e',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            {t.camera.selectFile}
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>
    );
  }

  // ── Render: live camera ───────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#000', touchAction: 'none' }}
    >
      {/* CSS keyframe for oval pulse */}
      <style>{`
        @keyframes oval-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        .oval-guide { animation: oval-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Live video — mirrored for selfie feel */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Dark overlay with oval cutout (box-shadow trick) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="oval-guide absolute"
          style={{
            left: '50%',
            top: '44%',
            transform: 'translate(-50%, -50%)',
            width: `${OVAL_WIDTH_PCT * 100}vw`,
            height: `${OVAL_HEIGHT_PCT * 100}dvh`,
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.85)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 rounded-full p-2.5 z-10"
        style={{
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
        }}
      >
        <X size={20} />
      </button>

      {/* Top guidance text */}
      <div
        className="absolute top-14 left-0 right-0 flex flex-col items-center gap-1 z-10 pointer-events-none"
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {t.camera.guideHint}
        </p>
      </div>

      {/* Below-oval hint */}
      <div
        className="absolute bottom-44 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.55)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {t.camera.guideText}
        </p>
      </div>

      {/* Capture button */}
      <div
        className="absolute bottom-20 left-0 right-0 flex justify-center z-10"
      >
        <button
          onClick={capture}
          disabled={cameraState !== 'live'}
          className="rounded-full flex items-center justify-center transition-transform active:scale-95"
          style={{
            width: '72px',
            height: '72px',
            border: '3px solid rgba(255,255,255,0.85)',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: '52px',
              height: '52px',
              background: 'rgba(255,255,255,0.9)',
            }}
          />
        </button>
      </div>

      {/* Flash overlay */}
      {flashing && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: '#fff',
            animation: 'flash-out 300ms ease forwards',
          }}
        />
      )}
      <style>{`
        @keyframes flash-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
