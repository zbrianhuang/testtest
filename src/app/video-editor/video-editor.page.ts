import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.page.html',
  styleUrls: ['./video-editor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule] // Import necessary modules for Ionic components and *ngFor
})
export class VideoEditorPage implements OnInit {
  constructor(private navCtrl: NavController) {}

  ngOnInit() {}
}