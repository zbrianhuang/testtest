import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { NavController } from '@ionic/angular';
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

  // ← Updated to use your video file
  videoSrc = 'assets/videos/annie_wave_to_earth.mp4';

  isPlaying = false;
  duration = 0;
  currentTime = 0;
  startTime = 0;
  endTime = 0;

  constructor(private navCtrl: NavController) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const vid = this.videoPlayer.nativeElement;

    vid.onloadedmetadata = () => {
      this.duration = vid.duration;
    };

    vid.ontimeupdate = () => {
      this.currentTime = vid.currentTime;
    };
  }

  togglePlay() {
    const vid = this.videoPlayer.nativeElement;
    if (this.isPlaying) {
      vid.pause();
    } else {
      vid.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  seek(event: any) {
    this.videoPlayer.nativeElement.currentTime = event.detail.value;
  }

  markStart() {
    this.startTime = this.currentTime;
    alert(`Start marked at ${this.startTime.toFixed(1)}s`);
  }

  markEnd() {
    this.endTime = this.currentTime;
    alert(`End marked at ${this.endTime.toFixed(1)}s`);
  }

  exportVideo() {
    alert(
      `Exporting clip from ${this.startTime.toFixed(1)}s to ${this.endTime.toFixed(
        1
      )}s…`
    );
  }
}