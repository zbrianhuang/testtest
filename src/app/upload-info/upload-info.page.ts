<<<<<<< HEAD
import { Component } from '@angular/core';
=======
import { Component, OnInit } from '@angular/core';
>>>>>>> backend2
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
<<<<<<< HEAD
=======
import { S3Service } from '../services/s3.service';
>>>>>>> backend2

@Component({
  selector: 'app-upload-info',
  standalone: true,
  templateUrl: './upload-info.page.html',
  styleUrls: ['./upload-info.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
<<<<<<< HEAD
export class UploadInfoPage {
=======
export class UploadInfoPage implements OnInit {
>>>>>>> backend2
  videoTitle = '';
  instrument = '';
  videoType = '';
  description = '';
  sheetMusicName = '';
<<<<<<< HEAD
  sheetMusicFile: File | null = null; 

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {}

=======
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

>>>>>>> backend2
  selectSheetMusic() {
    this.sheetMusicName = 'example-sheet.pdf';
  }

  async submit() {
<<<<<<< HEAD
    if (!this.videoTitle || !this.instrument || !this.videoType) {
      alert('Please fill in all required fields!');
      return;
    }
  
    const finalTitle = this.sheetMusicName
      ? `[sheet] ${this.videoTitle}`
      : this.videoTitle;
  
    const newVideo = {
      title: finalTitle,
      instrument: this.instrument,
      videoType: this.videoType,
      description: this.description,
      sheetMusicName: this.sheetMusicName,
      image: 'assets/icon/post1.jpg',
      hashtags: `#${this.instrument}#${this.videoType} · just now`,
      likes: 0,
      comments: 0,
      canDelete: true  // ✅ 讓 Tab3Page 能判斷這則影片能不能刪除
    };
  
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
  }
    
  
=======
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
>>>>>>> backend2
}