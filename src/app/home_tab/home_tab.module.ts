import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomeTabPage } from './home_tab.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { HomeTabPageRoutingModule } from './home_tab-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    HomeTabPageRoutingModule,
    HomeTabPage
  ]
})
export class HomeTabPageModule {}
