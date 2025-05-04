import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab-vid',
  templateUrl: './tab-vid.page.html',
  styleUrls: ['./tab-vid.page.scss'],
  standalone: false, 
})
export class TabVidPage implements OnInit {

  title: string = '';
  artist: string = '';
  cover_artist: string = '';
  videoUrl: string = ''; // '/assets/videos/annie_wave_to_earth.mp4'; // Default or fetched

  constructor(){} // Inject ActivatedRoute if needed


  ngOnInit() {
    //   const videoId = params.get('videoId');
    //   this.loadVideoInfo(videoId);

    this.title= 'Annie'; // Set dynamically
    this.artist = 'Wave to Earth';
    this.cover_artist = 'j';

    this.videoUrl = '/assets/videos/annie_wave_to_earth.mp4';
  }
  send_alert(str: string ){
    alert(str);

  }


}
