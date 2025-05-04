import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TabVidPageRoutingModule } from './tab-vid-routing.module';

import { TabVidPage } from './tab-vid.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabVidPageRoutingModule
  ],
  declarations: [TabVidPage]
})
export class TabVidPageModule {

}
