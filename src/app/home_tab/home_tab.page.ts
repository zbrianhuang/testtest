import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from 'src/app/search/search.component';
import { IonicModule, ModalController } from '@ionic/angular';

//not good
import {
  IonContent,
  IonHeader,
  IonBackButton,
  IonButton,
  IonButtons,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Video {
  title: string;
  description: string;
  thumbnailUrl: string;
  id:string;
}
interface Gallery_Title{
  title:string;
}
@Component({
  selector: 'app-hometab',
  templateUrl: 'home_tab.page.html',
  styleUrls: ['home_tab.page.scss'],
  standalone: true,
  
  imports: [IonicModule, FormsModule, CommonModule]
})
export class HomeTabPage implements OnInit{
/*  videos: Video[] = [
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
  */
  selectedSegment: string = 'discover';
  titles : Gallery_Title[]=
  [
    {
      title: 'Trending'
    },
    {
      title: 'Pop'
    },
    {
      title:'Rock'
    },
    {
      title:'lala'
    },
    {
      title: 'sdf'
    }
  ]
   
  videos: Video[][] = [
    [
      {
        title: 'Video title 1',
        description: 'Video info 1',
        thumbnailUrl: '../../assets/thumbnails/placeholder.jpeg',
        id: "a"
      },
      {
        title: 'Video title 2',
        description: 'Video info 2',
        thumbnailUrl: 'assets/thumbnails/placeholder2.JPG'
        ,id: "a"
      },{
        title: 'Video title 1',
        description: 'Video info 1',
        thumbnailUrl: '../../assets/thumbnails/placeholder.jpeg'
        ,id: "a"
      },
      {
        title: 'Video title 2',
        description: 'Video info 2',
        thumbnailUrl: 'assets/thumbnails/placeholder2.JPG'
        ,id: "a"
      },
    ],
    [
      {
        title: 'Video title 3',
        description: 'Video info 3',
        thumbnailUrl: 'assets/thumbnails/placeholder.jpeg'
        ,id: "a"
      },
      {
        title: 'Video title 4',
        description: 'Video info 4',
        thumbnailUrl: '../../assets/thumbnails/placeholder.jpeg'
        ,id: "a"
      },
    ],

  ];

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