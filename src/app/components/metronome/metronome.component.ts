import { Component, OnDestroy, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetronomeService } from '../../services/metronome.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-metronome',
  template: `
    <div class="metronome-wrapper" [class.collapsed]="!expanded">
      <div class="metronome-toggle" (click)="toggleExpanded()">
        <div class="single-beat-dot" [class.active]="isPlaying && currentBeat === 1"></div>
      </div>
      <div class="metronome-expanded" [@expandCollapse]="expanded ? 'expanded' : 'collapsed'">
        <div class="metronome-container">
          <div class="metronome-header">
            <h2>Tempo</h2>
          </div>
          <div class="tempo-visualization">
            <div class="beat-dots">
              <div class="beat-dot" *ngFor="let dot of [1,2,3,4]" 
                   [class.active]="isPlaying && currentBeat === dot"></div>
            </div>
          </div>
          <div class="tempo-controls">
            <ion-button fill="clear" (click)="decreaseTempo()">
              <ion-icon name="remove-outline"></ion-icon>
            </ion-button>
            <div class="tempo-display">
              <ion-icon name="musical-note-outline"></ion-icon>
              <span class="tempo-value">{{ tempo }}</span>
              <span class="tempo-unit">BPM</span>
            </div>
            <ion-button fill="clear" (click)="increaseTempo()">
              <ion-icon name="add-outline"></ion-icon>
            </ion-button>
          </div>
          <ion-button 
            class="play-button"
            [color]="isPlaying ? 'danger' : 'primary'"
            (click)="toggleMetronome()">
            <ion-icon [name]="isPlaying ? 'square' : 'play'"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      left: 16px;
      bottom: 120px;
      z-index: 1000;
    }

    .metronome-wrapper {
      display: flex;
      align-items: flex-start;
      
      &.collapsed {
        .metronome-expanded {
          width: 0;
          padding: 0;
          margin: 0;
          opacity: 0;
          pointer-events: none;
        }
      }
    }

    .metronome-toggle {
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      flex-shrink: 0;
      z-index: 2;
      width: 40px;
      height: 40px;
    }

    .single-beat-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      opacity: 0.5;
      transition: all 0.1s ease-in-out;

      &.active {
        opacity: 1;
        transform: scale(1.2);
        box-shadow: 0 0 20px var(--ion-color-primary);
      }
    }

    .metronome-expanded {
      margin-left: 12px;
      transition: all 0.3s ease-in-out;
      overflow: hidden;
    }

    .metronome-container {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;
      width: 280px;
    }

    .metronome-header {
      text-align: center;
      margin-bottom: 16px;
      h2 {
        color: white;
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    .tempo-visualization {
      margin: 20px 0;
    }

    .beat-dots {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .beat-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      opacity: 0.5;
      transition: all 0.1s ease-in-out;

      &.active {
        opacity: 1;
        transform: scale(1.2);
        box-shadow: 0 0 20px var(--ion-color-primary);
      }
    }

    .tempo-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 8px;
      margin-bottom: 16px;
    }

    .tempo-display {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      font-size: 1.2em;
      min-width: 120px;
      justify-content: center;

      .tempo-value {
        font-size: 1.4em;
        font-weight: bold;
      }

      .tempo-unit {
        font-size: 0.8em;
        opacity: 0.8;
      }
    }

    ion-button {
      --padding-start: 8px;
      --padding-end: 8px;
      --color: white;
    }

    .play-button {
      width: 60px;
      height: 60px;
      --border-radius: 50%;
      margin: 0 auto;
      display: block;

      ion-icon {
        font-size: 24px;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        width: '0',
        padding: '0',
        margin: '0',
        opacity: '0'
      })),
      state('expanded', style({
        width: '*',
        opacity: '1'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class MetronomeComponent implements OnDestroy {
  tempo: number = 120;
  isPlaying: boolean = false;
  expanded: boolean = false;
  currentBeat: number = 1;
  private beatInterval: any;

  constructor(
    private metronomeService: MetronomeService,
    private ngZone: NgZone
  ) {
    this.metronomeService.bpm.subscribe(bpm => {
      this.tempo = bpm;
      if (this.isPlaying) {
        this.restartBeatVisualization();
      }
    });
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  toggleMetronome() {
    this.ngZone.runOutsideAngular(() => {
      if (this.isPlaying) {
        this.metronomeService.stop();
        this.stopBeatVisualization();
      } else {
        this.metronomeService.start();
        this.startBeatVisualization();
      }
      this.ngZone.run(() => {
        this.isPlaying = !this.isPlaying;
      });
    });
  }

  increaseTempo() {
    this.metronomeService.setTempo(this.tempo + 5);
  }

  decreaseTempo() {
    this.metronomeService.setTempo(this.tempo - 5);
  }

  private startBeatVisualization() {
    if (this.beatInterval) {
      this.stopBeatVisualization();
    }

    this.ngZone.runOutsideAngular(() => {
      this.currentBeat = 1;
      const beatLength = 60 / this.tempo * 1000;
      
      this.beatInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.currentBeat = this.currentBeat % 4 + 1;
        });
      }, beatLength);
    });
  }

  private stopBeatVisualization() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    this.currentBeat = 1;
  }

  private restartBeatVisualization() {
    this.stopBeatVisualization();
    if (this.isPlaying) {
      this.startBeatVisualization();
    }
  }

  ngOnDestroy() {
    this.metronomeService.stop();
    this.stopBeatVisualization();
  }
} 