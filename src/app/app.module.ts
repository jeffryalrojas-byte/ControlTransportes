import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { RrhhComponent } from './rrhh/rrhh.component';
import { PlanillaComponent } from './planilla/planilla.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FinanzasModule } from './finanzas/finanzas.module';
import { VacacionesComponent } from './vacaciones/vacaciones.component';
import { IncapacidadesComponent } from './incapacidades/incapacidades.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './login/registro/registro.component';
import { MigracionComponent } from './shared/migracion/migracion.component';
import { CrearUsuariosPruebaComponent } from './shared/crear-usuarios-prueba/crear-usuarios-prueba.component';
import { MigracionCompletaComponent } from './shared/migracion-completa/migracion-completa.component';
import { environment } from 'src/environments/environment';

// 🔥 Firebase 11 + AngularFire 18 - Functional API imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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

@NgModule({
  declarations: [
    AppComponent,
    RrhhComponent,
    PlanillaComponent,
    ConfiguracionComponent,
    NavbarComponent,
    VacacionesComponent,
    IncapacidadesComponent,
    LoginComponent,
    RegistroComponent,
    MigracionComponent,
    CrearUsuariosPruebaComponent,
    MigracionCompletaComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FinanzasModule,
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
    MatDialogModule
  ],
  providers: [
    // ✅ Firebase 11 + AngularFire 18 Functional Providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
