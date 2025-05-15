import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { S3Service } from '../services/s3.service';

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
  videoUrl: string = '';
  thumbnailFile: File | null = null;
  thumbnailUrl: string = '';

  constructor(
    private toastController: ToastController,
    private router: Router,
    private s3Service: S3Service
  ) {}

  ngOnInit() {
    // Get video URL from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.videoUrl = (navigation.extras.state as any).videoUrl;
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
    if (!this.videoTitle || !this.instrument || !this.videoType || !this.thumbnailFile) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields and upload a thumbnail!',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
      return;
    }

    try {
      // Upload thumbnail to S3
      const thumbnailUrl = await this.s3Service.uploadThumbnail(this.thumbnailFile);

      const finalTitle = this.sheetMusicName
        ? `[sheet] ${this.videoTitle}`
        : this.videoTitle;

      const newVideo = {
        title: finalTitle,
        instrument: this.instrument,
        videoType: this.videoType,
        description: this.description,
        sheetMusicName: this.sheetMusicName,
        videoUrl: this.videoUrl,
        thumbnailUrl: thumbnailUrl,
        hashtags: `#${this.instrument}#${this.videoType} · just now`,
        likes: 0,
        comments: 0,
        canDelete: true
      };

      // Save to localStorage
      const existing = localStorage.getItem('uploadedVideos');
      const videoList = existing ? JSON.parse(existing) : [];
      videoList.unshift(newVideo);
      localStorage.setItem('uploadedVideos', JSON.stringify(videoList));

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