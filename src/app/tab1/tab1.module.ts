import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule  } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { HttpClientModule } from '@angular/common/http'; 
import { Tab1PageRoutingModule } from './tab1-routing.module';
import { IonButton, IonMenuToggle } from '@ionic/angular/standalone';
import { UploadSheetModalComponent } from '../components/upload-sheet-modal/upload-sheet-modal.component'; // Import modal

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // Add
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    HttpClientModule ,
    UploadSheetModalComponent,
    Tab1Page
  ],
  declarations: []
})


export class Tab1PageModule {}
