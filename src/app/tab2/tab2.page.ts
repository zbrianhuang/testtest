import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { MetronomeComponent } from '../components/metronome/metronome.component';
import { Capacitor } from '@capacitor/core';
import { Storage } from '@ionic/storage-angular';
import config from '../../../capacitor.config';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;
  
  isRecording: boolean = false;
  selectedMode: 'video' | 'template' = 'video';
  showRecent: boolean = false;
  hasRecorded: boolean = false;
  selectedTemplateImage: string | null = null;
  recordedVideoPath: string | null = null;
  previewElement: HTMLVideoElement | null = null;
  mediaRecorder: MediaRecorder | null = null;
  stream: MediaStream | null = null;
  chunks: Blob[] = [];
  currentCamera: 'user' | 'environment' = 'environment';
  isPlaying: boolean = false;
  isNativeApp: boolean = false;

  // Dragging state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  templateImagePosition: { top: number; left: number } = { top: 10, left: 10 }; // Default position in pixels

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private platform: Platform,
    private storage: Storage,
    private elementRef: ElementRef
  ) {
    this.isNativeApp = Capacitor.isNativePlatform();
  }

  async ngOnInit() {
    // Initialize storage
    await this.storage.create();
    setTimeout(() => this.checkPermissions(), 100);
  }

  async ionViewWillEnter() {
    await this.checkPermissions();
    this.resetState();
  }

  ionViewWillLeave() {
    this.resetState();
    this.stopMediaStream();
  }

  private resetState() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    this.recordedVideoPath = null;
    this.chunks = [];
    this.isPlaying = false;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position on page enter
  }

  private stopMediaStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.previewElement) {
      this.previewElement.srcObject = null;
    }
  }

  async switchCamera() {
    this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
    await this.setupCamera();
  }

  private async initializeCamera() {
    try {
      console.log('Initializing camera...');
      const constraints = {
        video: {
          facingMode: this.currentCamera,
          width: { ideal: 1280 }, // Reduced resolution for better compatibility
          height: { ideal: 720 }
        },
        audio: true
      };

      console.log('Requesting media stream with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream obtained');
      
      this.stream = stream;
      
      // Wait for the view to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.previewElement = this.videoPreview?.nativeElement;
      if (this.previewElement) {
        console.log('Setting up video preview');
        this.previewElement.srcObject = stream;
        try {
          await this.previewElement.play();
          console.log('Video preview started');
        } catch (playError) {
          console.error('Error playing video preview:', playError);
          throw new Error('無法播放相機預覽');
        }
      } else {
        throw new Error('找不到影片預覽元素');
      }

      // Check for supported MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Selected MIME type:', selectedMimeType);
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('找不到支援的影片格式');
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 1500000 // Reduced bitrate for better compatibility
      });
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: selectedMimeType });
        await this.saveVideo(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.showRecordingError();
      };

    } catch (error) {
      console.error('Error initializing camera:', error);
      if (this.isNativeApp) {
        this.showNativeAppError();
      } else {
        this.showWebBrowserError(error);
      }
    }
  }

  private async showRecordingError() {
    const alert = await this.alertController.create({
      header: '錄影錯誤',
      message: '錄影時發生錯誤。請重試。',
      buttons: ['確定']
    });
    await alert.present();
  }

  async toggleRecording() {
    if (!this.mediaRecorder) {
      console.error('MediaRecorder not initialized');
      return;
    }

    try {
      if (!this.isRecording) {
        // Start recording
        this.chunks = [];
        this.mediaRecorder.start(1000); // Collect data every second
        this.isRecording = true;
      } else {
        // Stop recording
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.hasRecorded = true;
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      this.showRecordingError();
      this.isRecording = false;
    }
  }

  async setupCamera() {
    try {
      // Stop existing stream if any
      this.stopMediaStream();
      await this.initializeCamera();
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showCameraError();
    }
  }

  private async showCameraError() {
    const alert = await this.alertController.create({
      header: '相機錯誤',
      message: '無法存取相機。請確保已允許 Safari 使用相機和麥克風。',
      buttons: [
        {
          text: '重新整理',
          handler: () => {
            window.location.reload();
          }
        },
        {
          text: '取消',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async checkPermissions() {
    if (this.isNativeApp) {
      // Native app flow
      try {
        const permissionStatus = await Camera.checkPermissions();
        if (permissionStatus.camera !== 'granted') {
          const requestResult = await Camera.requestPermissions();
          if (requestResult.camera !== 'granted') {
            throw new Error('Camera permission not granted');
          }
        }
        this.resetState();
        await this.initializeCamera();
      } catch (error) {
        console.error('Error checking permissions:', error);
        this.showNativeAppError();
      }
    } else {
      // Web browser flow (including mobile Safari)
      try {
        console.log('Checking browser permissions...');
        // First check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported in this browser');
        }

        // Try to get camera access with basic constraints first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: 'environment' // Try back camera first
          },
          audio: true 
        });
        
        console.log('Camera access granted');
        stream.getTracks().forEach(track => track.stop());
        this.resetState();
        await this.initializeCamera();
      } catch (error) {
        console.error('Error accessing camera:', error);
        this.showWebBrowserError(error);
      }
    }
  }

  private async showNativeAppError() {
    const alert = await this.alertController.create({
      header: '相機錯誤',
      message: '無法存取相機。請在手機設定中允許應用程式使用相機和麥克風。',
      buttons: [
        {
          text: '開啟設定',
          handler: () => {
            if (this.platform.is('ios')) {
              window.open('app-settings:');
            } else if (this.platform.is('android')) {
              window.open('package:' + config.appId);
            }
          }
        },
        {
          text: '取消',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async showWebBrowserError(error: any) {
    let errorMessage = '請在瀏覽器設定中允許此網站使用相機和麥克風。\n\n';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += '1. 點擊網址列左側的鎖頭圖示\n2. 選擇「設定此網站的權限」\n3. 允許相機和麥克風';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '找不到可用的相機。請確認您的設備有相機，且未被其他應用程式使用。';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '無法讀取相機。請確認相機未被其他應用程式使用。';
    } else {
      errorMessage += `錯誤訊息: ${error.message || '未知錯誤'}`;
    }

    const alert = await this.alertController.create({
      header: '需要相機權限',
      message: errorMessage,
      buttons: [
        {
          text: '重新整理',
          handler: () => {
            window.location.reload();
          }
        },
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            this.navCtrl.navigateBack('/tabs/home_tab');
          }
        }
      ]
    });
    await alert.present();
  }

  private async saveVideo(blob: Blob): Promise<void> {
    try {
      const fileName = `recording_${Date.now()}.webm`;
      
      if (this.isNativeApp) {
        // Native app: Save to device storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const base64Content = base64Data.split(',')[1];

          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Content,
            directory: Directory.Data
          });

          this.recordedVideoPath = savedFile.uri;
          console.log('Video saved:', this.recordedVideoPath);
        };
      } else {
        // Web browser: Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      const alert = await this.alertController.create({
        header: '錯誤',
        message: '無法儲存影片。',
        buttons: ['確定']
      });
      await alert.present();
    }
  }

  setMode(mode: 'video' | 'template' | undefined) {
    if (mode === 'video' || mode === 'template') {
      this.selectedMode = mode;
      this.showRecent = true;
    }
  }

  handleSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'video' || value === 'template') {
      this.setMode(value);
    }
  }

  showCamera() {
    this.showRecent = false;
    this.setupCamera();
  }

  selectTemplateVideo(imageUrl: string) {
    this.selectedTemplateImage = imageUrl;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position when selecting a new template
    this.showRecent = false;
  }

  async close() {
    if (this.hasRecorded) {
      const alert = await this.alertController.create({
        header: '要捨棄這個影片嗎？',
        buttons: [
          {
            text: '否',
            role: 'cancel',
            handler: () => {}
          },
          {
            text: '是',
            handler: () => {
              if (this.recordedVideoPath) {
                Filesystem.deleteFile({
                  path: this.recordedVideoPath,
                  directory: Directory.Data
                }).catch(console.error);
              }
              this.navCtrl.navigateBack('/tabs/home_tab');
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.navCtrl.navigateBack('/tabs/home_tab');
    }
  }

  goToNext() {
    if (this.recordedVideoPath) {
      // Pass the video path to the editor
      this.navCtrl.navigateForward('/tabs/video-editor', {
        state: { videoPath: this.recordedVideoPath }
      });
    }
  }

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.dragStartX = clientX - this.templateImagePosition.left;
    this.dragStartY = clientY - this.templateImagePosition.top;

    // Add event listeners for mouse/touch move and up events
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('touchmove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    document.addEventListener('touchend', this.stopDrag.bind(this));
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    // Get the camera-preview boundaries
    const cameraPreview = this.elementRef.nativeElement.querySelector('.camera-preview');
    const rect = cameraPreview.getBoundingClientRect();

    // Calculate new position in pixels
    // Calculate new position
    let newLeft = clientX - this.dragStartX;
    let newTop = clientY - this.dragStartY;

    // Ensure the image stays within the camera-preview boundaries
    const imageWidth = 100; // Width of the template image (from CSS)
    const imageHeight = 100; // Height of the template image (from CSS)
    newLeft = Math.max(0, Math.min(newLeft, rect.width - imageWidth));
    newTop = Math.max(0, Math.min(newTop, rect.height - imageHeight));

    // Convert to percentages
    const leftPercent = (newLeft / rect.width) * 100;
    const topPercent = (newTop / rect.height) * 100;

    this.templateImagePosition = { 
      top: topPercent,
      left: leftPercent
    };
    this.templateImagePosition = { top: newTop, left: newLeft };
  }

  stopDrag() {
    this.isDragging = false;


    // Remove event listeners
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('touchmove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
    document.removeEventListener('touchend', this.stopDrag.bind(this));

    // Do not save to storage, so position resets on new template selection
  }
}