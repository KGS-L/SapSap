import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MissionExecutionPage } from './mission-execution.page';

const routes: Routes = [
  {
    path: '',
    component: MissionExecutionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MissionExecutionPageRoutingModule {}
