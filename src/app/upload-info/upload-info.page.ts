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

    //show toast
    const toast = await this.toastController.create({
      message: 'Video uploaded successfully!',
      duration: 2000,
      color: 'success',
    });
    toast.present();

    //navigate to homepage
    this.router.navigate(['/tabs/home_tab']);
  }
}