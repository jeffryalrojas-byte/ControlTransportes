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

  historico: {
    id: string;
    ccssTrabajador: number;
    ccssPatrono: number;
    fecha: string;
  }[] = [];

  constructor(private configuracionService: ConfiguracionService) { }

  ngOnInit(): void {
    this.configuracionService.obtenerCargas().subscribe(cargas => {
      if (cargas) {
        this.cargas = {
          ccssTrabajador: cargas.ccssTrabajador * 100,
          ccssPatrono: cargas.ccssPatrono * 100
        };
      }
    });

    this.configuracionService.obtenerHistorico().subscribe(data => {
      this.historico = data;
    });
  }

  guardarCambios() {
    const cargasConvertidas: CargasSociales = {
      ccssTrabajador: this.cargas.ccssTrabajador / 100,
      ccssPatrono: this.cargas.ccssPatrono / 100
    };

    this.configuracionService.guardarCargas(cargasConvertidas);
    this.configuracionService.guardarHistorico(cargasConvertidas);

    alert('✅ Cargas sociales actualizadas correctamente');
  }

}
