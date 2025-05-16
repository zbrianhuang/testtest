// home_tab.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Make sure Router is imported
import { SearchComponent } from 'src/app/search/search.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD
=======
import { S3Service } from '../services/s3.service';
>>>>>>> backend2

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
<<<<<<< HEAD
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
=======
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
      // Load videos from localStorage
      const savedVideos = localStorage.getItem('uploadedVideos');
      const uploadedVideos = savedVideos ? JSON.parse(savedVideos) : [];

      // Get signed URLs for all videos
      const processedVideos = await Promise.all(
        uploadedVideos.map(async (video: any) => {
          const videoUrl = await this.s3Service.getVideoUrl(video.videoUrl);
          const thumbnailUrl = await this.s3Service.getThumbnailUrl(video.thumbnailUrl);
          return {
            ...video,
            videoUrl,
            thumbnailUrl
          };
        })
      );

      // Organize videos into categories
      this.videos = [
        processedVideos.slice(0, 5), // Trending (first 5 videos)
        processedVideos, // Recent Uploads (all videos)
        processedVideos.slice().sort((a, b) => b.likes - a.likes).slice(0, 5) // Popular (top 5 by likes)
      ];
    } catch (error) {
      console.error('Error loading videos:', error);
    }
>>>>>>> backend2
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