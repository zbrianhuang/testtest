import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UploadInfoPageRoutingModule } from './upload-info-routing.module';

import { UploadInfoPage } from './upload-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UploadInfoPageRoutingModule
  ],
  declarations: [UploadInfoPage]
})
export class UploadInfoPageModule {}
