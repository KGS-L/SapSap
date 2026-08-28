import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { MissionExecutionPageRoutingModule } from './mission-execution-routing.module';
import { MissionExecutionPage } from './mission-execution.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MissionExecutionPageRoutingModule
  ],
  declarations: [MissionExecutionPage]
})
export class MissionExecutionPageModule {}
