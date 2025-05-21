import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
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

  constructor(
    private toastController: ToastController,
    private router: Router,
    private s3Service: S3Service,
    private metadataService: VideoMetadataService
  ) {}

  ngOnInit() {
    // Get video file and thumbnail from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as any;
      this.videoFile = state.videoFile;
      this.thumbnailFile = state.thumbnailFile;
      this.videoMetadata = state.videoMetadata || null;
      
      if (this.videoMetadata) {
        console.log('Received video metadata:', 
          'trimStart:', this.videoMetadata.trimStart, 
          'trimEnd:', this.videoMetadata.trimEnd, 
          'duration:', this.videoMetadata.duration
        );
      }
      
      if (this.thumbnailFile) {
        // Create a preview URL for the thumbnail
        this.thumbnailUrl = URL.createObjectURL(this.thumbnailFile);
      }
      
      if (this.videoFile) {
        console.log('Received video from editor:', this.videoFile.name, 'size:', this.videoFile.size);
      }
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

  async submit() {
    if (!this.videoTitle || !this.instrument || !this.videoType || !this.thumbnailFile || !this.videoFile) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields and upload both video and thumbnail!',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
      return;
    }

    try {
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
      
      // Upload video and get metadata
      const videoMetadata = await this.s3Service.uploadVideo(
        this.videoFile, 
        videoMetadataObj
      );

      // Upload thumbnail
      if (videoMetadata && videoMetadata.id) {
        const thumbnailKey = await this.s3Service.uploadThumbnail(
          this.thumbnailFile,
          videoMetadata.id
        );
      } else {
        throw new Error('Failed to create video metadata record');
      }

      const toast = await this.toastController.create({
        message: 'Video uploaded successfully!',
        duration: 2000,
        color: 'success',
      });
      toast.present();

      this.router.navigate(['/tabs/home_tab']);
    } catch (error) {
      console.error('Error uploading video:', error);
      const toast = await this.toastController.create({
        message: 'Error uploading video. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
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