// tab-vid.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular'; 
import { S3Service } from '../services/s3.service';

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

  constructor(
    private route: ActivatedRoute,
    private s3Service: S3Service
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
      // First try to load from localStorage
      const savedVideos = localStorage.getItem('uploadedVideos');
      const uploadedVideos = savedVideos ? JSON.parse(savedVideos) : [];
      
      // Find the video with matching ID
      let videoData = uploadedVideos.find((video: any) => video.id === id);

      // If not found in localStorage, try the local db
      if (!videoData) {
        videoData = db.find(video => video.id === id);
      }

      if (videoData) {
        this.title = videoData.title;
        this.artist = videoData.artist || '';
        this.cover_artist = videoData.cover_artist || '';
        this.description = videoData.description || '';
        
        // If the video is from S3, get signed URL
        if (videoData.videoUrl.startsWith('s3://')) {
          this.videoUrl = await this.s3Service.getVideoUrl(videoData.videoUrl);
        } else {
          this.videoUrl = videoData.videoUrl;
        }
      } else {
        console.error(`Video with ID ${id} not found!`);
        this.title = 'Error: Video not found';
      }
    } catch (error) {
      console.error('Error loading video:', error);
      this.title = 'Error loading video';
    }
  }

  like_video() {
    this.liked = !this.liked;
  }

  save_video() {
    this.saved = !this.saved;
    console.log("saved:", this.saved);
  }

  send_alert(str: string) {
    alert(str);
  }
}