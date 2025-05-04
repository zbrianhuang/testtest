import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UploadInfoPage } from './upload-info.page';

const routes: Routes = [
  {
    path: '',
    component: UploadInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UploadInfoPageRoutingModule {}
