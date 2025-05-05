import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab3Page implements OnInit {
  
  //Preset videos (not deletable)
  presetVideos = [
    {
      title: '[sheet] annie. / wave to earth',
      thumbnail: 'assets/thumbnails/annie_thumb.png',
      hashtags: '#acousticguitar#fullsongcover · 3 days ago',
      likes: 100,
      comments: 20,
      canDelete: false,
    },
    {
      title: '[sheet] Dear Heartless / EggPlantEgg',
      thumbnail: 'assets/icon/post2.png',
      hashtags: '#guitar#solochallenge · 2 weeks ago',
      likes: 100,
      comments: 20,
      canDelete: false,
    },
    {
      title: '[sheet] Start / Depapepe',
      thumbnail: 'assets/icon/post3.jpg',
      hashtags: '#guitar#fullsongcover · 1 month ago',
      likes: 100,
      comments: 20,
      canDelete: false,
    },
  ];

  //User-uploaded videos (can be deleted)
  uploadedVideos: any[] = [];

  constructor() {}

  ngOnInit() {
    // Load uploaded videos from localStorage
    const saved = localStorage.getItem('uploadedVideos');
    if (saved) {
      this.uploadedVideos = JSON.parse(saved);
    }
  }

  //Delete user-uploaded video only
  deleteVideo(video: any) {
    this.uploadedVideos = this.uploadedVideos.filter(v => v !== video);
    localStorage.setItem('uploadedVideos', JSON.stringify(this.uploadedVideos));
  }

  //Combine all videos for display
  get allVideos() {
    return [...this.presetVideos, ...this.uploadedVideos];
  }
}
