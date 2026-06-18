import React, { useState, useEffect } from 'react';
import { Usuario, NoticiasActividades, GrupoEntrenamiento, MiembroGrupo, Planificacion, Sesion, Ejercicio, DiarioEntrada, ControlTiro, ImpactoFlecha, SetupRutina } from './types';
import PublicPage from './components/PublicPage';
import AdminDashboard from './components/AdminDashboard';
import TecnicoDashboard from './components/TecnicoDashboard';
import ArqueroDashboard from './components/ArqueroDashboard';
import { Target, Users, ShieldAlert, Award, FileText, Database } from 'lucide-react';
import SupabaseSyncPanel from './components/SupabaseSyncPanel';

export default function App() {
  // --- STATE BASE DE DATOS MOCK PERSISTIDO ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [noticias, setNoticias] = useState<NoticiasActividades[]>([]);
  const [grupos, setGrupos] = useState<GrupoEntrenamiento[]>([]);
  const [miembros, setMiembros] = useState<MiembroGrupo[]>([]);
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [diarios, setDiarios] = useState<DiarioEntrada[]>([]);
  const [controles, setControles] = useState<ControlTiro[]>([]);
  const [setups, setSetups] = useState<SetupRutina[]>([]);
  const [impactos, setImpactos] = useState<ImpactoFlecha[]>([]);

  // --- SESIÓN Y NAVEGACIÓN ---
  const [usuarioLogueado, setUsuarioLogueado] = useState<Usuario | null>(null);
  const [showSupabasePanel, setShowSupabasePanel] = useState<boolean>(true);

  // --- INICIALIZADOR DE SEMILLA DE DATOS (SEED) ---
  useEffect(() => {
    // 1. Usuarios
    const sUsuarios = localStorage.getItem('archery_usuarios');
    let seedUsuarios: Usuario[] = [];
    if (sUsuarios) {
      seedUsuarios = JSON.parse(sUsuarios).map((u: any) => {
        if (u.rol === 'tecnico') {
          return { ...u, rol: 'tecnico_principal' };
        }
        return u;
      });
    } else {
      seedUsuarios = [
        {
          id_usuario: 'usr-admin-1',
          nombre: 'Isabel',
          apellidos: 'Mendoza',
          email: 'archery.admin@archeryapp.com',
          rol: 'admin',
          fecha_nacimiento: '1985-04-12',
          licencia: 'ADMIN-01',
          id_club: 'Club Arco Silense',
          activo: true,
          fecha_alta: new Date().toISOString()
        },
        {
          id_usuario: 'usr-tecnico-1',
          nombre: 'Francisco Javier',
          apellidos: 'Antón',
          email: 'archery.coach.fjan@gmail.com', // Email de metadata
          rol: 'tecnico_principal',
          fecha_nacimiento: '1974-11-20',
          licencia: 'FITA-442',
          id_club: 'Club Arco Silense',
          activo: true,
          fecha_alta: new Date().toISOString()
        },
        {
          id_usuario: 'usr-tecnico-aux-1',
          nombre: 'Marta',
          apellidos: 'Sánchez (Auxiliar)',
          email: 'marta.auxiliar@archeryapp.com',
          rol: 'tecnico_auxiliar',
          fecha_nacimiento: '1992-06-15',
          licencia: 'AUX-1029',
          id_club: 'Club Arco Silense',
          activo: true,
          fecha_alta: new Date().toISOString()
        },
        {
          id_usuario: 'usr-arquero-1',
          nombre: 'Lucas',
          apellidos: 'Cabrera',
          email: 'lucas.arquero@archeryapp.com',
          rol: 'arquero',
          fecha_nacimiento: '2001-09-14',
          licencia: '71992A',
          id_club: 'Club Arco Silense',
          activo: true,
          fecha_alta: new Date().toISOString()
        },
        {
          // Usuario inactivo inicial para demostrar el flujo crítico de validación por administrador
          id_usuario: 'usr-arquero-2',
          nombre: 'Pedro',
          apellidos: 'Pendiente De Aprobación',
          email: 'pedro.pendiente@archeryapp.com',
          rol: 'arquero',
          fecha_nacimiento: '2004-05-18',
          licencia: '88910X',
          id_club: 'Club Arco Silense',
          activo: false,
          fecha_alta: new Date().toISOString()
        }
      ];
      localStorage.setItem('archery_usuarios', JSON.stringify(seedUsuarios));
    }
    setUsuarios(seedUsuarios);

    // 2. Noticias y Actividades
    const sNoticias = localStorage.getItem('archery_noticias');
    let seedNoticias: NoticiasActividades[] = [];
    if (sNoticias) {
      seedNoticias = JSON.parse(sNoticias);
    } else {
      seedNoticias = [
        {
          id: 'not-1',
          tipo: 'competicion',
          titulo: 'Campeonato Nacional FITA Sala 18m',
          contenido: 'Convocatoria oficial para el control clasificatorio de sala de Madrid. Homologado por la RFETA. Registro abierto.',
          fecha_creacion: new Date().toISOString(),
          nivel_competicion: 'Nacional'
        },
        {
          id: 'not-2',
          tipo: 'actividad',
          titulo: 'Clase Magistral de Suelta con Disparador de Tensión',
          contenido: 'Un taller interactivo práctico impartido por entrenadores nacionales para perfeccionar la suelta ciega y evitar la tensión parasitaria del hombro de arco.',
          fecha_creacion: new Date().toISOString()
        }
      ];
      localStorage.setItem('archery_noticias', JSON.stringify(seedNoticias));
    }
    setNoticias(seedNoticias);

    // 3. Grupos de Entrenamiento
    const sGrupos = localStorage.getItem('archery_grupos');
    let seedGrupos: GrupoEntrenamiento[] = [];
    if (sGrupos) {
      seedGrupos = JSON.parse(sGrupos);
    } else {
      seedGrupos = [
        {
          id: 'grp-1',
          nombre_grupo: 'Grupo Tecnificación Arco Compuesto',
          id_tecnico: 'usr-tecnico-1',
          nombre_tecnico: 'Francisco Javier Antón'
        },
        {
          id: 'grp-2',
          nombre_grupo: 'Escuela de Iniciación Olímpica',
          id_tecnico: 'usr-tecnico-1',
          nombre_tecnico: 'Francisco Javier Antón'
        }
      ];
      localStorage.setItem('archery_grupos', JSON.stringify(seedGrupos));
    }
    setGrupos(seedGrupos);

    // 4. Miembros del grupo
    const sMiembros = localStorage.getItem('archery_miembros');
    let seedMiembros: MiembroGrupo[] = [];
    if (sMiembros) {
      seedMiembros = JSON.parse(sMiembros);
    } else {
      seedMiembros = [
        { id_grupo: 'grp-1', id_arquero: 'usr-arquero-1', estado: 'aceptado' },
        { id_grupo: 'grp-1', id_arquero: 'usr-arquero-2', estado: 'pendiente_solicitud' }
      ];
      localStorage.setItem('archery_miembros', JSON.stringify(seedMiembros));
    }
    setMiembros(seedMiembros);

    // 5. Planificación Deportiva
    const sPlan = localStorage.getItem('archery_planificaciones');
    let seedPlan: Planificacion[] = [];
    if (sPlan) {
      seedPlan = JSON.parse(sPlan);
    } else {
      seedPlan = [
        {
          id: 'plan-1',
          tipo: 'individual',
          id_arquero: 'usr-arquero-1',
          macrociclo: 'General FITA Carga I',
          temporada: 'Temporada 2026/2027',
          fecha_inicio: '2026-06-01',
          fecha_fin: '2026-12-31',
          objetivos_macrociclo: 'Estabilizar el ciclo gestual completo, optimizar el anclaje físico con clicker y consolidar la suelta dinámica sin retenciones.',
          mesociclos_lista: [
            {
              id: 'meso-seed-1',
              nombre: 'Mesociclo de Preparación General',
              tipo_mesociclo: 'Preparatorio',
              fecha_inicio: '2026-06-02',
              fecha_fin: '2026-06-30',
              microciclos: [
                {
                  id: 'micro-seed-1',
                  nombre: 'Microciclo Inicial',
                  fechas: 'Semana 1 (Junio)',
                  volumen_flechas: 250,
                  enfoque_principal: 'Fuerza de espalda y alineación',
                  objetivos: 'Lograr 6 flechas agrupadas por serie de forma relajada.'
                }
              ]
            }
          ],
          competiciones: []
        }
      ];
      localStorage.setItem('archery_planificaciones', JSON.stringify(seedPlan));
    }
    setPlanificaciones(seedPlan);

    // 6. Ejercicios
    const sEj = localStorage.getItem('archery_ejercicios');
    let seedEj: Ejercicio[] = [];
    if (sEj) {
      seedEj = JSON.parse(sEj);
    } else {
      seedEj = [
        {
          id: 'ej-1',
          nombre: 'Control de Expansión de clicks constante (30 metros)',
          tipo_ejercicio: 'Técnica',
          descripcion: 'Disparos a diana de 80 cm completa enfocándonos únicamente en que la suelta del clicker se active por retracción ósea, no manual.',
          duracion: 40,
          densidad_repeticiones: '6 flechas por tanda. Repetir 12 tandas',
          dificultad: 'Media',
          intensidad_flechas_repeticion: 72
        },
        {
          id: 'ej-2',
          nombre: 'Resistencia Estática Isometric',
          tipo_ejercicio: 'Fuerza',
          descripcion: 'Cargar el arco con banda elástica, anclar bajo mentón durante 12 segundos alternados, descansar 30 segundos.',
          duracion: 20,
          densidad_repeticiones: '8 repeticiones por sesión',
          dificultad: 'Alta',
          intensidad_flechas_repeticion: 0
        }
      ];
      localStorage.setItem('archery_ejercicios', JSON.stringify(seedEj));
    }
    setEjercicios(seedEj);

    // 7. Diario de Arquero
    const sDiario = localStorage.getItem('archery_diarios');
    let seedDiario: DiarioEntrada[] = [];
    if (sDiario) {
      seedDiario = JSON.parse(sDiario);
    } else {
      seedDiario = [
        {
          id: 'dia-1',
          id_arquero: 'usr-arquero-1',
          fecha: '2026-06-11',
          titulo: 'Alineación de codo posterior perfecta',
          tipo_entrada: 'Apunte técnico',
          estado_animo: 'Muy Focalizado',
          nivel_energia_cansancio: 8,
          privacidad: 'visible_tecnicos',
          anotaciones_tecnico: 'Muy buena estabilidad hoy Lucas, el volumen de 120 flechas fue sólido.'
        }
      ];
      localStorage.setItem('archery_diarios', JSON.stringify(seedDiario));
    }
    setDiarios(seedDiario);

    // 8. Controles de tiro
    const sControles = localStorage.getItem('archery_controles');
    if (sControles) {
      setControles(JSON.parse(sControles));
    } else {
      const seedControles: ControlTiro[] = [
        {
          id: 'ctrl-1',
          id_arquero: 'usr-arquero-1',
          nombre_control: 'Clasificatorio Semanal',
          fecha: '2026-06-10',
          distancia: '70m',
          tipo_diana: '122 cm',
          flechas_por_serie: 6,
          tandas_por_serie: 6,
          comentarios: 'Tanda finalizada con excelente agrupamiento en amarillo.'
        }
      ];
      localStorage.setItem('archery_controles', JSON.stringify(seedControles));
      setControles(seedControles);
    }

    // 9. Setups y Visor
    const sSetups = localStorage.getItem('archery_setups');
    let seedSetups: SetupRutina[] = [];
    if (sSetups) {
      seedSetups = JSON.parse(sSetups);
    } else {
      seedSetups = [
        {
          id: 'set-1',
          id_arquero: 'usr-arquero-1',
          tipo: 'setup',
          datos_json: {
            distancia: '70m',
            visor: '5.2',
            libras: '40 lbs',
            objetivo_mental: 'Alineación ocular con la fibra óptica del peep'
          }
        },
        {
          id: 'set-2',
          id_arquero: 'usr-arquero-1',
          tipo: 'setup',
          datos_json: {
            distancia: '50m',
            visor: '4.85',
            libras: '40 lbs',
            objetivo_mental: 'Anclaje óseo en pómulo constante'
          }
        }
      ];
      localStorage.setItem('archery_setups', JSON.stringify(seedSetups));
    }
    setSetups(seedSetups);
 
    // 10. Sesiones de entrenamiento
    const sSesiones = localStorage.getItem('archery_sesiones_entrenamiento');
    let seedSesiones: Sesion[] = [];
    if (sSesiones) {
      seedSesiones = JSON.parse(sSesiones);
    } else {
      seedSesiones = [
        {
          id: 'ses-1',
          titulo: 'Rutina de Fuerza y Resistencia Dinámica',
          tipo_entrenamiento: 'Físico',
          fecha_asignada: '2026-06-15',
          asignado_a: 'grupo',
          id_grupo: 'grp-1',
          ejercicios_ids: ['ej-2'],
          intensidad: 80,
          comentarios: 'Entrenamiento enfocado en core y potencia de espalda.'
        },
        {
          id: 'ses-2',
          titulo: 'Análisis Técnico Clicker & Expansión',
          tipo_entrenamiento: 'Técnico',
          fecha_asignada: '2026-06-16',
          asignado_a: 'arquero',
          id_arquero: 'usr-arquero-1',
          ejercicios_ids: ['ej-1'],
          intensidad: 70,
          comentarios: 'Seguimiento individual para pulir la regularidad del disparo.'
        }
      ];
      localStorage.setItem('archery_sesiones_entrenamiento', JSON.stringify(seedSesiones));
    }
    setSesiones(seedSesiones);

    // 11. Impactos para dianas y estadísticas
    const sImps = localStorage.getItem('archery_impactos');
    let seedImps: ImpactoFlecha[] = [];
    if (sImps) {
      seedImps = JSON.parse(sImps);
    } else {
      const values = ['X', '10', '9', '10', '9', '8'];
      for (let s = 1; s <= 1; s++) { 
        for (let t = 1; t <= 6; t++) { 
          for (let f = 0; f < 6; f++) {
            const val = values[(t + f) % values.length];
            let r = 10;
            if (val === 'X') r = 3 + Math.random() * 5;
            else if (val === '10') r = 8 + Math.random() * 6;
            else if (val === '9') r = 16 + Math.random() * 12;
            else if (val === '8') r = 30 + Math.random() * 12;
            const angle = Math.random() * Math.PI * 2;
            seedImps.push({
              id_control: 'ctrl-1',
              serie: s,
              tanda: t,
              flecha_index: f + 1,
              valor_impacto: val,
              x: 150 + r * Math.cos(angle),
              y: 150 + r * Math.sin(angle)
            });
          }
        }
      }
      localStorage.setItem('archery_impactos', JSON.stringify(seedImps));
    }
    setImpactos(seedImps);

  }, []);

  // --- HANDLERS BASE DE DATOS MOCK ---

  // Registro de usuarios nuevos (comienza inactivo por defecto)
  const handleRegister = (nuevoU: Usuario) => {
    const list = [...usuarios, nuevoU];
    setUsuarios(list);
    localStorage.setItem('archery_usuarios', JSON.stringify(list));
  };

  // Login del usuario
  const handleLogin = (u: Usuario) => {
    setUsuarioLogueado(u);
  };

  // Cambiar estado activo de usuarios (Aprobar/Bloquear)
  const handleToggleUserActive = (id: string) => {
    const list = usuarios.map(u => {
      if (u.id_usuario === id) {
        return { ...u, activo: !u.activo };
      }
      return u;
    });
    setUsuarios(list);
    localStorage.setItem('archery_usuarios', JSON.stringify(list));
  };

  // Eliminar usuario
  const handleDeleteUsuario = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar el usuario? Se borrarán sus datos asociados.')) {
      const list = usuarios.filter(u => u.id_usuario !== id);
      setUsuarios(list);
      localStorage.setItem('archery_usuarios', JSON.stringify(list));
    }
  };

  // Actualizar usuario (Admin)
  const handleUpdateUsuario = (usuarioActualizado: Usuario) => {
    const list = usuarios.map(u => u.id_usuario === usuarioActualizado.id_usuario ? usuarioActualizado : u);
    setUsuarios(list);
    localStorage.setItem('archery_usuarios', JSON.stringify(list));
  };

  // Crear anuncio / competición
  const handleAddNoticia = (nuevaN: NoticiasActividades) => {
    const list = [nuevaN, ...noticias];
    setNoticias(list);
    localStorage.setItem('archery_noticias', JSON.stringify(list));
  };

  // Aprobar ingreso de arquero a un grupo de entrenamiento
  const handleApproveMiembro = (idGrupo: string, idArquero: string) => {
    const list = miembros.map(m => {
      if (m.id_grupo === idGrupo && m.id_arquero === idArquero) {
        return { ...m, estado: 'aceptado' as const };
      }
      return m;
    });
    setMiembros(list);
    localStorage.setItem('archery_miembros', JSON.stringify(list));
    alert('¡Solicitud de ingreso aceptada en el grupo de entrenamiento!');
  };

  // Añadir un miembro de forma directa (por el entrenador)
  const handleAddMiembroDirecto = (idGrupo: string, idArquero: string) => {
    const existe = miembros.find(m => m.id_grupo === idGrupo && m.id_arquero === idArquero);
    let list;
    if (existe) {
      list = miembros.map(m => {
        if (m.id_grupo === idGrupo && m.id_arquero === idArquero) {
          return { ...m, estado: 'aceptado' as const };
        }
        return m;
      });
    } else {
      const nuevo: MiembroGrupo = { id_grupo: idGrupo, id_arquero: idArquero, estado: 'aceptado' };
      list = [...miembros, nuevo];
    }
    setMiembros(list);
    localStorage.setItem('archery_miembros', JSON.stringify(list));
  };

  // Eliminar un miembro de un grupo (por el entrenador o de forma directa)
  const handleRemoveMiembroGrupo = (idGrupo: string, idArquero: string) => {
    const list = miembros.filter(m => !(m.id_grupo === idGrupo && m.id_arquero === idArquero));
    setMiembros(list);
    localStorage.setItem('archery_miembros', JSON.stringify(list));
  };

  // Guardar feedback del entrenador para la entrada del diario de un arquero
  const handleAddFeedbackDiario = (idDiario: string, feedback: string) => {
    const list = diarios.map(d => {
      if (d.id === idDiario) {
        return { ...d, anotaciones_tecnico: feedback };
      }
      return d;
    });
    setDiarios(list);
    localStorage.setItem('archery_diarios', JSON.stringify(list));
  };

  // Crear un grupo de entrenamiento (Técnico / Entrenador)
  const handleAddGrupo = (nombre: string) => {
    const nuevoGrupo: GrupoEntrenamiento = {
      id: 'grp-' + Date.now(),
      nombre_grupo: nombre,
      id_tecnico: usuarioLogueado?.id_usuario || '',
      nombre_tecnico: usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellidos}` : ''
    };
    const list = [...grupos, nuevoGrupo];
    setGrupos(list);
    localStorage.setItem('archery_grupos', JSON.stringify(list));
  };

  // Eliminar un grupo de entrenamiento (Técnico)
  const handleRemoveGrupo = (idGrupo: string) => {
    const listGrupos = grupos.filter(g => g.id !== idGrupo);
    setGrupos(listGrupos);
    localStorage.setItem('archery_grupos', JSON.stringify(listGrupos));

    // Dar de baja a todos los miembros de este grupo
    const listMiembros = miembros.filter(m => m.id_grupo !== idGrupo);
    setMiembros(listMiembros);
    localStorage.setItem('archery_miembros', JSON.stringify(listMiembros));

    // También limpiar planificaciones vinculadas de este grupo para evitar datos huérfanos
    const listPlanificaciones = planificaciones.filter(p => p.id_grupo !== idGrupo);
    setPlanificaciones(listPlanificaciones);
    localStorage.setItem('archery_planificaciones', JSON.stringify(listPlanificaciones));
  };

  // Modificar los datos de un grupo (Técnico)
  const handleUpdateGrupo = (idGrupo: string, nuevoNombre: string, idAuxiliar?: string, nombreAuxiliar?: string) => {
    const list = grupos.map(g => {
      if (g.id === idGrupo) {
        return { 
          ...g, 
          nombre_grupo: nuevoNombre,
          id_tecnico_auxiliar: idAuxiliar === undefined ? g.id_tecnico_auxiliar : (idAuxiliar || undefined),
          nombre_tecnico_auxiliar: nombreAuxiliar === undefined ? g.nombre_tecnico_auxiliar : (nombreAuxiliar || undefined)
        };
      }
      return g;
    });
    setGrupos(list);
    localStorage.setItem('archery_grupos', JSON.stringify(list));
  };

  // Enviar solicitud de unirse a un grupo (desde el arquero)
  const handleApplyGrupo = (idGrupo: string) => {
    const nuevaSol: MiembroGrupo = {
      id_grupo: idGrupo,
      id_arquero: usuarioLogueado?.id_usuario || '',
      estado: 'pendiente_solicitud'
    };
    const list = [...miembros, nuevaSol];
    setMiembros(list);
    localStorage.setItem('archery_miembros', JSON.stringify(list));
    alert('¡Solicitud de adhesión enviada al Técnico de la escuela!');
  };

  // Añadir planificación
  const handleAddPlanificacion = (nuevaP: Planificacion) => {
    const list = [nuevaP, ...planificaciones];
    setPlanificaciones(list);
    localStorage.setItem('archery_planificaciones', JSON.stringify(list));
  };

  // Actualizar planificación
  const handleUpdatePlanificacion = (planActualizada: Planificacion) => {
    const list = planificaciones.map(p => p.id === planActualizada.id ? planActualizada : p);
    setPlanificaciones(list);
    localStorage.setItem('archery_planificaciones', JSON.stringify(list));
  };

  // Eliminar planificación
  const handleRemovePlanificacion = (idPlan: string) => {
    const list = planificaciones.filter(p => p.id !== idPlan);
    setPlanificaciones(list);
    localStorage.setItem('archery_planificaciones', JSON.stringify(list));
  };

  // Añadir ejercicio
  const handleAddEjercicio = (nuevoE: Ejercicio) => {
    const list = [nuevoE, ...ejercicios];
    setEjercicios(list);
    localStorage.setItem('archery_ejercicios', JSON.stringify(list));
  };

  // Añadir sesión de entrenamiento
  const handleAddSesion = (nuevaS: Sesion) => {
    const list = [nuevaS, ...sesiones];
    setSesiones(list);
    localStorage.setItem('archery_sesiones_entrenamiento', JSON.stringify(list));
  };

  // Eliminar sesión de entrenamiento
  const handleRemoveSesion = (id: string) => {
    const list = sesiones.filter(s => s.id !== id);
    setSesiones(list);
    localStorage.setItem('archery_sesiones_entrenamiento', JSON.stringify(list));
  };

  // Actualizar ejercicio
  const handleUpdateEjercicio = (ejercicioActualizado: Ejercicio) => {
    const list = ejercicios.map(e => e.id === ejercicioActualizado.id ? ejercicioActualizado : e);
    setEjercicios(list);
    localStorage.setItem('archery_ejercicios', JSON.stringify(list));
  };

  // Actualizar sesión de entrenamiento
  const handleUpdateSesion = (sesionActualizada: Sesion) => {
    const list = sesiones.map(s => s.id === sesionActualizada.id ? sesionActualizada : s);
    setSesiones(list);
    localStorage.setItem('archery_sesiones_entrenamiento', JSON.stringify(list));
  };

  // Añadir entrada de diario
  const handleAddDiario = (nuevaD: DiarioEntrada) => {
    const list = [nuevaD, ...diarios];
    setDiarios(list);
    localStorage.setItem('archery_diarios', JSON.stringify(list));
  };

  // Añadir setup/marca visor
  const handleAddSetup = (nuevoS: SetupRutina) => {
    const list = [nuevoS, ...setups];
    setSetups(list);
    localStorage.setItem('archery_setups', JSON.stringify(list));
  };

  const handleRemoveSetup = (id: string) => {
    const list = setups.filter(s => s.id !== id);
    setSetups(list);
    localStorage.setItem('archery_setups', JSON.stringify(list));
  };

  const handleUpdateSetup = (updated: SetupRutina) => {
    const list = setups.map(s => s.id === updated.id ? updated : s);
    setSetups(list);
    localStorage.setItem('archery_setups', JSON.stringify(list));
  };

  // Guardar control completo Diana Interactiva
  const handleAddControlTiro = (nuevoCtrl: ControlTiro, deImpactos: ImpactoFlecha[]) => {
    // Vincular impactos con el id real del control de tiro generado
    const impactosVinculados = deImpactos.map(imp => ({
      ...imp,
      id_control: nuevoCtrl.id
    }));

    // Guardar control
    const listControles = [nuevoCtrl, ...controles];
    setControles(listControles);
    localStorage.setItem('archery_controles', JSON.stringify(listControles));

    // Guardar impactos del control en una lista persistida para analiticas
    const hImpactosActualizados = [...impactos, ...impactosVinculados];
    setImpactos(hImpactosActualizados);
    localStorage.setItem('archery_impactos', JSON.stringify(hImpactosActualizados));

    // También creamos un registro automático de entrenamiento en el Diario para que aparezca en su historial
    const entradaA: DiarioEntrada = {
      id: 'dia-auto-' + Date.now(),
      id_arquero: nuevoCtrl.id_arquero,
      fecha: nuevoCtrl.fecha,
      titulo: `Simulación Control Diana: ${nuevoCtrl.nombre_control} (${nuevoCtrl.distancia})`,
      tipo_entrada: 'Entrenamiento',
      estado_animo: 'Muy Focalizado',
      nivel_energia_cansancio: 8,
      archivo_url: nuevoCtrl.imagen_url,
      privacidad: 'visible_tecnicos',
      anotaciones_tecnico: 'Control completado. El agrupamiento es muy homogéneo. Mantén este anclaje.'
    };
    handleAddDiario(entradaA);
  };

  // --- SWITCH DE MOCK DIRECTO (FACILIDAD DE REVISIÓN PARA EL EVALUADOR) ---
  const handleMockSwitch = (rol: 'admin' | 'tecnico_principal' | 'tecnico_auxiliar' | 'arquero') => {
    if (rol === 'admin') {
      const ad = usuarios.find(u => u.rol === 'admin') || usuarios[0];
      setUsuarioLogueado(ad);
    } else if (rol === 'tecnico_principal') {
      const tec = usuarios.find(u => u.rol === 'tecnico_principal') || usuarios[1];
      setUsuarioLogueado(tec);
    } else if (rol === 'tecnico_auxiliar') {
      const tec = usuarios.find(u => u.rol === 'tecnico_auxiliar') || usuarios[2];
      setUsuarioLogueado(tec);
    } else {
      const arq = usuarios.find(u => u.rol === 'arquero' && u.activo) || usuarios[3];
      setUsuarioLogueado(arq);
    }
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
  };

  const handleSyncDataRetrieved = (data: {
    usuarios?: Usuario[];
    setups?: SetupRutina[];
    diarios?: DiarioEntrada[];
    controles?: ControlTiro[];
    noticias?: any[];
    sesiones?: Sesion[];
    grupos?: GrupoEntrenamiento[];
    miembros?: MiembroGrupo[];
    planificaciones?: Planificacion[];
    ejercicios?: Ejercicio[];
    impactos?: ImpactoFlecha[];
  }) => {
    if (data.usuarios && data.usuarios.length > 0) {
      setUsuarios(data.usuarios);
      localStorage.setItem('archery_usuarios', JSON.stringify(data.usuarios));
    }
    if (data.setups && data.setups.length > 0) {
      setSetups(data.setups);
      localStorage.setItem('archery_setups', JSON.stringify(data.setups));
    }
    if (data.diarios && data.diarios.length > 0) {
      setDiarios(data.diarios);
      localStorage.setItem('archery_diarios', JSON.stringify(data.diarios));
    }
    if (data.controles && data.controles.length > 0) {
      setControles(data.controles);
      localStorage.setItem('archery_controles', JSON.stringify(data.controles));
    }
    if (data.noticias && data.noticias.length > 0) {
      setNoticias(data.noticias);
      localStorage.setItem('archery_noticias', JSON.stringify(data.noticias));
    }
    if (data.sesiones && data.sesiones.length > 0) {
      setSesiones(data.sesiones);
      localStorage.setItem('archery_sesiones_entrenamiento', JSON.stringify(data.sesiones));
    }
    if (data.grupos && data.grupos.length > 0) {
      setGrupos(data.grupos);
      localStorage.setItem('archery_grupos', JSON.stringify(data.grupos));
    }
    if (data.miembros && data.miembros.length > 0) {
      setMiembros(data.miembros);
      localStorage.setItem('archery_miembros', JSON.stringify(data.miembros));
    }
    if (data.planificaciones && data.planificaciones.length > 0) {
      setPlanificaciones(data.planificaciones);
      localStorage.setItem('archery_planificaciones', JSON.stringify(data.planificaciones));
    }
    if (data.ejercicios && data.ejercicios.length > 0) {
      setEjercicios(data.ejercicios);
      localStorage.setItem('archery_ejercicios', JSON.stringify(data.ejercicios));
    }
    if (data.impactos && data.impactos.length > 0) {
      localStorage.setItem('archery_impactos', JSON.stringify(data.impactos));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* Barra de Acceso Rápido Global para demo / evaluadores */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2.5 z-40 relative">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 w-2 h-2 rounded-full animate-ping"></div>
          <p className="text-[11px] font-mono font-bold tracking-wider text-slate-300">
            SIMULACIÓN EN VIVO COMPLETA • VISTAS SEGÚN ROL (RBAC) ACTIVADA
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400">Probar un Rol de la App:</span>
          <button 
            onClick={() => handleMockSwitch('admin')}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition transition-all ${
              usuarioLogueado?.rol === 'admin' 
                ? 'bg-purple-650 text-white font-extrabold scale-105 shadow' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-305'
            }`}
          >
            Administrador
          </button>
          <button 
            onClick={() => handleMockSwitch('tecnico_principal')}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition transition-all ${
              usuarioLogueado?.rol === 'tecnico_principal' 
                ? 'bg-indigo-650 text-white font-extrabold scale-105 shadow' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-305'
            }`}
          >
            Téc. Principal
          </button>
          <button 
            onClick={() => handleMockSwitch('tecnico_auxiliar')}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition transition-all ${
              usuarioLogueado?.rol === 'tecnico_auxiliar' 
                ? 'bg-blue-650 text-white font-extrabold scale-105 shadow' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-305'
            }`}
          >
            Téc. Auxiliar
          </button>
          <button 
            onClick={() => handleMockSwitch('arquero')}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition transition-all ${
              usuarioLogueado?.rol === 'arquero' 
                ? 'bg-[#ef233c] text-white font-extrabold scale-105 shadow' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-305'
            }`}
          >
            Arquero Activo
          </button>
          <button 
            onClick={handleLogout}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md text-slate-400 hover:bg-slate-800 ${
              !usuarioLogueado ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Desconectado / Landing
          </button>
        </div>
      </div>

      {/* RENDERIZADOR ESPECÍFICO SEGÚN ROL */}
      <div className="flex-1 flex flex-col">
        {!usuarioLogueado ? (
          <PublicPage 
            noticias={noticias}
            grupos={grupos}
            usuariosExistentes={usuarios}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onMockUserSwitch={handleMockSwitch}
          />
        ) : usuarioLogueado.rol === 'admin' ? (
          <AdminDashboard 
            usuarioActual={usuarioLogueado}
            usuariosList={usuarios}
            noticiasList={noticias}
            onToggleUserActive={handleToggleUserActive}
            onDeleteUsuario={handleDeleteUsuario}
            onUpdateUsuario={handleUpdateUsuario}
            onAddNoticia={handleAddNoticia}
            onLogout={handleLogout}
          />
        ) : (usuarioLogueado.rol === 'tecnico_principal' || usuarioLogueado.rol === 'tecnico_auxiliar') ? (
          <TecnicoDashboard 
            usuarioActual={usuarioLogueado}
            usuariosList={usuarios}
            gruposList={grupos}
            miembrosList={miembros}
            planificaciones={planificaciones}
            ejerciciosList={ejercicios}
            sesionesList={sesiones}
            diariosList={diarios}
            controlesList={controles}
            setupsList={setups}
            impactosList={impactos}
            onApproveMiembro={handleApproveMiembro}
            onAddMiembroDirecto={handleAddMiembroDirecto}
            onRemoveMiembroGrupo={handleRemoveMiembroGrupo}
            onAddFeedbackDiario={handleAddFeedbackDiario}
            onAddPlanificacion={handleAddPlanificacion}
            onUpdatePlanificacion={handleUpdatePlanificacion}
            onRemovePlanificacion={handleRemovePlanificacion}
            onAddEjercicio={handleAddEjercicio}
            onUpdateEjercicio={handleUpdateEjercicio}
            onAddSesion={handleAddSesion}
            onUpdateSesion={handleUpdateSesion}
            onRemoveSesion={handleRemoveSesion}
            onAddGrupo={handleAddGrupo}
            onRemoveGrupo={handleRemoveGrupo}
            onUpdateGrupo={handleUpdateGrupo}
            onLogout={handleLogout}
          />
        ) : (
          <ArqueroDashboard 
            usuarioActual={usuarioLogueado}
            usuariosList={usuarios}
            gruposList={grupos}
            miembrosList={miembros}
            planificaciones={planificaciones}
            ejerciciosList={ejercicios}
            sesionesList={sesiones}
            diariosList={diarios}
            controlesList={controles}
            setupsList={setups}
            impactosList={impactos}
            onAddDiario={handleAddDiario}
            onAddControlTiro={handleAddControlTiro}
            onApplyGrupo={handleApplyGrupo}
            onAddSetup={handleAddSetup}
            onRemoveSetup={handleRemoveSetup}
            onUpdateSetup={handleUpdateSetup}
            onUpdateSesion={handleUpdateSesion}
            onLogout={handleLogout}
          />
        )}
      </div>

      {usuarioLogueado && showSupabasePanel && (
        <div className="bg-slate-55 border-t border-slate-200 px-4 py-4 shrink-0 shadow-inner">
          <div className="max-w-7xl mx-auto flex justify-between items-center mb-1 px-4">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
              🔌 Integración Remota de Base de Datos
            </span>
            <button 
              onClick={() => setShowSupabasePanel(false)}
              className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 px-2.5 py-1 rounded border border-rose-200 transition uppercase cursor-pointer"
            >
              Hé Ocultar Panel de Sincronización
            </button>
          </div>
          <SupabaseSyncPanel 
            usuarios={usuarios}
            noticias={noticias}
            grupos={grupos}
            miembros={miembros}
            planificaciones={planificaciones}
            ejercicios={ejercicios}
            sesiones={sesiones}
            diarios={diarios}
            controles={controles}
            setups={setups}
            onSyncDataRetrieved={handleSyncDataRetrieved}
          />
        </div>
      )}

      {usuarioLogueado && !showSupabasePanel && (
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-2.5 flex justify-between items-center text-xs text-slate-500 font-semibold shadow-xs">
          <span>Base de datos en la nube de Supabase configurada con éxito.</span>
          <button 
            onClick={() => setShowSupabasePanel(true)}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-extrabold text-[10px] rounded border border-indigo-200 uppercase transition tracking-wide cursor-pointer animate-pulse"
          >
            Mostrar Panel de Sincronización Supabase
          </button>
        </div>
      )}

    </div>
  );
}
