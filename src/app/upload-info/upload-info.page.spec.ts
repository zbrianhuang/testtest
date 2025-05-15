import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadInfoPage } from './upload-info.page';

describe('UploadInfoPage', () => {
  let component: UploadInfoPage;
  let fixture: ComponentFixture<UploadInfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
