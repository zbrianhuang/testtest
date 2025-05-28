import { Component, OnDestroy, NgZone, HostListener } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetronomeService } from '../../services/metronome.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-metronome',
  template: `
    <div class="metronome-wrapper" 
         [class.collapsed]="!expanded"
         [style.left.px]="position.x"
         [style.top.px]="position.y"
         (mousedown)="startDrag($event)"
         (touchstart)="startDrag($event)">
      <div class="metronome-toggle" (click)="toggleExpanded($event)" (touchstart)="handleTouchStart($event)">
        <div class="single-beat-dot" [class.active]="isPlaying && currentBeat === 1"></div>
        <span class="metronome-label">BPM</span>
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
            <ion-button fill="clear" (click)="decreaseTempo($event)" (touchstart)="handleButtonTouchStart($event, 'decrease')">
              <ion-icon name="remove-outline"></ion-icon>
            </ion-button>
            <div class="tempo-display">
              <ion-icon name="musical-note-outline"></ion-icon>
              <span class="tempo-value">{{ tempo }}</span>
              <span class="tempo-unit">BPM</span>
            </div>
            <ion-button fill="clear" (click)="increaseTempo($event)" (touchstart)="handleButtonTouchStart($event, 'increase')">
              <ion-icon name="add-outline"></ion-icon>
            </ion-button>
          </div>
          <ion-button 
            class="play-button"
            [color]="isPlaying ? 'danger' : 'primary'"
            (click)="toggleMetronome($event)"
            (touchstart)="handleButtonTouchStart($event, 'toggle')">
            <ion-icon [name]="isPlaying ? 'square' : 'play'"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      z-index: 9999999;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .metronome-wrapper {
      display: flex;
      align-items: flex-start;
      position: absolute;
      cursor: move; /* Show move cursor */
      pointer-events: auto;
      
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
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      flex-shrink: 0;
      z-index: 2;
      width: 60px;
      height: 60px;
      border: 3px solid var(--ion-color-danger);
      box-shadow: 0 0 15px rgba(255, 73, 97, 0.8);
      pointer-events: auto;
      touch-action: auto;
    }

    .metronome-label {
      color: white;
      font-size: 12px;
      margin-top: 4px;
      font-weight: bold;
    }

    .single-beat-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ion-color-danger);
      opacity: 0.5;
      transition: all 0.1s ease-in-out;

      &.active {
        opacity: 1;
        transform: scale(1.2);
        box-shadow: 0 0 20px var(--ion-color-danger);
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

  // Dragging properties
  position = { x: 20, y: window.innerHeight - 200 }; // Position near bottom of screen
  private isDragging = false;
  private startPosition = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };

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

  // Handle touchstart for the toggle button
  handleTouchStart(event: TouchEvent) {
    event.stopPropagation(); // Stop propagation to prevent dragging
    event.preventDefault(); // Prevent default touch behavior
    
    // Determine if this is a drag attempt or a toggle action
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    // Set a small timeout to determine if it's a drag or a tap
    const touchTimer = setTimeout(() => {
      this.toggleExpanded(event);
    }, 150);
    
    // Set up touch move listener to cancel the toggle if it's a drag
    const touchMoveListener = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const deltaX = Math.abs(moveTouch.clientX - startX);
      const deltaY = Math.abs(moveTouch.clientY - startY);
      
      // If the user moved their finger, it's a drag, not a tap
      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(touchTimer);
        document.removeEventListener('touchmove', touchMoveListener);
        document.removeEventListener('touchend', touchEndListener);
      }
    };
    
    // Clean up on touch end
    const touchEndListener = () => {
      clearTimeout(touchTimer);
      document.removeEventListener('touchmove', touchMoveListener);
      document.removeEventListener('touchend', touchEndListener);
    };
    
    // Add event listeners
    document.addEventListener('touchmove', touchMoveListener);
    document.addEventListener('touchend', touchEndListener);
  }
  
  // Handle touchstart for buttons within the metronome
  handleButtonTouchStart(event: TouchEvent, action: 'increase' | 'decrease' | 'toggle') {
    event.stopPropagation(); // Stop propagation to prevent dragging
    event.preventDefault(); // Prevent default touch behavior
    
    // Based on the action, call the appropriate method
    if (action === 'increase') {
      this.increaseTempo(event);
    } else if (action === 'decrease') {
      this.decreaseTempo(event);
    } else if (action === 'toggle') {
      this.toggleMetronome(event);
    }
  }

  toggleExpanded(event?: MouseEvent | TouchEvent) {
    if (event) {
      event.stopPropagation(); // Prevent event bubbling to avoid triggering drag
    }
    this.expanded = !this.expanded;
  }

  toggleMetronome(event?: MouseEvent | TouchEvent) {
    if (event) {
      event.stopPropagation(); // Prevent event bubbling to avoid triggering drag
    }
    this.ngZone.runOutsideAngular(() => {
      if (this.isPlaying) {
        this.metronomeService.stop();
        this.stopBeatVisualization();
      } else {
        this.metronomeService.start(this.tempo);
        this.startBeatVisualization();
      }
      this.isPlaying = !this.isPlaying;
    });
  }

  increaseTempo(event?: MouseEvent | TouchEvent) {
    if (event) {
      event.stopPropagation(); // Prevent event bubbling to avoid triggering drag
    }
    this.metronomeService.increaseTempo();
  }

  decreaseTempo(event?: MouseEvent | TouchEvent) {
    if (event) {
      event.stopPropagation(); // Prevent event bubbling to avoid triggering drag
    }
    this.metronomeService.decreaseTempo();
  }

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;
    
    // Store the initial position where the drag started
    if (event instanceof MouseEvent) {
      this.startPosition.x = event.clientX;
      this.startPosition.y = event.clientY;
    } else {
      // TouchEvent
      this.startPosition.x = event.touches[0].clientX;
      this.startPosition.y = event.touches[0].clientY;
    }
    
    // Calculate the offset from the top-left corner of the element
    this.dragOffset.x = this.position.x - this.startPosition.x;
    this.dragOffset.y = this.position.y - this.startPosition.y;
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    
    let clientX: number;
    let clientY: number;
    
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      // TouchEvent
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    
    // Calculate new position
    this.position.x = clientX + this.dragOffset.x;
    this.position.y = clientY + this.dragOffset.y;
    
    // Ensure metronome stays within the window boundaries
    this.position.x = Math.max(0, Math.min(window.innerWidth - 50, this.position.x));
    this.position.y = Math.max(0, Math.min(window.innerHeight - 50, this.position.y));
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopDrag() {
    this.isDragging = false;
  }

  private startBeatVisualization() {
    this.ngZone.runOutsideAngular(() => {
      // Clear any existing interval
      this.stopBeatVisualization();

      // Start new interval based on tempo
      const beatDuration = 60000 / this.tempo; // Convert BPM to ms
      this.beatInterval = setInterval(() => {
        this.currentBeat = this.currentBeat % 4 + 1;
        this.ngZone.run(() => {}); // Force UI update
      }, beatDuration);
    });
  }

  private stopBeatVisualization() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }

  private restartBeatVisualization() {
    this.stopBeatVisualization();
    this.startBeatVisualization();
  }

  ngOnDestroy() {
    this.stopBeatVisualization();
  }
} 