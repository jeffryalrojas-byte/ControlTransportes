import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
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

// 🔥 Import correcto de AngularFire
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';

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
    FormsModule,
    AppRoutingModule,
    FinanzasModule,

    // ✅ Inicialización de Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
