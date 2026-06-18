/**
 * ArcheryApp Types and Database Interfaces (Spanish)
 */

export type UserRole = 'admin' | 'tecnico_principal' | 'tecnico_auxiliar' | 'arquero';

export interface Usuario {
  id_usuario: string; // UUID matches auth.users
  nombre: string;
  apellidos: string;
  email: string;
  rol: UserRole;
  fecha_nacimiento: string;
  licencia: string;
  id_club?: string;
  activo: boolean;
  fecha_alta: string;
  fecha_baja?: string;
  fotografia_url?: string;
}

export type ActividadTipo = 'noticia' | 'actividad' | 'competicion';
export type NivelCompeticion = 'Autonómico' | 'Nacional' | 'Internacional';

export interface NoticiasActividades {
  id: string;
  tipo: ActividadTipo;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  nivel_competicion?: NivelCompeticion; // Nullable
}

export interface GrupoEntrenamiento {
  id: string;
  nombre_grupo: string;
  id_tecnico: string; // FK Usuario (tecnico)
  nombre_tecnico?: string; // Join helper
  id_tecnico_auxiliar?: string; // FK Usuario (tecnico_auxiliar)
  nombre_tecnico_auxiliar?: string; // Join helper
}

export type MiembroEstado = 'pendiente_invitacion' | 'pendiente_solicitud' | 'aceptado';

export interface MiembroGrupo {
  id_grupo: string;
  id_arquero: string;
  estado: MiembroEstado;
}

export type PlanificacionTipo = 'grupo' | 'individual';

export interface CompeticionPlaneada {
  id: string;
  nombre: string;
  fecha: string; // YYYY-MM-DD
  importancia: 'Alta' | 'Media' | 'Baja';
  tipo: 'grupo' | 'individual';
  id_arquero?: string; // Optativo si de forma individual
  comentarios?: string;
}

export interface MicrocicloPlan {
  id: string;
  nombre: string; // e.g. "Microciclo 1"
  fechas: string; // e.g. "Semana del 15 al 21"
  volumen_flechas?: number; // e.g. 500 flechas
  enfoque_principal: string; // e.g. "Técnica - Suelta limpia"
  objetivos: string; // e.g. "Arco compuesto: Suelta limpia sin gatillar con disparador de tensión"
}

export interface MesocicloPlan {
  id: string;
  nombre: string; // e.g. "Mesociclo I - Básico / General"
  tipo_mesociclo: string; // e.g. "Preparatorio", "Competitivo", "Transición", "Desarrollo", "Estabilización"
  fecha_inicio: string;
  fecha_fin: string;
  microciclos: MicrocicloPlan[];
}

export interface Planificacion {
  id: string;
  id_grupo?: string; // Optional
  id_arquero?: string; // Optional
  tipo: PlanificacionTipo;
  macrociclo: string; // Nombre del macrociclo
  mesociclo?: string; // Backward compatibility fallback (string)
  microciclo?: string; // Backward compatibility fallback (string)
  
  // Nuevos campos estructurados
  temporada?: string; // e.g. "Temporada 2026/2027"
  objetivos_macrociclo?: string; // e.g. "Conseguir medalla en autonómico"
  fecha_inicio?: string;
  fecha_fin?: string;
  mesociclos_lista?: MesocicloPlan[];
  competiciones?: CompeticionPlaneada[];
}

export interface Sesion {
  id: string;
  titulo: string;
  tipo_entrenamiento: string; // 'Técnico' | 'Físico' | 'Psicológico' or generic custom types
  fecha_asignada: string; // YYYY-MM-DD
  asignado_a: 'grupo' | 'arquero';
  id_grupo?: string;
  id_arquero?: string;
  ejercicios_ids: string[]; // List of Ejercicio IDs
  intensidad: number; // 1-100%
  comentarios?: string;
  completada?: boolean;
  completada_por_arqueros?: string[]; // IDs of archers who completed this session
  ejercicios_completados_arqueros?: Record<string, string[]>; // Map of ArcherID -> list of completed Exercise IDs
  flechas_completadas_arqueros?: Record<string, number>; // Map of ArcherID -> total arrows completed
}

export type EjercicioTipo =
  | 'Técnica'
  | 'Fuerza'
  | 'Variabilidad'
  | 'Estiramientos'
  | 'Iniciación'
  | 'Ajuste (Estabilidad)'
  | 'Carga (Fuerza, Técnica)'
  | 'Activación'
  | 'Precompetición'
  | 'Competición';

export type EjercicioDificultad = 'Baja' | 'Media' | 'Alta' | 'Muy Alta';

export interface Ejercicio {
  id: string;
  nombre: string;
  tipo_ejercicio: EjercicioTipo;
  descripcion: string;
  duracion: number; // en minutos
  densidad_repeticiones: string; // e.g. "6 flechas por serie"
  dificultad: EjercicioDificultad;
  intensidad_flechas_repeticion: number; // Número de flechas estimadas
}

export interface SesionEjercicio {
  id_sesion: string;
  id_ejercicio: string;
  flechas_por_tanda: number;
  numero_tandas: number;
}

export type DiarioTipoEntrada =
  | 'Rutina mental'
  | 'Pensamiento libre'
  | 'He ayudado a otros'
  | 'Entrenamiento'
  | 'Apunte técnico'
  | 'Apunte material'
  | 'Apunte físico'
  | 'Antes de la competición'
  | 'Durante la Competición'
  | 'Después de la competición';

export type DiarioPrivacidad = 'visible_tecnicos' | 'privada';

export interface DiarioEntrada {
  id: string;
  id_arquero: string;
  fecha: string;
  titulo: string;
  tipo_entrada: DiarioTipoEntrada;
  estado_animo: string; // e.g. "Excelente", "Motivado", "Cansado"
  nivel_energia_cansancio: number; // 1 to 10
  archivo_url?: string;
  privacidad: DiarioPrivacidad;
  anotaciones_tecnico?: string; // Feedback from tech
}

export type ControlDistancia = '12m' | '18m' | '30m' | '40m' | '50m' | '60m' | '70m';
export type TipoDiana =
  | 'Tr. Vertical [R]'
  | 'Tr. Vertical [C]'
  | '60 cm'
  | '80 cm completa'
  | '80 cm reducida'
  | '122 cm';

export interface ControlTiro {
  id: string;
  id_arquero: string;
  id_sesion?: string;
  nombre_control: string;
  fecha: string;
  distancia: ControlDistancia;
  tipo_diana: TipoDiana;
  flechas_por_serie: number;
  tandas_por_serie: number;
  imagen_url?: string;
  comentarios?: string;
}

export interface ImpactoFlecha {
  id_control: string;
  serie: number;
  tanda: number;
  flecha_index: number;
  valor_impacto: string; // 'X', '10', '9'...'1', 'M'
  x?: number;
  y?: number;
  spot?: string;
}

export type SeguimientoTipoSesion = 'Entrenamiento' | 'Competición';
export type SeguimientoModo = 'Voluntario' | 'Obligatorio';

export interface SeguimientoDiario {
  id: string;
  id_arquero: string;
  fecha: string;
  contador_flechas: number;
  objetivo_flechas: number;
  tipo_sesion: SeguimientoTipoSesion;
  modo: SeguimientoModo;
  notas_adicionales?: string;
}

export type SetupRutinaTipo = 'setup' | 'rutina' | 'objetivo_mental' | 'material';

export interface SetupRutina {
  id: string;
  id_arquero: string;
  tipo: SetupRutinaTipo;
  datos_json: any; // visual/viser distance records, mental objectives, checklist
}
