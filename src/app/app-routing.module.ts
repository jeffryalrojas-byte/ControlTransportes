import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RrhhComponent } from './rrhh/rrhh.component';
import { PlanillaComponent } from './planilla/planilla.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { FinanzasComponent } from './finanzas/finanzas.component';
import { VacacionesComponent } from './vacaciones/vacaciones.component';
import { IncapacidadesComponent } from './incapacidades/incapacidades.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './login/registro/registro.component';
import { MigracionComponent } from './shared/migracion/migracion.component';
import { CrearUsuariosPruebaComponent } from './shared/crear-usuarios-prueba/crear-usuarios-prueba.component';
import { MigracionCompletaComponent } from './shared/migracion-completa/migracion-completa.component';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'migracion', component: MigracionComponent },
  { path: 'crear-usuarios-prueba', component: CrearUsuariosPruebaComponent },
  { path: 'migracion-completa', component: MigracionCompletaComponent },
  { path: 'rrhh', component: RrhhComponent, canActivate: [AuthGuard] },
  { path: 'planilla', component: PlanillaComponent, canActivate: [AuthGuard] },
  { path: 'vacaciones', component: VacacionesComponent, canActivate: [AuthGuard] },
  { path: 'incapacidades', component: IncapacidadesComponent, canActivate: [AuthGuard], data: { roles: ['admin', 'supervisor'] } },
  { path: 'pagos', loadChildren: () => import('./pagos/pagos.module').then(m => m.PagosModule), canActivate: [AuthGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard], data: { roles: ['supervisor'] } },
  { path: 'finanzas', loadChildren: () => import('./finanzas/finanzas.module').then(m => m.FinanzasModule), canActivate: [AuthGuard], data: { roles: ['admin', 'supervisor'] } },
  { path: '**', redirectTo: 'rrhh' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
