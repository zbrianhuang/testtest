import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  isRecording: boolean = false;
  selectedMode: 'video' | 'template' = 'video';
  showRecent: boolean = false;
  hasRecorded: boolean = false;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
  }

  ionViewWillLeave() {
    this.isRecording = false;
    this.selectedMode = 'video';
    this.showRecent = false;
    this.hasRecorded = false;
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (!this.isRecording) {
      this.hasRecorded = true;
    }
  }

  setMode(mode: 'video' | 'template') {
    this.selectedMode = mode;
    this.showRecent = true;
  }

  showCamera() {
    this.showRecent = false;
  }

  async close() {
    if (this.hasRecorded) {
      const alert = await this.alertController.create({
        header: 'Do you want to discard this video?',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => {}
          },
          {
            text: 'Yes',
            handler: () => {
              this.navCtrl.navigateBack('/tabs/home_tab');
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.navCtrl.navigateBack('/tabs/home_tab');
    }
  }

  goToNext() {
    this.navCtrl.navigateForward('/tabs/video-editor');
  }
}