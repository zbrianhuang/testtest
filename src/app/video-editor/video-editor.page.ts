import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { NavController, AlertController, RangeCustomEvent, IonModal } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.page.html',
  styleUrls: ['./video-editor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class VideoEditorPage implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;

  @ViewChild('stitchingModal') stitchingModal!: IonModal;

  videoSrc = 'assets/videos/annie_wave_to_earth.mp4';
  isPlaying = false;
  isMuted = false;
  duration = 0;
  currentTime = 0;

  // Properties for timeline trimming
  trimStart = 0;
  trimEnd = 0;
  private isDragging: boolean = false;
  private dragType: 'start' | 'end' | 'scrub' | null = null;
  private timelineWidth: number = 0;
  private timelineLeft: number = 0;
  thumbnails: string[] = [];
  thumbnailsLoaded = false;

  // Properties for the template picture
  selectedTemplateImage: string | null = null;
  templateImagePosition: { top: number; left: number } = { top: 10, left: 10 };
  private initialTemplatePosition: { top: number; left: number } | null = null;

  // Crop rectangle properties
  cropRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  isResizing = false;
  resizeHandle: string | null = null;
  startX = 0;
  startY = 0;
  videoWrapperRect: DOMRect | null = null;

  // Add rotation property
  currentRotation: number = 0;

  // Volume control properties
  volumeLevel: number = 100;
  isVolumeSliderVisible: boolean = false;
  previousVolume: number = 100;
  private startVolume = 0;

  isStitchingModalOpen = false;
  selectedVideos: { file: File; preview: string }[] = [];
  isStitching = false;

  // Template dragging functionality
  private isDraggingTemplate = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private videoService: VideoService
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(async () => {
      const navigation = this.navCtrl['router'].getCurrentNavigation();
      if (navigation?.extras?.state) {
        this.selectedTemplateImage = navigation.extras.state['selectedTemplateImage'] || null;
        this.initialTemplatePosition = navigation.extras.state['templateImagePosition'] || { top: 10, left: 10 };
        
        // Wait for the view to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        this.updateTemplatePosition();
      }
    });
  }

  private updateTemplatePosition() {
    if (this.selectedTemplateImage && this.initialTemplatePosition) {
      const videoWrapper = this.elementRef.nativeElement.querySelector('.video-wrapper');
      if (videoWrapper) {
        // Use the percentages directly since they're already in percentage format
        this.templateImagePosition = {
          top: this.initialTemplatePosition.top,
          left: this.initialTemplatePosition.left
        };
      }
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateTemplatePosition();
  }

  async ngAfterViewInit() {
    const vid = this.videoPlayer.nativeElement;
    vid.load();

    // Initialize volume
    vid.volume = this.volumeLevel / 100;

    await new Promise<void>((resolve) => {
      const onMetadataLoaded = () => {
        vid.removeEventListener('loadedmetadata', onMetadataLoaded);
        resolve();
      };
      vid.addEventListener('loadedmetadata', onMetadataLoaded);
    });

    this.duration = vid.duration;
    this.trimEnd = this.duration;
    await this.generateThumbnails();

    vid.ontimeupdate = () => {
      this.currentTime = vid.currentTime;
      if (this.isPlaying) {
        if (this.currentTime < this.trimStart) {
          vid.currentTime = this.trimStart;
          this.currentTime = this.trimStart;
        } else if (this.currentTime >= this.trimEnd) {
          vid.currentTime = this.trimStart;
          this.currentTime = this.trimStart;
          vid.play();
        }
      }
      this.cdr.detectChanges();
    };

    // Initialize the video wrapper rect and crop rectangle
    const videoWrapper = this.elementRef.nativeElement.querySelector('.video-wrapper');
    if (videoWrapper) {
      this.videoWrapperRect = videoWrapper.getBoundingClientRect();
      if (this.videoWrapperRect) {
        // Initialize crop rectangle to 80% of video size
        const width = this.videoWrapperRect.width * 0.8;
        const height = this.videoWrapperRect.height * 0.8;
        const x = (this.videoWrapperRect.width - width) / 2;
        const y = (this.videoWrapperRect.height - height) / 2;
        this.cropRect = { x, y, width, height };
      }
    }

    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      this.timelineWidth = rect.width;
      this.timelineLeft = rect.left;
    }
  }

  async generateThumbnails() {
    const vid = this.videoPlayer.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas 2D context');
      return;
    }

    // Get the timeline width to determine optimal thumbnail count
    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    const timelineWidth = timeline ? timeline.offsetWidth : 400;
    const thumbnailCount = Math.max(12, Math.floor(timelineWidth / 60)); // At least 12 thumbnails, or one per 60px
    const interval = this.duration / thumbnailCount;

    // Set thumbnail size based on timeline height
    const thumbnailHeight = timeline ? timeline.offsetHeight : 60;
    const thumbnailWidth = Math.ceil(thumbnailHeight * (16/9)); // Maintain 16:9 aspect ratio

    canvas.width = thumbnailWidth;
    canvas.height = thumbnailHeight;

    this.thumbnails = [];
    for (let i = 0; i < thumbnailCount; i++) {
      const time = i * interval;
      vid.currentTime = time;

      try {
        await new Promise<void>((resolve, reject) => {
          const onSeeked = () => {
            vid.removeEventListener('seeked', onSeeked);
            vid.removeEventListener('error', onError);
            resolve();
          };
          const onError = (err: Event) => {
            vid.removeEventListener('seeked', onSeeked);
            vid.removeEventListener('error', onError);
            reject(err);
          };
          vid.addEventListener('seeked', onSeeked);
          vid.addEventListener('error', onError);
        });

        ctx.drawImage(vid, 0, 0, thumbnailWidth, thumbnailHeight);
        const thumbnailUrl = canvas.toDataURL('image/png');
        this.thumbnails.push(thumbnailUrl);
      } catch (err) {
        console.error(`Failed to generate thumbnail at time ${time}:`, err);
        this.thumbnails.push('');
      }
    }

    this.thumbnailsLoaded = true;
    this.cdr.detectChanges();
  }

  togglePlay() {
    const vid = this.videoPlayer.nativeElement;
    if (!this.isPlaying) {
      if (vid.currentTime < this.trimStart || vid.currentTime >= this.trimEnd) {
        vid.currentTime = this.trimStart;
      }
      vid.play();
    } else {
      vid.pause();
    }
    this.isPlaying = !this.isPlaying;
  }

  toggleSpeed() { alert('Speed control (stub)'); }
  rotateClip() {
    this.currentRotation = (this.currentRotation + 90) % 360;
    const video = this.videoPlayer.nativeElement;
    const wrapper = this.elementRef.nativeElement.querySelector('.video-wrapper');
    
    if (video && wrapper) {
      video.style.transform = `rotate(${this.currentRotation}deg)`;
      
      // Adjust video size based on rotation
      if (this.currentRotation % 180 === 90) {
        // For 90 and 270 degrees, swap width and height to maintain aspect ratio
        const wrapperWidth = wrapper.offsetWidth;
        const wrapperHeight = wrapper.offsetHeight;
        const scale = Math.min(wrapperHeight / video.videoWidth, wrapperWidth / video.videoHeight);
        
        video.style.width = video.videoHeight * scale + 'px';
        video.style.height = video.videoWidth * scale + 'px';
      } else {
        // For 0 and 180 degrees, reset to normal dimensions
        video.style.width = '100%';
        video.style.height = '100%';
      }
    }
  }
  toggleMute() {
    if (this.volumeLevel > 0) {
      this.previousVolume = this.volumeLevel;
      this.volumeLevel = 0;
    } else {
      this.volumeLevel = this.previousVolume || 100;
    }
    this.videoPlayer.nativeElement.volume = this.volumeLevel / 100;
    this.isVolumeSliderVisible = !this.isVolumeSliderVisible;
    this.cdr.detectChanges();
  }

  onVolumeChange(event: RangeCustomEvent) {
    const volume = Math.round(event.detail.value as number);
    this.volumeLevel = volume;
    this.videoPlayer.nativeElement.volume = volume / 100;
    this.cdr.detectChanges();
  }

  exportVideo() {
    console.log('Exporting video with crop area:', this.cropRect);
    console.log('Trimming from', this.trimStart, 'to', this.trimEnd);
    this.navCtrl.navigateForward('/upload-info');
  }

  async closeEditor() {
    const alert = await this.alertController.create({
      header: 'Do you want to discard your progress?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes',
          handler: () => {
            this.navCtrl.navigateBack('/tabs/home_tab');
          }
        }
      ]
    });
    await alert.present();
  }

  startTrim(event: MouseEvent | TouchEvent, type: 'start' | 'end' | 'scrub') {
    event.preventDefault();
    event.stopPropagation(); // Prevent the event from bubbling up to the timeline

    console.log(`startTrim called with type: ${type}`); // Debug log

    this.isDragging = true;
    this.dragType = type;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startX = clientX;

    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      this.timelineWidth = rect.width;
      this.timelineLeft = rect.left;
    }

    const vid = this.videoPlayer.nativeElement;
    if (type === 'start') {
      vid.currentTime = this.trimStart;
    } else if (type === 'end') {
      vid.currentTime = this.trimEnd;
    } else if (type === 'scrub') {
      const x = clientX - this.timelineLeft;
      let newTime = (x / this.timelineWidth) * this.duration;
      newTime = Math.max(this.trimStart, Math.min(this.trimEnd, newTime));
      vid.currentTime = newTime;
    }

    if (event instanceof TouchEvent) {
      document.addEventListener('touchmove', this.onTrim.bind(this));
      document.addEventListener('touchend', this.stopTrim.bind(this));
    }
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    if (this.isResizing) {
      event.preventDefault();
      this.onResizeCrop(event);
    }
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onMouseUp() {
    this.isResizing = false;
    this.resizeHandle = null;
  }

  onTrim(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.dragType) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const x = clientX - this.timelineLeft;
    let newTime = (x / this.timelineWidth) * this.duration;

    const vid = this.videoPlayer.nativeElement;
    if (this.dragType === 'start') {
      newTime = Math.max(0, Math.min(newTime, this.trimEnd - 0.1));
      this.trimStart = newTime;
      vid.currentTime = this.trimStart;
    } else if (this.dragType === 'end') {
      newTime = Math.min(this.duration, Math.max(newTime, this.trimStart + 0.1));
      this.trimEnd = newTime;
      vid.currentTime = this.trimEnd;
    } else if (this.dragType === 'scrub') {
      newTime = Math.max(this.trimStart, Math.min(this.trimEnd, newTime));
      vid.currentTime = newTime;
    }
  }

  stopTrim() {
    this.isDragging = false;
    this.dragType = null;

    document.removeEventListener('touchmove', this.onTrim);
    document.removeEventListener('touchend', this.stopTrim);
  }

  startResize(event: MouseEvent | TouchEvent, handle: string) {
    event.preventDefault();
    this.isResizing = true;
    this.resizeHandle = handle;
    
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    
    this.startX = clientX;
    this.startY = clientY;
  }

  onResizeCrop(event: MouseEvent | TouchEvent) {
    if (!this.isResizing || !this.resizeHandle || !this.videoWrapperRect) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    let newX = this.cropRect.x;
    let newY = this.cropRect.y;
    let newWidth = this.cropRect.width;
    let newHeight = this.cropRect.height;

    if (this.resizeHandle.includes('left')) {
      const deltaX = clientX - this.startX;
      newX = Math.max(0, Math.min(this.cropRect.x + deltaX, this.cropRect.x + this.cropRect.width - 10));
      newWidth = this.cropRect.width + (this.cropRect.x - newX);
    }
    if (this.resizeHandle.includes('right')) {
      const deltaX = clientX - this.startX;
      newWidth = Math.max(10, Math.min(this.cropRect.width + deltaX, this.videoWrapperRect.width - this.cropRect.x));
    }
    if (this.resizeHandle.includes('top')) {
      const deltaY = clientY - this.startY;
      newY = Math.max(0, Math.min(this.cropRect.y + deltaY, this.cropRect.y + this.cropRect.height - 10));
      newHeight = this.cropRect.height + (this.cropRect.y - newY);
    }
    if (this.resizeHandle.includes('bottom')) {
      const deltaY = clientY - this.startY;
      newHeight = Math.max(10, Math.min(this.cropRect.height + deltaY, this.videoWrapperRect.height - this.cropRect.y));
    }

    this.cropRect = { x: newX, y: newY, width: newWidth, height: newHeight };
    this.startX = clientX;
    this.startY = clientY;
  }

  getVolumeIcon(): string {
    if (this.volumeLevel === 0) {
      return 'volume-mute-outline';
    } else if (this.volumeLevel < 33) {
      return 'volume-low-outline';
    } else if (this.volumeLevel < 67) {
      return 'volume-medium-outline';
    } else {
      return 'volume-high-outline';
    }
  }

  preventScroll(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  preventClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('range-knob')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('range-knob')) {
      this.isDragging = true;
      this.startY = event.touches[0].clientY;
      this.startVolume = this.volumeLevel;
      event.preventDefault();
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    const deltaY = this.startY - event.touches[0].clientY;
    const volumeChange = (deltaY / 110) * 100; // 110px is the height of our slider
    let newVolume = this.startVolume + volumeChange;
    
    // Clamp the volume between 0 and 100
    newVolume = Math.max(0, Math.min(100, newVolume));
    
    this.volumeLevel = Math.round(newVolume);
    this.videoPlayer.nativeElement.volume = this.volumeLevel / 100;
    this.cdr.detectChanges();
    
    event.preventDefault();
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  onTouchEnd() {
    this.isDragging = false;
  }

  async openVideoStitchingModal() {
    this.isStitchingModalOpen = true;
  }

  closeStitchingModal() {
    this.isStitchingModalOpen = false;
    this.selectedVideos = [];
    this.isStitching = false;
  }

  async addVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = false;

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        this.selectedVideos.push({ file, preview });
        this.cdr.detectChanges();
      }
    };

    input.click();
  }

  removeVideo(index: number) {
    URL.revokeObjectURL(this.selectedVideos[index].preview);
    this.selectedVideos.splice(index, 1);
  }

  async startStitching() {
    if (this.selectedVideos.length < 2) {
      return;
    }

    try {
      this.isStitching = true;
      const files = this.selectedVideos.map(v => v.file);
      const stitchedVideo = await this.videoService.stitchVideos(files);
      
      // Create a preview of the stitched video
      const videoUrl = URL.createObjectURL(stitchedVideo);
      
      // Clean up old previews
      this.selectedVideos.forEach(v => URL.revokeObjectURL(v.preview));
      this.selectedVideos = [];
      
      // Update the video player with the stitched video
      this.videoSrc = videoUrl;
      this.videoPlayer.nativeElement.load();
      
      // Close the modal
      this.closeStitchingModal();
      
      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Videos have been successfully combined!',
        buttons: ['OK']
      });
      await alert.present();
      
    } catch (error) {
      console.error('Error stitching videos:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to combine videos. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isStitching = false;
    }
  }

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDraggingTemplate = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    // Store the initial position
    this.dragStartX = clientX;
    this.dragStartY = clientY;

    // Add event listeners
    if (event instanceof MouseEvent) {
      document.addEventListener('mousemove', this.onDrag.bind(this));
      document.addEventListener('mouseup', this.stopDrag.bind(this));
    } else {
      document.addEventListener('touchmove', this.onDrag.bind(this));
      document.addEventListener('touchend', this.stopDrag.bind(this));
    }
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDraggingTemplate) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const videoWrapper = this.elementRef.nativeElement.querySelector('.video-wrapper');
    if (!videoWrapper) return;

    const rect = videoWrapper.getBoundingClientRect();
    
    // Calculate the change in position
    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    // Update the position in percentages
    let newLeft = (this.templateImagePosition.left + (deltaX / rect.width) * 100);
    let newTop = (this.templateImagePosition.top + (deltaY / rect.height) * 100);

    // Clamp the values between 0 and 100
    newLeft = Math.max(0, Math.min(100, newLeft));
    newTop = Math.max(0, Math.min(100, newTop));

    this.templateImagePosition = {
      left: newLeft,
      top: newTop
    };

    // Update the start position for the next move
    this.dragStartX = clientX;
    this.dragStartY = clientY;
  }

  stopDrag() {
    this.isDraggingTemplate = false;

    // Remove event listeners
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('touchmove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
    document.removeEventListener('touchend', this.stopDrag.bind(this));
  }
}