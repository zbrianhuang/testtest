import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,                // ← mark as standalone
  imports: [
    IonicModule,                   // ← enables all <ion-*> tags
    CommonModule,                  // ← enables *ngIf, *ngFor, etc.
    RouterModule                   // ← for routerLink/href
  ]
})
export class TabsPage {
  hideTabBar = false;

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController
  ) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects;
        this.hideTabBar =
          url === '/tabs/tab2' ||
          url.startsWith('/tabs/video-editor');
      });
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Add Content',
      buttons: [
        {
          text: 'Upload Video',
          icon: 'cloud-upload',
          handler: () => {
            this.pickVideo();
          }
        },
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            this.router.navigate(['/tabs/tab2']);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async pickVideo() {
    try {
      console.log('Opening file picker for videos...');
      
      const result = await FilePicker.pickVideos({
        readData: false
      });

      console.log('File picker result:', result);
      
      if (result.files.length > 0) {
        const selectedFile = result.files[0];
        console.log('Selected file:', selectedFile);
        
        // Make sure we have a path
        if (!selectedFile.path) {
          console.error('No path found in selected file');
          
          // Try using the name and extension as a fallback
          if (selectedFile.name) {
            console.log('Using name as fallback for missing path');
            
            // Navigate to video editor with limited file info
            this.router.navigate(['/tabs/video-editor'], {
              state: { 
                videoFileInfo: selectedFile,
                sourceType: 'file-picker',
                isFromGallery: true 
              }
            });
            return;
          }
          
          alert('Could not access the selected video file. Please try again.');
          return;
        }
        
        try {
          // Create a proper File object
          const response = await fetch(selectedFile.path);
          const blob = await response.blob();
          const videoFile = new File([blob], selectedFile.name, { type: selectedFile.mimeType });
          
          console.log('Selected video:', videoFile.name, 'Size:', videoFile.size, 'Type:', videoFile.type);
          
          // Navigate to video editor with the selected video
          this.router.navigate(['/tabs/video-editor'], {
            state: { 
              videoFile: videoFile,
              sourceType: 'file-picker',
              isFromGallery: true 
            }
          });
        } catch (fetchError) {
          console.error('Error fetching file data:', fetchError);
          
          // Fallback navigation with just file info
          this.router.navigate(['/tabs/video-editor'], {
            state: { 
              videoFileInfo: selectedFile,
              sourceType: 'file-picker',
              isFromGallery: true 
            }
          });
        }
      }
    } catch (error) {
      console.error('Error picking video:', error);
      alert('Could not pick a video. Please try again later.');
    }
  }

  async pickVideoForDirectUpload() {
    try {
      const result = await FilePicker.pickVideos({
        readData: false
      });

      if (result.files.length > 0) {
        const videoFile = result.files[0];
        
        // Navigate directly to upload-info page with the video file
        this.router.navigate(['/upload-info'], {
          state: { videoFile: videoFile }
        });
      }
    } catch (error) {
      console.error('Error picking video for upload:', error);
    }
  }
}