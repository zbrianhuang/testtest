import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.page.html',
  styleUrls: ['./video-editor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VideoEditorPage implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer', { static: true })
  videoPlayer!: ElementRef<HTMLVideoElement>;

  videoSrc = 'assets/videos/annie_wave_to_earth.mp4';
  isPlaying = false;
  isMuted = false;
  duration = 0;
  currentTime = 0;

  startTime: number | null = null;
  endTime: number | null = null;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const vid = this.videoPlayer.nativeElement;
    vid.onloadedmetadata = () => (this.duration = vid.duration);
    vid.ontimeupdate = () => (this.currentTime = vid.currentTime);
  }

  togglePlay() {
    const vid = this.videoPlayer.nativeElement;
    this.isPlaying ? vid.pause() : vid.play();
    this.isPlaying = !this.isPlaying;
  }

  seek(event: any) {
    this.videoPlayer.nativeElement.currentTime = event.detail.value;
  }

  markInOut() {
    if (this.startTime === null) {
      this.startTime = this.currentTime;
      alert(`Start marked at ${this.startTime.toFixed(1)}s`);
    } else if (this.endTime === null) {
      this.endTime = this.currentTime;
      alert(`End marked at ${this.endTime.toFixed(1)}s`);
      this.splitClip();
    } else {
      alert('Start and end already marked.');
    }
  }

  splitClip() {
    alert(
      `Splitting clip from ${this.startTime!.toFixed(1)}s to ${this.endTime!.toFixed(1)}s…`
    );
  }

  exportVideo() {
    this.navCtrl.navigateForward('/upload-info');
  }

  toggleSpeed() { alert('Speed control (stub)'); }
  rotateClip() { alert('Rotate clip (stub)'); }
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.videoPlayer.nativeElement.muted = this.isMuted;
  }

  /** 
   * Called by the back-chevron. 
   * If any progress (mark start/end) exists, asks to discard.
   * Otherwise just navigates back.
   */
  async closeEditor() {
    if (this.startTime !== null || this.endTime !== null) {
      const alert = await this.alertController.create({
        header: 'Do you want to discard your progress?',
        buttons: [
          { text: 'No', role: 'cancel' },
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
}