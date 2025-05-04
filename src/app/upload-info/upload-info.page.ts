import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor() {}

  selectSheetMusic() {
    // 模擬選擇檔案（未串實體檔案系統）
    // 真實應用中會改為透過 file input 或 Capacitor plugin 上傳
    this.sheetMusicName = 'example-sheet.pdf';
  }

  submit() {
    console.log({
      videoTitle: this.videoTitle,
      instrument: this.instrument,
      videoType: this.videoType,
      description: this.description,
      sheetMusicName: this.sheetMusicName,
    });
  }
}

