import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './core/pages/home.component';
import { ForbiddenComponent } from './core/pages/forbidden.component';
import { RoleGuard } from './core/auth/role.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'forbidden', component: ForbiddenComponent },

  {
    path: 'patient',
    loadChildren: () =>
      import('./features/patient/patient.module').then(m => m.PatientModule),
    canActivate: [RoleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'doctor',
    loadChildren: () =>
      import('./features/doctor/doctor.module').then(m => m.DoctorModule),
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
