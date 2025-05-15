import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.page.html',
  styleUrls: ['./video-editor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VideoEditorPage implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;

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

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(() => {
      const navigation = this.navCtrl['router'].getCurrentNavigation();
      if (navigation?.extras?.state) {
        this.selectedTemplateImage = navigation.extras.state['selectedTemplateImage'] || null;
        this.templateImagePosition = navigation.extras.state['templateImagePosition'] || { top: 10, left: 10 };
      }
    });
  }

  async ngAfterViewInit() {
    const vid = this.videoPlayer.nativeElement;
    vid.load();

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

    const thumbnailCount = 8;
    const interval = this.duration / thumbnailCount;
    const thumbnailWidth = 50;
    const thumbnailHeight = 50;

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
  rotateClip() { alert('Rotate clip (stub)'); }
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.videoPlayer.nativeElement.muted = this.isMuted;
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
      this.onResize(event);
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

  onResize(event: MouseEvent | TouchEvent) {
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
}