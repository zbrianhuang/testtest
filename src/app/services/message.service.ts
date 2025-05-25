import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  sender: 'user' | 'other';
  isEdited: boolean;
}

export interface Conversation {
  id: string;
  user: string;
  messages: Message[];
  unread: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private conversations: Conversation[] = [
    { 
      id: '1', 
      user: 'AlexSmith', 
      messages: [
        { id: '1-1', text: 'Just uploaded a new cover of "Bohemian Rhapsody"!', timestamp: Date.now() - 3600000, sender: 'other', isEdited: false }
      ],
      unread: true 
    },
    { 
      id: '2', 
      user: 'JamieLee', 
      messages: [
        { id: '2-1', text: 'Can you share the sheet music for "Clair de Lune"?', timestamp: Date.now() - 7200000, sender: 'other', isEdited: false }
      ],
      unread: true 
    },
    { 
      id: '3', 
      user: 'SamTaylor', 
      messages: [
        { id: '3-1', text: 'Check out my latest video update on jazz chords!', timestamp: Date.now() - 14400000, sender: 'other', isEdited: false }
      ],
      unread: true 
    },
  ];

  private conversationsSubject = new BehaviorSubject<Conversation[]>(this.conversations);
  conversations$ = this.conversationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(this.getUnreadCount());
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadFromLocalStorage();
  }

  getConversations() {
    return this.conversationsSubject.getValue();
  }

  getConversation(id: string) {
    return this.conversations.find(conv => conv.id === id);
  }

  markAsRead(id: string) {
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      this.conversations[index].unread = false;
      this.conversationsSubject.next([...this.conversations]);
      this.updateUnreadCount();
      this.saveToLocalStorage();
    }
  }

  sendMessage(conversationId: string, text: string) {
    const index = this.conversations.findIndex(conv => conv.id === conversationId);
    if (index !== -1) {
      const newMessage: Message = {
        id: `${conversationId}-${Date.now()}`,
        text,
        timestamp: Date.now(),
        sender: 'user',
        isEdited: false
      };
      
      this.conversations[index].messages.push(newMessage);
      this.conversationsSubject.next([...this.conversations]);
      this.saveToLocalStorage();
      return newMessage;
    }
    return null;
  }

  editMessage(conversationId: string, messageId: string, newText: string) {
    const convIndex = this.conversations.findIndex(conv => conv.id === conversationId);
    if (convIndex !== -1) {
      const msgIndex = this.conversations[convIndex].messages.findIndex(msg => msg.id === messageId);
      if (msgIndex !== -1 && this.conversations[convIndex].messages[msgIndex].sender === 'user') {
        this.conversations[convIndex].messages[msgIndex].text = newText;
        this.conversations[convIndex].messages[msgIndex].isEdited = true;
        this.conversationsSubject.next([...this.conversations]);
        this.saveToLocalStorage();
        return true;
      }
    }
    return false;
  }

  deleteMessage(conversationId: string, messageId: string) {
    const convIndex = this.conversations.findIndex(conv => conv.id === conversationId);
    if (convIndex !== -1) {
      const msgIndex = this.conversations[convIndex].messages.findIndex(msg => msg.id === messageId);
      if (msgIndex !== -1 && this.conversations[convIndex].messages[msgIndex].sender === 'user') {
        this.conversations[convIndex].messages.splice(msgIndex, 1);
        this.conversationsSubject.next([...this.conversations]);
        this.saveToLocalStorage();
        return true;
      }
    }
    return false;
  }

  private getUnreadCount(): number {
    return this.conversations.filter(conv => conv.unread).length;
  }

  private updateUnreadCount() {
    this.unreadCountSubject.next(this.getUnreadCount());
  }

  private saveToLocalStorage() {
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
  }

  private loadFromLocalStorage() {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      try {
        this.conversations = JSON.parse(savedConversations);
        this.conversationsSubject.next([...this.conversations]);
        this.updateUnreadCount();
      } catch (e) {
        console.error('Error loading conversations from localStorage', e);
      }
    }
  }
} 