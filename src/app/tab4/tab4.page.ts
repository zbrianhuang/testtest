import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  conversations = [
    { user: 'AlexSmith', lastMessage: 'Just uploaded a new cover of "Bohemian Rhapsody"!' },
    { user: 'JamieLee', lastMessage: 'Can you share the sheet music for "Clair de Lune"?' },
    { user: 'SamTaylor', lastMessage: 'Check out my latest video update on jazz chords!' },
  ];

  constructor() {}

  ngOnInit() {}
}