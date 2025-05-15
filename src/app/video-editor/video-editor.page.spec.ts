import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoEditorPage } from './video-editor.page';

describe('VideoEditorPage', () => {
  let component: VideoEditorPage;
  let fixture: ComponentFixture<VideoEditorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoEditorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
