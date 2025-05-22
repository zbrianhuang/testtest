import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { S3Service } from '../services/s3.service';
import { VideoMetadataService } from '../services/video-metadata.service';

@Component({
  selector: 'app-upload-info',
  standalone: true,
  templateUrl: './upload-info.page.html',
  styleUrls: ['./upload-info.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UploadInfoPage implements OnInit {
  videoTitle = '';
  instrument = '';
  videoType = '';
  description = '';
  sheetMusicName = '';
  sheetMusicFile: File | null = null;
  videoFile: File | null = null;
  thumbnailFile: File | null = null;
  thumbnailUrl: string = '';
  videoMetadata: { 
    trimStart: number;
    trimEnd: number;
    duration: number;
  } | null = null;
  isGeneratingThumbnail = false;
  isUploading = false;
  uploadProgress = 0;
  cancelUploadSource: AbortController | null = null;
  isUpdatingExistingVideo = false;
  existingVideoId: string | null = null;
  returnTab: string | null = null;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private s3Service: S3Service,
    private metadataService: VideoMetadataService
  ) {}

  async ngOnInit() {
    // Get video file from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.videoFile = (navigation.extras.state as any).videoFile;
      this.thumbnailFile = (navigation.extras.state as any).thumbnailFile;
      this.videoMetadata = (navigation.extras.state as any).videoMetadata || null;
      this.returnTab = (navigation.extras.state as any).returnTab || null;
      
      if (this.videoMetadata) {
        console.log('Received video metadata:', 
          'trimStart:', this.videoMetadata.trimStart, 
          'trimEnd:', this.videoMetadata.trimEnd, 
          'duration:', this.videoMetadata.duration
        );
      }
      
      if (this.returnTab) {
        console.log('Return tab available:', this.returnTab);
      }
      
      // Check if we're updating an existing video
      const isUpdating = (navigation.extras.state as any).isUpdatingExistingVideo;
      if (isUpdating) {
        const existingMetadata = (navigation.extras.state as any).existingVideoMetadata;
        if (existingMetadata) {
          // Pre-fill the form with existing data
          this.videoTitle = existingMetadata.title || '';
          this.instrument = existingMetadata.artist || '';
          this.videoType = existingMetadata.coverArtist || '';
          this.description = existingMetadata.description || '';
          this.existingVideoId = (navigation.extras.state as any).existingVideoId;
          this.isUpdatingExistingVideo = true;
        }
      }
      
      // If we have a video but no thumbnail, generate one
      if (this.videoFile && !this.thumbnailFile) {
        this.generateThumbnailFromVideo();
      } else if (this.thumbnailFile) {
        // If we already have a thumbnail file, create a preview URL
        this.thumbnailUrl = URL.createObjectURL(this.thumbnailFile);
      }
    }
  }

  // Generate thumbnail from the first frame of the video
  async generateThumbnailFromVideo() {
    if (!this.videoFile) return;
    
    this.isGeneratingThumbnail = true;

    try {
      // Create a video element to load the video
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = URL.createObjectURL(this.videoFile);
      
      // Wait for video to load
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          // Seek to the first frame
          videoElement.currentTime = 0;
          videoElement.onseeked = () => resolve();
        };
        videoElement.onerror = () => {
          console.error('Error loading video for thumbnail generation');
          resolve();
        };
      });

      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw the video frame on the canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        const thumbnailBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(new Blob([]));
          }, 'image/jpeg', 0.8);
        });
        
        // Create a file from the blob
        const fileName = this.videoFile.name.replace(/\.[^/.]+$/, '') + '_thumbnail.jpg';
        this.thumbnailFile = new File([thumbnailBlob], fileName, { type: 'image/jpeg' });
        
        // Create a preview URL for display
        this.thumbnailUrl = URL.createObjectURL(this.thumbnailFile);
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      await this.presentToast('Failed to generate thumbnail. Please upload one manually.');
    } finally {
      this.isGeneratingThumbnail = false;
    }
  }

  async handleThumbnailUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.thumbnailFile = target.files[0];
      // Create a preview URL
      this.thumbnailUrl = URL.createObjectURL(this.thumbnailFile);
    }
  }

  selectSheetMusic() {
    this.sheetMusicName = 'example-sheet.pdf';
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color
    });
    toast.present();
  }

  async cancelUpload() {
    const alert = await this.alertController.create({
      header: 'Cancel Upload',
      message: 'Are you sure you want to cancel the upload?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            if (this.cancelUploadSource) {
              this.cancelUploadSource.abort();
              this.cancelUploadSource = null;
            }
            this.isUploading = false;
            this.uploadProgress = 0;
            this.presentToast('Upload cancelled', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  async submit() {
    if (!this.videoTitle || !this.instrument || !this.videoType || !this.thumbnailFile || !this.videoFile) {
      await this.presentToast('Please fill in all required fields and upload both video and thumbnail!');
      return;
    }

    try {
      this.isUploading = true;
      this.uploadProgress = 0;

      let uploadedMetadata;

      // Check if we're updating an existing video
      if (this.isUpdatingExistingVideo && this.existingVideoId) {
        // Show upload progress status for updates
        await this.presentToast('Updating existing video...', 'primary');
        
        // Check file size for appropriate upload method
        const isLargeFile = this.videoFile.size > 50 * 1024 * 1024;
        
        if (isLargeFile) {
          // For large files, use presigned URL and update metadata
          const { url, videoKey } = await this.s3Service.getVideoUploadPresignedUrl(this.videoFile.name);
          await this.uploadLargeFile(url, this.videoFile);
          
          // Update metadata with new key
          uploadedMetadata = await this.metadataService.updateVideo(this.existingVideoId, {
            title: this.videoTitle,
            description: this.description,
            artist: this.instrument,
            coverArtist: this.videoType,
            s3Key: videoKey
          });
        } else {
          // For smaller files, use regular upload method
          const { s3Key } = await this.s3Service.replaceVideo(this.existingVideoId, this.videoFile, {
            title: this.videoTitle,
            description: this.description,
            artist: this.instrument,
            coverArtist: this.videoType
          });
          
          uploadedMetadata = await this.metadataService.getVideo(this.existingVideoId);
        }
      } else {
        // Create metadata with standard fields
        const videoMetadataObj = {
          title: this.videoTitle,
          description: this.description,
          artist: this.instrument,
          coverArtist: this.videoType
        };
        
        // Add trim data if available
        if (this.videoMetadata) {
          Object.assign(videoMetadataObj, {
            trimStart: this.videoMetadata.trimStart,
            trimEnd: this.videoMetadata.trimEnd,
            duration: this.videoMetadata.duration
          });
        }

        // Handle new video upload
        // Check if the file is larger than 50MB - if so, use presigned URL
        const isLargeFile = this.videoFile.size > 50 * 1024 * 1024;

        if (isLargeFile) {
          // Show upload progress status
          await this.presentToast('Starting upload of large video file...', 'primary');
          
          // Get presigned URL for direct upload
          const { url, videoKey, videoId } = await this.s3Service.getVideoUploadPresignedUrl(this.videoFile.name);
          
          // Upload the file directly to S3 using fetch with progress tracking
          await this.uploadLargeFile(url, this.videoFile);
          
          // Create metadata entry
          uploadedMetadata = await this.metadataService.addVideo({
            id: videoId,
            title: this.videoTitle,
            description: this.description,
            artist: this.instrument,
            coverArtist: this.videoType,
            uploadDate: Date.now(),
            s3Key: videoKey,
            thumbnailKey: `thumbnails/${videoId}/${this.videoFile.name.replace('.mp4', '.jpg')}`
          });
        } else {
          // Regular upload for smaller files
          uploadedMetadata = await this.s3Service.uploadVideo(this.videoFile, videoMetadataObj);
        }
      }

      this.uploadProgress = 75;

      // Upload thumbnail - for both new and updated videos
      if (uploadedMetadata && uploadedMetadata.id) {
        const thumbnailKey = await this.s3Service.uploadThumbnail(
          this.thumbnailFile,
          uploadedMetadata.id
        );
      } else {
        throw new Error('Failed to create video metadata record');
      }

      this.uploadProgress = 100;
      
      const successMessage = this.isUpdatingExistingVideo 
        ? 'Video updated successfully!' 
        : 'Video uploaded successfully!';
        
      await this.presentToast(successMessage, 'success');

      // Navigate back to the appropriate tab
      if (this.returnTab && this.returnTab.startsWith('/tabs/')) {
        console.log('Returning to tab:', this.returnTab);
        this.router.navigateByUrl(this.returnTab);
      } else {
        // Default to home tab
        this.router.navigateByUrl('/tabs/home_tab');
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      await this.presentToast(error.message || 'Error uploading video. Please try again.');
    } finally {
      this.isUploading = false;
      this.cancelUploadSource = null;
    }
  }

  private async uploadLargeFile(presignedUrl: string, file: File): Promise<void> {
    // Create abort controller for cancellation
    this.cancelUploadSource = new AbortController();
    
    try {
      // Function to track upload progress
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Scale to 75% (remaining 25% will be for thumbnail upload)
            this.uploadProgress = Math.round((event.loaded / event.total) * 75);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload aborted'));
        
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
        
        // Setup cancellation
        this.cancelUploadSource?.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 
          ('name' in error && (error as {name: string}).name === 'AbortError' || 
           'message' in error && (error as {message: string}).message === 'Upload aborted')) {
        console.log('Upload was cancelled');
        throw new Error('Upload cancelled');
      }
      console.error('Error uploading large file:', error);
      throw error;
    }
  }

  changeThumbnail() {
    // Reset the thumbnail to allow choosing a new one
    this.thumbnailFile = null;
    this.thumbnailUrl = '';
    
    // Trigger the file input programmatically
    setTimeout(() => {
      const thumbnailInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (thumbnailInput) {
        thumbnailInput.click();
      }
    }, 100);
  }
}