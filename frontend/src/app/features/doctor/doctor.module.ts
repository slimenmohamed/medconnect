import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PlanningComponent } from './pages/planning.component';
import { NouvellePrescriptionComponent } from './pages/nouvelle-prescription.component';

const routes: Routes = [
  { path: '', redirectTo: 'planning', pathMatch: 'full' },
  { path: 'planning', component: PlanningComponent },
  { path: 'rdv/:id/prescription', component: NouvellePrescriptionComponent }
];

@NgModule({
  declarations: [PlanningComponent, NouvellePrescriptionComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class DoctorModule {}
