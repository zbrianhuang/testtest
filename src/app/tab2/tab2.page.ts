import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  isRecording: boolean = false; // Tracks recording state
  selectedMode: 'video' | 'template' = 'video'; // Tracks selected mode (Video or Template)

  constructor() {}

  ngOnInit() {}

  toggleRecording() {
    this.isRecording = !this.isRecording;
  }

  setMode(mode: 'video' | 'template') {
    this.selectedMode = mode;
  }

  close() {
    // Placeholder for closing the video camera (e.g., navigate back)
    console.log('Close button clicked');
  }
}