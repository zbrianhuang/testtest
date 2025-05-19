import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetronomeService {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private tempo = 120;
  private intervalId: any = null;

  public bpm = new BehaviorSubject<number>(120);

  constructor() {
    this.audioContext = new AudioContext();
  }

  setTempo(bpm: number) {
    this.tempo = Math.min(Math.max(bpm, 30), 250); // Limit BPM between 30 and 250
    this.bpm.next(this.tempo);
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const beatLength = 60 / this.tempo;

    this.intervalId = setInterval(() => {
      this.playClick();
    }, beatLength * 1000);

    this.playClick(); // Play first beat immediately
  }

  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.oscillator?.stop();
    this.oscillator = null;
  }

  private playClick() {
    // Create and configure oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();
    
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    this.oscillator.frequency.value = 1000;
    this.gainNode.gain.value = 0.1;
    
    // Schedule the click sound
    const now = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0.1, now);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    this.oscillator.start(now);
    this.oscillator.stop(now + 0.05);
  }

  getTempo(): number {
    return this.tempo;
  }

  isMetronomePlaying(): boolean {
    return this.isPlaying;
  }
} 