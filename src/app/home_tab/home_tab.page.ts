// home_tab.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from 'src/app/search/search.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { S3Service } from '../services/s3.service';
import { VideoMetadataService, VideoMetadata } from '../services/video-metadata.service';
import { UploadComponent } from '../upload/upload.component';

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

  videos: VideoMetadata[][] = [];

  constructor(
    private modalController: ModalController,
    private router: Router,
    private s3Service: S3Service,
    private metadataService: VideoMetadataService
  ) {}

  async ngOnInit() {
    await this.loadVideos();
  }

  async loadVideos() {
    try {
      console.log('Starting to load videos...');
      
      // Load videos from different categories
      const [trending, recent, popular] = await Promise.all([
        this.metadataService.getTrendingVideos(),
        this.metadataService.getRecentVideos(),
        this.metadataService.getPopularVideos()
      ]);

      console.log('Initial video counts:', {
        trending: trending.length,
        recent: recent.length,
        popular: popular.length
      });

      // Create a Set to track unique video IDs
      const uniqueVideoIds = new Set<string>();
      
      // Get signed URLs for all videos, ensuring each video appears only once
      const videosWithUrls = await Promise.all([
        ...trending,
        ...recent,
        ...popular
      ].filter(video => {
        // Only include the video if we haven't seen its ID before
        if (uniqueVideoIds.has(video.id)) {
          console.log(`Skipping duplicate video ID: ${video.id}`);
          return false;
        }
        uniqueVideoIds.add(video.id);
        return true;
      }).map(async (video) => {
        console.log(`Processing video: ${video.id} - ${video.title}`);
        const videoUrl = await this.s3Service.getVideoUrl(video.s3Key);
        let thumbnailUrl = '';
        try {
          thumbnailUrl = await this.s3Service.getThumbnailUrl(video.thumbnailKey);
        } catch (error) {
          console.warn(`Failed to load thumbnail for video ${video.id}:`, error);
          thumbnailUrl = 'assets/thumbnails/default.jpg';
        }
        return {
          ...video,
          videoUrl,
          thumbnailUrl
        };
      }));

      console.log(`Total unique videos processed: ${videosWithUrls.length}`);

      // Organize videos into categories, ensuring each video appears in its highest priority category
      this.videos = [
        videosWithUrls.filter(v => trending.some(t => t.id === v.id)), // Trending
        videosWithUrls.filter(v => recent.some(r => r.id === v.id) && !trending.some(t => t.id === v.id)), // Recent (excluding trending)
        videosWithUrls.filter(v => popular.some(p => p.id === v.id) && !trending.some(t => t.id === v.id) && !recent.some(r => r.id === v.id)) // Popular (excluding trending and recent)
      ];

      console.log('Final video distribution:', {
        trending: this.videos[0].length,
        recent: this.videos[1].length,
        popular: this.videos[2].length
      });
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

  async openUploadModal() {
    const modal = await this.modalController.create({
      component: UploadComponent,
      cssClass: 'upload-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      // Refresh videos if upload was successful
      await this.loadVideos();
    }
  }

  navigateToVideo(videoId: string) {
    console.log('Navigating to video with ID:', videoId);
    this.router.navigate(['/tab-vid', videoId]);
  }
}