import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { RrhhComponent } from './rrhh/rrhh.component';
import { PlanillaComponent } from './planilla/planilla.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './login/registro/registro.component';
import { MigracionComponent } from './shared/migracion/migracion.component';
import { CrearUsuariosPruebaComponent } from './shared/crear-usuarios-prueba/crear-usuarios-prueba.component';
import { MigracionCompletaComponent } from './shared/migracion-completa/migracion-completa.component';


// Modules
import { FinanzasModule } from './finanzas/finanzas.module';
import { GestionUsuariosModule } from './configuracion/gestion-usuarios/gestion-usuarios.module';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';

// Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReporteriaModule } from './reporteria/reporteria.module';
import { VacacionesComponent } from './vacaciones/vacaciones.component';
import { IncapacidadesComponent } from './incapacidades/incapacidades.component';

@NgModule({
  declarations: [
    AppComponent,
    RrhhComponent,
    PlanillaComponent,
    VacacionesComponent,
    IncapacidadesComponent,
    ConfiguracionComponent,
    NavbarComponent,
    LoginComponent,
    RegistroComponent,
    MigracionComponent,
    CrearUsuariosPruebaComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReporteriaModule,
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ],
  schemas: [NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
