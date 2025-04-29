import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  isRecording: boolean = false; // Tracks recording state
  selectedMode: 'video' | 'template' = 'video'; // Tracks selected mode (Video or Template)
  showRecent: boolean = false; // Tracks whether to show the recent videos section

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  toggleRecording() {
    this.isRecording = !this.isRecording;
  }

  setMode(mode: 'video' | 'template') {
    this.selectedMode = mode;
    // Show the recent videos section when either "Video" or "Template" is selected
    this.showRecent = true;
  }

  close() {
    // Navigate back to Tab 1
    this.navCtrl.navigateBack('/tabs/tab1');
  }
}