// home_tab.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Make sure Router is imported
import { SearchComponent } from 'src/app/search/search.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
  id: string; // Keep the id
  artist?: string;
  videoUrl?: string;
}

interface Gallery_Title {
  title: string;
}

@Component({
  selector: 'app-hometab',
  templateUrl: 'home_tab.page.html',
  styleUrls: ['home_tab.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule] // Keep necessary imports
})
export class HomeTabPage implements OnInit {

  selectedSegment: string = 'discover';

  titles: Gallery_Title[] = [
    { title: 'Trending' },
    { title: 'Pop' },
    { title: 'Rock' },
    { title: 'lala' },
    { title: 'sdf' }
  ];

  // Make sure IDs are unique for proper lookup later!
  // Using placeholder unique IDs for demonstration
  videos: Video[][] = [
    [
      {
        title: 'annie. / wave to earth' ,
        description: '#cover #guitar #vocal',
        thumbnailUrl: '../../assets/thumbnails/annie_thumb.png',
        id: "vid-001",
        artist: 'jim',
      },
      
    ],
    [
      {
        title: 'other song',
        description: '#band',
        thumbnailUrl: 'assets/thumbnails/placeholder.jpeg',
        id: "vid-002",
        artist: 'artist',
      },
      {
        title: 'other song2',
        description: '#cover',
        thumbnailUrl: '../../assets/thumbnails/placeholder2.JPG',
        id: "vid-003",
        artist: 'artist',
      },
    ],
    // Add more rows/videos as needed with unique IDs
  ];

  // Inject Router in the constructor (already done)
  constructor(private modalController: ModalController, private router: Router) {}

  ngOnInit() {
    // Optionally load or refresh videos here.
  }

  async openAdvancedSearch() {
    const modal = await this.modalController.create({
      component: SearchComponent,
      cssClass: 'advanced-search-modal',
      backdropDismiss: true,
      showBackdrop: true
    });
    await modal.present();
  }

  navigateToVideo(videoId: string) {
    console.log('Navigating to video with ID:', videoId);
    this.router.navigate(['/tab-vid', videoId]);
  }
}