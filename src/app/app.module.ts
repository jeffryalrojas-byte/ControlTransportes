import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
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
import { environment } from 'src/environments/environment';

// 🔥 Firebase 11 + AngularFire 18 - Functional API imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [
    AppComponent,
    RrhhComponent,
    PlanillaComponent,
    ConfiguracionComponent,
    NavbarComponent,
    VacacionesComponent,
    IncapacidadesComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    AppRoutingModule,
    FinanzasModule,
    MatTabsModule,
    BrowserAnimationsModule
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
