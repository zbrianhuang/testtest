import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, Conversation, Message } from '../services/message.service';
import { IonicModule, AlertController, ActionSheetController, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-conversation-detail',
  templateUrl: './conversation-detail.page.html',
  styleUrls: ['./conversation-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ConversationDetailPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  
  conversation: Conversation | undefined;
  newMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.conversation = this.messageService.getConversation(id);
      this.messageService.markAsRead(id);
    } else {
      this.router.navigate(['/tabs/tab4']);
    }
  }

  ionViewDidEnter() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation) return;
    
    this.messageService.sendMessage(this.conversation.id, this.newMessage);
    this.newMessage = '';
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  async showEditOptions(message: Message) {
    if (!this.conversation) return;
    
    const actionSheet = await this.actionSheetController.create({
      header: 'Message Options',
      buttons: [
        {
          text: 'Edit',
          icon: 'pencil',
          handler: () => {
            this.showEditPrompt(message);
          }
        },
        {
          text: 'Delete',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.showDeleteConfirm(message);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async showEditPrompt(message: Message) {
    if (!this.conversation) return;
    
    const alert = await this.alertController.create({
      header: 'Edit Message',
      inputs: [
        {
          name: 'messageText',
          type: 'text',
          value: message.text,
          placeholder: 'Edit your message'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.messageText.trim() && data.messageText !== message.text) {
              this.messageService.editMessage(this.conversation!.id, message.id, data.messageText);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showDeleteConfirm(message: Message) {
    if (!this.conversation) return;
    
    const alert = await this.alertController.create({
      header: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.messageService.deleteMessage(this.conversation!.id, message.id);
          }
        }
      ]
    });

    await alert.present();
  }

  private scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(300);
    }
  }
} 