import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';

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
  hasRecorded: boolean = false; // Tracks whether a recording has been completed

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    // Reset state when entering the page
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
  }

  ionViewWillLeave() {
    // Reset state when leaving the page
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    // Set hasRecorded to true when stopping a recording (i.e., transitioning from recording to stopped)
    if (!this.isRecording) {
      this.hasRecorded = true;
    }
  }

  setMode(mode: 'video' | 'template') {
    this.selectedMode = mode;
    // Show the grid for both "Video" and "Template" modes
    this.showRecent = true;
  }

  showCamera() {
    // Close the grid and show the camera preview
    this.showRecent = false;
  }

  async close() {
    if (this.hasRecorded) {
      // Show confirmation popup if a recording has been made
      const alert = await this.alertController.create({
        header: 'Do you want to discard this video?',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => {
              // Stay on the current page
            }
          },
          {
            text: 'Yes',
            handler: () => {
              // Navigate to home tab
              this.navCtrl.navigateBack('/tabs/home_tab');
            }
          }
        ]
      });
      await alert.present();
    } else {
      // Navigate back to home tab if no recording has been made
      this.navCtrl.navigateBack('/tabs/home_tab');
    }
  }

  goToNext() {
    // Placeholder for navigation after recording
    console.log('Next button clicked');
    // Optionally navigate to a preview or upload page
    // this.navCtrl.navigateForward('/path-to-next-page');
  }
}