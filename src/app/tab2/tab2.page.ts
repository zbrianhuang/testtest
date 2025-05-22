import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { NavController, AlertController, IonicModule, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetronomeComponent } from '../components/metronome/metronome.component';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MetronomeComponent]
})
export class Tab2Page implements OnInit, OnDestroy {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;
  
  isRecording: boolean = false;
  selectedMode: 'video' | 'template' = 'video';
  showRecent: boolean = false;
  hasRecorded: boolean = false;
  selectedTemplateImage: string | null = null;
  currentCamera: 'front' | 'back' = 'front';
  
  // For native camera stream
  mediaStream: MediaStream | null = null;

  // Dragging state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  templateImagePosition: { top: number; left: number } = { top: 10, left: 10 }; // Default position in pixels

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private storage: Storage,
    private elementRef: ElementRef,
    private router: Router,
    private platform: Platform
  ) {}

  async ngOnInit() {
    // Initialize storage
    await this.storage.create();
  }
  
  ngOnDestroy() {
    // Make sure to clean up the camera when component is destroyed
    this.stopCamera();
  }

  ionViewWillEnter() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position on page enter
    
    // Start the camera automatically when entering the page
    this.startCamera();
  }

  ionViewWillLeave() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    
    // Clean up camera resources when leaving
    this.stopCamera();
  }
  
  // Start the camera preview
  async startCamera() {
    try {
      // In browser environment, handle differently
      if (!this.platform.is('capacitor')) {
        // Check if we're on iOS Safari which has strict limitations
        if (this.isIOSSafari()) {
          this.showIOSSafariAlert();
          return;
        }

        // For other web browsers, bypass Capacitor Camera plugin and use browser APIs directly
        await this.startWebCamera();
        return;
      }
      
      // Only for native platforms - check permissions using Capacitor
      const cameraPermissionStatus = await Camera.checkPermissions();
      
      if (cameraPermissionStatus.camera !== 'granted') {
        // Try requesting permissions
        const requestResult = await Camera.requestPermissions();
        
        if (requestResult.camera !== 'granted') {
          // If permissions still not granted, show a more detailed alert
          this.showDetailedPermissionAlert();
          return;
        }
      }
      
      // On native platforms, use direct device camera access
      await this.startNativeCamera();
    } catch (error) {
      console.error('Error starting camera:', error);
      // Show an alert about camera permission issues
      this.showDetailedPermissionAlert();
    }
  }
  
  // Use Capacitor Camera API for iOS/Android
  async startNativeCamera() {
    try {
      // When in native mode, we'll use the web camera API for preview
      // as Capacitor's Camera is primarily for taking photos/videos, not streaming
      await this.startWebCamera();
    } catch (error) {
      console.error('Error starting native camera:', error);
    }
  }
  
  // Use WebAPI camera for browser/development
  async startWebCamera() {
    try {
      // Stop any existing streams
      if (this.mediaStream) {
        this.stopCamera();
      }
      
      console.log('Starting web camera with facing mode:', this.currentCamera);
      
      // Start a new camera stream with specific constraints for better browser compatibility
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.currentCamera === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true // Enable audio for recording
      });
      
      // Make sure videoPreview is available before setting srcObject
      await this.waitForVideoElement();
      
      // Connect the stream to the video element
      if (this.videoPreview && this.videoPreview.nativeElement) {
        this.videoPreview.nativeElement.srcObject = this.mediaStream;
        this.videoPreview.nativeElement.play()
          .catch(err => console.error('Error playing video:', err));
      } else {
        console.error('Video element not found');
      }
    } catch (error) {
      console.error('Error accessing web camera:', error);
      // For browser, show a simpler alert
      this.showSimpleBrowserPermissionAlert();
    }
  }
  
  // Wait for the video element to be available in the DOM
  private waitForVideoElement(): Promise<void> {
    return new Promise((resolve) => {
      if (this.videoPreview && this.videoPreview.nativeElement) {
        resolve();
        return;
      }
      
      // If not available, wait a bit and check again
      const checkInterval = setInterval(() => {
        if (this.videoPreview && this.videoPreview.nativeElement) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(); // Resolve anyway after timeout
      }, 2000);
    });
  }
  
  // Browser-specific permission alert
  async showSimpleBrowserPermissionAlert() {
    const alert = await this.alertController.create({
      header: 'Camera Access Required',
      message: 'Please allow camera access in your browser. Look for the camera permission icon in your address bar.',
      buttons: ['OK']
    });
    await alert.present();
  }
  
  // Clean up camera resources
  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Clear the video element source
    if (this.videoPreview && this.videoPreview.nativeElement) {
      this.videoPreview.nativeElement.srcObject = null;
    }
  }
  
  // Show alert for camera permission issues
  async showCameraPermissionAlert() {
    const alert = await this.alertController.create({
      header: 'Camera Permission Required',
      message: 'Please allow camera access to use this feature.',
      buttons: ['OK']
    });
    await alert.present();
  }
  
  // Show a more detailed alert with platform-specific instructions
  async showDetailedPermissionAlert() {
    let message = 'This app needs camera access to record videos.';
    
    // Add platform-specific instructions
    if (this.platform.is('ios')) {
      message += ' Please go to Settings > Privacy > Camera and enable access for this app.';
    } else if (this.platform.is('android')) {
      message += ' Please go to Settings > Apps > This App > Permissions and enable Camera.';
    }
    
    const alert = await this.alertController.create({
      header: 'Camera Permission Required',
      message: message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: () => {
            // We can't open settings directly from the app on iOS
            // The user will need to manually open settings
          }
        }
      ]
    });
    await alert.present();
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (!this.isRecording) {
      this.hasRecorded = true;
      // Here you would stop recording and save the video
    } else {
      // Start recording
      this.startRecording();
    }
  }
  
  // Start video recording
  async startRecording() {
    // Real recording functionality would be implemented here
    console.log('Recording started');
    // In a real app, you would use MediaRecorder API or a Capacitor plugin for recording
  }

  setMode(mode: 'video' | 'template' | undefined) {
    if (mode === 'video' || mode === 'template') {
      this.selectedMode = mode;
      this.showRecent = true;
      
      // When showing recent items, stop the camera to save resources
      this.stopCamera();
    }
  }

  handleSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'video' || value === 'template') {
      this.setMode(value);
    }
  }

  showCamera() {
    // Set showRecent to false to display the camera preview
    this.showRecent = false;
    
    // Make sure we're in Recording mode
    this.selectedMode = 'video'; // Reset to video mode for proper behavior
    
    // Start the camera
    this.startCamera();
    
    // Force update the UI if needed
    setTimeout(() => {
      // Focus the recording area to show controls clearly
      const recordButton = this.elementRef.nativeElement.querySelector('.record-button');
      if (recordButton) {
        recordButton.focus();
      }
    }, 100);
  }

  selectTemplateVideo(imageUrl: string) {
    this.selectedTemplateImage = imageUrl;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position when selecting a new template
    this.showRecent = false;
    
    // Start camera when returning to recording mode with template
    this.startCamera();
  }

  async close() {
    // Always clean up camera resources when closing
    this.stopCamera();
    
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

  switchCamera() {
    this.currentCamera = this.currentCamera === 'front' ? 'back' : 'front';
    console.log('Switched camera to:', this.currentCamera);
    
    // Restart the camera with new facing mode
    this.stopCamera();
    this.startCamera();
  }

  goToNext() {
    // Clean up camera when leaving
    this.stopCamera();
    
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
    let newLeft = clientX - this.dragStartX;
    let newTop = clientY - this.dragStartY;

    // Ensure the image stays within the camera-preview boundaries
    const imageWidth = 100; // Width of the template image (from CSS)
    const imageHeight = 100; // Height of the template image (from CSS)
    newLeft = Math.max(0, Math.min(newLeft, rect.width - imageWidth));
    newTop = Math.max(0, Math.min(newTop, rect.height - imageHeight));

    this.templateImagePosition = { 
      top: newTop,
      left: newLeft
    };
  }

  stopDrag() {
    this.isDragging = false;

    // Remove event listeners
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('touchmove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
    document.removeEventListener('touchend', this.stopDrag.bind(this));
  }

  // Detect iOS Safari browser
  private isIOSSafari(): boolean {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && 
           !/MSStream/.test(userAgent) && 
           /Safari/.test(userAgent) && 
           !/Chrome/.test(userAgent) &&
           !/CriOS/.test(userAgent);
  }

  // Show alert specific to iOS Safari limitations
  async showIOSSafariAlert() {
    const alert = await this.alertController.create({
      header: 'Browser Limitation',
      message: 'Camera access is not fully supported in iOS Safari. For the best experience, please install the app or use the desktop version.',
      buttons: ['OK']
    });
    await alert.present();
    
    // Provide a placeholder or sample video display
    this.setupPlaceholderVideo();
  }
  
  // Setup a placeholder video for iOS Safari
  private setupPlaceholderVideo() {
    if (this.videoPreview && this.videoPreview.nativeElement) {
      // Display a static image or show a message in the video element
      const videoElement = this.videoPreview.nativeElement;
      videoElement.style.background = '#000';
      
      // Create an overlay with camera info
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.color = 'white';
      overlay.style.textAlign = 'center';
      overlay.style.padding = '20px';
      
      const icon = document.createElement('ion-icon');
      icon.setAttribute('name', 'camera-outline');
      icon.style.fontSize = '64px';
      icon.style.marginBottom = '16px';
      
      const text = document.createElement('div');
      text.textContent = 'Camera preview not available in iOS Safari';
      
      overlay.appendChild(icon);
      overlay.appendChild(text);
      
      // Add the overlay to the parent of the video element
      const parent = videoElement.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.appendChild(overlay);
      }
    }
  }
}