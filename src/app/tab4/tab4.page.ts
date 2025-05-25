import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, Conversation } from '../services/message.service';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  conversations: Conversation[] = [];

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.messageService.conversations$.subscribe(conversations => {
      this.conversations = conversations;
    });
  }

  openConversation(id: string) {
    this.router.navigate(['/conversation', id]);
  }
}