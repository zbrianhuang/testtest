import { Component, OnInit, ElementRef } from '@angular/core';
import { NavController, AlertController, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetronomeComponent } from '../components/metronome/metronome.component';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Platform } from '@ionic/angular';
import { FilePicker } from '@capawesome/capacitor-file-picker';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MetronomeComponent]
})
export class Tab2Page implements OnInit {
  isRecording: boolean = false;
  selectedMode: 'video' | 'template' = 'video';
  showRecent: boolean = false;
  hasRecorded: boolean = false;
  selectedTemplateImage: string | null = null;
  currentCamera: 'front' | 'back' = 'front';

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
    private platform: Platform
  ) {}

  async ngOnInit() {
    // Initialize storage
    await this.storage.create();
    // No need to load saved position since we don't want to persist it in Tab2
  }

  ionViewWillEnter() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position on page enter
  }

  ionViewWillLeave() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
    this.selectedTemplateImage = null;
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (!this.isRecording) {
      this.hasRecorded = true;
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
  }

  selectTemplateVideo(imageUrl: string) {
    this.selectedTemplateImage = imageUrl;
    this.templateImagePosition = { top: 10, left: 10 }; // Reset position when selecting a new template
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

    // Convert to percentages
    const leftPercent = (newLeft / rect.width) * 100;
    const topPercent = (newTop / rect.height) * 100;

    this.templateImagePosition = { 
      top: topPercent,
      left: leftPercent
    };
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

  switchCamera() {
    this.currentCamera = this.currentCamera === 'front' ? 'back' : 'front';
  }

  async showUploadOptions() {
    const alert = await this.alertController.create({
      header: 'Upload Video',
      message: 'Choose how to upload your video',
      buttons: [
        {
          text: 'Record New',
          handler: () => {
            this.showCamera();
          }
        },
        {
          text: 'Upload Existing',
          handler: () => {
            this.pickVideo();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  async pickVideo() {
    try {
      const result = await FilePicker.pickFiles({
        readData: true
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        if (file.data && file.mimeType?.startsWith('video/')) {
          // Navigate to video editor with the selected file
          this.navCtrl.navigateForward('/tabs/video-editor', {
            state: {
              videoFile: new File([file.data], file.name, { type: file.mimeType })
            }
          });
        } else {
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Please select a video file.',
            buttons: ['OK']
          });
          await alert.present();
        }
      }
    } catch (error) {
      console.error('Error picking video:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to pick video. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}