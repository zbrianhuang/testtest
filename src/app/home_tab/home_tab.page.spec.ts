import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import {HomeTabPage} from './home_tab.page';



describe('Tab1Page', () => {
  let component: HomeTabPage;
  let fixture: ComponentFixture<HomeTabPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeTabPage],
      imports: [IonicModule.forRoot(), ExploreContainerComponentModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
