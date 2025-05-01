import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController } from '@ionic/angular';
import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let alertController: AlertController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tab2Page],
      imports: [IonicModule.forRoot()],
      providers: [AlertController]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    alertController = TestBed.inject(AlertController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with isRecording as false, selectedMode as video, showRecent as false, and hasRecorded as false', () => {
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeFalse();
    expect(component.hasRecorded).toBeFalse();
  });

  it('should toggle recording state without affecting showRecent', () => {
    component.showRecent = true; // Simulate grid being open
    expect(component.isRecording).toBeFalse();
    component.toggleRecording();
    expect(component.isRecording).toBeTrue();
    expect(component.showRecent).toBeTrue(); // Grid visibility should not change
    component.toggleRecording();
    expect(component.isRecording).toBeFalse();
    expect(component.showRecent).toBeTrue();
  });

  it('should set mode to template and show grid', () => {
    component.setMode('template');
    expect(component.selectedMode).toBe('template');
    expect(component.showRecent).toBeTrue();
  });

  it('should set mode to video and show recent videos', () => {
    component.setMode('video');
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeTrue();
  });

  it('should show camera and close grid without affecting recording state', () => {
    component.showRecent = true; // Simulate grid being open
    component.isRecording = true; // Simulate recording active
    component.showCamera();
    expect(component.showRecent).toBeFalse();
    expect(component.isRecording).toBeTrue(); // Recording state should not change
  });

  it('should show Next button after recording is stopped', () => {
    expect(component.hasRecorded).toBeFalse();
    component.toggleRecording(); // Start recording
    expect(component.isRecording).toBeTrue();
    component.toggleRecording(); // Stop recording
    expect(component.isRecording).toBeFalse();
    expect(component.hasRecorded).toBeTrue();
  });

  it('should reset state when entering the page (ionViewWillEnter)', () => {
    component.isRecording = true;
    component.selectedMode = 'template';
    component.showRecent = true;
    component.hasRecorded = true;
    component.ionViewWillEnter();
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeFalse();
    expect(component.hasRecorded).toBeFalse();
  });

  it('should reset state when leaving the page (ionViewWillLeave)', () => {
    component.isRecording = true;
    component.selectedMode = 'template';
    component.showRecent = true;
    component.hasRecorded = true;
    component.ionViewWillLeave();
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeFalse();
    expect(component.hasRecorded).toBeFalse();
  });

  it('should navigate to home tab when closing without recording', () => {
    spyOn(component.navCtrl, 'navigateBack');
    component.close();
    expect(component.navCtrl.navigateBack).toHaveBeenCalledWith('/tabs/home_tab');
  });

  it('should show alert when closing with recording', async () => {
    component.hasRecorded = true; // Simulate a recording
    spyOn(alertController, 'create').and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      onDidDismiss: () => Promise.resolve({ role: 'cancel' })
    } as any));
    await component.close();
    expect(alertController.create).toHaveBeenCalled();
  });
});