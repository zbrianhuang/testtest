import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabVidPage } from './tab-vid.page';

const routes: Routes = [
  {
    path: '',
    component: TabVidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabVidPageRoutingModule {}
