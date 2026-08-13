import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuarioActual: Usuario | null = null;
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];
  cargando = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.obtenerUsuarioActual();
  }

  async cargarUsuarios(): Promise<void> {
    this.cargando = true;
    try {
      const empresaId = localStorage.getItem('empresaActiva');
      if (!empresaId) throw new Error('No hay empresa activa');

      this.usuarios = await this.userService.obtenerUsuariosEmpresa(empresaId);
    } catch (error: any) {
      this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando = false;
    }
  }

  obtenerUsuarioActual(): void {
    const usuarioJson = localStorage.getItem('usuarioActivo');
    if (usuarioJson) {
      this.usuarioActual = JSON.parse(usuarioJson);
    }
  }

  abrirDialogoNuevoUsuario(): void {
    // TODO: Implementar diálogo para crear nuevo usuario
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  editarUsuario(usuario: Usuario): void {
    // TODO: Implementar diálogo para editar usuario
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  async desactivarUsuario(usuario: Usuario): Promise<void> {
    if (confirm(`¿Desactivar usuario ${usuario.nombre}?`)) {
      try {
        await this.userService.desactivarUsuario(usuario.uid);
        this.snackBar.open('Usuario desactivado', 'Cerrar', { duration: 3000 });
        this.cargarUsuarios();
      } catch (error: any) {
        this.snackBar.open('Error al desactivar usuario', 'Cerrar', { duration: 3000 });
      }
    }
  }

  async activarUsuario(usuario: Usuario): Promise<void> {
    if (confirm(`¿Activar usuario ${usuario.nombre}?`)) {
      try {
        await this.userService.activarUsuario(usuario.uid);
        this.snackBar.open('Usuario activado', 'Cerrar', { duration: 3000 });
        this.cargarUsuarios();
      } catch (error: any) {
        this.snackBar.open('Error al activar usuario', 'Cerrar', { duration: 3000 });
      }
    }
  }
}
