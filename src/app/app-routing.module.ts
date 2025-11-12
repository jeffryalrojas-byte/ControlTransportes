import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RrhhComponent } from './rrhh/rrhh.component';
import { PlanillaComponent } from './planilla/planilla.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { FinanzasComponent } from './finanzas/finanzas.component'; // 👈 AÑADIR ESTO
import { VacacionesComponent } from './vacaciones/vacaciones.component';
import { IncapacidadesComponent } from './incapacidades/incapacidades.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'rrhh', component: RrhhComponent },
  { path: 'planilla', component: PlanillaComponent },
  { path: 'vacaciones', component: VacacionesComponent },
  { path: 'incapacidades', component: IncapacidadesComponent },
  { path: 'configuracion', component: ConfiguracionComponent },
  { path: 'finanzas', loadChildren: () => import('./finanzas/finanzas.module').then(m => m.FinanzasModule) },
  { path: '', redirectTo: '/finanzas', pathMatch: 'full' },
  { path: '**', redirectTo: 'rrhh' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
