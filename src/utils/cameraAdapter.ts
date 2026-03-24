// Prompt 5 — Camera adapter (web + native Capacitor)
// On web: uses getUserMedia (LiveCamera component).
// On native (Capacitor): uses native camera plugin.

// Detect Capacitor native platform without importing at module level
// (avoids build errors when @capacitor/core is not yet installed)
function isNativePlatform(): boolean {
  return (
    typeof (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor
      ?.isNativePlatform === 'function' &&
    ((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor!.isNativePlatform!() ?? false)
  );
}

export async function isCameraAvailable(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      // Dynamic import — only available when @capacitor/camera is installed
      const { Camera } = await import('@capacitor/camera');
      const perms = await Camera.checkPermissions();
      return perms.camera === 'granted' || perms.camera === 'prompt';
    } catch {
      return false;
    }
  }
  return !!(navigator.mediaDevices?.getUserMedia);
}

/**
 * Capture a photo using the native Capacitor camera API.
 * Falls back to returning null on error so the caller can use the web camera.
 */
export async function captureNative(): Promise<string | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import(
      '@capacitor/camera'
    );
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      direction: 'front' as Parameters<typeof Camera.getPhoto>[0]['direction'],
    });
    return photo.base64String ?? null;
  } catch {
    return null;
  }
}
