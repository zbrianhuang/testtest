import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class Tab2Page implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  
  isRecording: boolean = false;
  selectedMode: 'video' | 'template' = 'video';
  showRecent: boolean = false;
  hasRecorded: boolean = false;
  selectedTemplateImage: string | null = null;
  cameraStream: MediaStream | null = null;
  isCameraActive: boolean = false;

  // Dragging state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  templateImagePosition: { top: number; left: number } = { top: 10, left: 10 };

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private storage: Storage,
    private elementRef: ElementRef,
    private platform: Platform
  ) {}

  async ngOnInit() {
    await this.storage.create();
  }

  async ionViewWillEnter() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    this.templateImagePosition = { top: 10, left: 10 };
    
    if (!this.showRecent) {
      await this.startCamera();
    }
  }

  async ionViewWillLeave() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    await this.stopCamera();
  }

  async startCamera() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Camera } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          webUseInput: true
        });
        
        if (image.webPath) {
          this.selectedTemplateImage = image.webPath;
        }
      } else {
        // Web implementation
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.cameraStream;
          await this.videoElement.nativeElement.play();
          this.isCameraActive = true;
        }
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      this.presentToast('Error accessing camera');
    }
  }

  async stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
      this.isCameraActive = false;
    }
  }

  async toggleRecording() {
    if (!this.isRecording) {
      // Start recording
      try {
        const stream = this.videoElement.nativeElement.srcObject as MediaStream;
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          this.hasRecorded = true;
          // Here you can save the video or process it further
        };

        mediaRecorder.start();
        this.isRecording = true;
      } catch (error) {
        console.error('Error starting recording:', error);
        this.presentToast('Error starting recording');
      }
    } else {
      // Stop recording
      this.isRecording = false;
      this.hasRecorded = true;
    }
  }

  setMode(mode: string | number | undefined) {
    const modeStr = String(mode);
    if (modeStr === 'video' || modeStr === 'template') {
      this.selectedMode = modeStr as 'video' | 'template';
      this.showRecent = true;
      this.stopCamera();
    }
  }

  async showCamera() {
    this.showRecent = false;
    await this.startCamera();
  }

  selectTemplateVideo(imageUrl: string) {
    this.selectedTemplateImage = imageUrl;
    this.templateImagePosition = { top: 10, left: 10 };
    this.showRecent = false;
  }

  async close() {
    if (this.hasRecorded) {
      const alert = await this.alertController.create({
        header: 'Do you want to discard this video?',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => {}
          },
          {
            text: 'Yes',
            handler: () => {
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
    this.navCtrl.navigateForward('/tabs/video-editor', {
      state: {
        selectedTemplateImage: this.selectedTemplateImage,
        templateImagePosition: this.templateImagePosition
      }
    });
  }

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.dragStartX = clientX - this.templateImagePosition.left;
    this.dragStartY = clientY - this.templateImagePosition.top;

    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('touchmove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    document.addEventListener('touchend', this.stopDrag.bind(this));
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const cameraPreview = this.elementRef.nativeElement.querySelector('.camera-preview');
    const rect = cameraPreview.getBoundingClientRect();

    let newLeft = clientX - this.dragStartX;
    let newTop = clientY - this.dragStartY;

    const imageWidth = 100;
    const imageHeight = 100;
    newLeft = Math.max(0, Math.min(newLeft, rect.width - imageWidth));
    newTop = Math.max(0, Math.min(newTop, rect.height - imageHeight));

    this.templateImagePosition = { top: newTop, left: newLeft };
  }

  stopDrag() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('touchmove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
    document.removeEventListener('touchend', this.stopDrag.bind(this));
  }

  async presentToast(message: string) {
    const toast = await this.alertController.create({
      header: 'Notification',
      message: message,
      buttons: ['OK']
    });
    await toast.present();
  }
}