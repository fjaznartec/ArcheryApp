import { supabase } from './supabaseClient';
import { SetupRutina, Usuario, GrupoEntrenamiento, MiembroGrupo, Planificacion, Ejercicio, Sesion, DiarioEntrada, ControlTiro, ImpactoFlecha } from '../types';

export interface SyncStatus {
  connected: boolean;
  tablesVerified: { [key: string]: boolean };
  error?: string;
  loading: boolean;
}

// Check connection to Supabase and see which tables defined in the schema are active
export async function checkSupabaseConnection(): Promise<SyncStatus> {
  const status: SyncStatus = {
    connected: false,
    tablesVerified: {
      usuarios: false,
      noticias_actividades: false,
      grupos_entrenamiento: false,
      miembros_grupo: false,
      planificacion: false,
      sesiones: false,
      ejercicios: false,
      diario: false,
      controles_tiro: false,
      impactos_flechas: false,
      setups_rutinas: false
    },
    loading: false
  };

  try {
    // Probe the connection by checking auth state or doing a dummy request
    const { data: authProbe, error: authError } = await supabase.auth.getSession();
    if (authError) {
      status.error = `Error de autenticación: ${authError.message}`;
      return status;
    }
    
    status.connected = true;

    // Probe tables by fetching 1 row with limit 0
    const tables = Object.keys(status.tablesVerified);
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      // If error is undefined or is NOT "relation does not exist", the table is active
      if (!error || (error.code !== 'PGRST116' && !error.message.includes('does not exist') && error.code !== '42P01')) {
        status.tablesVerified[table] = true;
      }
    }
  } catch (err: any) {
    status.connected = false;
    status.error = err.message || 'Error desconocido al conectar con Supabase';
  }

  return status;
}

// Function to push a single entity or bulk save to Supabase
export async function pushToSupabase(table: string, data: any | any[]) {
  try {
    const isArray = Array.isArray(data);
    const payload = isArray ? data : [data];
    
    if (payload.length === 0) return { success: true };

    const { error } = await supabase.from(table).upsert(payload, { onConflict: getTablePrimaryKey(table) });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error(`Error uploading to ${table}:`, err);
    return { success: false, error: err.message };
  }
}

// Helper to determine primary key for upserts
function getTablePrimaryKey(table: string): string {
  if (table === 'usuarios') return 'id_usuario';
  if (table === 'miembros_grupo') return 'id_grupo,id_arquero'; // composite key
  if (table === 'impactos_flechas') return 'id_control,serie,tanda,flecha_index'; // composite key
  return 'id';
}

// Push all local state to Supabase in a transaction-like sequence (handling foreign key order)
export async function pushAllToSupabase(localData: {
  usuarios: Usuario[];
  noticias: any[];
  grupos: GrupoEntrenamiento[];
  miembros: MiembroGrupo[];
  planificaciones: Planificacion[];
  ejercicios: Ejercicio[];
  sesiones: Sesion[];
  diarios: DiarioEntrada[];
  controles: ControlTiro[];
  setups: SetupRutina[];
  impactos: ImpactoFlecha[];
}) {
  const results: { [key: string]: { success: boolean; error?: string } } = {};

  try {
    // 1. Usuarios (FK dependency root)
    const formattedUsuarios = localData.usuarios.map(u => ({
      id_usuario: u.id_usuario.startsWith('usr-') ? generateUUIDForMockId(u.id_usuario) : u.id_usuario,
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      rol: u.rol === 'tecnico_principal' || u.rol === 'tecnico_auxiliar' ? 'tecnico' : u.rol, // Map local subroles to Enum 'tecnico'
      fecha_nacimiento: u.fecha_nacimiento || '2000-01-01',
      licencia: u.licencia || null,
      id_club: u.id_club || null,
      activo: u.activo ?? true,
      fecha_alta: u.fecha_alta || new Date().toISOString()
    }));
    results.usuarios = await pushToSupabase('usuarios', formattedUsuarios);

    // 2. Noticias
    const formattedNoticias = localData.noticias.map(n => ({
      id: transformMockIdToUUID(n.id),
      tipo: n.tipo,
      titulo: n.titulo,
      contenido: n.contenido,
      fecha_creacion: n.fecha || new Date().toISOString(),
      nivel_competicion: n.nivel_competicion || null
    }));
    results.noticias_actividades = await pushToSupabase('noticias_actividades', formattedNoticias);

    // 3. Grupos
    const formattedGrupos = localData.grupos.map(g => ({
      id: transformMockIdToUUID(g.id),
      nombre_grupo: g.nombre_grupo,
      id_tecnico: g.id_tecnico.startsWith('usr-') ? generateUUIDForMockId(g.id_tecnico) : g.id_tecnico
    }));
    results.grupos_entrenamiento = await pushToSupabase('grupos_entrenamiento', formattedGrupos);

    // 4. Miembros
    const formattedMiembros = localData.miembros.map(m => ({
      id_grupo: transformMockIdToUUID(m.id_grupo),
      id_arquero: m.id_arquero.startsWith('usr-') ? generateUUIDForMockId(m.id_arquero) : m.id_arquero,
      estado: m.estado
    }));
    results.miembros_grupo = await pushToSupabase('miembros_grupo', formattedMiembros);

    // 5. Planificaciones
    const formattedPlanes = localData.planificaciones.map(p => ({
      id: transformMockIdToUUID(p.id),
      id_grupo: p.id_grupo ? transformMockIdToUUID(p.id_grupo) : null,
      id_arquero: p.id_arquero ? (p.id_arquero.startsWith('usr-') ? generateUUIDForMockId(p.id_arquero) : p.id_arquero) : null,
      tipo: p.tipo,
      macrociclo: p.macrociclo,
      mesociclo: p.mesociclo || null,
      microciclo: p.microciclo || null,
      temporada: p.temporada || null,
      objetivos_macrociclo: p.objetivos_macrociclo || null,
      fecha_inicio: p.fecha_inicio || null,
      fecha_fin: p.fecha_fin || null,
      mesociclos_lista: p.mesociclos_lista || [],
      competiciones: p.competiciones || []
    }));
    results.planificacion = await pushToSupabase('planificacion', formattedPlanes);

    // 6. Ejercicios
    const formattedEjercicios = localData.ejercicios.map(e => ({
      id: transformMockIdToUUID(e.id),
      nombre: e.nombre,
      tipo_ejercicio: e.tipo_ejercicio,
      descripcion: e.descripcion,
      duracion: e.duracion,
      densidad_repeticiones: e.densidad_repeticiones,
      dificultad: e.dificultad,
      intensidad_flechas_repeticion: e.intensidad_flechas_repeticion || 6
    }));
    results.ejercicios = await pushToSupabase('ejercicios', formattedEjercicios);

    // 7. Diarios
    const formattedDiarios = localData.diarios.map(d => ({
      id: transformMockIdToUUID(d.id),
      id_arquero: d.id_arquero.startsWith('usr-') ? generateUUIDForMockId(d.id_arquero) : d.id_arquero,
      fecha: d.fecha,
      titulo: d.titulo,
      tipo_entrada: d.tipo_entrada,
      estado_animo: d.estado_animo,
      nivel_energia_cansancio: d.nivel_energia_cansancio,
      archivo_url: d.archivo_url || null,
      privacidad: d.privacidad,
      anotaciones_tecnico: d.anotaciones_tecnico || null
    }));
    results.diario = await pushToSupabase('diario', formattedDiarios);

    // 8. Controles de tiro
    const formattedControles = localData.controles.map(c => ({
      id: transformMockIdToUUID(c.id),
      id_arquero: c.id_arquero.startsWith('usr-') ? generateUUIDForMockId(c.id_arquero) : c.id_arquero,
      id_sesion: c.id_sesion ? transformMockIdToUUID(c.id_sesion) : null,
      nombre_control: c.nombre_control,
      fecha: c.fecha,
      distancia: c.distancia,
      tipo_diana: c.tipo_diana,
      flechas_por_serie: c.flechas_por_serie || 6,
      tandas_por_serie: c.tandas_por_serie || 6,
      imagen_url: c.imagen_url || null,
      comentarios: c.comentarios || null
    }));
    results.controles_tiro = await pushToSupabase('controles_tiro', formattedControles);

    // 9. Impactos
    const formattedImpactos = localData.impactos.map(i => ({
      id_control: transformMockIdToUUID(i.id_control),
      serie: i.serie,
      tanda: i.tanda,
      flecha_index: i.flecha_index,
      valor_impacto: i.valor_impacto
    }));
    results.impactos_flechas = await pushToSupabase('impactos_flechas', formattedImpactos);

    // 10. Setups
    const formattedSetups = localData.setups.map(s => ({
      id: transformMockIdToUUID(s.id),
      id_arquero: s.id_arquero.startsWith('usr-') ? generateUUIDForMockId(s.id_arquero) : s.id_arquero,
      tipo: s.tipo,
      datos_json: s.datos_json
    }));
    results.setups_rutinas = await pushToSupabase('setups_rutinas', formattedSetups);

    // 11. Sesiones
    const formattedSesiones = localData.sesiones.map(s => ({
      id: transformMockIdToUUID(s.id),
      id_planificacion: null, // Since plans are freestanding in our newer simplified flow or linked locally
      titulo: s.titulo || 'Sesión de Entrenamiento',
      tipo_entrenamiento: s.tipo_entrenamiento || 'Técnico',
      fecha_asignada: s.fecha_asignada || new Date().toISOString().split('T')[0],
      asignado_a: s.asignado_a || 'arquero',
      id_grupo: s.id_grupo ? transformMockIdToUUID(s.id_grupo) : null,
      id_arquero: s.id_arquero && !s.id_arquero.startsWith('usr-') ? s.id_arquero : (s.id_arquero ? generateUUIDForMockId(s.id_arquero) : null),
      ejercicios_ids: s.ejercicios_ids || [],
      intensidad: s.intensidad || 50,
      comentarios: s.comentarios || null,
      completada_por_arqueros: s.completada_por_arqueros || [],
      ejercicios_completados_arqueros: s.ejercicios_completados_arqueros || {},
      flechas_completadas_arqueros: s.flechas_completadas_arqueros || {}
    }));
    results.sesiones = await pushToSupabase('sesiones', formattedSesiones);

    return { success: true, results };
  } catch (err: any) {
    console.error("General sync failure:", err);
    return { success: false, error: err.message || 'Error general en sincronización', results };
  }
}

// Pull data from Supabase and map back to local interfaces
export async function pullFromSupabase() {
  try {
    const data: any = {};
    
    // Fetch users
    const { data: dbUsers } = await supabase.from('usuarios').select('*');
    if (dbUsers) {
      data.usuarios = dbUsers.map(u => ({
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        apellidos: u.apellidos,
        email: u.email,
        rol: u.rol === 'tecnico' ? 'tecnico_principal' : u.rol, // Map backend 'tecnico' to frontend 'tecnico_principal'
        fecha_nacimiento: u.fecha_nacimiento,
        licencia: u.licencia,
        id_club: u.id_club,
        activo: u.activo,
        fecha_alta: u.fecha_alta
      }));
    }

    // Fetch setups
    const { data: dbSetups } = await supabase.from('setups_rutinas').select('*');
    if (dbSetups) {
      data.setups = dbSetups.map(s => ({
        id: s.id,
        id_arquero: s.id_arquero,
        tipo: s.tipo,
        datos_json: s.datos_json
      }));
    }

    // Fetch diaries
    const { data: dbDiarios } = await supabase.from('diario').select('*');
    if (dbDiarios) {
      data.diarios = dbDiarios.map(d => ({
        id: d.id,
        id_arquero: d.id_arquero,
        fecha: d.fecha,
        titulo: d.titulo,
        tipo_entrada: d.tipo_entrada,
        estado_animo: d.estado_animo,
        nivel_energia_cansancio: d.nivel_energia_cansancio,
        archivo_url: d.archivo_url,
        privacidad: d.privacidad,
        anotaciones_tecnico: d.anotaciones_tecnico
      }));
    }

    // Fetch controls
    const { data: dbControles } = await supabase.from('controles_tiro').select('*');
    if (dbControles) {
      data.controles = dbControles.map(c => ({
        id: c.id,
        id_arquero: c.id_arquero,
        id_sesion: c.id_sesion,
        nombre_control: c.nombre_control,
        fecha: c.fecha,
        distancia: c.distancia,
        tipo_diana: c.tipo_diana,
        flechas_por_serie: c.flechas_por_serie,
        tandas_por_serie: c.tandas_por_serie,
        imagen_url: c.imagen_url,
        comentarios: c.comentarios
      }));
    }

    // Fetch news
    const { data: dbNoticias } = await supabase.from('noticias_actividades').select('*');
    if (dbNoticias) {
      data.noticias = dbNoticias.map(n => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        contenido: n.contenido,
        fecha: n.fecha_creacion,
        nivel_competicion: n.nivel_competicion
      }));
    }

    // Fetch sessions (sesiones)
    const { data: dbSesiones } = await supabase.from('sesiones').select('*');
    if (dbSesiones) {
      data.sesiones = dbSesiones.map(s => ({
        id: s.id,
        titulo: s.titulo,
        tipo_entrenamiento: s.tipo_entrenamiento,
        fecha_asignada: s.fecha_asignada,
        asignado_a: s.asignado_a,
        id_grupo: s.id_grupo,
        id_arquero: s.id_arquero,
        ejercicios_ids: s.ejercicios_ids || [],
        intensidad: s.intensidad,
        comentarios: s.comentarios || '',
        completada_por_arqueros: s.completada_por_arqueros || [],
        ejercicios_completados_arqueros: s.ejercicios_completados_arqueros || {},
        flechas_completadas_arqueros: s.flechas_completadas_arqueros || {}
      }));
    }

    // Fetch grupos_entrenamiento
    const { data: dbGrupos } = await supabase.from('grupos_entrenamiento').select('*');
    if (dbGrupos) {
      data.grupos = dbGrupos.map(g => ({
        id: g.id,
        nombre_grupo: g.nombre_grupo,
        id_tecnico: g.id_tecnico
      }));
    }

    // Fetch miembros_grupo
    const { data: dbMiembros } = await supabase.from('miembros_grupo').select('*');
    if (dbMiembros) {
      data.miembros = dbMiembros.map(m => ({
        id_grupo: m.id_grupo,
        id_arquero: m.id_arquero,
        estado: m.estado
      }));
    }

    // Fetch planificacion
    const { data: dbPlanes } = await supabase.from('planificacion').select('*');
    if (dbPlanes) {
      data.planificaciones = dbPlanes.map(p => ({
        id: p.id,
        id_grupo: p.id_grupo,
        id_arquero: p.id_arquero,
        tipo: p.tipo,
        macrociclo: p.macrociclo,
        mesociclo: p.mesociclo,
        microciclo: p.microciclo,
        temporada: p.temporada,
        objetivos_macrociclo: p.objetivos_macrociclo,
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        mesociclos_lista: p.mesociclos_lista || [],
        competiciones: p.competiciones || []
      }));
    }

    // Fetch ejercicios
    const { data: dbEjercicios } = await supabase.from('ejercicios').select('*');
    if (dbEjercicios) {
      data.ejercicios = dbEjercicios.map(e => ({
        id: e.id,
        nombre: e.nombre,
        tipo_ejercicio: e.tipo_ejercicio,
        descripcion: e.descripcion,
        duracion: e.duracion,
        densidad_repeticiones: e.densidad_repeticiones,
        dificultad: e.dificultad,
        intensidad_flechas_repeticion: e.intensidad_flechas_repeticion
      }));
    }

    // Fetch impactos_flechas
    const { data: dbImpactos } = await supabase.from('impactos_flechas').select('*');
    if (dbImpactos) {
      data.impactos = dbImpactos.map(i => ({
        id_control: i.id_control,
        serie: i.serie,
        tanda: i.tanda,
        flecha_index: i.flecha_index,
        valor_impacto: i.valor_impacto
      }));
    }

    return { success: true, data };
  } catch (err : any) {
    return { success: false, error: err.message };
  }
}

// Convert local generated short string ids (e.g. 'usr-1', 'grp-2') to standard UUIDs for Supabase safety
export function transformMockIdToUUID(mockId: string): string {
  if (!mockId) return '';
  // If it's already a UUID, return it
  if (mockId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return mockId;
  }
  
  // Hash to deterministic UUID
  return generateUUIDForMockId(mockId);
}

function generateUUIDForMockId(id: string): string {
  // Simple deterministic UUID converter for consistent keys
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const parts = [
    Math.abs(hash).toString(16).padStart(8, '0'),
    Math.abs(hash * 3).toString(16).substring(0, 4).padStart(4, '0'),
    '4' + Math.abs(hash * 7).toString(16).substring(0, 3).padStart(3, '0'),
    '8' + Math.abs(hash * 11).toString(16).substring(0, 3).padStart(3, '0'),
    Math.abs(hash * 17).toString(16).substring(0, 12).padStart(12, '0')
  ];
  return parts.join('-');
}
