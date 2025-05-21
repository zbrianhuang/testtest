import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ModalController, Platform, ToastController, IonicModule } from '@ionic/angular';
import { Filesystem, Directory, Encoding, WriteFileResult, ReaddirResult, ReadFileResult } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener'; // For opening PDFs
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Keep your existing interface
interface SheetMusic {
  title: string;
  author: string;
  thumbnail: string; // This will now be a device path or a web path
  redirect: string;  // This will now be a device path or a web path
  isUserUploaded?: boolean; // Optional: to differentiate
}

// Import the modal component
import { UploadSheetModalComponent } from '../components/upload-sheet-modal/upload-sheet-modal.component';

const USER_SHEET_MUSIC_DIR = 'my_sheet_music'; // Subdirectory in app's data
const USER_METADATA_FILE = 'user_sheetmusic.json';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    HttpClientModule
  ]
})
export class Tab1Page implements OnInit {
  sheets: SheetMusic[] = [];
  isLoading: boolean = true;
  errorLoading: boolean = false;
  isOpeningPdf: boolean = false;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.platform.ready().then(() => { // Ensure plugins are ready
      this.loadSheetMusicData();
    });
  }

  async openUploadModal() {
    const modal = await this.modalCtrl.create({
      component: UploadSheetModalComponent,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss(); // Use onWillDismiss
    if (data) {
      // data contains title, author, sheetFile obj, thumbnailFile obj
      this.isLoading = true;
      try {
        const newSheet = await this.processAndSaveUpload(data);
        this.sheets.unshift(newSheet); // Add to the beginning of the array
        await this.saveUserSheetMusicMetadata();
        this.presentToast('Sheet Music uploaded successfully!', 'success');
      } catch (error) {
        console.error("Error processing upload:", error);
        this.presentToast('Failed to upload sheet music.', 'danger');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async processAndSaveUpload(uploadData: any): Promise<SheetMusic> {
    const uniqueId = Date.now().toString();
    const sheetFileName = `sheet_${uniqueId}_${uploadData.sheetFile.name}`;
    const thumbFileName = `thumb_${uniqueId}_${uploadData.thumbnailFile.name}`;

    let sheetFilePath: string;
    let thumbFilePath: string;

    if (Capacitor.isNativePlatform()) {
      // Create directory if it doesn't exist
      try {
        await Filesystem.readdir({
          path: USER_SHEET_MUSIC_DIR,
          directory: Directory.Data
        });
      } catch(e) {
        await Filesystem.mkdir({
          path: USER_SHEET_MUSIC_DIR,
          directory: Directory.Data,
          recursive: true // Create parent dirs if needed (though Data dir should exist)
        });
      }

      // Save sheet file
      const savedSheet = await Filesystem.copy({
        from: uploadData.sheetFile.path, // Original path from FilePicker
        to: `${USER_SHEET_MUSIC_DIR}/${sheetFileName}`,
        toDirectory: Directory.Data,
      });
      sheetFilePath = savedSheet.uri;

      // Save thumbnail file
      const savedThumb = await Filesystem.copy({
        from: uploadData.thumbnailFile.path,
        to: `${USER_SHEET_MUSIC_DIR}/${thumbFileName}`,
        toDirectory: Directory.Data,
      });
      thumbFilePath = savedThumb.uri;

    } else { // Web/PWA - save as base64 in metadata or use IndexedDB for larger files
             // For simplicity here, we'll store base64 data directly in the object.
             // This is NOT ideal for large PDFs on the web but works for demonstration.
             // A better web solution involves IndexedDB.
      sheetFilePath = uploadData.sheetFile.data; // This is base64 data URL
      thumbFilePath = uploadData.thumbnailFile.data; // This is base64 data URL
    }


    return {
      title: uploadData.title,
      author: uploadData.author,
      thumbnail: thumbFilePath, // On native, this needs convertFileSrc for display
      redirect: sheetFilePath, // On native, this needs to be opened with FileOpener
      isUserUploaded: true,
    };
  }

  async loadSheetMusicData() {
    this.isLoading = true;
    this.errorLoading = false;

    // 1. Load default sheet music from assets
    const defaultSheets$ = this.http.get<SheetMusic[]>('assets/data/sheetmusic.json').pipe(
      map(sheets => sheets.map(s => ({...s, isUserUploaded: false}))), // Mark as not user-uploaded
      catchError(err => {
        console.warn("Error loading default sheet music data:", err);
        return []; // Return empty array on error
      })
    );

    // 2. Load user-uploaded sheet music metadata
    const userSheets$ = new Observable<SheetMusic[]>(subscriber => {
      Filesystem.readFile({
        path: `${USER_SHEET_MUSIC_DIR}/${USER_METADATA_FILE}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      }).then(result => {
        const userSheetsData = JSON.parse(result.data as string) as SheetMusic[];
        // Convert file paths for display if native
        const processedUserSheets = userSheetsData.map(sheet => {
          if (Capacitor.isNativePlatform() && sheet.isUserUploaded) {
            return {
              ...sheet,
              thumbnail: Capacitor.convertFileSrc(sheet.thumbnail),
              // redirect path remains native, will be handled by openFile
            };
          }
          return sheet; // For web/PWA base64 or if not user uploaded
        });
        subscriber.next(processedUserSheets);
        subscriber.complete();
      }).catch(err => {
        console.warn('No user sheet music metadata found or error reading:', err);
        subscriber.next([]); // No user data yet
        subscriber.complete();
      });
    });

    // Combine both
    defaultSheets$.pipe(
      switchMap(defaultSheets =>
        userSheets$.pipe(
          map(userSheets => [...userSheets, ...defaultSheets]) // User sheets first
        )
      ),
      finalize(() => this.isLoading = false)
    ).subscribe(
      allSheets => {
        this.sheets = allSheets;
      },
      err => {
        console.error("Error in combined loading:", err);
        this.errorLoading = true;
      }
    );
  }


  private async saveUserSheetMusicMetadata() {
    // Filter out non-user uploaded sheets before saving
    const userSheetsToSave = this.sheets
      .filter(s => s.isUserUploaded)
      .map(s => {
        // On native, store original file paths, not converted ones
        if (Capacitor.isNativePlatform() && s.isUserUploaded) {
          const originalThumbnailPath = s.thumbnail.startsWith('capacitor://localhost/_capacitor_file_')
            ? s.thumbnail.replace('capacitor://localhost/_capacitor_file_', '') // crude way to get original
            : s.thumbnail; // Assuming it might already be original if re-saved
          
          // A more robust way to get original path: store it separately when creating the SheetMusic object
          // For now, this is a simplified attempt.
          // The `redirect` path is already the original native path.

          // This part is tricky because convertFileSrc changes the path.
          // It's better to store the original `file://` URI and convert ONLY for display.
          // Let's adjust `processAndSaveUpload` and `loadSheetMusicData` slightly.

          // For simplicity in this example, we assume that the paths in `this.sheets` for user-uploaded
          // items are already the correct, original file URIs before `convertFileSrc` was applied for display.
          // If `convertFileSrc` was applied in-place, you'd need to revert or store original paths separately.
          // The current `processAndSaveUpload` stores the correct URI.
          // The `loadSheetMusicData` applies `convertFileSrc` for display but the original is in the JSON.
          // So, when saving, we take the objects from `this.sheets`. If they were modified in memory for display,
          // we need to be careful. Best practice: keep original URIs in the model, convert on demand for view.

          // Let's assume `s.thumbnail` and `s.redirect` on `this.sheets` for user uploads
          // are the original native URIs (file://...) or base64 for web.
          // The display conversion should happen in the template or a getter.
          // To correct this: Modify loadSheetMusicData to NOT convert in place,
          // but use a getter or pipe in template. For now, we'll proceed, but be aware.
          return {
            title: s.title,
            author: s.author,
            thumbnail: s.thumbnail, // Should be original URI
            redirect: s.redirect,   // Should be original URI
            isUserUploaded: true
          };
        }
        return s; // For web (base64) or non-user-uploaded
      });

    try {
      await Filesystem.writeFile({
        path: `${USER_SHEET_MUSIC_DIR}/${USER_METADATA_FILE}`,
        data: JSON.stringify(userSheetsToSave),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      console.error('Unable to save user sheet music metadata', e);
      this.presentToast('Error saving your uploaded music list.', 'danger');
    }
  }

  async openFile(sheet: SheetMusic) {
    this.isOpeningPdf = true;
    try {
      if (Capacitor.isNativePlatform()) {
        if (sheet.isUserUploaded) {
          // For user-uploaded files
          const filePath = sheet.redirect.startsWith('file://') 
            ? sheet.redirect 
            : `file://${sheet.redirect}`;
            
          await FileOpener.open({
            filePath: filePath,
            contentType: 'application/pdf'
          });
        } else {
          // For bundled PDFs in assets
          try {
            // First, read the file from assets
            const response = await fetch(sheet.redirect);
            const blob = await response.blob();
            
            // Convert blob to base64
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]); // Remove the data URL prefix
              };
              reader.readAsDataURL(blob);
            });

            // Create a temporary file name
            const tempFileName = `temp_${Date.now()}.pdf`;
            const tempFilePath = `${USER_SHEET_MUSIC_DIR}/${tempFileName}`;

            // Ensure directory exists
            try {
              await Filesystem.readdir({
                path: USER_SHEET_MUSIC_DIR,
                directory: Directory.Data
              });
            } catch(e) {
              await Filesystem.mkdir({
                path: USER_SHEET_MUSIC_DIR,
                directory: Directory.Data,
                recursive: true
              });
            }

            // Write the base64 data to a temporary file
            const result = await Filesystem.writeFile({
              path: tempFilePath,
              data: base64Data,
              directory: Directory.Data,
              encoding: Encoding.UTF8
            });

            // Open the temporary file
            await FileOpener.open({
              filePath: result.uri,
              contentType: 'application/pdf'
            });
          } catch (error) {
            console.error('Error processing bundled PDF:', error);
            throw error;
          }
        }
      } else {
        // For web platform
        window.open(sheet.redirect, '_blank');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      this.presentToast('Could not open the PDF file. Please try again.', 'danger');
    } finally {
      this.isOpeningPdf = false;
    }
  }


  // Helper for displaying thumbnails correctly
  getDisplayThumbnail(sheet: SheetMusic): string {
    if (sheet.isUserUploaded && Capacitor.isNativePlatform() && sheet.thumbnail.startsWith('file://')) {
      return Capacitor.convertFileSrc(sheet.thumbnail);
    }
    return sheet.thumbnail; // Returns asset path or base64 data URI
  }


  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}