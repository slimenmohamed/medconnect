import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PatientsAdminComponent } from './pages/patients-admin.component';
import { DoctorsAdminComponent } from './pages/doctors-admin.component';

const routes: Routes = [
  { path: '', redirectTo: 'patients', pathMatch: 'full' },
  { path: 'patients', component: PatientsAdminComponent },
  { path: 'doctors',  component: DoctorsAdminComponent }
];

@NgModule({
  declarations: [PatientsAdminComponent, DoctorsAdminComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
