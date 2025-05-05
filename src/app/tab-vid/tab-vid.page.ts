// tab-vid.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular'; 

const db = [
    { id: "vid-001", title: 'annie.', artist: 'wave to earth', cover_artist: 'jim', videoUrl: '/assets/videos/annie_wave_to_earth.mp4', description: '#cover #guitar #vocal' },
    { id: "vid-002", title: '', artist: '', cover_artist: 'B', videoUrl: '/assets/videos/placeholder_video_1.mp4', description: '' },
    { id: "vid-003", title: '',artist: '', cover_artist: 'C', videoUrl: '/assets/videos/placeholder_video_2.mp4', description: '' },
    { id: "vid-004", title: '', artist: '', cover_artist: 'D', videoUrl: '/assets/videos/placeholder_video_3.mp4', description: '' },
    { id: "vid-005", title: '', artist: '', cover_artist: 'E', videoUrl: '/assets/videos/placeholder_video_4.mp4', description: '' },
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

  // Inject ActivatedRoute
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get the 'id' parameter from the URL snapshot
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    this.videoId = idFromRoute;

    if (this.videoId) {
      console.log('Loading video for ID:', this.videoId);
      this.loadVideoInfo(this.videoId);
    } else {
      console.error('No video ID found in route parameters!');
      this.title = 'Error: Video not found';
      // Optionally navigate back or show an error message
    }
  }

  loadVideoInfo(id: string) {
    const videoData = db.find(video => video.id === id);

    if (videoData) {
      this.title = videoData.title;
      this.artist = videoData.artist;
      this.cover_artist = videoData.cover_artist; 
      this.videoUrl = videoData.videoUrl;
      this.description = videoData.description; 
    } else {
      console.error(`Video with ID ${id} not found in fake database!`);
      this.title = 'Error: Video details not found';
      this.artist = '';
      this.cover_artist = '';
      this.videoUrl = '';
      this.description = '';
    }
  }

  send_alert(str: string) {
    alert(str);
  }
}