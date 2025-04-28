import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeTabPage } from './home_tab.page';

const routes: Routes = [
  {
    path: '',
    component: HomeTabPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeTabPageRoutingModule {}
