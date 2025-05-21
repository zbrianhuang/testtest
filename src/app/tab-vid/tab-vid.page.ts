// tab-vid.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Import Router
import { CommonModule } from '@angular/common'; 
import { IonicModule, LoadingController } from '@ionic/angular'; 
import { S3Service } from '../services/s3.service';
import { VideoMetadataService, VideoMetadata } from '../services/video-metadata.service';

const db = [
    { id: "vid-001", title: 'annie.', artist: 'wave to earth', cover_artist: 'jim', videoUrl: '/assets/videos/annie_wave_to_earth.mp4', description: '#cover #guitar #vocal' },
    { id: "vid-002", title: '', artist: '', cover_artist: 'B', videoUrl: '/assets/videos/placeholder.MP4', description: '' },
    { id: "vid-003", title: '',artist: '', cover_artist: 'C', videoUrl: '/assets/videos/placeholder.mp4', description: '' },
    { id: "vid-004", title: '', artist: '', cover_artist: 'D', videoUrl: '/assets/videos/placeholder.mp4', description: '' },
    { id: "vid-005", title: '', artist: '', cover_artist: 'E', videoUrl: '/assets/videos/placeholder.mp4', description: '' },
];

@Component({
  selector: 'app-tab-vid',
  templateUrl: './tab-vid.page.html',
  styleUrls: ['./tab-vid.page.scss'],
  standalone: false, 
})
export class TabVidPage implements OnInit {

  videoId: string | null = null;
  title: string = 'Loading...';
  artist: string = '';
  cover_artist: string = '';
  videoUrl: string = '';
  description: string = ''; 
  liked: boolean = false;
  saved: boolean = false;
  views: number = 0;
  likes: number = 0;
  videoData: VideoMetadata | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private s3Service: S3Service,
    private metadataService: VideoMetadataService,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    // Get the 'id' parameter from the URL snapshot
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    this.videoId = idFromRoute;

    if (this.videoId) {
      console.log('Loading video for ID:', this.videoId);
      await this.loadVideoInfo(this.videoId);
    } else {
      console.error('No video ID found in route parameters!');
      this.title = 'Error: Video not found';
      // Optionally navigate back or show an error message
    }
  }

  async loadVideoInfo(id: string) {
    try {
      this.videoData = await this.metadataService.getVideo(id);
      
      if (this.videoData) {
        this.title = this.videoData.title;
        this.artist = this.videoData.artist;
        this.cover_artist = this.videoData.coverArtist;
        this.description = this.videoData.description;
        this.views = this.videoData.views;
        this.likes = this.videoData.likes;
        
        // Get the video URL from S3
        this.videoUrl = await this.s3Service.getVideoUrl(this.videoData.s3Key);
        
        // Increment view count
        this.views = await this.metadataService.incrementViews(id);
      } else {
        console.error(`Video with ID ${id} not found!`);
        this.title = 'Error: Video not found';
      }
    } catch (error) {
      console.error('Error loading video:', error);
      this.title = 'Error loading video';
    }
  }

  async like_video() {
    if (this.videoId) {
      this.likes = await this.metadataService.incrementLikes(this.videoId);
      this.liked = !this.liked;
    }
  }

  save_video() {
    this.saved = !this.saved;
    console.log("saved:", this.saved);
  }

  async editVideo() {
    if (!this.videoId || !this.videoData) {
      alert('Cannot edit this video. Video data not available.');
      return;
    }

    try {
      // Show loading indicator
      const loading = await this.loadingCtrl.create({
        message: 'Preparing video for editing...'
      });
      await loading.present();

      // Create a blob URL from the video URL for editing
      // We need to fetch the video to create a Blob object
      const response = await fetch(this.videoUrl);
      const videoBlob = await response.blob();
      
      // Create a File object from the Blob
      const fileName = this.videoData.s3Key.split('/').pop() || 'video.mp4';
      const videoFile = new File([videoBlob], fileName, { type: 'video/mp4' });

      loading.dismiss();

      // Navigate to the video editor with the video file and metadata
      this.router.navigate(['/tabs/video-editor'], {
        state: { 
          videoFile: videoFile,
          videoMetadata: {
            id: this.videoId,
            title: this.title,
            artist: this.artist,
            coverArtist: this.cover_artist,
            description: this.description,
            isExistingVideo: true
          }
        }
      });
    } catch (error) {
      console.error('Error preparing video for editing:', error);
      alert('Failed to prepare video for editing. Please try again.');
    }
  }

  send_alert(str: string) {
    alert(str);
  }
}