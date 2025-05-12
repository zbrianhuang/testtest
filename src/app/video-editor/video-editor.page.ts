import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

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
  trimStart = 0;
  trimEnd = 0;

  startTime: number | null = null;
  endTime: number | null = null;

  // Properties for the template picture
  selectedTemplateImage: string | null = null;
  templateImagePosition: { top: number; left: number } = { top: 10, left: 10 }; // Default position

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private elementRef: ElementRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Retrieve navigation state
    this.route.queryParams.subscribe(() => {
      const navigation = this.navCtrl['router'].getCurrentNavigation();
      if (navigation?.extras?.state) {
        this.selectedTemplateImage = navigation.extras.state['selectedTemplateImage'] || null;
        this.templateImagePosition = navigation.extras.state['templateImagePosition'] || { top: 10, left: 10 };
      }
    });
  }

  ngAfterViewInit() {
    const vid = this.videoPlayer.nativeElement;
    vid.onloadedmetadata = () => {
      this.duration = vid.duration;
      this.trimEnd = this.duration; // Initialize trimEnd to the video duration
    };
    vid.ontimeupdate = () => (this.currentTime = vid.currentTime);

    // Get timeline dimensions after view initialization
    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    const rect = timeline.getBoundingClientRect();
    this.timelineWidth = rect.width;
    this.timelineLeft = rect.left;
  }

  togglePlay() {
    const vid = this.videoPlayer.nativeElement;
    this.isPlaying ? vid.pause() : vid.play();
    this.isPlaying = !this.isPlaying;
  }

  seek(event: any) {
    this.videoPlayer.nativeElement.currentTime = event.target.value;
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

  // Properties and methods for trimming (unchanged from previous implementation)
  private isDragging: boolean = false;
  private dragType: 'start' | 'end' | null = null;
  private timelineWidth: number = 0;
  private timelineLeft: number = 0;

  startTrim(event: MouseEvent, type: 'start' | 'end') {
    event.preventDefault();
    this.isDragging = true;
    this.dragType = type;

    const timeline = this.elementRef.nativeElement.querySelector('.timeline');
    const rect = timeline.getBoundingClientRect();
    this.timelineWidth = rect.width;
    this.timelineLeft = rect.left;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.dragType) return;

    const vid = this.videoPlayer.nativeElement;
    const x = event.clientX - this.timelineLeft;
    let newTime = (x / this.timelineWidth) * this.duration;

    if (this.dragType === 'start') {
      newTime = Math.max(0, Math.min(newTime, this.trimEnd - 0.1));
      this.trimStart = newTime;
      if (this.currentTime < this.trimStart) {
        this.currentTime = this.trimStart;
        vid.currentTime = this.currentTime;
      }
    } else if (this.dragType === 'end') {
      newTime = Math.min(this.duration, Math.max(newTime, this.trimStart + 0.1));
      this.trimEnd = newTime;
      if (this.currentTime > this.trimEnd) {
        this.currentTime = this.trimEnd;
        vid.currentTime = this.currentTime;
      }
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.dragType = null;
  }
}