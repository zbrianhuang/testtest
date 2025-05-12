import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, Platform, ToastController, IonicModule } from '@ionic/angular';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class UploadSheetModalComponent implements OnInit {
  @ViewChild('sheetFileInput') sheetFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('thumbnailFileInput') thumbnailFileInputRef!: ElementRef<HTMLInputElement>;

  uploadForm: FormGroup;
  selectedSheetFile: { name: string; path: string; data?: string; mimeType?: string } | null = null;
  selectedThumbnailFile: { name: string; path: string; data?: string; mimeType?: string } | null = null;

  sheetFileName: string = '';
  thumbnailFileName: string = '';

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private platform: Platform,
    private toastCtrl: ToastController
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
    });
  }

  ngOnInit() {}

  async selectSheetFile() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FilePicker.pickFiles({
          types: ['application/pdf'],
          readData: false, // We only need the path for native
        });
        if (result.files.length > 0) {
          const file = result.files[0];
          this.selectedSheetFile = { name: file.name, path: file.path!, mimeType: file.mimeType };
          this.sheetFileName = file.name;
        }
      } catch (e) {
        console.error('Error picking sheet file:', e);
        this.presentToast('Error picking sheet file.');
      }
    } else {
      // Web fallback
      this.sheetFileInputRef.nativeElement.click();
    }
  }

  async selectThumbnailFile() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FilePicker.pickFiles({
          types: ['image/jpeg', 'image/png'],
          readData: false, // We only need the path for native
        });
        if (result.files.length > 0) {
          const file = result.files[0];
          this.selectedThumbnailFile = { name: file.name, path: file.path!, mimeType: file.mimeType };
          this.thumbnailFileName = file.name;
        }
      } catch (e) {
        console.error('Error picking thumbnail:', e);
        this.presentToast('Error picking thumbnail.');
      }
    } else {
      // Web fallback
      this.thumbnailFileInputRef.nativeElement.click();
    }
  }

  // Handler for web file input
  handleSheetFileWeb(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.readFileAsBase64(file).then(base64Data => {
        this.selectedSheetFile = { name: file.name, path: '', data: base64Data, mimeType: file.type };
        this.sheetFileName = file.name;
      });
    }
  }

  handleThumbnailFileWeb(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
       this.readFileAsBase64(file).then(base64Data => {
        this.selectedThumbnailFile = { name: file.name, path: '', data: base64Data, mimeType: file.type };
        this.thumbnailFileName = file.name;
      });
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string); // Format: data:mime/type;base64,BASE64_ENCODED_STRING
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
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

  dismissModal() {
    this.modalCtrl.dismiss(null);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
    });
    toast.present();
  }
}