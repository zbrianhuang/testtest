//////////////////
// RUN:
// npm install @capacitor/filesystem 
// npm install @capacitor-community/file-opener
// npm install @capawesome/capacitor-file-picker
//////////////////

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, Platform, ToastController, IonicModule } from '@ionic/angular';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface UploadData {
  title: string;
  author: string;
  sheetFile: { name: string; path: string; data?: string }; // path is for native, data for web
  thumbnailFile: { name: string; path: string; data?: string };
}

@Component({
  selector: 'app-upload-sheet-modal',
  templateUrl: './upload-sheet-modal.component.html',
  styleUrls: ['./upload-sheet-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class UploadSheetModalComponent implements OnInit {
  @ViewChild('sheetFileInput') sheetFileInput!: ElementRef;
  @ViewChild('thumbnailFileInput') thumbnailFileInput!: ElementRef;

  uploadForm: FormGroup;
  selectedSheetFile: any = null;
  selectedThumbnailFile: any = null;
  sheetFileName: string = '';
  thumbnailFileName: string = '';
  thumbnailPreview: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private platform: Platform,
    private toastController: ToastController
  ) {
    this.uploadForm = this.formBuilder.group({
      title: ['', Validators.required],
      author: ['', Validators.required]
    });
  }

  ngOnInit() {}

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        // For web
        this.selectedThumbnailFile = {
          name: 'camera_photo.jpg',
          path: image.webPath,
          data: image.webPath
        };
        this.thumbnailFileName = 'Camera Photo';
        this.thumbnailPreview = image.webPath;
      } else if (image.path) {
        // For native
        this.selectedThumbnailFile = {
          name: 'camera_photo.jpg',
          path: image.path
        };
        this.thumbnailFileName = 'Camera Photo';
        this.thumbnailPreview = Capacitor.convertFileSrc(image.path);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      this.presentToast('Error taking picture');
    }
  }

  async selectSheetFile() {
    try {
      const result = await FilePicker.pickFiles({
        types: ['application/pdf'],
        readData: true
      });

      if (result.files.length > 0) {
        const file = result.files[0];
        this.selectedSheetFile = {
          name: file.name,
          path: file.path,
          data: file.data
        };
        this.sheetFileName = file.name;
      }
    } catch (error) {
      console.error('Error picking file:', error);
      this.presentToast('Error selecting file');
    }
  }

  async selectThumbnailFile() {
    try {
      const result = await FilePicker.pickFiles({
        types: ['image/jpeg', 'image/png'],
        readData: true
      });

      if (result.files.length > 0) {
        const file = result.files[0];
        this.selectedThumbnailFile = {
          name: file.name,
          path: file.path,
          data: file.data
        };
        this.thumbnailFileName = file.name;
        if (file.data) {
          this.thumbnailPreview = file.data;
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      this.presentToast('Error selecting file');
    }
  }

  handleSheetFileWeb(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.readFileAsBase64(file).then(base64Data => {
        this.selectedSheetFile = { name: file.name, path: '', data: base64Data };
        this.sheetFileName = file.name;
      });
    }
  }

  handleThumbnailFileWeb(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.readFileAsBase64(file).then(base64Data => {
        this.selectedThumbnailFile = { name: file.name, path: '', data: base64Data };
        this.thumbnailFileName = file.name;
        this.thumbnailPreview = base64Data;
      });
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  async saveSheetMusic() {
    if (this.uploadForm.valid && this.selectedSheetFile && this.selectedThumbnailFile) {
      const formData = this.uploadForm.value;
      const uploadData: UploadData = {
        title: formData.title,
        author: formData.author,
        sheetFile: this.selectedSheetFile,
        thumbnailFile: this.selectedThumbnailFile,
      };
      this.modalCtrl.dismiss(uploadData);
    } else {
      this.presentToast('Please fill all fields and select files.');
    }
  }
}