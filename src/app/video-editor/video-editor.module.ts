import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VideoEditorPageRoutingModule } from './video-editor-routing.module';
import { VideoEditorPage } from './video-editor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoEditorPageRoutingModule,
    VideoEditorPage // Import standalone component here
  ],
  declarations: [] // Remove VideoEditorPage from declarations
})
export class VideoEditorPageModule {}