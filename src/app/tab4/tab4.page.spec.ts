import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tab4Page } from './tab4.page';
import { IonicModule } from '@ionic/angular';

describe('Tab4Page', () => {
  let component: Tab4Page;
  let fixture: ComponentFixture<Tab4Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tab4Page],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab4Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a conversations array with 3 items', () => {
    expect(component.conversations.length).toBe(3);
    expect(component.conversations[0].user).toBe('AlexSmith');
    expect(component.conversations[0].lastMessage).toBe('Just uploaded a new cover of "Bohemian Rhapsody"!');
  });
});