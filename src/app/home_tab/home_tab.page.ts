// home_tab.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from 'src/app/search/search.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { S3Service } from '../services/s3.service';

interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
  id: string;
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
  imports: [IonicModule, FormsModule, CommonModule]
})
export class HomeTabPage implements OnInit {
  selectedSegment: string = 'discover';

  titles: Gallery_Title[] = [
    { title: 'Trending' },
    { title: 'Recent Uploads' },
    { title: 'Popular' }
  ];

  videos: Video[][] = [];

  constructor(
    private modalController: ModalController,
    private router: Router,
    private s3Service: S3Service
  ) {}

  async ngOnInit() {
    await this.loadVideos();
  }

  async loadVideos() {
    try {
      // Load videos from S3
      const s3Videos = await this.s3Service.listVideos();

      // Organize videos into categories
      this.videos = [
        s3Videos.slice(0, 5), // Trending (first 5 videos)
        s3Videos, // Recent Uploads (all videos)
        s3Videos.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5) // Popular (top 5 by likes)
      ];
    } catch (error) {
      console.error('Error loading videos:', error);
    }
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