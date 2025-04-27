import { Component, OnInit} from '@angular/core';
interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
}
@Component({
  selector: 'app-hometab',
  templateUrl: 'home_tab.page.html',
  styleUrls: ['home_tab.page.scss'],
  standalone: false,
})
export class HomeTabPage implements OnInit{
  videos: Video[] = [
    {
      title: 'Video title',
      description: 'video info ',
      thumbnailUrl: '../../assets/thumbnails/placeholder.jpeg'
    },
    {
      title: 'Video title',
      description: 'Plce holder.',
      thumbnailUrl: 'assets/thumbnails/placeholder2.JPG'
    },
    {
      title: 'Video title',
      description: 'SDLKFJL',
      thumbnailUrl: 'assets/thumbnails/placeholder.jpeg'
    },
    {
      title: 'Video title',
      description: 'video info ',
      thumbnailUrl: '../../assets/thumbnails/placeholder.jpeg'
    },
    {
      title: 'Video title',
      description: 'Plce holder.',
      thumbnailUrl: 'assets/thumbnails/placeholder2.JPG'
    },
    {
      title: 'Video title',
      description: 'SDLKFJL',
      thumbnailUrl: 'assets/thumbnails/placeholder.jpeg'
    }
  ];
  constructor() {}

  ngOnInit() {
    // Optionally load or refresh videos here.
  }
}

/*
import { Component, OnInit } from '@angular/core';

interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
}
@Component({
  selector: 'app-hometab',
  templateUrl: 'home_tab.page.html',
  styleUrls: ['home_tab.page.scss'],
  standalone: false,
})

export class HomePage implements OnInit {
  videos: Video[] = [
    {
      title: 'Video 1',
      description: 'This is the description for Video 1.',
      thumbnailUrl: 'assets/thumbnails/placeholder.jpg'
    },
    {
      title: 'Video 2',
      description: 'This is the description for Video 2.',
      thumbnailUrl: 'assets/thumbnails/placeholder.jpg'
    },
    {
      title: 'Video 3',
      description: 'This is the description for Video 3.',
      thumbnailUrl: 'assets/thumbnails/.jpg'
    }
  ];

  constructor() {}

  ngOnInit() {
    // Optionally load or refresh videos here.
  }
}
*/