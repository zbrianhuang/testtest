import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabVidPage } from './tab-vid.page';

describe('TabVidPage', () => {
  let component: TabVidPage;
  let fixture: ComponentFixture<TabVidPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TabVidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
