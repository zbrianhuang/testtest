import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { NavController, AlertController, RangeCustomEvent, IonModal } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../services/video.service';
import { S3Service } from '../services/s3.service';
import { Subscription } from 'rxjs';
import { VideoMetadataService } from '../services/video-metadata.service';

interface VideoLayer {
  id: string;
  videoUrl?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  isSelected: boolean;
  zIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnails: string[];
  trimFrameStart: number;
  trimFrameWidth: number;
  isMovingUp: boolean;
  isMovingDown: boolean;
}

interface TrimRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.page.html',
  styleUrls: ['./video-editor.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class VideoEditorPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;

  @ViewChild('stitchingModal') stitchingModal!: IonModal;

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('timelineContainer') timelineContainer!: ElementRef;

  videoSrc = 'assets/videos/annie_wave_to_earth.mp4';
  isPlaying = false;
  isMuted = false;
  duration = 0;
  currentTime = 0;
  isExporting = false;

  // Properties for timeline trimming
  trimStart = 0;
  trimEnd = 0;
  private isDragging: boolean = false;
  private dragType: 'start' | 'end' | 'scrub' | null = null;
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
  public isResizing = false;
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
  isFromGallery = false;

  // Template dragging functionality
  private isDraggingTemplate = false;
  private dragStartX = 0;
  private dragStartY = 0;

  private subscriptions: Subscription[] = [];
  private navigationStateHandled = false;

  // Layer management properties
  layers: VideoLayer[] = [];
  selectedLayerId: string | null = null;
  public isDraggingLayer = false;
  private dragStartPos = { x: 0, y: 0 };
  private resizeStartPos = { x: 0, y: 0 };
  private resizeStartSize = { width: 0, height: 0 };

  // Timeline properties
  private _timelineWidth = 0;
  timelineScale = 1; // pixels per second
  timelineThumbnailWidth = 100; // width of each thumbnail in pixels
  timelineThumbnailHeight = 60; // height of each thumbnail in pixels
  private thumbnailInterval = 1; // generate thumbnail every X seconds

  showOpacityPanel = false;

  isTrimMode = false;
  trimRect: TrimRect = { x: 0, y: 0, width: 0, height: 0 };
  isResizingTrim = false;
  private activeTrimHandle: 'start' | 'end' | null = null;
  private activeLayerId: string | null = null;
  private initialTrimStart = 0;
  private initialTrimWidth = 0;

  // Properties for timeline expansion
  isTimelineExpanded = false;
  private longPressTimer: any;
  private readonly LONG_PRESS_DURATION = 500;
  private readonly TIMELINE_NORMAL_HEIGHT = 60;
  private readonly TIMELINE_EXPANDED_HEIGHT = 200;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private videoService: VideoService,
    private s3Service: S3Service,
    private router: Router,
    private metadataService: VideoMetadataService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.selectedTemplateImage = navigation.extras.state['selectedTemplateImage'];
      this.initialTemplatePosition = navigation.extras.state['templateImagePosition'];
    }
  }

  async ngOnInit() {
    // Wait for the view to be initialized
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check for navigation state data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      this.selectedTemplateImage = state['selectedTemplateImage'] || null;
      this.initialTemplatePosition = state['templateImagePosition'] || { top: 10, left: 10 };
      
      // Check if we have a videoFile from file picker
      const videoFile = state['videoFile'];
      const videoFileInfo = state['videoFileInfo'];
      
      if (videoFile) {
        console.log('Received video file in editor:', videoFile.name);
        
        // Create a video URL from the file
        const videoUrl = URL.createObjectURL(videoFile);
        this.videoSrc = videoUrl;
        
        // Set flag to indicate this is from gallery/file picker
        this.isFromGallery = state['isFromGallery'] || false;
        
        // We'll initialize layers after the view is initialized
        this.navigationStateHandled = true;
      } else if (videoFileInfo) {
        // Handle case where we only have metadata but no file content
        console.log('Received video file info:', videoFileInfo.name);
        
        if (videoFileInfo.path) {
          // Try to load the video from path
          this.videoSrc = videoFileInfo.path;
        } else {
          // Fall back to the default video
          console.log('No usable path, using default video');
          this.videoSrc = 'assets/videos/playingGod1.mp4';
        }
        
        // Set flag to indicate this is from gallery/file picker
        this.isFromGallery = state['isFromGallery'] || false;
        
        // We'll initialize layers after the view is initialized
        this.navigationStateHandled = true;
      } else {
        // Initialize with default video layers
        await this.initializeVideoLayers();
      }
    } else {
      // Initialize with default video layers
      await this.initializeVideoLayers();
    }
  }

  private async initializeVideoLayers() {
    try {
      console.log('Starting video layer initialization...');
      
      // Ensure canvasContainer is available
      if (!this.canvasContainer?.nativeElement) {
        console.error('Canvas container not available');
        return;
      }
      
      // Calculate canvas container dimensions
      const container = this.canvasContainer.nativeElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
      
      // Calculate video dimensions (50% of container width, maintaining aspect ratio)
      const videoWidth = Math.min(containerWidth * 0.5, 400); // Max width of 400px
      const videoHeight = (videoWidth * 9) / 16; // Assuming 16:9 aspect ratio
      
      // Check if we're in a cross-origin isolated context
      const isCrossOriginIsolated = this.videoService.checkIfCrossOriginIsolated();
      console.log('Cross-origin isolated context:', isCrossOriginIsolated);
      
      if (!isCrossOriginIsolated) {
        console.warn('Not running in a cross-origin isolated context. FFMPEG operations may fail.');
        await this.showError('This application requires a secure context with cross-origin isolation. Some features may not work correctly.');
      }
      
      // Create single layer with playingGod1.mp4
      const videoPath = 'assets/videos/playingGod1.mp4';
      console.log('Loading video from path:', videoPath);
      
      const layer1: VideoLayer = {
        id: `layer-${Date.now()}`,
        videoUrl: videoPath,
        position: { 
          x: (containerWidth - videoWidth) / 2, // Center horizontally
          y: (containerHeight - videoHeight) / 2 // Center vertically
        },
        size: { width: videoWidth, height: videoHeight },
        opacity: 1,
        zIndex: 0,
        isSelected: true,
        startTime: 0,
        endTime: 0,
        thumbnails: [],
        duration: 0,
        trimFrameStart: 0,
        trimFrameWidth: 0,
        isMovingUp: false,
        isMovingDown: false
      };

      console.log('Created video layer:', layer1);

      // Add the layer
      this.layers = [layer1];
      this.selectedLayerId = layer1.id;

      // Load video and set its duration
      try {
        await this.loadVideoForLayer(layer1);
      } catch (error) {
        console.error('Failed to load video for layer:', error);
        await this.showError('Failed to load video. This may be due to CORS restrictions or a missing file.');
      }
    } catch (error) {
      console.error('Error initializing video layers:', error);
      await this.showError('Error initializing the video editor. Please try again.');
    }
  }

  /**
   * Helper method to load a video for a layer
   */
  private async loadVideoForLayer(layer: VideoLayer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!layer.videoUrl) {
        console.error('Video URL is undefined');
        reject(new Error('Video URL is undefined'));
        return;
      }
      
      // Create a video element to test the video
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // Set up event listeners
      const onLoadedMetadata = () => {
        console.log(`Video loaded: Duration = ${video.duration}s`);
        layer.duration = video.duration;
        layer.endTime = video.duration;
        
        // Calculate timeline trim frame width based on duration
        this.updateTimelineTrimFrame(layer);
        
        // Clean up
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        
        resolve();
      };
      
      const onError = (e: Event) => {
        console.error('Error loading video:', e);
        // Clean up
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        
        reject(new Error('Failed to load video'));
      };
      
      // Add event listeners
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
      
      // Set the source and start loading
      video.src = layer.videoUrl;
      video.load();
      
      // Set a timeout just in case
      setTimeout(() => {
        if (!layer.duration) {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(new Error('Video load timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Update timeline trim frame based on video duration
   */
  private updateTimelineTrimFrame(layer: VideoLayer): void {
    if (!layer.duration) return;
    
    const trackElement = this.elementRef.nativeElement.querySelector(`.timeline-track[data-layer-id="${layer.id}"] .track-content`);
    if (!trackElement) return;
    
    const trackWidth = trackElement.offsetWidth;
    layer.trimFrameWidth = trackWidth;
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
    // Ensure videos are loaded and ready
    const vid = this.videoPlayer.nativeElement;
    vid.load();

    // Initialize volume
    vid.volume = this.volumeLevel / 100;

    // Wait for both videos to be ready
    await Promise.all(this.layers.map(layer => {
      return new Promise<void>((resolve) => {
        const video = document.createElement('video');
        if (layer.videoUrl) {
          video.src = layer.videoUrl;
          video.onloadeddata = () => {
            console.log(`Video ${layer.id} loaded successfully`);
            resolve();
          };
          video.onerror = (error) => {
            console.error(`Error loading video ${layer.id}:`, error);
            resolve(); // Resolve anyway to not block the initialization
          };
        } else {
          resolve();
        }
      });
    }));

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
        this.cropRect = {
          x: 0,
          y: 0,
          width: this.videoWrapperRect.width,
          height: this.videoWrapperRect.height
        };
      }
    }

    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      this.timelineWidth = rect.width;
      this.timelineLeft = rect.left;
    }

    // Force a change detection to ensure everything is rendered
    this.cdr.detectChanges();
  }

  async generateThumbnails() {
    try {
      const vid = this.videoPlayer.nativeElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      const timeline = this.elementRef.nativeElement.querySelector('.timeline');
      if (!timeline) {
        throw new Error('Timeline element not found');
      }

      const timelineWidth = timeline.offsetWidth;
      const thumbnailCount = Math.max(12, Math.floor(timelineWidth / 60));
      const interval = this.duration / thumbnailCount;
      const thumbnailHeight = timeline.offsetHeight;
      const thumbnailWidth = Math.ceil(thumbnailHeight * (16/9));

      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;

      this.thumbnails = [];
      for (let i = 0; i < thumbnailCount; i++) {
        try {
          const time = i * interval;
          vid.currentTime = time;

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
          console.error(`Failed to generate thumbnail at time ${i * interval}:`, err);
          this.thumbnails.push(''); // Placeholder for failed thumbnail
        }
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      await this.showError('Failed to generate video thumbnails');
    } finally {
      this.thumbnailsLoaded = true;
      this.cdr.detectChanges();
    }
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    console.log('Toggle play:', this.isPlaying);
    
    this.layers.forEach(layer => {
      const video = this.elementRef.nativeElement.querySelector(`#video-${layer.id}`) as HTMLVideoElement;
      if (video) {
        if (this.isPlaying) {
          video.currentTime = layer.startTime;
          video.play().catch(error => {
            console.error('Error playing video:', error);
          });
        } else {
          video.pause();
        }
      }
    });
  }

  // Add new method to handle video seeking
  seekToTime(time: number) {
    this.layers.forEach(layer => {
      const video = this.elementRef.nativeElement.querySelector(`#video-${layer.id}`) as HTMLVideoElement;
      if (video) {
        // Only seek if the time is within the layer's start and end time
        if (time >= layer.startTime && time <= layer.endTime) {
          video.currentTime = time;
        }
      }
    });
  }

  // Update the onTimeUpdate method to handle synchronized playback
  onTimeUpdate(event: Event, layer: VideoLayer) {
    const video = event.target as HTMLVideoElement;
    
    // If the video reaches its end time, loop back to start time
    if (video.currentTime >= layer.endTime) {
      video.currentTime = layer.startTime;
      if (this.isPlaying) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing video:', error);
          });
        }
      }
    }
    
    // Update the playhead position
    this.cdr.detectChanges();
  }

  // Update method to handle video start time
  setVideoStartTime(layerId: string, value: string | number | null | undefined) {
    if (value === null || value === undefined) return;
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return;

    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.startTime = Math.max(0, Math.min(numericValue, layer.duration - 0.1));
      
      // Update video position if it's currently playing
      const video = this.elementRef.nativeElement.querySelector(`#video-${layerId}`) as HTMLVideoElement;
      if (video) {
        video.currentTime = layer.startTime;
      }
    }
  }

  // Update method to handle video end time
  setVideoEndTime(layerId: string, value: string | number | null | undefined) {
    if (value === null || value === undefined) return;
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return;

    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.endTime = Math.min(layer.duration, Math.max(numericValue, layer.startTime + 0.1));
    }
  }

  // Add method to get current playback time
  getCurrentPlaybackTime(): number {
    // Return the time of the first playing video
    const firstPlayingVideo = this.layers.find(layer => {
      const video = this.elementRef.nativeElement.querySelector(`#video-${layer.id}`) as HTMLVideoElement;
      return video && !video.paused;
    });

    if (firstPlayingVideo) {
      const video = this.elementRef.nativeElement.querySelector(`#video-${firstPlayingVideo.id}`) as HTMLVideoElement;
      return video ? video.currentTime : 0;
    }
    return 0;
  }

  // Add method to sync all videos to a specific time
  syncVideosToTime(time: number) {
    this.layers.forEach(layer => {
      const video = this.elementRef.nativeElement.querySelector(`#video-${layer.id}`) as HTMLVideoElement;
      if (video) {
        // Only sync if the time is within the layer's start and end time
        if (time >= layer.startTime && time <= layer.endTime) {
          video.currentTime = time;
        }
      }
    });
  }

  toggleSpeed() {
    const speeds = [0.5, 1, 1.5, 2];
    const currentSpeed = this.videoPlayer.nativeElement.playbackRate;
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.videoPlayer.nativeElement.playbackRate = speeds[nextIndex];
  }

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
    this.isMuted = !this.isMuted;
    this.videoPlayer.nativeElement.muted = this.isMuted;
    this.isVolumeSliderVisible = !this.isVolumeSliderVisible;
    this.cdr.detectChanges();
  }

  onVolumeChange(event: RangeCustomEvent) {
    const volume = Math.round(event.detail.value as number);
    this.volumeLevel = volume;
    this.videoPlayer.nativeElement.volume = volume / 100;
    this.cdr.detectChanges();
  }

  async exportVideo() {
    if (this.isExporting) {
      return;
    }

    let processingAlert: HTMLIonAlertElement | null = null;
    
    try {
      this.isExporting = true;
      
      // Show loading indicator
      processingAlert = await this.alertController.create({
        header: 'Processing Video',
        message: 'Please wait while we process your video...',
        backdropDismiss: false
      });
      await processingAlert.present();
      
      // Get video element to export
      const videoElement = this.videoPlayer ? this.videoPlayer.nativeElement : 
        this.elementRef.nativeElement.querySelector('video');
      
      if (!videoElement) {
        throw new Error('No video element found to export');
      }
      
      // Create a timestamp for the exported files
      const timestamp = Date.now();
      
      // Get the original file name from the video source or create a unique name
      let fileName = this.videoSrc.split('/').pop() || `edited-video-${timestamp}.mp4`;
      // Ensure it has an mp4 extension
      if (!fileName.toLowerCase().endsWith('.mp4')) {
        fileName = `${fileName.split('.')[0] || 'edited-video'}.mp4`;
      }
      
      // Check if we have the original video file from navigation state
      let videoFile: File | null = null;
      
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state && navigation.extras.state['videoFile']) {
        // Use the original file that was passed to the editor
        const originalFile = navigation.extras.state['videoFile'] as File;
        videoFile = new File([originalFile], fileName, { type: 'video/mp4' });
        console.log('Using original video file:', videoFile.name, 'size:', videoFile.size);
      } else {
        // If no file was passed, we'll just create a placeholder file
        // This is a limitation when the source is an asset or URL
        console.log('No original file available, creating placeholder');
        videoFile = new File([new Blob([])], fileName, { type: 'video/mp4' });
      }
      
      console.log('Creating thumbnail...');
      // Create a temporary thumbnail from the current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }
      
      // Ensure we're at the frame we want to capture
      videoElement.currentTime = this.trimStart;
      
      // Wait for video to seek to desired time
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });
      
      // Draw the current frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get thumbnail blob
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(new Blob([])); // Empty fallback
        }, 'image/jpeg', 0.8);
      });
      console.log('Thumbnail created successfully, size:', thumbnailBlob.size);
      
      const thumbnailFile = new File([thumbnailBlob], fileName.replace('.mp4', '.jpg'), { type: 'image/jpeg' });

      // Dismiss the processing alert before navigation
      if (processingAlert) {
        await processingAlert.dismiss();
        processingAlert = null;
      }
      
      // Create an object with trim info to pass to the upload page
      const videoMetadata = {
        trimStart: this.trimStart,
        trimEnd: this.trimEnd,
        duration: videoElement.duration
      };
      
      // Navigate to upload info page with both files
      this.navCtrl.navigateForward('/upload-info', {
        state: {
          videoFile,
          thumbnailFile,
          videoMetadata
        }
      });
    } catch (error) {
      console.error('Error exporting video:', error);
      
      // Make sure to dismiss the processing alert if it exists
      if (processingAlert) {
        await processingAlert.dismiss();
        processingAlert = null;
      }
      
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to export video: ' + (error instanceof Error ? error.message : 'Unknown error'),
        buttons: ['OK']
      });
      await errorAlert.present();
    } finally {
      this.isExporting = false;
    }
  }

  private async getVideoBlob(videoElement: HTMLVideoElement): Promise<Blob> {
    try {
      console.log('Starting video capture with MediaRecorder...');
      
      // First check if captureStream is available
      if (!(videoElement as any).captureStream && !(videoElement as any).mozCaptureStream) {
        throw new Error('Video capture not supported in this browser or context');
      }
      
      // Get the stream from the video element
      const stream = (videoElement as any).captureStream 
        ? (videoElement as any).captureStream() 
        : (videoElement as any).mozCaptureStream();
      
      // Check if MediaRecorder is available with the needed codecs
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        console.warn('VP9 codec not supported, trying VP8');
        if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          console.warn('VP8 codec not supported, trying default codec');
        }
      }
      
      // Choose the best codec option available
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';
          
      console.log('Using MIME type:', mimeType);
      
      // Create the media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      const chunks: Blob[] = [];
      
      return new Promise((resolve, reject) => {
        // Listen for data available event
        mediaRecorder.ondataavailable = (e) => {
          console.log('Data available from MediaRecorder, chunk size:', e.data.size);
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        // When recording completes
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped, creating blob from chunks...');
          if (chunks.length === 0) {
            reject(new Error('No video data was captured'));
            return;
          }
          
          const blob = new Blob(chunks, { type: mimeType });
          console.log('Created video blob, size:', blob.size);
          resolve(blob);
        };

        // Handle errors
        mediaRecorder.onerror = (error) => {
          console.error('MediaRecorder error:', error);
          reject(error);
        };

        // Start recording with 100ms timeslice to get more frequent ondataavailable events
        mediaRecorder.start(100);
        console.log('MediaRecorder started');
        
        // Set currentTime to trimStart
        videoElement.currentTime = this.trimStart;
        
        // Play the video once it's ready at the trim start point
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          
          // Play the video
          videoElement.play().then(() => {
            console.log('Video playback started from time:', videoElement.currentTime);
            
            // Check time periodically to stop at trim end
            const checkTime = () => {
              if (videoElement.currentTime >= this.trimEnd) {
                console.log('Reached trim end time:', videoElement.currentTime);
                videoElement.pause();
                
                // Wait a moment to ensure the last frame is captured
                setTimeout(() => {
                  console.log('Stopping MediaRecorder...');
                  mediaRecorder.stop();
                }, 100);
              } else if (mediaRecorder.state === 'recording') {
                requestAnimationFrame(checkTime);
              }
            };
            
            checkTime();
          }).catch(err => {
            console.error('Error playing video:', err);
            mediaRecorder.stop();
            reject(new Error('Could not play video: ' + err.message));
          });
        };
        
        videoElement.addEventListener('seeked', onSeeked);
      });
    } catch (error) {
      console.error('Error in video capture:', error);
      throw new Error('Failed to capture video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
    if (this.isMuted || this.volumeLevel === 0) {
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

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clean up video resources
    if (this.videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.videoSrc);
    }
    
    // Clean up thumbnail resources
    this.thumbnails.forEach(thumbnail => {
      if (thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnail);
      }
    });
    
    // Clean up stitching previews
    this.selectedVideos.forEach(video => {
      if (video.preview.startsWith('blob:')) {
        URL.revokeObjectURL(video.preview);
      }
    });
  }

  addNewLayer() {
    const newLayer: VideoLayer = {
      id: `layer-${Date.now()}`,
      videoUrl: '', // This will be set when user selects a video
      position: { x: 0, y: 0 },
      size: { width: 300, height: 169 }, // Default size matching our initialization
      opacity: 1,
      zIndex: this.layers.length,
      isSelected: true,
      startTime: 0,
      endTime: 0,
      thumbnails: [],
      duration: 0,
      trimFrameStart: 0,
      trimFrameWidth: 0,
      isMovingUp: false,
      isMovingDown: false
    };

    // Add the new layer
    this.layers.push(newLayer);
    this.selectedLayerId = newLayer.id;
    this.cdr.detectChanges();
  }

  triggerFileUpload(layerId: string) {
    const fileInput = document.getElementById(`file-input-${layerId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onVideoFileSelected(event: Event, layerId: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      // Clean up old video URL if it exists
      if (layer.videoUrl && layer.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(layer.videoUrl);
      }

      // Create new video URL
      layer.videoUrl = URL.createObjectURL(file);
      
      // Position the layer if it's new
      if (layer.position.x === 0 && layer.position.y === 0) {
        const lastLayer = this.layers[this.layers.length - 2];
        if (lastLayer) {
          layer.position = {
            x: lastLayer.position.x + lastLayer.size.width + 20,
            y: lastLayer.position.y
          };
        } else {
          // If this is the first layer, center it
          const container = this.canvasContainer.nativeElement;
          layer.position = {
            x: (container.offsetWidth - layer.size.width) / 2,
            y: (container.offsetHeight - layer.size.height) / 2
          };
        }
      }
      
      // Generate thumbnails
      this.generateThumbnailsForLayer(layer).then(() => {
        // Reset the input value to allow selecting the same file again
        input.value = '';
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error processing video:', error);
      // Show error to user
      this.alertController.create({
        header: 'Error',
        message: 'Failed to process video. Please try again.',
        buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  selectLayer(layerId: string) {
    console.log('Selecting layer:', layerId);
    this.layers.forEach(layer => {
      layer.isSelected = layer.id === layerId;
    });
    this.selectedLayerId = layerId;
    this.cdr.detectChanges();
  }

  startDragLayer(event: MouseEvent | TouchEvent, layerId: string) {
    console.log('startDragLayer called for layer', layerId);
    event.preventDefault();
    event.stopPropagation();
    
    this.isDraggingLayer = true;
    this.selectLayer(layerId);
    
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      this.dragStartPos = {
        x: clientX - layer.position.x,
        y: clientY - layer.position.y
      };
    }

    // Add event listeners
    if (event instanceof MouseEvent) {
      document.addEventListener('mousemove', this.onDragLayer.bind(this));
      document.addEventListener('mouseup', this.stopDragLayer.bind(this));
    } else {
      document.addEventListener('touchmove', this.onDragLayer.bind(this));
      document.addEventListener('touchend', this.stopDragLayer.bind(this));
    }
  }

  onDragLayer(event: MouseEvent | TouchEvent) {
    if (!this.isDraggingLayer || !this.selectedLayerId) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const layer = this.layers.find(l => l.id === this.selectedLayerId);
    if (layer) {
      const container = this.canvasContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate new position
      let newX = clientX - this.dragStartPos.x;
      let newY = clientY - this.dragStartPos.y;
      
      // Keep the layer within container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - layer.size.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - layer.size.height));
      
      layer.position = {
        x: newX,
        y: newY
      };
      
      // Force change detection
      this.cdr.detectChanges();
    }
  }

  stopDragLayer() {
    this.isDraggingLayer = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.onDragLayer.bind(this));
    document.removeEventListener('touchmove', this.onDragLayer.bind(this));
    document.removeEventListener('mouseup', this.stopDragLayer.bind(this));
    document.removeEventListener('touchend', this.stopDragLayer.bind(this));
  }

  startResizeLayer(event: MouseEvent | TouchEvent, layerId: string) {
    console.log('startResizeLayer called for layer', layerId);
    event.preventDefault();
    this.isResizing = true;
    this.selectLayer(layerId);
    
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      this.resizeStartPos = { x: clientX, y: clientY };
      this.resizeStartSize = { ...layer.size };
    }

    // Add event listeners
    if (event instanceof MouseEvent) {
      document.addEventListener('mousemove', this.onResizeLayer.bind(this));
      document.addEventListener('mouseup', this.stopResizeLayer.bind(this));
    } else {
      document.addEventListener('touchmove', this.onResizeLayer.bind(this));
      document.addEventListener('touchend', this.stopResizeLayer.bind(this));
    }
  }

  onResizeLayer(event: MouseEvent | TouchEvent) {
    console.log('onResizeLayer called');
    if (!this.isResizing || !this.selectedLayerId) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const layer = this.layers.find(l => l.id === this.selectedLayerId);
    if (layer) {
      const deltaX = clientX - this.resizeStartPos.x;
      const deltaY = clientY - this.resizeStartPos.y;
      
      // Calculate new width based on deltaX
      const newWidth = Math.max(100, this.resizeStartSize.width + deltaX);
      
      // Calculate new height maintaining 16:9 aspect ratio
      const newHeight = (newWidth * 9) / 16;
      
      // Check if new height is within minimum bounds
      if (newHeight >= 56) { // Minimum height for 100px width with 16:9 ratio
        layer.size = {
          width: newWidth,
          height: newHeight
        };
        
        // Force change detection
        this.cdr.detectChanges();
      }
    }
  }

  stopResizeLayer() {
    this.isResizing = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.onResizeLayer.bind(this));
    document.removeEventListener('touchmove', this.onResizeLayer.bind(this));
    document.removeEventListener('mouseup', this.stopResizeLayer.bind(this));
    document.removeEventListener('touchend', this.stopResizeLayer.bind(this));
  }

  updateLayerOpacity(layerId: string, value: number | { lower: number; upper: number }) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      // Handle both number and range object cases
      const opacity = typeof value === 'number' ? value : value.upper;
      layer.opacity = opacity;
    }
  }

  moveLayerUp(layerId: string) {
    const currentIndex = this.layers.findIndex(layer => layer.id === layerId);
    if (currentIndex < this.layers.length - 1) {
      // Set animation state
      this.layers[currentIndex].isMovingUp = true;
      
      // Swap layers
      const temp = this.layers[currentIndex];
      this.layers[currentIndex] = this.layers[currentIndex + 1];
      this.layers[currentIndex + 1] = temp;
      
      // Update z-indices
      this.layers.forEach((layer, index) => {
        layer.zIndex = index;
      });
      
      // Clear animation state after animation completes
      setTimeout(() => {
        this.layers[currentIndex].isMovingUp = false;
        this.cdr.detectChanges();
      }, 300);
    }
  }

  moveLayerDown(layerId: string) {
    const currentIndex = this.layers.findIndex(layer => layer.id === layerId);
    if (currentIndex > 0) {
      // Set animation state
      this.layers[currentIndex].isMovingDown = true;
      
      // Swap layers
      const temp = this.layers[currentIndex];
      this.layers[currentIndex] = this.layers[currentIndex - 1];
      this.layers[currentIndex - 1] = temp;
      
      // Update z-indices
      this.layers.forEach((layer, index) => {
        layer.zIndex = index;
      });
      
      // Clear animation state after animation completes
      setTimeout(() => {
        this.layers[currentIndex].isMovingDown = false;
        this.cdr.detectChanges();
      }, 300);
    }
  }

  private updateZIndices() {
    this.layers.forEach((layer, index) => {
      layer.zIndex = index;
    });
    this.cdr.detectChanges();
  }

  deleteLayer(layerId: string) {
    console.log('Deleting layer:', layerId); // Debug log
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index !== -1) {
      // Clean up video resources
      const layer = this.layers[index];
      if (layer.videoUrl && layer.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(layer.videoUrl);
      }
      
      // Remove the layer
      this.layers.splice(index, 1);
      
      // Update selection
      if (this.selectedLayerId === layerId) {
        this.selectedLayerId = this.layers.length > 0 ? this.layers[0].id : null;
        if (this.selectedLayerId) {
          this.selectLayer(this.selectedLayerId);
        }
      }
      
      // Update z-indices
      this.updateZIndices();
      
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

  async generateThumbnailsForLayer(layer: VideoLayer) {
    if (!layer.videoUrl) return;

    const video = document.createElement('video');
    video.src = layer.videoUrl;
    
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        layer.duration = video.duration;
        layer.endTime = video.duration;
        resolve();
      };
    });

    const canvas = document.createElement('canvas');
    const timelineWidth = this.timelineContainer.nativeElement.offsetWidth;
    const thumbnailWidth = 100; // Fixed width for each thumbnail
    const numThumbnails = Math.ceil(timelineWidth / thumbnailWidth);
    const interval = layer.duration / numThumbnails;

    canvas.width = thumbnailWidth;
    canvas.height = this.timelineThumbnailHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbnails: string[] = [];

    for (let i = 0; i < numThumbnails; i++) {
      const time = i * interval;
      video.currentTime = time;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, thumbnailWidth, this.timelineThumbnailHeight);
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
          resolve();
        };
      });
    }

    layer.thumbnails = thumbnails;
    this.cdr.detectChanges();
  }

  private onTimelineDragHandler = (layerId: string, type: 'start' | 'end', event: MouseEvent | TouchEvent) => {
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const timeline = this.elementRef.nativeElement.querySelector('.timeline-container');
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentTime = (currentX / this.timelineWidth) * layer.duration;

    if (type === 'start') {
      layer.startTime = Math.max(0, Math.min(currentTime, layer.endTime - 0.1));
    } else {
      layer.endTime = Math.min(layer.duration, Math.max(currentTime, layer.startTime + 0.1));
    }
  };

  startTimelineDrag(event: MouseEvent | TouchEvent, layerId: string, type: 'start' | 'end') {
    event.preventDefault();
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const timeline = this.elementRef.nativeElement.querySelector('.timeline-container');
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const startX = clientX - rect.left;
    const startTime = (startX / this.timelineWidth) * layer.duration;

    if (type === 'start') {
      layer.startTime = Math.max(0, Math.min(startTime, layer.endTime - 0.1));
    } else {
      layer.endTime = Math.min(layer.duration, Math.max(startTime, layer.startTime + 0.1));
    }

    const dragHandler = (e: MouseEvent | TouchEvent) => this.onTimelineDragHandler(layerId, type, e);
    const stopHandler = () => {
      document.removeEventListener('mousemove', dragHandler);
      document.removeEventListener('mouseup', stopHandler);
      document.removeEventListener('touchmove', dragHandler);
      document.removeEventListener('touchend', stopHandler);
    };

    document.addEventListener('mousemove', dragHandler);
    document.addEventListener('mouseup', stopHandler);
    document.addEventListener('touchmove', dragHandler);
    document.addEventListener('touchend', stopHandler);
  }

  get timelineWidth(): number {
    return this._timelineWidth;
  }

  set timelineWidth(value: number) {
    this._timelineWidth = value;
  }

  updateLayerStartTime(layerId: string, value: string | number | null | undefined) {
    if (value === null || value === undefined) return;
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return;

    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      const newStartTime = Math.max(0, Math.min(numericValue, layer.endTime - 0.1));
      layer.startTime = newStartTime;
      
      // Update video position if it's currently playing
      const video = this.elementRef.nativeElement.querySelector(`#video-${layerId}`) as HTMLVideoElement;
      if (video) {
        video.currentTime = newStartTime;
      }
    }
  }

  updateLayerEndTime(layerId: string, value: string | number | null | undefined) {
    if (value === null || value === undefined) return;
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return;

    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      const newEndTime = Math.min(layer.duration, Math.max(numericValue, layer.startTime + 0.1));
      layer.endTime = newEndTime;
    }
  }

  getPlayheadPosition(layer: VideoLayer): number {
    const video = this.elementRef.nativeElement.querySelector(`#video-${layer.id}`) as HTMLVideoElement;
    if (!video) return 0;
    
    const progress = (video.currentTime - layer.startTime) / (layer.endTime - layer.startTime);
    const timelineWidth = this.timelineContainer.nativeElement.offsetWidth;
    return progress * timelineWidth;
  }

  toggleOpacityPanel() {
    this.showOpacityPanel = !this.showOpacityPanel;
  }

  toggleTrimMode() {
    this.isTrimMode = !this.isTrimMode;
    if (this.isTrimMode) {
      // Initialize trim frame for the selected layer
      const selectedLayer = this.layers.find(layer => layer.isSelected);
      if (selectedLayer) {
        const timelineWidth = this.timelineContainer.nativeElement.offsetWidth;
        selectedLayer.trimFrameStart = timelineWidth / 3;
        selectedLayer.trimFrameWidth = timelineWidth / 3;
        this.updateVideoPlaybackFromTrim(selectedLayer.id);
      }
    }
  }

  startTimelineTrim(event: MouseEvent | TouchEvent, handle: 'start' | 'end', layerId: string) {
    event.stopPropagation();
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    this.isResizingTrim = true;
    this.activeTrimHandle = handle;
    this.activeLayerId = layerId;

    const timelineRect = this.timelineContainer.nativeElement.getBoundingClientRect();
    const startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.dragStartX = startX - timelineRect.left;
    this.initialTrimStart = layer.trimFrameStart;
    this.initialTrimWidth = layer.trimFrameWidth;

    document.addEventListener('mousemove', this.onTimelineTrim);
    document.addEventListener('touchmove', this.onTimelineTrim);
    document.addEventListener('mouseup', this.stopTimelineTrim);
    document.addEventListener('touchend', this.stopTimelineTrim);
  }

  onTimelineTrim = (event: MouseEvent | TouchEvent) => {
    if (!this.isResizingTrim || !this.activeLayerId) return;

    const layer = this.layers.find(l => l.id === this.activeLayerId);
    if (!layer) return;

    const timelineRect = this.timelineContainer.nativeElement.getBoundingClientRect();
    const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const deltaX = currentX - timelineRect.left - this.dragStartX;
    const timelineWidth = timelineRect.width;

    if (this.activeTrimHandle === 'start') {
      const newStart = Math.max(0, Math.min(this.initialTrimStart + deltaX, this.initialTrimStart + this.initialTrimWidth - 50));
      layer.trimFrameStart = newStart;
      layer.trimFrameWidth = this.initialTrimWidth - (newStart - this.initialTrimStart);
    } else {
      const newWidth = Math.max(50, Math.min(this.initialTrimWidth + deltaX, timelineWidth - this.initialTrimStart));
      layer.trimFrameWidth = newWidth;
    }

    this.updateVideoPlaybackFromTrim(layer.id);
  }

  stopTimelineTrim = () => {
    this.isResizingTrim = false;
    this.activeTrimHandle = null;
    this.activeLayerId = null;
    document.removeEventListener('mousemove', this.onTimelineTrim);
    document.removeEventListener('touchmove', this.onTimelineTrim);
    document.removeEventListener('mouseup', this.stopTimelineTrim);
    document.removeEventListener('touchend', this.stopTimelineTrim);
  }

  updateVideoPlaybackFromTrim(layerId: string) {
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    const video = document.getElementById(`video-${layerId}`) as HTMLVideoElement;
    if (!video) return;

    const timelineWidth = this.timelineContainer.nativeElement.offsetWidth;
    const startTime = (layer.trimFrameStart / timelineWidth) * layer.duration;
    const endTime = ((layer.trimFrameStart + layer.trimFrameWidth) / timelineWidth) * layer.duration;

    layer.startTime = startTime;
    layer.endTime = endTime;

    if (video.currentTime < startTime || video.currentTime > endTime) {
      video.currentTime = startTime;
    }
  }

  startTimelineLongPress(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.longPressTimer = setTimeout(() => {
      this.expandTimeline();
    }, this.LONG_PRESS_DURATION);
  }

  endTimelineLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  expandTimeline() {
    this.isTimelineExpanded = true;
    this.cdr.detectChanges();
  }

  collapseTimeline() {
    this.isTimelineExpanded = false;
    this.cdr.detectChanges();
  }

  // Update the track-content class binding
  getTrackContentClass(): string {
    return `track-content ${this.isTimelineExpanded ? 'expanded' : ''}`;
  }

  // Add time formatting helper
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}