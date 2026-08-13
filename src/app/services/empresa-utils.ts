/**
 * 🔧 Utility para obtener empresaId
 * Centraliza la lógica para evitar duplicación
 */

export function obtenerEmpresaId(): string {
  return localStorage.getItem('empresaActiva') || 'sin_id';
}
