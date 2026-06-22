import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MesRdvComponent } from './pages/mes-rdv.component';
import { PrendreRdvComponent } from './pages/prendre-rdv.component';
import { MonDossierComponent } from './pages/mon-dossier.component';

const routes: Routes = [
  { path: '', redirectTo: 'mes-rdv', pathMatch: 'full' },
  { path: 'mes-rdv',     component: MesRdvComponent },
  { path: 'prendre-rdv', component: PrendreRdvComponent },
  { path: 'dossier',     component: MonDossierComponent }
];

@NgModule({
  declarations: [MesRdvComponent, PrendreRdvComponent, MonDossierComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class PatientModule {}
