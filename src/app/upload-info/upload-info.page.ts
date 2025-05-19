import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-info',
  standalone: true,
  templateUrl: './upload-info.page.html',
  styleUrls: ['./upload-info.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UploadInfoPage {
  videoTitle = '';
  instrument = '';
  videoType = '';
  description = '';
  sheetMusicName = '';
  sheetMusicFile: File | null = null; 

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {}

  selectSheetMusic() {
    this.sheetMusicName = 'example-sheet.pdf';
  }

  async submit() {
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
      image: '/src/assets/thumbnails/知足＿thumb.pngn/post1.jpg',
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
    
  
}