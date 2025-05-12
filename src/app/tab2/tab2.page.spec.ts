import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let alertController: AlertController;
  let navCtrl: NavController;
  let storage: Storage;

  beforeEach(async () => {
    const storageMock = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve()),
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve(null)),
      set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      declarations: [Tab2Page],
      imports: [IonicModule.forRoot()],
      providers: [
        AlertController,
        { provide: NavController, useValue: { navigateBack: jasmine.createSpy('navigateBack'), navigateForward: jasmine.createSpy('navigateForward') } },
        { provide: Storage, useValue: storageMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    alertController = TestBed.inject(AlertController);
    navCtrl = TestBed.inject(NavController);
    storage = TestBed.inject(Storage);
    await component.ngOnInit(); // Ensure storage is initialized
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

  it('should select a template image, reset position, and close the grid', () => {
    component.showRecent = true; // Simulate grid being open
    component.selectedMode = 'template'; // Simulate template mode
    component.templateImagePosition = { top: 50, left: 50 }; // Simulate a dragged position
    component.selectTemplateVideo('assets/icon/post1.jpg');
    expect(component.selectedTemplateImage).toBe('assets/icon/post1.jpg');
    expect(component.showRecent).toBeFalse(); // Grid should close
    expect(component.templateImagePosition).toEqual({ top: 10, left: 10 }); // Position should reset
  });

  it('should start dragging the template image', () => {
    component.selectedTemplateImage = 'assets/icon/post1.jpg';
    const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    spyOn(event, 'preventDefault');
    component.startDrag(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragging).toBeTrue();
  });

  it('should drag the template image to a new position', () => {
    component.selectedTemplateImage = 'assets/icon/post1.jpg';
    component.isDragging = true;
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.startDrag(startEvent);

    const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 120 });
    component.onDrag(moveEvent);

    expect(component.templateImagePosition.left).toBeGreaterThan(10); // Default left is 10px
    expect(component.templateImagePosition.top).toBeGreaterThan(10); // Default top is 10px
  });

  it('should reset state when entering the page (ionViewWillEnter)', () => {
    component.isRecording = true;
    component.selectedMode = 'template';
    component.showRecent = true;
    component.hasRecorded = true;
    component.selectedTemplateImage = 'assets/icon/post1.jpg';
    component.ionViewWillEnter();
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeFalse();
    expect(component.hasRecorded).toBeFalse();
    expect(component.selectedTemplateImage).toBeNull();
  });

  it('should reset state when leaving the page (ionViewWillLeave)', () => {
    component.isRecording = true;
    component.selectedMode = 'template';
    component.showRecent = true;
    component.hasRecorded = true;
    component.selectedTemplateImage = 'assets/icon/post1.jpg';
    component.ionViewWillLeave();
    expect(component.isRecording).toBeFalse();
    expect(component.selectedMode).toBe('video');
    expect(component.showRecent).toBeFalse();
    expect(component.hasRecorded).toBeFalse();
    expect(component.selectedTemplateImage).toBeNull();
  });

  it('should navigate to home tab when closing without recording', () => {
    component.close();
    expect(navCtrl.navigateBack).toHaveBeenCalledWith('/tabs/home_tab');
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