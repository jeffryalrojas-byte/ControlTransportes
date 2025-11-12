import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasComponent } from './finanzas.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [FinanzasComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: FinanzasComponent }
    ])
  ]
})
export class FinanzasModule { }

