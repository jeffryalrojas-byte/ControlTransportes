import { Component, OnInit } from '@angular/core';
import { ConfiguracionService, CargasSociales } from '../services/configuracion.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  cargas: CargasSociales = {
    ccssTrabajador: 0,
    ccssPatrono: 0
  };

  historico: { ccssTrabajador: number; ccssPatrono: number; fecha: string }[] = [];

  constructor(private configuracionService: ConfiguracionService) { }

  ngOnInit(): void {
    const cargasGuardadas = this.configuracionService.obtenerCargas();
    this.cargas = {
      ccssTrabajador: cargasGuardadas.ccssTrabajador * 100,
      ccssPatrono: cargasGuardadas.ccssPatrono * 100
    };

    this.historico = this.configuracionService.obtenerHistorico();
  }

  guardarCambios() {
    // Convertir de porcentaje a decimal antes de guardar
    const cargasConvertidas: CargasSociales = {
      ccssTrabajador: this.cargas.ccssTrabajador / 100,
      ccssPatrono: this.cargas.ccssPatrono / 100
    };

    this.configuracionService.guardarCargas(cargasConvertidas);

    // Actualizar histórico en pantalla
    this.historico = this.configuracionService.obtenerHistorico();

    alert('✅ Cargas sociales actualizadas correctamente');
  }

}
