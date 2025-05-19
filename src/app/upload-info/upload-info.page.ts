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

  constructor(
    private toastController: ToastController,
    private router: Router,
    private s3Service: S3Service,
    private metadataService: VideoMetadataService
  ) {}

  ngOnInit() {
    // Get video file from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.videoFile = (navigation.extras.state as any).videoFile;
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
      // Upload video and get metadata
      const videoMetadata = await this.s3Service.uploadVideo(this.videoFile, {
        title: this.videoTitle,
        description: this.description,
        artist: this.instrument,
        coverArtist: this.videoType
      });

      // Upload thumbnail
      const thumbnailKey = await this.s3Service.uploadThumbnail(
        this.thumbnailFile,
        videoMetadata.id
      );

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
}