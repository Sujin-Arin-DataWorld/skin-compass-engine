// Prompt 1 + Prompt 2 — Live Camera + Capture Flow
// Beauty-app-grade live camera with face oval guide, smart crop, and compression.

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, ImageIcon } from 'lucide-react';

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
const JPEG_QUALITY_FALLBACK = 0.65;
const SIZE_LIMIT_BYTES = 150_000;

export default function LiveCamera({ onCapture, onClose }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [flashing, setFlashing] = useState(false);

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
        setErrorMsg('카메라 권한이 거부되었습니다.');
      } else if (name === 'NotFoundError') {
        setErrorMsg('카메라를 찾을 수 없습니다.');
      } else {
        setErrorMsg('카메라를 열 수 없습니다.');
      }
      setCameraState('fallback');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraState !== 'live') return;

    // Flash effect
    setFlashing(true);
    setTimeout(() => setFlashing(false), 300);

    // Stop tracks after capture to save battery
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Map oval guide to video resolution
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const ovalW = viewW * OVAL_WIDTH_PCT;
    const ovalH = viewH * OVAL_HEIGHT_PCT;
    const ovalX = (viewW - ovalW) / 2;
    const ovalY = (viewH - ovalH) / 2;

    // Scale from viewport to video resolution
    const scaleX = vw / viewW;
    const scaleY = vh / viewH;

    const padX = ovalW * CROP_PADDING;
    const padY = ovalH * CROP_PADDING;

    const cropX = Math.max(0, (ovalX - padX) * scaleX);
    const cropY = Math.max(0, (ovalY - padY) * scaleY);
    const cropW = Math.min(vw - cropX, (ovalW + 2 * padX) * scaleX);
    const cropH = Math.min(vh - cropY, (ovalH + 2 * padY) * scaleY);

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
    if (!ctx) return;

    // Draw raw (unflipped) frame — AI needs real orientation, not mirror
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    // Use toDataURL (synchronous) — avoids iOS Safari toBlob callback bug
    const tryExport = (quality: number): { base64: string; sizeBytes: number } | null => {
      const dataURL = canvas.toDataURL('image/jpeg', quality);
      if (!dataURL || dataURL === 'data:,') return null;
      const b64 = dataURL.split(',')[1];
      if (!b64) return null;
      // Approximate byte size from base64 length
      const sizeBytes = Math.ceil(b64.length * 0.75);
      return { base64: b64, sizeBytes };
    };

    let result = tryExport(JPEG_QUALITY_PRIMARY);
    if (result && result.sizeBytes > SIZE_LIMIT_BYTES) {
      result = tryExport(JPEG_QUALITY_FALLBACK);
    }
    if (!result) return;

    // Build a Blob for the onCapture signature (still needed by callers)
    const binaryStr = atob(result.base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    onCapture(result.base64, blob);
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
            카메라 권한이 필요합니다
          </p>
          <p
            className="mb-1"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {errorMsg || '직접 사진을 선택해주세요.'}
          </p>
          <p
            className="mb-6"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Chrome 또는 Safari에서 접속하시면 라이브 카메라를 사용할 수
            있습니다.
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
            사진 선택하기
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
            top: '50%',
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
          밝은 곳에서 가이드라인에 맞춰주세요
        </p>
      </div>

      {/* Below-oval hint */}
      <div
        className="absolute bottom-40 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.55)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          얼굴을 타원 안에 맞춰주세요
        </p>
      </div>

      {/* Capture button */}
      <div
        className="absolute bottom-12 left-0 right-0 flex justify-center z-10"
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
