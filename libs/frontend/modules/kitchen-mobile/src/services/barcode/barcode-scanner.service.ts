import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, EMPTY } from 'rxjs';
import { map, filter, catchError, switchMap, take } from 'rxjs/operators';
import { BrowserMultiFormatReader, Result, DecodeHintType } from '@zxing/library';
import { BarcodeScanResult } from '../../types';

export interface BarcodeScanConfig {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
  torch: boolean;
  zoom: number;
  formats: string[]
  tryHarder: boolean;
  enabledHints: Map<DecodeHintType, any>;
}

@Injectable({
  providedIn: 'root',
})
export class BarcodeScannerService {
  private reader!: BrowserMultiFormatReader;
  private isScanning$ = new BehaviorSubject<boolean>(false);
  private isSupported$ = new BehaviorSubject<boolean>(false);
  private lastScan$ = new BehaviorSubject<BarcodeScanResult | null>(null);
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  private readonly defaultConfig: BarcodeScanConfig = {
    facingMode: 'environment',
    width: 1280,
    height: 720,
    torch: false,
    zoom: 1.0,
    formats: [
      'QR_CODE',
      'CODE_128',
      'CODE_93',
      'CODE_39',
      'EAN_13',
      'EAN_8',
      'UPC_A',
      'UPC_E',
      'CODABAR',
      'DATA_MATRIX',
      'PDF_417'
    ],
    tryHarder: true,
    enabledHints: new Map()
  };

  constructor(private ngZone: NgZone) {
    this.initializeScanner()
  }

  get isScanning(): Observable<boolean> {
    return this.isScanning$.asObservable()
  }

  get isSupported(): Observable<boolean> {
    return this.isSupported$.asObservable()
  }

  get lastScan(): Observable<BarcodeScanResult | null> {
    return this.lastScan$.asObservable()
  }

  get scans(): Observable<BarcodeScanResult> {
    return this.lastScan$.pipe(
      filter(scan => scan !== null),
      map(scan => scan!)
    );
  }

  private async initializeScanner(): Promise<void> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('Camera access not supported');
        this.isSupported$.next(false);
        return;
      }

      // Initialize the barcode reader
      this.reader = new BrowserMultiFormatReader()

      // Configure hints for better recognition
      const hints = new Map()
      hints.set(DecodeHintType.PURE_BARCODE, false);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, this.defaultConfig.formats);
      hints.set(DecodeHintType.TRY_HARDER, this.defaultConfig.tryHarder);

      this.reader.hints = hints;
      this.isSupported$.next(true);
    } catch (error) {
      console.error('Failed to initialize barcode scanner:', error);
      this.isSupported$.next(false);
    }
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    config: Partial<BarcodeScanConfig> = {}
  ): Promise<void> {
    if (!this.reader || this.isScanning$.value) {
      return;
    }

    const finalConfig = { ...this.defaultConfig, ...config }
    this.videoElement = videoElement;

    try {
      // Get available cameras
      const devices = await this.getVideoDevices()
      if (devices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Select camera based on facing mode preference
      const deviceId = this.selectCamera(devices, finalConfig.facingMode);

      // Configure media constraints
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: finalConfig.facingMode,
          width: { ideal: finalConfig.width },
          height: { ideal: finalConfig.height }
        }
      };

      // Start video stream
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;

      // Configure torch if supported
      if (finalConfig.torch) {
        await this.setTorch(true);
      }

      // Start scanning
      this.reader.decodeFromVideoDevice(
        deviceId || null,
        videoElement,
        (result: Result | undefined, error: any) => {
          this.ngZone.run(() => {
            if (result) {
              const scanResult: BarcodeScanResult = {
                text: result.getText(),
                format: result.getBarcodeFormat().toString(),
                timestamp: new Date()
              };

              this.lastScan$.next(scanResult);
            }

            if (error && !(error.name === 'NotFoundException')) {
              console.error('Barcode scanning error:', error);
            }
          });
        }
      );

      this.isScanning$.next(true);
    } catch (error) {
      console.error('Failed to start scanning:', error);
      this.cleanup()
      throw error;
    }
  }

  stopScanning(): void {
    if (!this.isScanning$.value) return;

    try {
      this.reader.reset()
      this.cleanup()
      this.isScanning$.next(false);
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  private async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput');
  }

  private selectCamera(devices: MediaDeviceInfo[], facingMode: string): string | undefined {
    // Try to find camera with preferred facing mode
    const preferredCamera = devices.find(device =>
      device.label.toLowerCase().includes(facingMode === 'environment' ? 'back' : 'front')
    );

    if (preferredCamera) {
      return preferredCamera.deviceId;
    }

    // Fallback to first available camera
    return devices[0]?.deviceId;
  }

  async setTorch(enabled: boolean): Promise<void> {
    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities()
      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: enabled } as any],
        });
      }
    } catch (error) {
      console.warn('Torch control not supported:', error);
    }
  }

  async setZoom(zoom: number): Promise<void> {
    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities()
      if ('zoom' in capabilities) {
        const settings = videoTrack.getSettings()
        const maxZoom = (capabilities as any).zoom?.max || 3;
        const constrainedZoom = Math.min(Math.max(zoom, 1), maxZoom);

        await videoTrack.applyConstraints({
          advanced: [{ zoom: constrainedZoom } as any],
        });
      }
    } catch (error) {
      console.warn('Zoom control not supported:', error);
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.isScanning$.value || !this.videoElement) return;

    const devices = await this.getVideoDevices()
    if (devices.length < 2) return;

    const currentDevice = this.getCurrentDeviceId()
    const nextDevice = this.getNextDevice(devices, currentDevice);

    if (nextDevice) {
      // Restart scanning with new camera
      this.stopScanning()
      await this.startScanning(this.videoElement, {
        facingMode: this.defaultConfig.facingMode
      });
    }
  }

  private getCurrentDeviceId(): string | undefined {
    if (!this.stream) return undefined;

    const videoTrack = this.stream.getVideoTracks()[0]
    return videoTrack?.getSettings().deviceId;
  }

  private getNextDevice(devices: MediaDeviceInfo[], currentId?: string): MediaDeviceInfo | undefined {
    if (!currentId) return devices[0]

    const currentIndex = devices.findIndex(device => device.deviceId === currentId);
    const nextIndex = (currentIndex + 1) % devices.length;
    return devices[nextIndex]
  }

  // Scan from image file
  async scanFromFile(file: File): Promise<BarcodeScanResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const img = new Image()
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            const result = await this.reader.decodeFromImage(dataUrl);

            const scanResult: BarcodeScanResult = {
              text: result.getText(),
              format: result.getBarcodeFormat().toString(),
              timestamp: new Date()
            };

            resolve(scanResult);
          } catch (error) {
            reject(error);
          }
        }

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      }

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Scan from canvas
  async scanFromCanvas(canvas: HTMLCanvasElement): Promise<BarcodeScanResult | null> {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const dataUrl = canvas.toDataURL('image/png');
      const result = await this.reader.decodeFromImage(dataUrl);

      return {
        text: result.getText(),
        format: result.getBarcodeFormat().toString(),
        timestamp: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  // Get camera capabilities
  async getCameraCapabilities(): Promise<MediaTrackCapabilities | null> {
    if (!this.stream) return null;

    const videoTrack = this.stream.getVideoTracks()[0]
    return videoTrack ? videoTrack.getCapabilities() : null;
  }

  // Get available camera devices
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    return this.getVideoDevices()
  }

  // Check if torch is supported
  async isTorchSupported(): Promise<boolean> {
    const capabilities = await this.getCameraCapabilities()
    return capabilities ? 'torch' in capabilities : false;
  }

  // Check if zoom is supported
  async isZoomSupported(): Promise<boolean> {
    const capabilities = await this.getCameraCapabilities()
    return capabilities ? 'zoom' in capabilities : false;
  }

  updateConfig(config: Partial<BarcodeScanConfig>): void {
    Object.assign(this.defaultConfig, config);

    if (this.reader && config.enabledHints) {
      this.reader.hints = config.enabledHints;
    }
  }
}