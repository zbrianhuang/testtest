import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { S3Service } from '../services/s3.service';
import { VideoMetadataService } from '../services/video-metadata.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class UploadComponent {
  videoFile: File | null = null;
  thumbnailFile: File | null = null;
  title: string = '';
  description: string = '';
  artist: string = '';
  coverArtist: string = '';
  isUploading: boolean = false;
  uploadProgress: number = 0;

  constructor(
    private s3Service: S3Service,
    private metadataService: VideoMetadataService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  onVideoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.videoFile = input.files[0];
    }
  }

  onThumbnailFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.thumbnailFile = input.files[0];
    }
  }

  async uploadVideo() {
    if (!this.videoFile || !this.thumbnailFile) {
      this.showToast('Please select both video and thumbnail files');
      return;
    }

    if (!this.title || !this.artist || !this.coverArtist) {
      this.showToast('Please fill in all required fields');
      return;
    }

    try {
      this.isUploading = true;
      this.uploadProgress = 0;

      // Upload video and get metadata
      const videoMetadata = await this.s3Service.uploadVideo(this.videoFile, {
        title: this.title,
        description: this.description,
        artist: this.artist,
        coverArtist: this.coverArtist
      });

      this.uploadProgress = 50;

      // Upload thumbnail
      const thumbnailKey = await this.s3Service.uploadThumbnail(
        this.thumbnailFile,
        videoMetadata.id
      );

      this.uploadProgress = 100;
      this.showToast('Video uploaded successfully!');
      this.modalCtrl.dismiss(true);
    } catch (error) {
      console.error('Error uploading video:', error);
      this.showToast('Error uploading video. Please try again.');
    } finally {
      this.isUploading = false;
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
} 