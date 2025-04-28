import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tab2Page],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with isRecording as false and selectedMode as video', () => {
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
  });

  it('should toggle recording state', () => {
    expect(component.isRecording).toBeFalse();
    component.toggleRecording();
    expect(component.isRecording).toBeTrue();
    component.toggleRecording();
    expect(component.isRecording).toBeFalse();
  });

  it('should set mode to template', () => {
    component.setMode('template');
    expect(component.selectedMode).toBe('template');
  });
});