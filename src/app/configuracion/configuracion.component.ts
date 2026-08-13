import { Component, OnInit } from '@angular/core';
import { ConfiguracionService, CargasSociales } from '../services/configuracion.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  puestos: string[] = ['Administrador', 'Chofer', 'Asistente'];
  incentivos: { [puesto: string]: number } = {};

  historico: {
    id: string;
    ccssTrabajador: number;
    ccssPatrono: number;
    fecha: string;
  }[] = [];

  // Logo
  logoBase64: string | null = null;
  subiendo = false;
  archivoSeleccionado: File | null = null;

  constructor(
    private configuracionService: ConfiguracionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.configuracionService.obtenerCargas().subscribe(cargas => {
      if (cargas) {
        this.cargas = {
          ccssTrabajador: cargas.ccssTrabajador * 100,
          ccssPatrono: cargas.ccssPatrono * 100
        };
      }
    });

    this.configuracionService.obtenerIncentivos().subscribe(data => {
      this.incentivos = data || {};
    });

    this.configuracionService.obtenerHistorico().subscribe(data => {
      this.historico = data;
    });

    this.cargarLogo();
  }

  // ==================== LOGO ====================
  cargarLogo(): void {
    this.configuracionService.obtenerLogo().subscribe(data => {
      if (data?.base64) {
        this.logoBase64 = data.base64;
      }
    });
  }

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar que sea imagen
      if (!archivo.type.startsWith('image/')) {
        this.snackBar.open('❌ Por favor selecciona una imagen válida', 'Cerrar', { duration: 3000 });
        return;
      }

      // Validar tamaño (máximo 2MB para Base64)
      if (archivo.size > 2 * 1024 * 1024) {
        this.snackBar.open('❌ La imagen no debe superar 2MB', 'Cerrar', { duration: 3000 });
        return;
      }

      this.archivoSeleccionado = archivo;
    }
  }

  async subirLogo(): Promise<void> {
    if (!this.archivoSeleccionado) {
      this.snackBar.open('⚠️ Selecciona una imagen primero', 'Cerrar', { duration: 3000 });
      return;
    }

    this.subiendo = true;
    try {
      this.logoBase64 = await this.configuracionService.subirLogo(this.archivoSeleccionado);
      this.snackBar.open('✅ Logo subido correctamente', 'Cerrar', { duration: 3000 });
      this.archivoSeleccionado = null;
    } catch (error: any) {
      this.snackBar.open('❌ Error al subir logo: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.subiendo = false;
    }
  }

  // ==================== CARGAS SOCIALES ====================
  guardarCambios() {
    const cargasConvertidas: CargasSociales = {
      ccssTrabajador: this.cargas.ccssTrabajador / 100,
      ccssPatrono: this.cargas.ccssPatrono / 100
    };

    this.configuracionService.guardarCargas(cargasConvertidas);
    this.configuracionService.guardarHistorico(cargasConvertidas);

    this.snackBar.open('✅ Cargas sociales actualizadas', 'Cerrar', { duration: 3000 });
  }

  // ==================== INCENTIVOS ====================
  guardarIncentivos() {
    this.configuracionService.guardarIncentivos(this.incentivos);
    this.snackBar.open('✅ Incentivos guardados', 'Cerrar', { duration: 3000 });
  }
}
