import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  conversations = [
    { user: 'user1', lastMessage: 'blablablablabla' },
    { user: 'user1', lastMessage: 'blablablablabla' },
    { user: 'user1', lastMessage: 'blablablablabla' },
  ];

  constructor() {}

  ngOnInit() {}
}