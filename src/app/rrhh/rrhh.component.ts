import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';
import { SesionService } from '../services/sesion.service';

import { KeyValue } from '@angular/common';
import { PlanillasService } from '../services/planillas.service';
import { IncapacidadesService } from '../services/incapacidades.service';

@Component({
  selector: 'app-rrhh',
  templateUrl: './rrhh.component.html',
  styleUrls: ['./rrhh.component.scss']
})
export class RrhhComponent implements OnInit {
  empleados: Empleado[] = [];
  planillas: any[] = [];
  aguinaldos: { [id: string]: number } = {};
  diasVacaciones: { [id: string]: any } = {};

  //Lista de puestos dispobibles
  puestosDisponibles: string[] = [
    'Administrador',
    'Chofer',
    'Asistente'
  ];

  // Campos del formulario
  cedula = '';
  nombre = '';
  puesto = '';
  fechaIngreso = '';
  tipoPago: 'mensual' | 'diario' = 'mensual';
  salarioMensual = 0;
  salarioDiario = 0;
  tipoContrato: 'indefinido' | 'definido' = 'indefinido';
  fechaFinContrato = '';

  editando = false;
  idEditando: string | null = null;
  usuarioActivo: any;

  incapacidades: any[] = [];

  //Para los datos de la sociedad
  nombreEmpresa: string = '';
  cedulaEmpresa: string = '';

  constructor(
    private vacacionesService: VacacionesService,
    private rrhhService: RrhhService,
    private sesionService: SesionService,
    private planillasService: PlanillasService,
    private incapacidadesService: IncapacidadesService
  ) { }

  ngOnInit() {
    const userData = localStorage.getItem('usuarioActivo');
    if (userData) this.usuarioActivo = JSON.parse(userData);

    //Datos de la Sociedad
    this.nombreEmpresa = this.sesionService.getEmpresaActual() || 'Empresa desconocida';
    this.cedulaEmpresa = this.sesionService.getCedulaEmpresaActual() || 'Sin cédula';

    //Cargamos Planillas
    this.CargarPlanillas();

    //Cargamos Empleados
    this.CargarEmpleados();

    //Cargamos Incapacidades
    this.CargarIncapacidades()


  }


  public CargarEmpleados(): any {
    this.rrhhService.obtener().subscribe(data => {
      this.empleados = data;
      this.actualizarDiasVacaciones();
      this.intentarCalcularAguinaldos(); // 👈 clave
    });
  }

  public CargarPlanillas(): any {
    this.planillasService.obtener().subscribe((data: any[]) => {
      this.planillas = data || [];
      // recalcular aguinaldos luego de que lleguen las planillas 
      this.intentarCalcularAguinaldos(); // 👈 clave
    });
  }

  public CargarIncapacidades(): any {
    // 🔥 Cargar incapacidades
    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;
    });
  }


  private intentarCalcularAguinaldos() {
    if (this.empleados?.length && this.planillas?.length) {
      this.calcularAguinaldos();
    }
  }

  public agregar() {
    if (!this.cedula || !this.nombre || !this.puesto || !this.fechaIngreso) return;

    const empresaId = this.usuarioActivo?.empresa?.id || this.usuarioActivo?.empresa || 'desconocida';

    // Validar si ya existe en la empresa
    const existe = this.empleados.some(
      e => e.cedula === this.cedula && e.empresaId === empresaId && e.id !== this.idEditando
    );
    if (existe) {
      alert('Ya existe un funcionario con esta cédula en esta empresa.');
      return;
    }

    if (this.editando && this.idEditando) {
      const i = this.empleados.findIndex(e => e.id === this.idEditando);
      if (i >= 0) {
        this.empleados[i] = {
          ...this.empleados[i],
          cedula: this.cedula,
          nombre: this.nombre,
          puesto: this.puesto,
          fechaIngreso: this.fechaIngreso,
          tipoPago: this.tipoPago,
          salarioMensual: this.tipoPago === 'mensual' ? this.salarioMensual : 0,
          salarioDiario: this.tipoPago === 'diario' ? this.salarioDiario : 0,
          tipoContrato: this.tipoContrato,
          fechaFinContrato: this.tipoContrato === 'definido' ? this.fechaFinContrato : ''
        };
        this.rrhhService.actualizar(this.empleados[i]);
      }
      this.editando = false;
      this.idEditando = null;
    } else {
      const empresaId = this.usuarioActivo?.empresa?.id || this.usuarioActivo?.empresa || 'desconocida';
      const empresaCedula = this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';

      const nuevo: Empleado = {
        id: uuid(),
        empresaId,
        empresaCedula,
        cedula: this.cedula,
        nombre: this.nombre,
        puesto: this.puesto,
        fechaIngreso: this.fechaIngreso,
        tipoPago: this.tipoPago,
        salarioMensual: this.tipoPago === 'mensual' ? this.salarioMensual : 0,
        salarioDiario: this.tipoPago === 'diario' ? this.salarioDiario : 0,
        tipoContrato: this.tipoContrato,
        fechaFinContrato: this.tipoContrato === 'definido' ? this.fechaFinContrato : ''
      };
      this.rrhhService.agregar(nuevo).then(() => {
      });
    }

    this.limpiarFormulario();
    this.actualizarDiasVacaciones();
    this.calcularAguinaldos();
  }

  eliminar(id: string) {
    const empleado = this.empleados.find(e => e.id === id);
    const nombre = empleado ? empleado.nombre : 'este empleado';
    if (!confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) return;

    this.rrhhService.eliminar(id);
    this.empleados = this.empleados.filter(e => e.id !== id);
    alert(`✅ ${nombre} ha sido eliminado correctamente.`);
  }

  limpiarFormulario() {
    this.cedula = '';
    this.nombre = '';
    this.puesto = '';
    this.fechaIngreso = '';
    this.tipoPago = 'mensual';
    this.salarioMensual = 0;
    this.salarioDiario = 0;
    this.tipoContrato = 'indefinido';
    this.fechaFinContrato = '';
    this.editando = false;
  }

  editar(e: Empleado) {
    this.editando = true;
    this.idEditando = e.id;
    this.cedula = e.cedula;
    this.nombre = e.nombre;
    this.puesto = e.puesto;
    this.fechaIngreso = e.fechaIngreso;
    this.tipoPago = e.tipoPago;
    this.salarioMensual = e.salarioMensual;
    this.salarioDiario = e.salarioDiario;
    this.tipoContrato = e.tipoContrato;
    this.fechaFinContrato = e.fechaFinContrato || '';
  }

  calcularAguinaldos() {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const añoAnterior = añoActual - 1;

    // Periodo general del aguinaldo, el mes Enero = 0 por eso los datos
    const inicioPeriodo = new Date(añoAnterior, 11, 1);
    inicioPeriodo.setHours(0, 0, 0, 0);

    const finPeriodo = new Date(añoActual, 10, 30);
    finPeriodo.setHours(0, 0, 0, 0);

    this.aguinaldos = {};

    if (!this.empleados?.length || !this.planillas?.length) {
      this.empleados.forEach(e => this.aguinaldos[String(e.id)] = 0);
      return;
    }

    this.empleados.forEach(e => {
      const empIdStr = String(e.id);
      let totalPeriodo = 0;

      // 📌 FECHA REAL DE INICIO considering fechaIngreso
      let fechaIngreso = new Date(e.fechaIngreso);
      fechaIngreso = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), 1);
      fechaIngreso.setHours(0, 0, 0, 0);

      // Usar el máximo entre ingreso y 1 noviembre
      const inicioReal = fechaIngreso > inicioPeriodo ? fechaIngreso : inicioPeriodo;

      this.planillas.forEach(p => {
        if (!p?.mes) return;

        // Convierte el campo mes ('YYYY-MM' o 'YYYY-MM-DD') a Date
        let fechaMes: Date;
        try {
          let [yyyy, mm] = p.mes.split('-');
          fechaMes = new Date(Number(yyyy), Number(mm) - 1, 1);
          fechaMes.setHours(0, 0, 0, 0);
        } catch {
          return;
        }

        // 📌 Solo sumar planillas dentro del rango válido
        if (fechaMes >= inicioReal && fechaMes <= finPeriodo) {
          const detalle = (p.detalleEmpleados || [])
            .find((d: any) => String(d.id) === empIdStr);

          if (detalle) {
            const bruto =
              typeof detalle.salarioBruto === 'number'
                ? detalle.salarioBruto
                : detalle.salarioNeto; // fallback para planillas viejas

            if (typeof bruto === 'number') {
              totalPeriodo += bruto;
            }
          }
        }
      });

      // 🟢 Fórmula oficial: total devengado / 12
      this.aguinaldos[empIdStr] = totalPeriodo / 12;
    });
  }



  actualizarDiasVacaciones() {
    this.empleados.forEach(e => {
      // 🟢 EMPLEADO DIARIO → usa planillas
      if (e.tipoPago === 'diario') {
        this.vacacionesService
          .calcularDiasPendientes(e, this.planillas)
          .subscribe(dias => {
            this.diasVacaciones[e.id] = dias;
          });
      }

      // 🟢 EMPLEADO MENSUAL → usa incapacidades
      else {
        this.vacacionesService
          .calcularDiasPendientesSinPlanillas(e)
          .subscribe(dias => {
            this.diasVacaciones[e.id] = dias;
          });
      }

    });
  }


  tieneVacacionesPendientes(id: string): boolean {
    const vac = this.diasVacaciones[id];
    if (!vac) return false;
    return Object.values(vac).some((dias: any) => dias > 0);
  }


  getDiasPendientesIncapacidad(empleadoId: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Filtrar incapacidades del empleado que NO han terminado
    const futurasYActivas = this.incapacidades.filter(i => {
      if (i.empleadoId !== empleadoId) return false;

      const fin = new Date(i.fechaFin);
      fin.setHours(0, 0, 0, 0);

      return fin >= hoy; // aún no termina (incluye las futuras)
    });

    if (futurasYActivas.length === 0) return 0;

    let totalPendiente = 0;

    futurasYActivas.forEach(inc => {
      const inicio = new Date(inc.fechaInicio);
      const fin = new Date(inc.fechaFin);

      inicio.setHours(0, 0, 0, 0);
      fin.setHours(0, 0, 0, 0);

      if (hoy < inicio) {
        // incapacidad FUTURA → contar todos los días completos
        const diff = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24) + 1;
        totalPendiente += diff;
      } else {
        // incapacidad ACTIVA → contar desde hoy hasta fin
        const diff = (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24) + 1;
        totalPendiente += diff;
      }
    });

    return totalPendiente;
  }


  vacacionKeyValueFn = (a: KeyValue<string, number>, b: KeyValue<string, number>): number => {
    return 0; // no importa el orden, solo lo usamos para tipar correctamente
  };

  obtenerEstadoEmpleado(e: Empleado) {
    return this.rrhhService.obtenerEstadoEmpleado(e)
  }


  puedeEliminar(): boolean {
    return this.usuarioActivo?.rol === 'Supervisor';
  }

  esAdmin(): boolean {
    return this.usuarioActivo?.rol === 'Administrador';
  }


  //ESTO ES PARA EL TEMA DEL CONTRATO

  imprimirContrato(e: any) {
    const hoy = new Date().toLocaleDateString('es-CR');

    let logoURL = ''
    // Datos de la empresa desde sesión
    const empresa = this.nombreEmpresa;
    const cedula = this.cedulaEmpresa;

    if (cedula == '3-102-908063') {
      logoURL = 'assets/LogoDyF.jpg'; // ruta del logo

    } else {
      logoURL = 'assets/LogoGyA.png'; // ruta del logo
    }

    const contrato = `
    <html>
    <head>
      <title>Contrato de Trabajo</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          line-height: 1.5;
          font-size: 14px;
        }

        h1 { text-align: center; }

        .logo {
          width: 180px;
          display: block;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 20px;
        }

        .titulo-sec {
          margin-top: 20px;
          font-weight: bold;
          font-size: 16px;
        }

        .firma {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }

        .firma div {
          text-align: center;
          width: 45%;
        }
      </style>
    </head>

    <body>

    <img src="${logoURL}" class="logo">

    <h1>CONTRATO INDIVIDUAL DE TRABAJO</h1>

    <p>En Buenos Aires, Puntarenas, a los <b>${hoy}</b>, entre 
    <b>${empresa}</b>, Cédula Jurídica <b>${cedula}</b>, representada por su administrador,
    en adelante como “EL EMPLEADOR”, y 
    <b>${e.nombre}</b>, portador(a) de la cédula de identidad <b>${e.cedula}</b>,
    en adelante “LA PERSONA TRABAJADORA”, se acuerda el presente Contrato Individual de Trabajo,
    sujeto a las siguientes cláusulas:</p>

    <div class="titulo-sec">PRIMERO: Naturaleza de los servicios</div>
    <p>
    La persona trabajadora se obliga a prestar sus servicios en el puesto de 
    <b>${e.puesto}</b>, cumpliendo las labores propias del cargo, las instrucciones superiores, 
    así como cualquier otra función complementaria y razonable relacionada con sus 
    responsabilidades.
    </p>

    <div class="titulo-sec">SEGUNDO: Lugar donde se prestarán los servicios</div>
    <p>
    La persona trabajadora ejecutará sus labores principalmente en las instalaciones 
    del centro asignado por la CCSS o en las rutas establecidas por el empleador, pudiendo 
    ser trasladada temporalmente a otros lugares siempre que las necesidades del servicio 
    lo requieran.
    </p>

    <div class="titulo-sec">TERCERO: Jornada y horario</div>
    <p>
    La jornada será la correspondiente al servicio contratado por la CCSS, respetando la 
    normativa laboral vigente. El horario podrá ajustarse cuando las condiciones operativas 
    lo ameriten.
    </p>

    <div class="titulo-sec">CUARTO: Salario</div>
    <p>
      La persona trabajadora devengará un salario de: <br>
      Mensual: ₡${e.salarioMensual || 0}</b> 
      (colones).<br>
      Diario de <b>₡${e.salarioDiario || 0}</b>.
      <br><br>
      El salario será cancelado conforme las disposiciones legales, mediante transferencia o 
      el método de pago autorizado por el empleador.
    </p>

    <div class="titulo-sec">QUINTO: Obligaciones de la persona trabajadora</div>
    <p>
      a) Cumplir las políticas internas del empleador.<br>
      b) Tratar con respeto a compañeros, usuarios y superiores.<br>
      c) Hacer buen uso del vehículo asignado y reportar cualquier daño o anomalía.<br>
      d) Cumplir con las normas de tránsito, seguridad y salud ocupacional.<br>
      e) Mantener la confidencialidad de la información relacionada con el trabajo.
    </p>

    <div class="titulo-sec">SEXTO: Plazo del contrato</div>
    <p>
      Tipo de contrato: <b>${e.tipoContrato}</b><br>
      ${e.tipoContrato === 'definido'
        ? `Este contrato tendrá vigencia desde el <b>${e.fechaIngreso}</b> 
             hasta el <b>${e.fechaFinContrato}</b>.`
        : `El contrato es por tiempo indefinido conforme al Código de Trabajo.`
      }
    </p>

    <div class="titulo-sec">SÉTIMO: Terminación del contrato</div>
    <p>
      El contrato podrá darse por terminado conforme a los artículos 81, 82 y 85 
      del Código de Trabajo, así como por las demás causales previstas en la legislación 
      vigente.
    </p>

    <div class="titulo-sec">OCTAVO: Riesgos de trabajo</div>
    <p>
      El empleador garantiza que la persona trabajadora se encuentra asegurada mediante 
      una póliza de riesgos del trabajo vigente ante el INS.
    </p>

    <div class="titulo-sec">NOVENO: Vacaciones, aguinaldo y demás derechos</div>
    <p>
      La persona trabajadora gozará de vacaciones, aguinaldo, descansos y demás derechos 
      establecidos en la legislación costarricense.
    </p>

    <div class="titulo-sec">DÉCIMO: Mantenimiento y limpieza del vehículo</div>
    <p>
      El trabajador se compromete a mantener en óptimas condiciones de limpieza y mantenimiento 
      el vehículo asignado para sus labores. En particular, deberá:
	    1.	Mantener el vehículo limpio, tanto en su interior como en su exterior.
	    2.	Limpiar regularmente el cajón del vehículo, evitando acumulación de suciedad, 
          residuos o materiales innecesarios.
	    3.	Cuidar y mantener en buen estado la capota o canopy, asegurándose de que los 
          zippers estén limpios y funcionando correctamente, utilizando un cepillo u otro 
          método adecuado para su limpieza.
	    4.	Estar atento a los cambios de aceite y otros aspectos básicos del mantenimiento 
          preventivo del vehículo, reportando cualquier anomalía o necesidad de servicio 
          mecánico oportunamente.
    </p>

    <div class="titulo-sec">UNDÉCIMO: De la conducción y el recorrido de la gira</div>
    <p>
      El trabajador deberá conducir el vehículo de manera prudente y respetando en todo momento
       los límites de velocidad y las normas de tránsito vigentes. Queda estrictamente prohibido
       el manejo a alta velocidad o de forma temeraria, priorizando siempre la seguridad de los 
       ocupantes y de terceros.

      En caso de que algún funcionario de la CCSS solicite regresar a un punto anterior debido 
       al olvido de insumos u otro motivo, el trabajador deberá informar de inmediato al administrador
       del contrato para obtener su aprobación. Si el regreso no es autorizado, los kilómetros 
       recorridos por dicha desviación no serán reconocidos para efectos de pago.

    </p>
    <div class="titulo-sec">DUODECIMO: Del uso del vehículo</div>
    <p>
      El vehículo asignado es de uso exclusivo para actividades laborales y no podrá ser utilizado 
      para fines personales, en horarios fuera de la jornada de trabajo, días feriados, no laborados 
      o libres, salvo autorización expresa del empleador.

      Se permite que el trabajador lleve el vehículo a su casa, siempre y cuando se comprometa a 
      mantenerlo resguardado dentro de su propiedad, en un lugar seguro. Cualquier uso indebido del 
      vehículo o incumplimiento de esta disposición podrá ser motivo de sanciones disciplinarias. 
      Cuando el empleador así lo requiera, el vehículo podrá ser dejado en algún punto específico y 
      el empleado debe de llegar por sus propios medios a dicho establecimiento. 

    </p>
    <div class="titulo-sec">DÉCIMOTERCERO: Disposiciones finales</div>
    <p>
      El incumplimiento de estas disposiciones podrá ser motivo de medidas disciplinarias 
      conforme a la normativa interna de la empresa.
      Ambas partes manifiestan su conformidad con lo anterior y firman en dos ejemplares 
      del mismo tenor.
    </p>

    <div class="firma">
      <div>
        ____________________________ <br>
        ${empresa}<br>
        Cédula Jurídica: ${cedula}<br>
        Representante Legal
      </div>

      <div>
        ____________________________ <br>
        ${e.nombre}<br>
        Cédula: ${e.cedula}<br>
        Teléfono:
      </div>
    </div>

    </body>
    </html>
  `;

    const newWindow = window.open('', '_blank');
    newWindow!.document.write(contrato);
    newWindow!.document.close();

    setTimeout(() => {
      newWindow!.print();
    }, 700);
  }


}


