import React, { useState } from 'react';
import { Usuario, GrupoEntrenamiento, MiembroGrupo, Planificacion, Sesion, Ejercicio, PlanificacionTipo, EjercicioTipo, EjercicioDificultad, DiarioEntrada, ControlTiro, SetupRutina, MesocicloPlan, MicrocicloPlan, CompeticionPlaneada } from '../types';
import { Users, Calendar, Target, FileText, TrendingUp, Sparkles, Plus, Eye, CheckCircle, BarChart2, Trash2, BookOpen, ArrowLeft, Sliders, MessageSquare, Check, UserPlus, Pencil, X, Search, Trophy, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { generateSessionPDF } from '../lib/pdfGenerator';

interface TecnicoDashboardProps {
  usuarioActual: Usuario;
  usuariosList: Usuario[];
  gruposList: GrupoEntrenamiento[];
  miembrosList: MiembroGrupo[];
  planificaciones: Planificacion[];
  ejerciciosList: Ejercicio[];
  sesionesList?: Sesion[];
  diariosList: DiarioEntrada[];
  controlesList: ControlTiro[];
  setupsList: SetupRutina[];
  onApproveMiembro: (idGrupo: string, idArquero: string) => void;
  onAddMiembroDirecto: (idGrupo: string, idArquero: string) => void;
  onRemoveMiembroGrupo: (idGrupo: string, idArquero: string) => void;
  onAddFeedbackDiario: (idDiario: string, feedback: string) => void;
  onAddPlanificacion: (p: Planificacion) => void;
  onUpdatePlanificacion?: (p: Planificacion) => void;
  onRemovePlanificacion?: (id: string) => void;
  onAddEjercicio: (e: Ejercicio) => void;
  onUpdateEjercicio: (e: Ejercicio) => void;
  onAddSesion: (s: Sesion) => void;
  onUpdateSesion: (s: Sesion) => void;
  onRemoveSesion?: (id: string) => void;
  onAddGrupo: (nombre: string) => void;
  onRemoveGrupo: (idGrupo: string) => void;
  onUpdateGrupo: (idGrupo: string, nuevoNombre: string, idAuxiliar?: string, nombreAuxiliar?: string) => void;
  onLogout: () => void;
}

export default function TecnicoDashboard({
  usuarioActual,
  usuariosList,
  gruposList,
  miembrosList,
  planificaciones,
  ejerciciosList,
  sesionesList = [],
  diariosList,
  controlesList,
  setupsList,
  onApproveMiembro,
  onAddMiembroDirecto,
  onRemoveMiembroGrupo,
  onAddFeedbackDiario,
  onAddPlanificacion,
  onUpdatePlanificacion,
  onRemovePlanificacion,
  onAddEjercicio,
  onUpdateEjercicio,
  onAddSesion,
  onUpdateSesion,
  onRemoveSesion,
  onAddGrupo,
  onRemoveGrupo,
  onUpdateGrupo,
  onLogout
}: TecnicoDashboardProps) {
  const [activeTab, setActiveTab] = useState<'grupos' | 'planificacion' | 'sesiones' | 'informes' | 'scouting'>('grupos');
  const [sesionesSubTab, setSesionesSubTab] = useState<'sesiones' | 'ejercicios'>('sesiones');

  // Mando de expediente y gestión directa
  const [selectedArcherId, setSelectedArcherId] = useState<string | null>(null);
  const [grupoSelectAdd, setGrupoSelectAdd] = useState<{ [grupoId: string]: string }>({});
  const [feedbackDiarioText, setFeedbackDiarioText] = useState<{ [diarioId: string]: string }>({});
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [editingGrupoVal, setEditingGrupoVal] = useState('');

  // Modal de gestión de deportistas/arqueros por grupo
  const [mgmtGrupo, setMgmtGrupo] = useState<GrupoEntrenamiento | null>(null);
  const [mgmtSearch, setMgmtSearch] = useState('');

  // Cuadro de confirmación personalizado para evitar cuelgues con window.confirm en iframes sandboxed
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const pedirConfirmacion = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  // Planificación form
  const [planTipo, setPlanTipo] = useState<PlanificacionTipo>('individual');
  const [planGrupoId, setPlanGrupoId] = useState('');
  const [planArqueroId, setPlanArqueroId] = useState('');
  const [planMacro, setPlanMacro] = useState('General FITA Carga I');
  const [planTemporada, setPlanTemporada] = useState('Temporada 2026/2027');
  const [planFechaInicio, setPlanFechaInicio] = useState('2026-06-01');
  const [planFechaFin, setPlanFechaFin] = useState('2026-12-31');
  const [planObjetivos, setPlanObjetivos] = useState('Estabilizar el ciclo gestual completo, optimizar el anclaje físico con clicker y consolidar la suelta dinámica sin retenciones.');

  // Estado para el macrociclo seleccionado para diseño jerárquico
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Formulario de Mesociclo nuevo
  const [mesoNombre, setMesoNombre] = useState('');
  const [mesoTipo, setMesoTipo] = useState('Preparatorio');
  const [mesoInicio, setMesoInicio] = useState('2026-06-01');
  const [mesoFin, setMesoFin] = useState('2026-06-30');
  const [isAddingMeso, setIsAddingMeso] = useState(false);

  // Formulario de Microciclo nuevo
  const [addingMicroForMesoId, setAddingMicroForMesoId] = useState<string | null>(null);
  const [microNombre, setMicroNombre] = useState('');
  const [microFechas, setMicroFechas] = useState('');
  const [microVolumen, setMicroVolumen] = useState<number>(300);
  const [microEnfoque, setMicroEnfoque] = useState('Técnica de anclaje');
  const [microObjetivo, setMicroObjetivo] = useState('');

  // Formulario de Competición nueva
  const [isAddingComp, setIsAddingComp] = useState(false);
  const [compNombre, setCompNombre] = useState('');
  const [compFecha, setCompFecha] = useState('2026-06-25');
  const [compImportancia, setCompImportancia] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [compTipo, setCompTipo] = useState<'grupo' | 'individual'>('grupo');
  const [compArqueroId, setCompArqueroId] = useState('');
  const [compComments, setCompComments] = useState('');

  // Estado para el control del calendario interactivo
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // 5 corresponds to June 2026

  // Estados de edición para Macrociclo, Mesociclo, Microciclo y Competicion
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [editingMesoId, setEditingMesoId] = useState<string | null>(null);
  const [editingMesoNombre, setEditingMesoNombre] = useState('');
  const [editingMesoTipo, setEditingMesoTipo] = useState('Preparatorio');
  const [editingMesoInicio, setEditingMesoInicio] = useState('2026-06-01');
  const [editingMesoFin, setEditingMesoFin] = useState('2026-06-30');

  const [editingMicroId, setEditingMicroId] = useState<string | null>(null);
  const [editingMicroNombre, setEditingMicroNombre] = useState('');
  const [editingMicroFechas, setEditingMicroFechas] = useState('');
  const [editingMicroVolumen, setEditingMicroVolumen] = useState<number>(300);
  const [editingMicroEnfoque, setEditingMicroEnfoque] = useState('Técnica de anclaje');
  const [editingMicroObjetivo, setEditingMicroObjetivo] = useState('');

  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editingCompNombre, setEditingCompNombre] = useState('');
  const [editingCompFecha, setEditingCompFecha] = useState('2026-06-25');
  const [editingCompImportancia, setEditingCompImportancia] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [editingCompTipo, setEditingCompTipo] = useState<'grupo' | 'individual'>('grupo');
  const [editingCompArqueroId, setEditingCompArqueroId] = useState('');
  const [editingCompComments, setEditingCompComments] = useState('');

  // Ejercicio form
  const [ejNombre, setEjNombre] = useState('');
  const [ejTipo, setEjTipo] = useState<EjercicioTipo>('Técnica');
  const [ejDesc, setEjDesc] = useState('');
  const [ejDuracion, setEjDuracion] = useState(45);
  const [ejDensidad, setEjDensidad] = useState('6 flechas por serie en 2 min');
  const [ejDificultad, setEjDificultad] = useState<EjercicioDificultad>('Media');
  const [ejIntensidadFlechas, setEjIntensidadFlechas] = useState(72);

  // Filtros de Tipo de Ejercicio
  const [filterEjerciciosBancoTipo, setFilterEjerciciosBancoTipo] = useState<string>('Todos');
  const [filterEjerciciosProgramarTipo, setFilterEjerciciosProgramarTipo] = useState<string>('Todos');

  // Sesiones de Entrenamiento form
  const [sesTitulo, setSesTitulo] = useState('');
  const [tiposEntrenamiento, setTiposEntrenamiento] = useState<string[]>(() => {
    const defaultTypes = ['Técnico', 'Físico', 'Psicológico'];
    try {
      const saved = localStorage.getItem('archery_tipos_entrenamiento');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.from(new Set([...defaultTypes, ...parsed]));
    } catch (e) {
      return defaultTypes;
    }
  });

  React.useEffect(() => {
    const defaultTypes = ['Técnico', 'Físico', 'Psicológico'];
    try {
      const saved = localStorage.getItem('archery_tipos_entrenamiento');
      const parsed = saved ? JSON.parse(saved) : [];
      const sessionTypes = sesionesList.map(s => s.tipo_entrenamiento).filter(Boolean);
      const combined = Array.from(new Set([...defaultTypes, ...parsed, ...sessionTypes]));
      setTiposEntrenamiento(combined);
    } catch (e) {
      // safe fallback
    }
  }, [sesionesList]);

  const [sesTipo, setSesTipo] = useState('Técnico');
  const [nuevoTipoEntrenamiento, setNuevoTipoEntrenamiento] = useState('');
  const [sesFecha, setSesFecha] = useState('2026-06-15');
  const [sesAsignadoA, setSesAsignadoA] = useState<'grupo' | 'arquero'>('grupo');
  const [sesGrupoId, setSesGrupoId] = useState(gruposList[0]?.id || '');
  const [sesArqueroId, setSesArqueroId] = useState(usuariosList.find(u => u.rol === 'arquero')?.id_usuario || '');
  const [sesEjerciciosIds, setSesEjerciciosIds] = useState<string[]>([]);
  const [sesIntensidad, setSesIntensidad] = useState(75);
  const [sesComentarios, setSesComentarios] = useState('');

  // Informes form
  const [informeArqueroId, setInformeArqueroId] = useState('');
  const [informeGrupoId, setInformeGrupoId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('2026-06-01');
  const [fechaHasta, setFechaHasta] = useState('2026-06-15');
  const [informeResult, setInformeResult] = useState<any | null>(null);

  // Estados de edición para Ejercicios y Sesiones
  const [editingEjercicioId, setEditingEjercicioId] = useState<string | null>(null);
  const [editingSesionId, setEditingSesionId] = useState<string | null>(null);

  const handleEditEjercicioClick = (ej: Ejercicio) => {
    setEditingEjercicioId(ej.id);
    setEjNombre(ej.nombre);
    setEjTipo(ej.tipo_ejercicio);
    setEjDesc(ej.descripcion);
    setEjDuracion(ej.duracion);
    setEjDensidad(ej.densidad_repeticiones);
    setEjDificultad(ej.dificultad);
    setEjIntensidadFlechas(ej.intensidad_flechas_repeticion);
  };

  const handleCancelEditEjercicio = () => {
    setEditingEjercicioId(null);
    setEjNombre('');
    setEjTipo('Técnica');
    setEjDesc('');
    setEjDuracion(45);
    setEjDensidad('6 flechas por serie en 2 min');
    setEjDificultad('Media');
    setEjIntensidadFlechas(72);
  };

  const handleEditSesionClick = (ses: Sesion) => {
    setEditingSesionId(ses.id);
    setSesTitulo(ses.titulo);
    setSesTipo(ses.tipo_entrenamiento);
    setSesFecha(ses.fecha_asignada);
    setSesAsignadoA(ses.asignado_a);
    if (ses.asignado_a === 'grupo') {
      setSesGrupoId(ses.id_grupo || '');
    } else {
      setSesArqueroId(ses.id_arquero || '');
    }
    setSesEjerciciosIds(ses.ejercicios_ids || []);
    setSesIntensidad(ses.intensidad);
    setSesComentarios(ses.comentarios || '');
  };

  const handleCancelEditSesion = () => {
    setEditingSesionId(null);
    setSesTitulo('');
    setSesComentarios('');
    setSesEjerciciosIds([]);
    setSesIntensidad(75);
    setSesFecha('2026-06-15');
    setSesAsignadoA('grupo');
    setSesGrupoId(gruposList[0]?.id || '');
    setSesArqueroId(usuariosList.find(u => u.rol === 'arquero')?.id_usuario || '');
  };

  const handleCrearPlan = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlanId) {
      const planOriginal = planificaciones.find(p => p.id === editingPlanId);
      if (!planOriginal) return;

      const planActualizado: Planificacion = {
        ...planOriginal,
        tipo: planTipo,
        id_grupo: planTipo === 'grupo' ? planGrupoId : undefined,
        id_arquero: planTipo === 'individual' ? planArqueroId : undefined,
        macrociclo: planMacro,
        temporada: planTemporada,
        fecha_inicio: planFechaInicio,
        fecha_fin: planFechaFin,
        objetivos_macrociclo: planObjetivos
      };
      onUpdatePlanificacion?.(planActualizado);
      alert('¡Macrociclo modificado exitosamente!');
      handleCancelEditPlan();
      return;
    }

    const nuevaPlan: Planificacion = {
      id: 'plan-' + Date.now(),
      tipo: planTipo,
      id_grupo: planTipo === 'grupo' ? planGrupoId : undefined,
      id_arquero: planTipo === 'individual' ? planArqueroId : undefined,
      macrociclo: planMacro,
      temporada: planTemporada,
      fecha_inicio: planFechaInicio,
      fecha_fin: planFechaFin,
      objetivos_macrociclo: planObjetivos,
      mesociclos_lista: [],
      competiciones: []
    };

    onAddPlanificacion(nuevaPlan);
    alert('¡Planificación de Macrociclo creada con éxito!');
    handleCancelEditPlan();
  };

  const handleEditPlanClick = (p: Planificacion) => {
    setEditingPlanId(p.id);
    setPlanTipo(p.tipo);
    setPlanGrupoId(p.id_grupo || '');
    setPlanArqueroId(p.id_arquero || '');
    setPlanMacro(p.macrociclo);
    setPlanTemporada(p.temporada || 'Temporada 2026/2027');
    setPlanFechaInicio(p.fecha_inicio || '2026-06-01');
    setPlanFechaFin(p.fecha_fin || '2026-12-31');
    setPlanObjetivos(p.objetivos_macrociclo || '');
  };

  const handleCancelEditPlan = () => {
    setEditingPlanId(null);
    setPlanTipo('individual');
    setPlanGrupoId('');
    setPlanArqueroId('');
    setPlanMacro('General FITA Carga I');
    setPlanTemporada('Temporada 2026/2027');
    setPlanFechaInicio('2026-06-01');
    setPlanFechaFin('2026-12-31');
    setPlanObjetivos('Estabilizar el ciclo gestual completo, optimizar el anclaje físico con clicker y consolidar la suelta dinámica sin retenciones.');
  };

  // Añadir Mesociclo a la planificación activa
  const handleAddMesociclo = (planId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!mesoNombre.trim()) {
      alert("Por favor, indica un nombre para el mesociclo.");
      return;
    }

    const nuevoMeso: MesocicloPlan = {
      id: 'meso-' + Date.now(),
      nombre: mesoNombre,
      tipo_mesociclo: mesoTipo,
      fecha_inicio: mesoInicio,
      fecha_fin: mesoFin,
      microciclos: []
    };

    const mesosList = plan.mesociclos_lista || [];
    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: [...mesosList, nuevoMeso]
    };

    onUpdatePlanificacion?.(updatedPlan);
    
    // Reset form
    setMesoNombre('');
    setIsAddingMeso(false);
  };

  // Eliminar Mesociclo de la planificación activa
  const handleRemoveMesociclo = (planId: string, mesoId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    const list = (plan.mesociclos_lista || []).filter(m => m.id !== mesoId);
    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: list
    };

    onUpdatePlanificacion?.(updatedPlan);
  };

  // Edición de Mesociclo
  const handleEditMesoClick = (meso: MesocicloPlan) => {
    setEditingMesoId(meso.id);
    setEditingMesoNombre(meso.nombre);
    setEditingMesoTipo(meso.tipo_mesociclo);
    setEditingMesoInicio(meso.fecha_inicio);
    setEditingMesoFin(meso.fecha_fin);
  };

  const handleCancelEditMeso = () => {
    setEditingMesoId(null);
    setEditingMesoNombre('');
    setEditingMesoTipo('Preparatorio');
    setEditingMesoInicio('2026-06-01');
    setEditingMesoFin('2026-06-30');
  };

  const handleUpdateMesociclo = (planId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!editingMesoNombre.trim()) {
      alert("Por favor, introduce el nombre del mesociclo.");
      return;
    }

    const updatedMesoLista = (plan.mesociclos_lista || []).map(m => {
      if (m.id === editingMesoId) {
        return {
          ...m,
          nombre: editingMesoNombre,
          tipo_mesociclo: editingMesoTipo,
          fecha_inicio: editingMesoInicio,
          fecha_fin: editingMesoFin
        };
      }
      return m;
    });

    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: updatedMesoLista
    };

    onUpdatePlanificacion?.(updatedPlan);
    handleCancelEditMeso();
    alert('¡Mesociclo modificado exitosamente!');
  };

  // Añadir Microciclo a un Mesociclo de la planificación activa
  const handleAddMicrociclo = (planId: string, mesoId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!microNombre.trim() || !microObjetivo.trim()) {
      alert("Por favor, indica un nombre y objetivos para el microciclo.");
      return;
    }

    const nuevoMicro: MicrocicloPlan = {
      id: 'micro-' + Date.now(),
      nombre: microNombre,
      fechas: microFechas || "Semana regular",
      volumen_flechas: microVolumen,
      enfoque_principal: microEnfoque,
      objetivos: microObjetivo
    };

    const updatedMesoLista = (plan.mesociclos_lista || []).map(meso => {
      if (meso.id === mesoId) {
        return {
          ...meso,
          microciclos: [...meso.microciclos, nuevoMicro]
        };
      }
      return meso;
    });

    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: updatedMesoLista
    };

    onUpdatePlanificacion?.(updatedPlan);

    // Reset Form
    setMicroNombre('');
    setMicroFechas('');
    setMicroObjetivo('');
    setAddingMicroForMesoId(null);
  };

  // Eliminar Microciclo de un Mesociclo
  const handleRemoveMicrociclo = (planId: string, mesoId: string, microId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    const updatedMesoLista = (plan.mesociclos_lista || []).map(meso => {
      if (meso.id === mesoId) {
        return {
          ...meso,
          microciclos: meso.microciclos.filter(mic => mic.id !== microId)
        };
      }
      return meso;
    });

    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: updatedMesoLista
    };

    onUpdatePlanificacion?.(updatedPlan);
  };

  // Edición de Microciclo
  const handleEditMicroClick = (micro: MicrocicloPlan) => {
    setEditingMicroId(micro.id);
    setEditingMicroNombre(micro.nombre);
    setEditingMicroFechas(micro.fechas);
    setEditingMicroVolumen(micro.volumen_flechas);
    setEditingMicroEnfoque(micro.enfoque_principal);
    setEditingMicroObjetivo(micro.objetivos);
  };

  const handleCancelEditMicro = () => {
    setEditingMicroId(null);
    setEditingMicroNombre('');
    setEditingMicroFechas('');
    setEditingMicroVolumen(300);
    setEditingMicroEnfoque('Técnica de anclaje');
    setEditingMicroObjetivo('');
  };

  const handleUpdateMicrociclo = (planId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!editingMicroNombre.trim() || !editingMicroObjetivo.trim()) {
      alert("Por favor, indica un nombre y objetivos para el microciclo.");
      return;
    }

    const updatedMesoLista = (plan.mesociclos_lista || []).map(meso => {
      const updatedMicrociclos = (meso.microciclos || []).map(mic => {
        if (mic.id === editingMicroId) {
          return {
            ...mic,
            nombre: editingMicroNombre,
            fechas: editingMicroFechas || "Semana regular",
            volumen_flechas: editingMicroVolumen,
            enfoque_principal: editingMicroEnfoque,
            objetivos: editingMicroObjetivo
          };
        }
        return mic;
      });
      return {
        ...meso,
        microciclos: updatedMicrociclos
      };
    });

    const updatedPlan: Planificacion = {
      ...plan,
      mesociclos_lista: updatedMesoLista
    };

    onUpdatePlanificacion?.(updatedPlan);
    handleCancelEditMicro();
    alert('¡Microciclo modificado exitosamente!');
  };

  // Añadir Competición al Macrociclo
  const handleAddCompeticion = (planId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!compNombre.trim()) {
      alert("Por favor, introduce el nombre de la competición.");
      return;
    }

    const nuevaComp: CompeticionPlaneada = {
      id: 'comp-' + Date.now(),
      nombre: compNombre,
      fecha: compFecha,
      importancia: compImportancia,
      tipo: compTipo,
      id_arquero: compTipo === 'individual' ? compArqueroId : undefined,
      comentarios: compComments
    };

    const comps = plan.competiciones || [];
    const updatedPlan: Planificacion = {
      ...plan,
      competiciones: [...comps, nuevaComp]
    };

    onUpdatePlanificacion?.(updatedPlan);

    // Reset Form
    setCompNombre('');
    setCompComments('');
    setCompArqueroId('');
    setIsAddingComp(false);
  };

  // Eliminar Competición de la planificación
  const handleRemoveCompeticion = (planId: string, compId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    const comps = (plan.competiciones || []).filter(c => c.id !== compId);
    const updatedPlan: Planificacion = {
      ...plan,
      competiciones: comps
    };

    onUpdatePlanificacion?.(updatedPlan);
  };

  // Edición de Competición
  const handleEditCompClick = (comp: CompeticionPlaneada) => {
    setEditingCompId(comp.id);
    setEditingCompNombre(comp.nombre);
    setEditingCompFecha(comp.fecha);
    setEditingCompImportancia(comp.importancia);
    setEditingCompTipo(comp.tipo);
    setEditingCompArqueroId(comp.id_arquero || '');
    setEditingCompComments(comp.comentarios || '');
  };

  const handleCancelEditComp = () => {
    setEditingCompId(null);
    setEditingCompNombre('');
    setEditingCompFecha('2026-06-25');
    setEditingCompImportancia('Alta');
    setEditingCompTipo('grupo');
    setEditingCompArqueroId('');
    setEditingCompComments('');
  };

  const handleUpdateCompeticion = (planId: string) => {
    const plan = planificaciones.find(p => p.id === planId);
    if (!plan) return;

    if (!editingCompNombre.trim()) {
      alert("Por favor, introduce el nombre de la competición.");
      return;
    }

    const updatedCompet_lista = (plan.competiciones || []).map(comp => {
      if (comp.id === editingCompId) {
        return {
          ...comp,
          nombre: editingCompNombre,
          fecha: editingCompFecha,
          importancia: editingCompImportancia,
          tipo: editingCompTipo,
          id_arquero: editingCompTipo === 'individual' ? editingCompArqueroId : undefined,
          comentarios: editingCompComments
        };
      }
      return comp;
    });

    const updatedPlan: Planificacion = {
      ...plan,
      competiciones: updatedCompet_lista
    };

    onUpdatePlanificacion?.(updatedPlan);
    handleCancelEditComp();
    alert('¡Competición modificada exitosamente!');
  };

  const handleCrearEjercicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ejNombre || !ejDesc) {
      alert('Por favor, indica un nombre y descripción para el ejercicio.');
      return;
    }

    if (editingEjercicioId) {
      const ejActualizado: Ejercicio = {
        id: editingEjercicioId,
        nombre: ejNombre,
        tipo_ejercicio: ejTipo,
        descripcion: ejDesc,
        duracion: ejDuracion,
        densidad_repeticiones: ejDensidad,
        dificultad: ejDificultad,
        intensidad_flechas_repeticion: ejIntensidadFlechas
      };
      onUpdateEjercicio(ejActualizado);
      alert('¡Ejercicio actualizado en el archivo del club!');
      handleCancelEditEjercicio();
      return;
    }

    const nuevoEj: Ejercicio = {
      id: 'ej-' + Date.now(),
      nombre: ejNombre,
      tipo_ejercicio: ejTipo,
      descripcion: ejDesc,
      duracion: ejDuracion,
      densidad_repeticiones: ejDensidad,
      dificultad: ejDificultad,
      intensidad_flechas_repeticion: ejIntensidadFlechas
    };

    onAddEjercicio(nuevoEj);
    alert('¡Ejercicio guardado en el archivo del club!');
    setEjNombre('');
    setEjDesc('');
  };

  const handleCrearSesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesTitulo) {
      alert('Por favor, indica un título para la sesión de entrenamiento.');
      return;
    }
    if (sesEjerciciosIds.length === 0) {
      alert('Por favor, selecciona al menos un ejercicio del fichero para conformar la sesión.');
      return;
    }

    const nGrupoId = sesAsignadoA === 'grupo' ? (sesGrupoId || (gruposList[0]?.id || '')) : undefined;
    const nArqueroId = sesAsignadoA === 'arquero' ? (sesArqueroId || (usuariosList.find(u => u.rol === 'arquero')?.id_usuario || '')) : undefined;

    if (editingSesionId) {
      const sesActualizada: Sesion = {
        id: editingSesionId,
        titulo: sesTitulo,
        tipo_entrenamiento: sesTipo,
        fecha_asignada: sesFecha,
        asignado_a: sesAsignadoA,
        id_grupo: nGrupoId,
        id_arquero: nArqueroId,
        ejercicios_ids: sesEjerciciosIds,
        intensidad: Number(sesIntensidad),
        comentarios: sesComentarios || undefined
      };
      onUpdateSesion(sesActualizada);
      alert(`¡Sesión "${sesTitulo}" modificada correctamente!`);
      handleCancelEditSesion();
      return;
    }

    const nuevaS: Sesion = {
      id: 'ses-' + Date.now(),
      titulo: sesTitulo,
      tipo_entrenamiento: sesTipo,
      fecha_asignada: sesFecha,
      asignado_a: sesAsignadoA,
      id_grupo: nGrupoId,
      id_arquero: nArqueroId,
      ejercicios_ids: sesEjerciciosIds,
      intensidad: Number(sesIntensidad),
      comentarios: sesComentarios || undefined
    };

    onAddSesion(nuevaS);
    alert(`¡Sesión "${sesTitulo}" creada y asignada correctamente!`);
    
    // Reset form
    setSesTitulo('');
    setSesComentarios('');
    setSesEjerciciosIds([]);
  };

  const handleAgregarTipoEntrenamiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoTipoEntrenamiento.trim()) {
      const limpio = nuevoTipoEntrenamiento.trim();
      if (!tiposEntrenamiento.includes(limpio)) {
        const nuevosTipos = [...tiposEntrenamiento, limpio];
        setTiposEntrenamiento(nuevosTipos);
        const defaultTypes = ['Técnico', 'Físico', 'Psicológico'];
        const customOnly = nuevosTipos.filter(t => !defaultTypes.includes(t));
        localStorage.setItem('archery_tipos_entrenamiento', JSON.stringify(customOnly));
        setSesTipo(limpio);
      } else {
        setSesTipo(limpio);
      }
      setNuevoTipoEntrenamiento('');
    }
  };

  const handleEliminarTipoEntrenamiento = (tipoAEliminar: string) => {
    const defaultTypes = ['Técnico', 'Físico', 'Psicológico'];
    if (defaultTypes.includes(tipoAEliminar)) return;
    const nuevosTipos = tiposEntrenamiento.filter(t => t !== tipoAEliminar);
    setTiposEntrenamiento(nuevosTipos);
    const customOnly = nuevosTipos.filter(t => !defaultTypes.includes(t));
    localStorage.setItem('archery_tipos_entrenamiento', JSON.stringify(customOnly));
    if (sesTipo === tipoAEliminar) {
      setSesTipo('Técnico');
    }
  };

  const handleToggleEjercicioEnSesion = (id: string) => {
    if (sesEjerciciosIds.includes(id)) {
      setSesEjerciciosIds(sesEjerciciosIds.filter(x => x !== id));
    } else {
      setSesEjerciciosIds([...sesEjerciciosIds, id]);
    }
  };

  const handleGenerarInforme = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generación dinámica del reporte utilizando datos de demostración o calculados
    const arqueroSel = usuariosList.find(u => u.id_usuario === informeArqueroId);
    
    setInformeResult({
      nombre: arqueroSel ? `${arqueroSel.nombre} ${arqueroSel.apellidos}` : 'Todos los arqueros del grupo',
      id: informeArqueroId || 'grupo-general',
      rango: `${fechaDesde} al ${fechaHasta}`,
      flechasSemanales: 420,
      objetivoFlechas: 500,
      promedioControl: 9.35,
      promedioGrupo: 8.92,
      estadoAnimoPredominante: 'Motivado / Confiado',
      cansancioMedio: 4.2, // escala 1-10
      evolucion: [
        { fecha: '06-01', flechas: 80, score: 9.1 },
        { fecha: '06-04', flechas: 95, score: 9.3 },
        { fecha: '06-08', flechas: 120, score: 9.4 },
        { fecha: '06-12', flechas: 125, score: 9.6 },
      ],
      observacionIA: 'El arquero muestra una correlación excelente entre el descanso auto-reportado (energía >= 8) y la estabilidad del tiro amarillo en larga distancia. Se recomienda mantener el microciclo de volumen moderado antes del próximo control autonómico.'
    });
  };

  const arqueros = usuariosList.filter(u => u.rol === 'arquero');
  
  const esAuxiliar = usuarioActual.rol === 'tecnico_auxiliar';
  const misGrupos = gruposList.filter(g => 
    esAuxiliar 
      ? g.id_tecnico_auxiliar === usuarioActual.id_usuario 
      : g.id_tecnico === usuarioActual.id_usuario
  );
  
  // Solicitudes pendientes de miembros de grupo de entrenamiento (solo para los grupos de este técnico)
  const misGruposIds = misGrupos.map(g => g.id);
  const solicitudesPendientes = miembrosList.filter(m => 
    misGruposIds.includes(m.id_grupo) && 
    (m.estado === 'pendiente_solicitud' || m.estado === 'pendiente_invitacion')
  );

  const getNombreUsuario = (id: string) => {
    const u = usuariosList.find(us => us.id_usuario === id);
    return u ? `${u.nombre} ${u.apellidos}` : 'Usuario';
  };

  const getNombreGrupo = (id: string) => {
    const g = gruposList.find(gr => gr.id === id);
    return g ? g.nombre_grupo : 'Grupo';
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8" id="tecnico_dashboard">
      
      {/* Header técnico */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-650 text-white p-2 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">
              {esAuxiliar ? 'Panel de Técnico Auxiliar' : 'Panel de Técnico Principal'}
            </h2>
            <p className="text-xs text-slate-500">Bienvenido, {usuarioActual.nombre} {usuarioActual.apellidos} • <span className="font-bold text-indigo-600">{esAuxiliar ? 'Técnico Auxiliar' : 'Técnico Principal'}</span></p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg self-center">
          <button 
            onClick={() => setActiveTab('grupos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'grupos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Grupos
          </button>
          <button 
            onClick={() => setActiveTab('planificacion')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'planificacion' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Planificación Anual
          </button>
          <button 
            onClick={() => setActiveTab('sesiones')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'sesiones' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Sesiones & Ejercicios
          </button>
          <button 
            onClick={() => setActiveTab('informes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'informes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Informes & Analítica
          </button>
          <button 
            onClick={() => setActiveTab('scouting')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'scouting' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'} flex items-center gap-1`}
          >
            <Sparkles size={11} />
            Módulos IA / Scouting
          </button>
          <button 
            onClick={onLogout}
            className="px-2.5 py-1.5 ml-2 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-md"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* TAB GENERADOR DE GRUPOS */}
        {activeTab === 'grupos' && (
          selectedArcherId ? (
            // Vista de Expediente Detallada
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedArcherId(null)}
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title="Volver a los grupos"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-[#ef233c] text-white px-2 py-0.5 rounded">Expediente de Alumno</span>
                    <h3 className="text-lg font-black text-slate-800 mt-1">
                      {getNombreUsuario(selectedArcherId)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Licencia: <span className="font-mono font-bold text-[#ef233c]">{usuariosList.find(u => u.id_usuario === selectedArcherId)?.licencia || 'ST-998'}</span> • {usuariosList.find(u => u.id_usuario === selectedArcherId)?.email}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedArcherId(null)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition"
                >
                  Cerrar Ficha
                </button>
              </div>

              {/* Secciones de datos del alumno */}
              <div className="grid lg:grid-cols-12 gap-8">
                
                {/* DIARIO EMOCIONAL / SENSACIONES DE TIRO */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <BookOpen size={16} className="text-[#ef233c]" />
                    <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider">Diario de Alumno & Rutina mental</h4>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {diariosList.filter(d => d.id_arquero === selectedArcherId).length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 border border-dashed rounded-lg">El alumno no ha registrado reflexiones o sensaciones técnicas todavía.</p>
                    ) : (
                      diariosList.filter(d => d.id_arquero === selectedArcherId).map((d) => (
                        <div key={d.id} className="p-4 bg-slate-55 border border-slate-200 rounded-xl space-y-3 relative">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">{d.fecha}</span>
                            <span className="text-[9px] bg-red-100 text-[#ef233c] font-bold px-2 py-0.5 rounded capitalize">
                              {d.tipo_entrada}
                            </span>
                          </div>
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-800">{d.titulo}</h5>
                            <p className="text-xs text-slate-655 mt-1.5 bg-white p-2.5 rounded border border-slate-100 italic">
                              "{d.estado_animo || 'Sensación normal'} - Energía/Foco: {d.nivel_energia_cansancio}/10"
                            </p>
                          </div>

                          {/* Sección para que el Entrenador responda / envíe anotación técnica de mejora */}
                          <div className="pt-2 border-t border-slate-150 space-y-2">
                            <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Tu Feedback de Entrenador:</span>
                            {d.anotaciones_tecnico ? (
                              <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg text-xs italic font-semibold">
                                "{d.anotaciones_tecnico}"
                              </div>
                            ) : (
                              <p className="text-[10px] text-amber-600 italic">No le has enviado feedback todavía.</p>
                            )}
                            
                            <div className="flex gap-2.5 mt-2">
                              <input 
                                type="text"
                                placeholder="Escribe un consejo o corrección técnica..."
                                value={feedbackDiarioText[d.id] || ''}
                                onChange={(e) => setFeedbackDiarioText({ ...feedbackDiarioText, [d.id]: e.target.value })}
                                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-indigo-600"
                              />
                              <button
                                onClick={() => {
                                  if (!feedbackDiarioText[d.id]) return;
                                  onAddFeedbackDiario(d.id, feedbackDiarioText[d.id]);
                                  setFeedbackDiarioText({ ...feedbackDiarioText, [d.id]: '' });
                                  alert('¡Feedback técnico enviado al alumno con éxito!');
                                }}
                                className="px-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                              >
                                <Check size={12} />
                                {d.anotaciones_tecnico ? 'Actualizar' : 'Responder'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* VISORES Y CONTROLES TIROS */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* CONFIGURACIÓN DE VISORES */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Sliders size={16} className="text-[#ef233c]" />
                      <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider">Setup & Regulaciones de Visor</h4>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto">
                      {setupsList.filter(s => s.id_arquero === selectedArcherId).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center sm:col-span-2 bg-slate-50 border rounded-xl">No hay marcas de visor anotadas en su setup.</p>
                      ) : (
                        setupsList.filter(s => s.id_arquero === selectedArcherId).map((s) => (
                          <div key={s.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl relative">
                            <span className="text-[9px] bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded uppercase absolute top-2 right-2">
                              {s.datos_json?.distancia || '---'}
                            </span>
                            <span className="block text-[9px] uppercase font-bold text-slate-400">Visor</span>
                            <span className="text-sm font-black text-indigo-700">{s.datos_json?.visor || '---'}</span>
                            <p className="text-[10px] text-slate-500 leading-normal mt-1 border-t pt-1.5 truncate" title={s.datos_json?.objetivo_mental}>
                              "{s.datos_json?.objetivo_mental || 'Sin notas'}"
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CONTROLES / SERIES DE DIANAS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Target size={16} className="text-emerald-500" />
                      <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider">Rondas de Precisión en Control</h4>
                    </div>

                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                      {controlesList.filter(c => c.id_arquero === selectedArcherId).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 border rounded-xl">No hay controles de diana recientes.</p>
                      ) : (
                        controlesList.filter(c => c.id_arquero === selectedArcherId).map((c) => (
                          <div key={c.id} className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-extrabold text-slate-800">{c.nombre_control}</p>
                              <p className="text-[10px] text-slate-400">Fecha: {c.fecha} • {c.distancia} • Diana {c.tipo_diana}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase rounded">
                                {c.tandas_por_serie}x{c.flechas_por_serie} Rondas
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            // Mostrar Gestión de Grupos Normales
            <div className="space-y-6">
              
              {/* Creador de Grupos de Entrenamiento */}
              {!esAuxiliar && (
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-md font-black text-slate-805 flex items-center gap-1.5">
                        <Users size={18} className="text-[#ef233c]" />
                        Crear Nuevo Grupo de Entrenamiento
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Como Técnico, puedes crear tus propios grupos de tecnificación o escuelas de entrenamiento para alumnos.</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Ej. Escuela de Iniciación FITA 2026"
                        value={nuevoGrupoNombre}
                        onChange={(e) => setNuevoGrupoNombre(e.target.value)}
                        className="text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl p-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#ef233c] focus:border-transparent w-full md:w-80 transition font-medium"
                      />
                      <button
                        onClick={() => {
                          if (!nuevoGrupoNombre.trim()) {
                            alert('Por favor, introduce un nombre para el nuevo grupo.');
                            return;
                          }
                          onAddGrupo(nuevoGrupoNombre.trim());
                          setNuevoGrupoNombre('');
                          alert(`¡Grupo "${nuevoGrupoNombre.trim()}" creado correctamente!`);
                        }}
                        className="px-5 py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white font-bold text-xs uppercase rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition"
                      >
                        <Plus size={14} />
                        Crear Grupo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Solicitudes de Admisión de Jugadores */}
                <div className="md:col-span-6 bg-white border border-slate-100 p-5 rounded-xl space-y-4 shadow-sm">
                  <h3 className="text-md font-extrabold text-slate-850">Aprobación y Asignación de Solicitudes</h3>
                  <p className="text-xs text-slate-400">Valida las solicitudes directas de arqueros que desean incorporarse a tu escuela de tecnificación.</p>
                  
                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold font-mono">
                        <tr>
                          <th className="px-4 py-3">Arquero</th>
                          <th className="px-4 py-3">Grupo de Destino</th>
                          <th className="px-4 py-3 text-right">Aprobación</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-150 text-slate-700">
                        {solicitudesPendientes.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic animate-pulse">No hay solicitudes pendientes actualmente. ¡Todo al día!</td>
                          </tr>
                        ) : (
                          solicitudesPendientes.map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-slate-800">{getNombreUsuario(s.id_arquero)}</td>
                              <td className="px-4 py-3 font-medium text-slate-650">{getNombreGrupo(s.id_grupo)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => onApproveMiembro(s.id_grupo, s.id_arquero)}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase rounded shadow-xs flex items-center gap-1 ml-auto transition"
                                >
                                  <CheckCircle size={10} />
                                  Aprobar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Listado y Roster Directo de tus Grupos */}
                <div className="md:col-span-6 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-6">
                  <h3 className="text-md font-extrabold text-slate-800">Tus Escuelas Técnicas & Roster de Atletas</h3>
                  
                  <div className="space-y-4">
                    {misGrupos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No tienes escuelas técnicas asignadas todavía.</p>
                    ) : (
                      misGrupos.map((g) => {
                        const grupoMiembros = miembrosList.filter(m => m.id_grupo === g.id && m.estado === 'aceptado');
                        const gMiembrosIds = miembrosList.filter(m => m.id_grupo === g.id).map(m => m.id_arquero);
                        
                        // List of other active archers who can be enrolled directly
                        const arquerosDisponibles = usuariosList.filter(u => u.rol === 'arquero' && u.activo && !gMiembrosIds.includes(u.id_usuario));

                        return (
                          <div key={g.id} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3.5">
                            <div className="flex justify-between items-start pb-2 border-b border-indigo-100/50 gap-2">
                              <div className="flex-1">
                                <span className="text-[9px] bg-indigo-100 text-indigo-850 font-bold uppercase px-2 py-0.5 rounded">Grupo de Tecnificación</span>
                                
                                {/* Técnico Auxiliar Asignado */}
                                <div className="mt-1.5 mb-1.5 text-[11px] text-slate-600 flex flex-wrap items-center gap-1">
                                  <span className="font-bold">Auxiliar:</span>{' '}
                                  {esAuxiliar ? (
                                    <span className="bg-slate-200/80 font-bold text-slate-800 px-1.5 py-0.5 rounded">
                                      👤 {g.nombre_tecnico_auxiliar || 'Sin técnico auxiliar'}
                                    </span>
                                  ) : (
                                    <select
                                      value={g.id_tecnico_auxiliar || ''}
                                      onChange={(e) => {
                                        const auxId = e.target.value;
                                        const auxUsr = usuariosList.find(u => u.id_usuario === auxId);
                                        const auxNombre = auxUsr ? `${auxUsr.nombre} ${auxUsr.apellidos}` : '';
                                        onUpdateGrupo(g.id, g.nombre_grupo, auxId || '', auxNombre || '');
                                        alert('¡Técnico Auxiliar asignado con éxito a este grupo!');
                                      }}
                                      className="text-[10px] p-0.5 border border-slate-200 rounded bg-white hover:bg-slate-100/50 cursor-pointer focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700"
                                    >
                                      <option value="">-- Sin asignar --</option>
                                      {usuariosList.filter(u => u.rol === 'tecnico_auxiliar' && u.activo).map((u) => (
                                        <option key={u.id_usuario} value={u.id_usuario}>
                                          {u.nombre} {u.apellidos}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>

                                {editingGrupoId === g.id ? (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <input
                                      type="text"
                                      value={editingGrupoVal}
                                      onChange={(e) => setEditingGrupoVal(e.target.value)}
                                      className="text-xs bg-white border border-indigo-300 rounded-lg p-1 px-2 font-bold text-slate-800 w-full focus:outline-indigo-600"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        if (!editingGrupoVal.trim()) return;
                                        onUpdateGrupo(g.id, editingGrupoVal.trim());
                                        setEditingGrupoId(null);
                                        alert('¡Nombre del grupo actualizado con éxito!');
                                      }}
                                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition"
                                      title="Guardar nombre"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingGrupoId(null)}
                                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-705 rounded-md transition"
                                      title="Cancelar"
                                    >
                                      <ArrowLeft size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <h4 className="font-extrabold text-[#ef233c] text-sm">{g.nombre_grupo}</h4>
                                    {!esAuxiliar && (
                                      <button
                                        onClick={() => {
                                          setEditingGrupoId(g.id);
                                          setEditingGrupoVal(g.nombre_grupo);
                                        }}
                                        className="p-1 hover:bg-indigo-100/50 text-slate-400 hover:text-slate-700 rounded transition"
                                        title="Editar nombre de grupo"
                                      >
                                        <Pencil size={11} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-slate-600 bg-white border p-1 px-2.5 rounded-lg shadow-2xs">
                                  {grupoMiembros.length} Miembros
                                </span>
                                {!esAuxiliar && (
                                  <button
                                    onClick={() => {
                                      pedirConfirmacion(
                                        "Eliminar Escuela Técnica",
                                        `¿Estás COMPLETAMENTE seguro de eliminar la escuela "${g.nombre_grupo}"? Esto desactivará y desvinculará a todos sus alumnos asignados.`,
                                        () => onRemoveGrupo(g.id)
                                      );
                                    }}
                                    className="p-1.5 text-slate-405 hover:text-[#ef233c] hover:bg-red-50 rounded-lg transition"
                                    title="Eliminar este grupo definitivamente"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Miembros en el roster */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Planilla de Deportistas:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMgmtGrupo(g);
                                    setMgmtSearch('');
                                  }}
                                  className="text-[10px] text-indigo-650 hover:text-indigo-805 font-bold bg-white border border-indigo-150 px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-3xs"
                                  title="Añadir o eliminar arqueros de este grupo"
                                >
                                  <UserPlus size={11} />
                                  Gestionar Roster
                                </button>
                              </div>
                              {grupoMiembros.length === 0 ? (
                                <p className="text-xs text-slate-400 italic bg-white/40 p-2 text-center rounded border border-dashed border-indigo-100">Sin deportistas activos. Enrola un nuevo arquero abajo.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                  {grupoMiembros.map((m) => {
                                    const arc = usuariosList.find(u => u.id_usuario === m.id_arquero);
                                    return (
                                      <div key={m.id_arquero} className="flex justify-between items-center bg-white p-2 border border-slate-150 rounded-lg shadow-2xs">
                                        <div>
                                          <p className="text-xs font-bold text-slate-850">{arc ? `${arc.nombre} ${arc.apellidos}` : 'Alumno'}</p>
                                          <p className="text-[10px] text-slate-400 font-mono">Lic: {arc?.licencia || '---'}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => setSelectedArcherId(m.id_arquero)}
                                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md transition flex items-center gap-1"
                                            title="Inspeccionar diario, setups y dianas de precisión"
                                          >
                                            <Eye size={11} />
                                            Dossier
                                          </button>
                                          <button
                                            onClick={() => {
                                              pedirConfirmacion(
                                                "Dar de Baja del Grupo",
                                                `¿Seguro que deseas dar de baja a ${arc?.nombre} de este grupo de entrenamiento?`,
                                                () => {
                                                  onRemoveMiembroGrupo(g.id, m.id_arquero);
                                                  alert(`¡Se ha dado de baja del grupo a ${arc?.nombre || 'el arquero'} con éxito!`);
                                                }
                                              );
                                            }}
                                            className="p-1 px-2 bg-red-50 hover:bg-red-100 text-[#ef233c] rounded-md transition"
                                            title="Dar de baja y eliminar del grupo"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Añadir nuevo arquero de forma directa */}
                            <div className="pt-2.5 border-t border-slate-200 mt-2">
                              <span className="block text-[10px] font-extrabold uppercase text-indigo-650 mb-1.5 flex items-center gap-1">
                                <UserPlus size={11} />
                                Inscripción Directa (Añadir sin invitación):
                              </span>
                              {arquerosDisponibles.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No hay otros deportistas activos en el club para inscribir.</p>
                              ) : (
                                <div className="flex gap-2">
                                  <select
                                    value={grupoSelectAdd[g.id] || ''}
                                    onChange={(e) => setGrupoSelectAdd({ ...grupoSelectAdd, [g.id]: e.target.value })}
                                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-indigo-600 focus:border-indigo-600"
                                  >
                                    <option value="">Selecciona arquero del club...</option>
                                    {arquerosDisponibles.map((a) => (
                                      <option key={a.id_usuario} value={a.id_usuario}>
                                        {a.nombre} {a.apellidos} ({a.licencia || 'Sin lic.'})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const aid = grupoSelectAdd[g.id];
                                      if (!aid) {
                                        alert('Por favor selecciona un deportista.');
                                        return;
                                      }
                                      onAddMiembroDirecto(g.id, aid);
                                      setGrupoSelectAdd({ ...grupoSelectAdd, [g.id]: '' });
                                    }}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition hover:scale-102 active:scale-98"
                                  >
                                    Inscribir
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )
        )}

        {/* TAB PLANIFICACIÓN DEPORTIVA */}
        {activeTab === 'planificacion' && (
          <div className="space-y-6">
            {!selectedPlanId ? (
              // VISTA 1: LISTADO DE MACROCICLOS / PLANIFICACIONES ACTIVAS
              <div className="grid lg:grid-cols-12 gap-6 text-slate-850">
                {/* Formulario: Creador de Nuevo Macrociclo */}
                <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-md font-bold text-slate-850 flex items-center gap-1.5">
                    <Calendar className="text-indigo-650" size={18} />
                    {editingPlanId ? 'Modificar Macrociclo' : 'Planificador de Macrociclos'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPlanId ? 'Modifica el nombre, destinatario u orientaciones de esta periodización.' : 'Genera periodizaciones deportivas estacionales. Aplica la configuración a un grupo de entrenamiento completo o directamente como plan individual para arqueros específicos.'}
                  </p>

                  {editingPlanId && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 text-xs rounded-lg font-medium flex justify-between items-center">
                      <span>Editando macrociclo activo.</span>
                      <button type="button" onClick={handleCancelEditPlan} className="underline text-amber-900 hover:text-amber-950 font-bold">
                        Cancelar
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleCrearPlan} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Planificación</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPlanTipo('grupo')}
                          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition ${
                            planTipo === 'grupo' ? 'bg-indigo-650 text-white border-transparent' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Plan Grupal
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanTipo('individual')}
                          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition ${
                            planTipo === 'individual' ? 'bg-indigo-650 text-white border-transparent' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Plan Individual
                        </button>
                      </div>
                    </div>

                    {planTipo === 'grupo' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grupo de Entrenamiento</label>
                        <select 
                          value={planGrupoId} 
                          onChange={(e) => setPlanGrupoId(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                          required
                        >
                          <option value="">Selecciona grupo...</option>
                          {misGrupos.map((g) => (
                            <option key={g.id} value={g.id}>{g.nombre_grupo}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Arquero Asignado</label>
                        <select 
                          value={planArqueroId} 
                          onChange={(e) => setPlanArqueroId(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                          required
                        >
                          <option value="">Selecciona arquero...</option>
                          {arqueros.map((a) => (
                            <option key={a.id_usuario} value={a.id_usuario}>{a.nombre} {a.apellidos}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Macrociclo (Anual/Estacional)</label>
                      <input 
                        type="text" 
                        required
                        value={planMacro}
                        onChange={(e) => setPlanMacro(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                        placeholder="e.g. Campeonato de España Aire Libre"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Temporada</label>
                      <input 
                        type="text" 
                        required
                        value={planTemporada}
                        onChange={(e) => setPlanTemporada(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                        placeholder="e.g. Temporada 2026/2027"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Inicio</label>
                        <input 
                          type="date" 
                          required
                          value={planFechaInicio}
                          onChange={(e) => setPlanFechaInicio(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Fin</label>
                        <input 
                          type="date" 
                          required
                          value={planFechaFin}
                          onChange={(e) => setPlanFechaFin(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivos del Macrociclo</label>
                      <textarea 
                        rows={3}
                        required
                        value={planObjetivos}
                        onChange={(e) => setPlanObjetivos(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed"
                        placeholder="e.g. Incrementar la regularidad con clicker y clasificar para el nacional..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                    >
                      {editingPlanId ? 'Guardar Cambios' : 'Crear Macrociclo'}
                    </button>
                  </form>
                </div>

                {/* Listado de Macrociclos Activos */}
                <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-md font-bold text-slate-800">
                    Sistemas de Planificación Anual
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecciona uno de los macrociclos listados para diseñar detalladamente la periodización de mesociclos, microciclos y su calendario competitivo asociado.
                  </p>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {planificaciones.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 border border-dashed rounded-xl bg-slate-25">
                        No se han guardado planificaciones. Crea una en el panel izquierdo para comenzar.
                      </p>
                    ) : (
                      planificaciones.map((p) => {
                        const totalMesos = p.mesociclos_lista?.length || 0;
                        const totalComps = p.competiciones?.length || 0;
                        return (
                          <div key={p.id} className="p-4 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl relative transition-all shadow-xs flex flex-col justify-between md:flex-row md:items-center gap-4">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  p.tipo === 'grupo' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  Plan {p.tipo}
                                </span>
                                {p.temporada && (
                                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                    🧭 {p.temporada}
                                  </span>
                                )}
                                {(p.fecha_inicio || p.fecha_fin) && (
                                  <span className="text-[9px] text-slate-500 font-mono font-bold bg-white border px-2 py-0.5 rounded whitespace-nowrap">
                                    📅 {p.fecha_inicio || '---'} a {p.fecha_fin || '---'}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-medium">#{p.id}</span>
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-800">
                                {p.macrociclo}
                              </h4>
                              <p className="text-xs text-slate-500 font-mono">
                                {p.tipo === 'grupo' ? `GRUPO: ${getNombreGrupo(p.id_grupo || '')}` : `ARQUERO: ${getNombreUsuario(p.id_arquero || '')}`}
                              </p>

                              {p.objetivos_macrociclo && (
                                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-150 rounded-lg p-2.5 max-w-xl italic">
                                  <strong className="text-slate-600 font-extrabold block not-italic uppercase text-[9px] tracking-wider mb-0.5">Objetivos del Macrociclo:</strong>
                                  &ldquo;{p.objetivos_macrociclo}&rdquo;
                                </p>
                              )}
                              
                              <div className="flex gap-4 pt-1 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  📂 {totalMesos} {totalMesos === 1 ? 'Mesociclo' : 'Mesociclos'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  🏆 {totalComps} {totalComps === 1 ? 'Competición' : 'Competiciones'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedPlanId(p.id)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg tracking-wide uppercase transition cursor-pointer"
                              >
                                Planificar 🚀
                              </button>

                              <button
                                onClick={() => handleEditPlanClick(p)}
                                className={`p-1.5 rounded-lg transition ${editingPlanId === p.id ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                title="Modificar macrociclo"
                              >
                                <Pencil size={15} />
                              </button>
                              
                              {onRemovePlanificacion && (
                                <button
                                  onClick={() => {
                                    pedirConfirmacion(
                                      "Eliminar Macrociclo",
                                      `¿Estás completamente seguro de eliminar el macrociclo "${p.macrociclo}"? Se perderán todos sus mesociclos, microciclos y calendario de competiciones.`,
                                      () => onRemovePlanificacion(p.id)
                                    );
                                  }}
                                  className="p-1 px-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Eliminar planificación"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // VISTA 2: PANEL DE CONTROL DE MACROCICLO DETALLADO (DISEÑO JERÁRQUICO + CALENDARIO DE COMPETICIONES)
              (() => {
                const selectedPlan = planificaciones.find(p => p.id === selectedPlanId);
                if (!selectedPlan) {
                  setSelectedPlanId(null);
                  return null;
                }

                // Generar días del mes para el calendario
                const getDaysInMonth = (year: number, month: number) => {
                  return new Date(year, month + 1, 0).getDate();
                };

                const getFirstDayOfMonth = (year: number, month: number) => {
                  const day = new Date(year, month, 1).getDay();
                  return day === 0 ? 6 : day - 1; // Ajuste para arrancar en Lunes
                };

                const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
                const offset = getFirstDayOfMonth(calendarYear, calendarMonth);
                
                const calendarDays: (number | null)[] = [];
                for (let i = 0; i < offset; i++) {
                  calendarDays.push(null);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  calendarDays.push(d);
                }

                const monthNames = [
                  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ];

                const handlePrevMonth = () => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(y => y - 1);
                  } else {
                    setCalendarMonth(m => m - 1);
                  }
                };

                const handleNextMonth = () => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(y => y + 1);
                  } else {
                    setCalendarMonth(m => m + 1);
                  }
                };

                return (
                  <div className="space-y-6 text-slate-800">
                    {/* Botón de Retorno y Cabecera de Macrociclo */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedPlanId(null)}
                          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-bold transition mb-2"
                        >
                          <ArrowLeft size={14} />
                          Volver a Macrociclos
                        </button>
                        <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                          <Trophy className="text-[#ef233c]" size={20} />
                          {selectedPlan.macrociclo}
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                          {selectedPlan.tipo === 'grupo' ? `GRUPO DE ENTRENAMIENTO: ${getNombreGrupo(selectedPlan.id_grupo || '')}` : `PLAN INDIVIDUAL DE: ${getNombreUsuario(selectedPlan.id_arquero || '')}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            pedirConfirmacion(
                              "Eliminar Macrociclo",
                              `¿Quieres eliminar "${selectedPlan.macrociclo}" y todo su contenido?`,
                              () => {
                                onRemovePlanificacion?.(selectedPlan.id);
                                setSelectedPlanId(null);
                              }
                            );
                          }}
                          className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:text-white hover:bg-red-600 rounded-lg text-xs font-bold transition"
                        >
                          Eliminar Planificación
                        </button>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                      {/* COLUMNA IZQUIERDA (ANCHO 7): PERIODIZACIÓN (MESOCICLOS & MICROCICLOS) */}
                      <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black text-slate-900">
                              Estructura de la Periodización
                            </h3>
                            <p className="text-xs text-slate-500">Define mesociclos y añade microciclos de entrenamiento semanales.</p>
                          </div>
                          
                          <button
                            onClick={() => setIsAddingMeso(!isAddingMeso)}
                            className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} />
                            {isAddingMeso ? 'Cerrar' : 'Añadir Mesociclo'}
                          </button>
                        </div>

                        {/* FORM: AGREGAR MESOCICLO */}
                        {isAddingMeso && (
                          <div className="p-4 bg-slate-25 border border-indigo-150 rounded-xl space-y-3">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Programar Nuevo Mesociclo</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Nombre</label>
                                <input
                                  type="text"
                                  value={mesoNombre}
                                  onChange={(e) => setMesoNombre(e.target.value)}
                                  className="w-full text-xs p-2 bg-white border rounded-lg"
                                  placeholder="e.g. Mesociclo I - Transición / Carga"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Tipo de Mesociclo</label>
                                <select
                                  value={mesoTipo}
                                  onChange={(e) => setMesoTipo(e.target.value)}
                                  className="w-full text-xs p-2 bg-white border rounded-lg"
                                >
                                  <option value="Preparatorio">Preparatorio</option>
                                  <option value="Competitivo">Competitivo</option>
                                  <option value="Transición">Transición</option>
                                  <option value="Desarrollo">Desarrollo (Volumen)</option>
                                  <option value="Estabilización">Estabilización (Ajuste)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Fecha de Inicio</label>
                                <input
                                  type="date"
                                  value={mesoInicio}
                                  onChange={(e) => setMesoInicio(e.target.value)}
                                  className="w-full text-xs p-2 bg-white border rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Fecha de Fin</label>
                                <input
                                  type="date"
                                  value={mesoFin}
                                  onChange={(e) => setMesoFin(e.target.value)}
                                  className="w-full text-xs p-2 bg-white border rounded-lg"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddMesociclo(selectedPlan.id)}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                            >
                              Guardar Mesociclo
                            </button>
                          </div>
                        )}

                        {/* LISTADO DE MESOCICLOS */}
                        <div className="space-y-4">
                          {(!selectedPlan.mesociclos_lista || selectedPlan.mesociclos_lista.length === 0) ? (
                            <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed rounded-lg bg-slate-25">
                              No hay mesociclos programados todavía para este macrociclo.
                            </p>
                          ) : (
                            selectedPlan.mesociclos_lista.map((meso) => (
                              <div key={meso.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative">
                                <div className="absolute top-4 right-4 flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditMesoClick(meso)}
                                    className={`p-1.5 rounded-md transition ${editingMesoId === meso.id ? 'bg-amber-100 text-amber-700' : 'text-slate-350 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                    title="Modificar mesociclo"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMesociclo(selectedPlan.id, meso.id)}
                                    className="p-1.5 text-slate-355 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                                    title="Eliminar este mesociclo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                {editingMesoId === meso.id ? (
                                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs mr-16">
                                    <h5 className="font-extrabold text-indigo-700 uppercase">Modificar Mesociclo</h5>
                                    <div className="space-y-1.5">
                                      <div>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Nombre</label>
                                        <input
                                          type="text"
                                          value={editingMesoNombre}
                                          onChange={(e) => setEditingMesoNombre(e.target.value)}
                                          className="w-full text-xs p-1 border rounded focus:outline-indigo-600"
                                        />
                                      </div>
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Tipo</label>
                                          <select
                                            value={editingMesoTipo}
                                            onChange={(e) => setEditingMesoTipo(e.target.value)}
                                            className="w-full text-[11px] p-0.5 border rounded"
                                          >
                                            <option value="Preparatorio">Preparatorio</option>
                                            <option value="Competitivo">Competitivo</option>
                                            <option value="Transición">Transición</option>
                                            <option value="Desarrollo">Desarrollo</option>
                                            <option value="Estabilización">Estabilización</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Inicio</label>
                                          <input
                                            type="date"
                                            value={editingMesoInicio}
                                            onChange={(e) => setEditingMesoInicio(e.target.value)}
                                            className="w-full text-[10px] p-0.5 border rounded"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Fin</label>
                                          <input
                                            type="date"
                                            value={editingMesoFin}
                                            onChange={(e) => setEditingMesoFin(e.target.value)}
                                            className="w-full text-[10px] p-0.5 border rounded"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateMesociclo(selectedPlan.id)}
                                        className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded"
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditMeso}
                                        className="px-2 py-1 bg-slate-205 hover:bg-slate-300 text-slate-700 text-[10px] font-extrabold uppercase rounded"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1 pr-16 text-slate-800">
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg">
                                      {meso.tipo_mesociclo}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 pt-1">
                                      <TrendingUp size={14} className="text-secondary-650" />
                                      {meso.nombre}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                      📅 {meso.fecha_inicio} a {meso.fecha_fin}
                                    </p>
                                  </div>
                                )}

                                {/* LISTA DE MICROCICLOS DENTRO DEL MESOCICLO */}
                                <div className="border-t border-slate-200 pt-3 text-slate-800">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                                      Microciclos Asociados ({meso.microciclos?.length || 0})
                                    </h5>
                                    
                                    <button
                                      onClick={() => setAddingMicroForMesoId(addingMicroForMesoId === meso.id ? null : meso.id)}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-850 font-extrabold flex items-center gap-0.5 cursor-pointer transition"
                                    >
                                      {addingMicroForMesoId === meso.id ? 'Cancelar' : '+ Añadir Microciclo'}
                                    </button>
                                  </div>

                                  {/* FORM: AGREGAR MICROCICLO */}
                                  {addingMicroForMesoId === meso.id && (
                                    <div className="p-3 mb-3 bg-white border border-indigo-100 rounded-lg space-y-2 text-xs">
                                      <div className="grid md:grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Nombre</label>
                                          <input
                                            type="text"
                                            value={microNombre}
                                            onChange={(e) => setMicroNombre(e.target.value)}
                                            className="w-full text-xs p-1 px-2 border rounded"
                                            placeholder="e.g. Microciclo 1"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Fechas / Rango</label>
                                          <input
                                            type="text"
                                            value={microFechas}
                                            onChange={(e) => setMicroFechas(e.target.value)}
                                            className="w-full text-xs p-1 px-2 border rounded"
                                            placeholder="e.g. Semana 15 Jun - 21 Jun"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Volumen Flechas Estimadas</label>
                                          <input
                                            type="number"
                                            value={microVolumen}
                                            onChange={(e) => setMicroVolumen(parseInt(e.target.value) || 0)}
                                            className="w-full text-xs p-1 px-2 border rounded"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Enfoque Técnico</label>
                                          <input
                                            type="text"
                                            value={microEnfoque}
                                            onChange={(e) => setMicroEnfoque(e.target.value)}
                                            className="w-full text-xs p-1 px-2 border rounded"
                                            placeholder="e.g. Postura y Anclaje"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Descripción detallada & Objetivos</label>
                                        <textarea
                                          value={microObjetivo}
                                          onChange={(e) => setMicroObjetivo(e.target.value)}
                                          rows={2}
                                          className="w-full text-xs p-1.5 px-2 border rounded"
                                          placeholder="e.g. 5 tandas diarias de 6 flechas enfocándose en postura pélvica..."
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAddMicrociclo(selectedPlan.id, meso.id)}
                                        className="w-full py-1 bg-indigo-650 text-white text-[10px] font-extrabold uppercase rounded transition hover:bg-indigo-750"
                                      >
                                        Guardar Microciclo
                                      </button>
                                    </div>
                                  )}

                                  {(!meso.microciclos || meso.microciclos.length === 0) ? (
                                    <p className="text-[10px] text-slate-400 italic py-1">No hay microciclos guardados.</p>
                                  ) : (
                                    <div className="space-y-2 mt-2 font-sans text-slate-800">
                                      {meso.microciclos.map((micro) => (
                                        <div key={micro.id} className="p-2.5 bg-white border border-slate-150 rounded-lg relative hover:border-slate-350 transition-all text-slate-800">
                                          <div className="absolute top-2 right-2 flex items-center gap-1">
                                            <button
                                              onClick={() => handleEditMicroClick(micro)}
                                              className={`p-1 rounded-md transition ${editingMicroId === micro.id ? 'text-amber-600 bg-amber-50' : 'text-slate-300 hover:text-indigo-650 hover:bg-indigo-50'}`}
                                              title="Modificar microciclo"
                                            >
                                              <Pencil size={11} />
                                            </button>
                                            <button
                                              onClick={() => handleRemoveMicrociclo(selectedPlan.id, meso.id, micro.id)}
                                              className="p-1 text-slate-300 hover:text-[#ef233c] hover:bg-red-50 rounded-md transition"
                                              title="Eliminar microciclo"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                          
                                          {editingMicroId === micro.id ? (
                                            <div className="space-y-2 text-xs pr-12 pt-1 text-slate-800">
                                              <h6 className="font-extrabold text-indigo-700 uppercase text-[9px]">Modificar Microciclo</h6>
                                              <div className="grid grid-cols-2 gap-1.5">
                                                <div>
                                                  <label className="block text-[7px] text-slate-400 uppercase font-black">Nombre</label>
                                                  <input
                                                    type="text"
                                                    value={editingMicroNombre}
                                                    onChange={(e) => setEditingMicroNombre(e.target.value)}
                                                    className="w-full text-[11px] p-0.5 border rounded"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[7px] text-slate-400 uppercase font-black">Fechas/Semanas</label>
                                                  <input
                                                    type="text"
                                                    value={editingMicroFechas}
                                                    onChange={(e) => setEditingMicroFechas(e.target.value)}
                                                    className="w-full text-[11px] p-0.5 border rounded"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[7px] text-slate-400 uppercase font-black">Est. Flechas</label>
                                                  <input
                                                    type="number"
                                                    value={editingMicroVolumen}
                                                    onChange={(e) => setEditingMicroVolumen(parseInt(e.target.value) || 0)}
                                                    className="w-full text-[11px] p-0.5 border rounded"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[7px] text-slate-400 uppercase font-black">Enfoque Técnico</label>
                                                  <input
                                                    type="text"
                                                    value={editingMicroEnfoque}
                                                    onChange={(e) => setEditingMicroEnfoque(e.target.value)}
                                                    className="w-full text-[11px] p-0.5 border rounded"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-[7px] text-slate-400 uppercase font-black">Objetivos</label>
                                                <textarea
                                                  value={editingMicroObjetivo}
                                                  onChange={(e) => setEditingMicroObjetivo(e.target.value)}
                                                  rows={2}
                                                  className="w-full text-[11px] p-1 border rounded"
                                                />
                                              </div>
                                              <div className="flex gap-1.5 pt-1">
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateMicrociclo(selectedPlan.id)}
                                                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded"
                                                >
                                                  Guardar
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleCancelEditMicro}
                                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-extrabold uppercase rounded"
                                                >
                                                  Cancelar
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-start justify-between text-slate-800 pr-14">
                                              <div className="space-y-0.5">
                                                <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-mono">
                                                  {micro.nombre}
                                                </span>
                                                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                                  {micro.enfoque_principal}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-extrabold">
                                                  🗓️ {micro.fechas} • 🏹 Est. {micro.volumen_flechas} flechas
                                                </p>
                                                <p className="text-[10px] text-slate-650 bg-slate-50 border-l-2 p-1.5 border-indigo-200 mt-1 uppercase font-semibold font-mono tracking-wide text-justify scale-z leading-snug">
                                                  {micro.objetivos}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* COLUMNA DERECHA (ANCHO 5): CALENDARIO INTERACTIVO DE COMPETICIONES CLAVE */}
                      <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black text-slate-900">
                              Calendario de Competiciones
                            </h3>
                            <p className="text-xs text-slate-500">Sitúa eventos importantes para el grupo de tiro o de forma individual.</p>
                          </div>

                          <button
                            onClick={() => setIsAddingComp(!isAddingComp)}
                            className="p-1 px-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white text-[10px] font-extrabold uppercase rounded-lg transition tracking-wider cursor-pointer"
                          >
                            {isAddingComp ? "Cerrar" : "Añadir"}
                          </button>
                        </div>

                        {/* FORM: AGREGAR COMPETICIÓN */}
                        {isAddingComp && (
                          <div className="p-3 bg-red-25 border border-red-150 rounded-xl space-y-2 text-xs">
                            <h4 className="text-[10px] font-extrabold text-[#ef233c] uppercase tracking-wider">Planificar Competición Clave</h4>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Nombre del Evento</label>
                                <input
                                  type="text"
                                  value={compNombre}
                                  onChange={(e) => setCompNombre(e.target.value)}
                                  className="w-full text-xs p-1.5 bg-white border rounded border-slate-200"
                                  placeholder="e.g. Campeonato Nacional de Aire Libre"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Fecha</label>
                                  <input
                                    type="date"
                                    value={compFecha}
                                    onChange={(e) => setCompFecha(e.target.value)}
                                    className="w-full text-xs p-1 bg-white border rounded border-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Importancia</label>
                                  <select
                                    value={compImportancia}
                                    onChange={(e) => setCompImportancia(e.target.value as any)}
                                    className="w-full text-xs p-1 bg-white border rounded border-slate-200"
                                  >
                                    <option value="Alta">Alta (Objetivo principal)</option>
                                    <option value="Media">Media (Test preparativo)</option>
                                    <option value="Baja">Baja (Test de control)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Destinatario</label>
                                  <select
                                    value={compTipo}
                                    onChange={(e) => setCompTipo(e.target.value as any)}
                                    className="w-full text-xs p-1 bg-white border rounded border-slate-200"
                                  >
                                    <option value="grupo">Todo el Grupo</option>
                                    <option value="individual">Individual</option>
                                  </select>
                                </div>
                                {compTipo === 'individual' && (
                                  <div>
                                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Seleccionar Arquero</label>
                                    <select
                                      value={compArqueroId}
                                      onChange={(e) => setCompArqueroId(e.target.value)}
                                      className="w-full text-xs p-1 bg-white border rounded border-slate-200"
                                    >
                                      <option value="">Selecciona...</option>
                                      {arqueros.map((a) => (
                                        <option key={a.id_usuario} value={a.id_usuario}>{a.nombre} {a.apellidos}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Comentarios y Observaciones</label>
                                <input
                                  type="text"
                                  value={compComments}
                                  onChange={(e) => setCompComments(e.target.value)}
                                  className="w-full text-xs p-1.5 bg-white border rounded border-slate-200"
                                  placeholder="e.g. Exigencia alta de viento"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddCompeticion(selectedPlan.id)}
                                className="w-full py-1.5 bg-[#ef233c] text-white text-[10px] font-extrabold uppercase rounded transition hover:bg-[#d90429]"
                              >
                                Agendar Evento
                              </button>
                            </div>
                          </div>
                        )}

                        {/* EL CALENDARIO INTERACTIVO */}
                        <div className="bg-slate-50 border rounded-xl p-3 shadow-xs space-y-2">
                          <div className="flex items-center justify-between border-b pb-2 mb-2">
                            <span className="text-xs font-black text-slate-800">
                              {monthNames[calendarMonth]} de {calendarYear}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-slate-200 rounded transition"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-slate-200 rounded transition"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Grid 7 días de la semana */}
                          <div className="grid grid-cols-7 text-center gap-1">
                            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(wd => (
                              <span key={wd} className="text-[9px] font-bold text-slate-400 uppercase">
                                {wd}
                              </span>
                            ))}

                            {/* Mostrar días */}
                            {calendarDays.map((day, idx) => {
                              if (day === null) {
                                return <div key={`empty-${idx}`} className="h-8 rounded" />;
                              }

                              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const compsHoy = (selectedPlan.competiciones || []).filter(c => c.fecha === dateStr);
                              const hasHigh = compsHoy.some(c => c.importancia === 'Alta');
                              const hasMed = compsHoy.some(c => c.importancia === 'Media');

                              let cellBg = "bg-white hover:bg-slate-100";
                              if (compsHoy.length > 0) {
                                cellBg = hasHigh 
                                  ? "bg-red-50 hover:bg-red-100 text-red-700 font-extrabold border border-red-300"
                                  : hasMed
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold border border-amber-300"
                                    : "bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold border border-teal-300";
                              }

                              return (
                                <button
                                  key={`day-${day}`}
                                  type="button"
                                  onClick={() => {
                                    setCompFecha(dateStr);
                                    setIsAddingComp(true);
                                  }}
                                  className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono transition-all relative ${cellBg}`}
                                  title={compsHoy.map(c => `[${c.importancia}] ${c.nombre}`).join(', ') || 'Clic para programar competición'}
                                >
                                  <span>{day}</span>
                                  {compsHoy.length > 0 && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#ef233c]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* LISTA SINOPSIS DE LAS COMPETICIONES DEL CALENDARIO */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Competiciones Programadas ({selectedPlan.competiciones?.length || 0})</h4>
                          <div className="space-y-2 max-h-[180px] overflow-y-auto">
                            {(!selectedPlan.competiciones || selectedPlan.competiciones.length === 0) ? (
                              <p className="text-xs text-slate-400 italic text-center py-4">No hay competiciones de calendario agendadas.</p>
                            ) : (
                              [...selectedPlan.competiciones]
                                .sort((a,b) => a.fecha.localeCompare(b.fecha))
                                .map((c) => (
                                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative hover:border-slate-350 transition-all font-sans text-xs">
                                    <div className="absolute top-3 right-3 flex items-center gap-1">
                                      <button
                                        onClick={() => handleEditCompClick(c)}
                                        className={`p-1 rounded-md transition ${editingCompId === c.id ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                        title="Modificar competición"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveCompeticion(selectedPlan.id, c.id)}
                                        className="p-1 text-slate-404 hover:text-red-500 rounded transition hover:bg-red-50"
                                        title="Descartar competición"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>

                                    {editingCompId === c.id ? (
                                      <div className="space-y-2 pr-12 pt-1 text-slate-800">
                                        <h5 className="font-extrabold text-indigo-700 uppercase text-[9px] flex items-center gap-1">
                                          Modificar Competición
                                        </h5>
                                        <div className="space-y-1.5">
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Nombre</label>
                                            <input
                                              type="text"
                                              value={editingCompNombre}
                                              onChange={(e) => setEditingCompNombre(e.target.value)}
                                              className="w-full text-xs p-1 border rounded"
                                              required
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            <div>
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Fecha</label>
                                              <input
                                                type="date"
                                                value={editingCompFecha}
                                                onChange={(e) => setEditingCompFecha(e.target.value)}
                                                className="w-full text-[10px] p-0.5 border rounded"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Importancia</label>
                                              <select
                                                value={editingCompImportancia}
                                                onChange={(e) => setEditingCompImportancia(e.target.value as any)}
                                                className="w-full text-[10px] p-0.5 border rounded"
                                              >
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                              </select>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            <div>
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Destinatario</label>
                                              <select
                                                value={editingCompTipo}
                                                onChange={(e) => setEditingCompTipo(e.target.value as any)}
                                                className="w-full text-[10px] p-0.5 border rounded"
                                              >
                                                <option value="grupo">Todo el Grupo</option>
                                                <option value="individual">Individual</option>
                                              </select>
                                            </div>
                                            {editingCompTipo === 'individual' && (
                                              <div>
                                                <label className="block text-[8px] font-bold text-slate-400 uppercase">Arquero</label>
                                                <select
                                                  value={editingCompArqueroId}
                                                  onChange={(e) => setEditingCompArqueroId(e.target.value)}
                                                  className="w-full text-[10px] p-0.5 border rounded"
                                                >
                                                  <option value="">Selecciona...</option>
                                                  {arqueros.map((a) => (
                                                    <option key={a.id_usuario} value={a.id_usuario}>{a.nombre} {a.apellidos}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Comentarios</label>
                                            <input
                                              type="text"
                                              value={editingCompComments}
                                              onChange={(e) => setEditingCompComments(e.target.value)}
                                              className="w-full text-xs p-1 border rounded"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCompeticion(selectedPlan.id)}
                                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded"
                                          >
                                            Guardar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelEditComp}
                                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-extrabold uppercase rounded"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1 pr-14 text-slate-800">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                            c.importancia === 'Alta' ? 'bg-red-500 text-white' : c.importancia === 'Media' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                                          }`}>
                                            Prioridad: {c.importancia}
                                          </span>
                                          <span className="text-[8px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                                            {c.fecha}
                                          </span>
                                        </div>
                                        <p className="text-xs font-black leading-snug">
                                          {c.nombre}
                                        </p>
                                        <p className="text-[10px] font-bold text-indigo-700 uppercase font-mono">
                                          🎯 {c.tipo === 'grupo' ? 'Todo el grupo' : `Exclusivo: ${getNombreUsuario(c.id_arquero || '')}`}
                                        </p>
                                        {c.comentarios && (
                                          <p className="text-[10px] italic text-slate-500 bg-white px-2 py-1 rounded border leading-relaxed">
                                            {c.comentarios}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TAB SESIONES & EJERCICIOS */}
        {activeTab === 'sesiones' && (
          <div className="space-y-6">
            
            {/* Sub-Tabs Selector inside the tab to cleanly separate Sesiones and Ejercicios */}
            <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl border">
              <button
                onClick={() => setSesionesSubTab('sesiones')}
                className={`py-2 px-5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  sesionesSubTab === 'sesiones'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar size={14} />
                Sesiones de Entrenamiento
              </button>
              <button
                onClick={() => setSesionesSubTab('ejercicios')}
                className={`py-2 px-5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  sesionesSubTab === 'ejercicios'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Target size={14} />
                Banco de Ejercicios
              </button>
            </div>

            {sesionesSubTab === 'sesiones' ? (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Formulario: Creador de Sesiones */}
                <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-855 flex items-center gap-1.5">
                      <Calendar className="text-indigo-600" size={18} />
                      {editingSesionId ? 'Modificar Sesión de Entrenamiento' : 'Creador de Sesiones de Entrenamiento'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Conforma sesiones uniendo múltiples ejercicios de tu banco homologado y asígnalos a grupos o individuos.</p>
                    {editingSesionId && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 text-xs rounded-lg font-medium flex justify-between items-center mt-2">
                        <span>Editando sesión activa.</span>
                        <button type="button" onClick={handleCancelEditSesion} className="underline text-amber-900 hover:text-amber-950 font-bold">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCrearSesion} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título de la Sesión *</label>
                      <input 
                        type="text" 
                        required
                        value={sesTitulo}
                        onChange={(e) => setSesTitulo(e.target.value)}
                        placeholder="Ej. Sesión Intensiva Pestaña Superior de Codo"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Entrenamiento</label>
                        <select 
                          value={sesTipo} 
                          onChange={(e) => setSesTipo(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-705 font-bold"
                        >
                          {tiposEntrenamiento.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Concreta *</label>
                        <input 
                          type="date" 
                          required
                          value={sesFecha}
                          onChange={(e) => setSesFecha(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        />
                      </div>
                    </div>

                    {/* Expandir tipo de entrenamiento */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">¿Crear otro tipo de entrenamiento?</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={nuevoTipoEntrenamiento}
                          onChange={(e) => setNuevoTipoEntrenamiento(e.target.value)}
                          placeholder="Ej. Postural, Visual..."
                          className="text-xs bg-white border border-slate-200 rounded p-1.5 flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarTipoEntrenamiento}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Añadir
                        </button>
                      </div>

                      {/* List of custom training types */}
                      {tiposEntrenamiento.some(t => !['Técnico', 'Físico', 'Psicológico'].includes(t)) && (
                        <div className="pt-2 border-t border-slate-200/50">
                          <span className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1">Tipos personalizados creados:</span>
                          <div className="flex flex-wrap gap-1">
                            {tiposEntrenamiento
                              .filter(t => !['Técnico', 'Físico', 'Psicológico'].includes(t))
                              .map(t => (
                                <span key={t} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                  <span>{t}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarTipoEntrenamiento(t)}
                                    className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none cursor-pointer p-0.5"
                                    title="Eliminar este tipo personalizado"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-700">Asignar a:</span>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="asignacion" 
                            checked={sesAsignadoA === 'grupo'} 
                            onChange={() => setSesAsignadoA('grupo')}
                          />
                          Grupo General
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="asignacion" 
                            checked={sesAsignadoA === 'arquero'} 
                            onChange={() => setSesAsignadoA('arquero')}
                          />
                          Arquero Concreto
                        </label>
                      </div>

                      {sesAsignadoA === 'grupo' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seleccionar Grupo de Entrenamiento</label>
                          <select
                            value={sesGrupoId || (misGrupos[0]?.id || '')}
                            onChange={(e) => setSesGrupoId(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                          >
                            {misGrupos.map(g => (
                              <option key={g.id} value={g.id}>{g.nombre_grupo}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seleccionar Arquero Federado</label>
                          <select
                            value={sesArqueroId || (usuariosList.find(u => u.rol === 'arquero')?.id_usuario || '')}
                            onChange={(e) => setSesArqueroId(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                          >
                            {usuariosList.filter(u => u.rol === 'arquero').map(u => (
                              <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} {u.apellidos}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Intensidad de Carga: {sesIntensidad}%</label>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        value={sesIntensidad} 
                        onChange={(e) => setSesIntensidad(Number(e.target.value))}
                        className="w-full accent-indigo-650"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">
                          Seleccionar Ejercicios Integrados (Conforman la sesión) *
                        </label>
                        {sesEjerciciosIds.length > 0 && (
                          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 font-mono">
                            🏹 Total Temp: {sesEjerciciosIds.reduce((sum, eid) => sum + (ejerciciosList.find(e => e.id === eid)?.intensidad_flechas_repeticion || 0), 0)} f.
                          </span>
                        )}
                      </div>
                      {ejerciciosList.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 p-1.5 bg-slate-100 rounded-lg">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase">Filtrar por Tipo:</span>
                          <select
                            value={filterEjerciciosProgramarTipo}
                            onChange={(e) => setFilterEjerciciosProgramarTipo(e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                          >
                            <option value="Todos">Todos los tipos</option>
                            <option value="Técnica">Técnica</option>
                            <option value="Fuerza">Fuerza</option>
                            <option value="Variabilidad">Variabilidad</option>
                            <option value="Estiramientos">Estiramientos</option>
                            <option value="Iniciación">Iniciación</option>
                            <option value="Ajuste (Estabilidad)">Ajuste (Estabilidad)</option>
                            <option value="Carga (Fuerza, Técnica)">Carga (Fuerza, Técnica)</option>
                            <option value="Activación">Activación</option>
                            <option value="Precompetición">Precompetición</option>
                            <option value="Competición">Competición</option>
                          </select>
                        </div>
                      )}
                      {ejerciciosList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 border p-3 rounded-lg">No hay ejercicios homologados guardados. Ve al Banco de Ejercicios primero.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50">
                          {ejerciciosList.filter(e => filterEjerciciosProgramarTipo === 'Todos' || e.tipo_ejercicio === filterEjerciciosProgramarTipo).length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-5">No hay ejercicios de este tipo en el fichero.</p>
                          ) : (
                            ejerciciosList
                              .filter(e => filterEjerciciosProgramarTipo === 'Todos' || e.tipo_ejercicio === filterEjerciciosProgramarTipo)
                              .map(e => {
                                const seleccionado = sesEjerciciosIds.includes(e.id);
                                return (
                                  <div 
                                    key={e.id}
                                    onClick={() => handleToggleEjercicioEnSesion(e.id)}
                                    className={`p-2 rounded-md border text-xs cursor-pointer transition flex items-center justify-between ${
                                      seleccionado 
                                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold' 
                                        : 'bg-white border-slate-150 text-slate-655'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <span>{e.nombre}</span>
                                      <span className="block text-[9px] text-slate-500 font-mono font-medium">{e.tipo_ejercicio} • {e.duracion} min</span>
                                    </div>
                                    <div className="shrink-0">
                                      {seleccionado ? (
                                        <span className="text-[10px] text-indigo-700 bg-indigo-100 p-0.5 px-1.5 rounded-sm font-bold">Agregado</span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">＋ Incluir</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comandos / Notas Técnicas Adicionales</label>
                      <textarea 
                        rows={2}
                        value={sesComentarios}
                        onChange={(e) => setSesComentarios(e.target.value)}
                        placeholder="Recomendaciones post-anclaje, flechas estimadas o pauta técnica importante..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-normal text-slate-700"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-705 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-xs"
                      >
                        {editingSesionId ? 'Guardar Cambios de Sesión' : 'Programar y Publicar Entrenamiento'}
                      </button>
                      {editingSesionId && (
                        <button
                          type="button"
                          onClick={handleCancelEditSesion}
                          className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase rounded-lg transition font-mono"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Listado de Sesiones de Entrenamiento Programadas */}
                <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-bold text-slate-800">Planificador de Sesiones Activas</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                      {sesionesList.length} Programaciones
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[660px] overflow-y-auto pr-1">
                    {sesionesList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 bg-slate-50 border border-dashed rounded-xl">No hay sesiones de entrenamiento calendarizadas actualmente. Usa el panel de la izquierda para componer la primera.</p>
                    ) : (
                      sesionesList.map((s) => {
                        const targetText = s.asignado_a === 'grupo' 
                          ? `Grupo: ${getNombreGrupo(s.id_grupo || '')}`
                          : `Arquero: ${getNombreUsuario(s.id_arquero || '')}`;

                        const totalFlechasSesion = s.ejercicios_ids?.reduce((acc, eid) => {
                          const ej = ejerciciosList.find(e => e.id === eid);
                          return acc + (ej?.intensidad_flechas_repeticion || 0);
                        }, 0) || 0;
                        
                        return (
                          <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative hover:border-indigo-200 transition space-y-3">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <button
                                onClick={() => generateSessionPDF(s, ejerciciosList, targetText, usuariosList)}
                                className="text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 p-1 rounded-md transition shadow-2xs cursor-pointer flex items-center justify-center"
                                title="Imprimir / Exportar a PDF"
                              >
                                <Printer size={13} />
                              </button>
                              <button
                                onClick={() => handleEditSesionClick(s)}
                                className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                title="Editar sesión"
                              >
                                <Pencil size={15} />
                              </button>
                              {onRemoveSesion && (
                                <button
                                  onClick={() => {
                                    pedirConfirmacion(
                                      "Eliminar Sesión",
                                      "¿Seguro que deseas eliminar esta sesión de entrenamiento programada?",
                                      () => onRemoveSesion(s.id)
                                    );
                                  }}
                                  className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                                  title="Eliminar sesión"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>

                            <div>
                              <div className="flex gap-2 items-center">
                                <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                  s.tipo_entrenamiento === 'Técnico' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : s.tipo_entrenamiento === 'Físico'
                                    ? 'bg-green-100 text-green-800'
                                    : s.tipo_entrenamiento === 'Psicológico'
                                    ? 'bg-purple-100 text-[#6f42c1]'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {s.tipo_entrenamiento}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">{s.fecha_asignada}</span>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-800 mt-1">{s.titulo}</h4>
                              <p className="text-[11px] text-indigo-700 font-extrabold mt-0.5">Asignación: {targetText}</p>
                            </div>

                            {s.comentarios && (
                              <p className="text-xs text-slate-400 bg-white p-2.5 rounded-lg border border-slate-150 italic leading-relaxed">
                                &ldquo;{s.comentarios}&rdquo;
                              </p>
                            )}

                            <div className="space-y-1">
                              <span className="block text-[9px] uppercase font-bold text-slate-400 font-extrabold">Ejercicios conformantes ({s.ejercicios_ids?.length || 0}):</span>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {s.ejercicios_ids && s.ejercicios_ids.map(eid => {
                                  const ej = ejerciciosList.find(e => e.id === eid);
                                  if (!ej) return null;
                                  return (
                                    <div key={eid} className="p-2.5 bg-white border border-slate-150 rounded-lg text-xs flex justify-between items-center gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-700 truncate">{ej.nombre}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{ej.duracion} min • {ej.densidad_repeticiones}</p>
                                      </div>
                                      <div className="text-right shrink-0 bg-indigo-50/50 p-1 px-2 rounded border border-indigo-100 text-[10px] font-bold text-indigo-700 font-mono" title="Flechas estimadas">
                                        🏹 {ej.intensidad_flechas_repeticion} f.
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Mostrar reporte de completitud para entrenadores */}
                            {(() => {
                              const completaronUserIds = s.completada_por_arqueros || [];
                              const ejerciciosCompletadosMap = s.ejercicios_completados_arqueros || {};
                              const flechasCompletadasMap = s.flechas_completadas_arqueros || {};
                              
                              const allArcherIds = Array.from(new Set([
                                ...completaronUserIds,
                                ...Object.keys(ejerciciosCompletadosMap),
                                ...Object.keys(flechasCompletadasMap)
                              ])).filter(uid => usuariosList.some(u => u.id_usuario === uid));
                              
                              if (allArcherIds.length === 0) return null;
                              
                              return (
                                <div className="mt-3 pt-3 border-t border-slate-250 bg-slate-100/50 p-3 rounded-xl space-y-2">
                                  <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1">
                                    <span>📈 Control de Avance de Alumnos ({allArcherIds.length})</span>
                                  </p>
                                  <div className="space-y-1">
                                    {allArcherIds.map(uid => {
                                      const u = usuariosList.find(usr => usr.id_usuario === uid);
                                      if (!u) return null;
                                      const archerCompletedSession = completaronUserIds.includes(uid);
                                      const completedExercises = ejerciciosCompletadosMap[uid] || [];
                                      const completedArrows = flechasCompletadasMap[uid] ?? 0;
                                      return (
                                        <div key={uid} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${completedExercises.length === (s.ejercicios_ids?.length || 0) ? 'bg-emerald-500' : 'bg-indigo-400'}`} />
                                            <span className="font-extrabold text-slate-705 truncate">{u.nombre}</span>
                                            {archerCompletedSession && (
                                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                                Completada
                                              </span>
                                            )}
                                          </div>
                                          <div className="shrink-0 flex items-center gap-2.5 font-mono text-[10px] text-slate-500 font-bold">
                                            <span>ejercicios: {completedExercises.length}/{s.ejercicios_ids?.length || 0}</span>
                                            <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">🏹 {completedArrows} flechas</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-[10px] flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-450">Intensidad: <strong>{s.intensidad}%</strong></span>
                                <span className="bg-amber-50 text-amber-850 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase flex items-center gap-1">
                                  🏹 TOTAL SESIÓN: {totalFlechasSesion} FLECHAS
                                </span>
                              </div>
                              <span className="text-slate-400 font-bold font-mono">RefID: {s.id}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Creador de Ejercicios */}
                <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-855 flex items-center gap-1.5">
                      <Target className="text-indigo-600" size={18} />
                      {editingEjercicioId ? 'Modificar Ejercicio del Club' : 'Creador de Ejercicios del Club'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Guarda ejercicios individuales con sus configuraciones, tiempos de suelta, repeticiones FITA e intensidades estimadas.</p>
                    {editingEjercicioId && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 text-xs rounded-lg font-medium flex justify-between items-center mt-2">
                        <span>Editando ejercicio homologado.</span>
                        <button type="button" onClick={handleCancelEditEjercicio} className="underline text-amber-900 hover:text-amber-950 font-bold">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCrearEjercicio} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Ejercicio *</label>
                      <input 
                        type="text" 
                        required
                        value={ejNombre}
                        onChange={(e) => setEjNombre(e.target.value)}
                        placeholder="Ej. Tándem Estabilidad hombros"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Ejercicio</label>
                        <select 
                          value={ejTipo} 
                          onChange={(e) => setEjTipo(e.target.value as EjercicioTipo)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        >
                          <option value="Técnica">Técnica</option>
                          <option value="Fuerza">Fuerza</option>
                          <option value="Variabilidad">Variabilidad</option>
                          <option value="Estiramientos">Estiramientos</option>
                          <option value="Iniciación">Iniciación</option>
                          <option value="Ajuste (Estabilidad)">Ajuste (Estabilidad)</option>
                          <option value="Carga (Fuerza, Técnica)">Carga (Fuerza, Técnica)</option>
                          <option value="Activación">Activación</option>
                          <option value="Precompetición">Precompetición</option>
                          <option value="Competición">Competición</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dificultad</label>
                        <select 
                          value={ejDificultad} 
                          onChange={(e) => setEjDificultad(e.target.value as EjercicioDificultad)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        >
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Muy Alta">Muy Alta</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duración (min) *</label>
                        <input 
                          type="number" 
                          required
                          value={ejDuracion}
                          onChange={(e) => setEjDuracion(Number(e.target.value))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Flechas Estimadas *</label>
                        <input 
                          type="number" 
                          required
                          value={ejIntensidadFlechas}
                          onChange={(e) => setEjIntensidadFlechas(Number(e.target.value))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Densidad de Repeticiones</label>
                      <input 
                        type="text" 
                        required
                        value={ejDensidad}
                        onChange={(e) => setEjDensidad(e.target.value)}
                        placeholder="Ej. 6 flechas en 2 min con 45s de descanso"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción del Ejercicio *</label>
                      <textarea 
                        required
                        rows={3}
                        value={ejDesc}
                        onChange={(e) => setEjDesc(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        placeholder="Pasos para realizar, ángulo de enfoque visual, agarre del disparador o clicker..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                      >
                        {editingEjercicioId ? 'Guardar Cambios' : 'Registrar Ejercicio en Archivo'}
                      </button>
                      {editingEjercicioId && (
                        <button
                          type="button"
                          onClick={handleCancelEditEjercicio}
                          className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-705 text-xs font-bold uppercase rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Listado banco de ejercicios */}
                <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-md font-bold text-slate-800">Fichero de Ejercicios Homologados del Club</h3>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Filtrar:</span>
                      <select
                        value={filterEjerciciosBancoTipo}
                        onChange={(e) => setFilterEjerciciosBancoTipo(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium w-full sm:w-auto cursor-pointer"
                      >
                        <option value="Todos">Todos los tipos</option>
                        <option value="Técnica">Técnica</option>
                        <option value="Fuerza">Fuerza</option>
                        <option value="Variabilidad">Variabilidad</option>
                        <option value="Estiramientos">Estiramientos</option>
                        <option value="Iniciación">Iniciación</option>
                        <option value="Ajuste (Estabilidad)">Ajuste (Estabilidad)</option>
                        <option value="Carga (Fuerza, Técnica)">Carga (Fuerza, Técnica)</option>
                        <option value="Activación">Activación</option>
                        <option value="Precompetición">Precompetición</option>
                        <option value="Competición">Competición</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {ejerciciosList.filter(e => filterEjerciciosBancoTipo === 'Todos' || e.tipo_ejercicio === filterEjerciciosBancoTipo).length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-12 col-span-2 bg-slate-25 rounded-lg border border-dashed border-slate-200">No hay ejercicios de este tipo en el fichero.</p>
                    ) : (
                      ejerciciosList
                        .filter(e => filterEjerciciosBancoTipo === 'Todos' || e.tipo_ejercicio === filterEjerciciosBancoTipo)
                        .map((e) => (
                          <div key={e.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group hover:border-slate-300 transition">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                                {e.tipo_ejercicio}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEditEjercicioClick(e)}
                                  className="text-slate-450 hover:text-indigo-650 transition cursor-pointer p-0.5 rounded hover:bg-slate-200"
                                  title="Editar Ejercicio"
                                >
                                  <Pencil size={11} />
                                </button>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">{e.duracion} min</span>
                              </div>
                            </div>
                            <h4 className="font-bold text-xs text-slate-800 leading-tight">{e.nombre}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-3 leading-normal">{e.descripcion}</p>
                            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-450 flex justify-between">
                              <span>Dificultad: <strong className="font-bold text-slate-700">{e.dificultad}</strong></span>
                              <span>Volumen: <strong className="font-bold text-slate-700">{e.intensidad_flechas_repeticion} flechas</strong></span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB ANÁLISIS E INFORMES DE DESEMPEÑO */}
        {activeTab === 'informes' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-850 flex items-center gap-1.5">
                <FileText className="text-indigo-600" size={18} />
                Generador de Informes de Rendimiento y Comparativas
              </h3>
              <p className="text-xs text-slate-400">Selecciona el rango de fechas e individualiza la analítica contrastando el rendimiento de tu arquero contra el promedio técnico de su grupo.</p>

              <form onSubmit={handleGenerarInforme} className="grid sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comparar Arquero</label>
                  <select 
                    value={informeArqueroId} 
                    onChange={(e) => setInformeArqueroId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                    required
                  >
                    <option value="">Selecciona arquero...</option>
                    {arqueros.map((a) => (
                      <option key={a.id_usuario} value={a.id_usuario}>{a.nombre} {a.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rango Desde</label>
                  <input 
                    type="date" 
                    value={fechaDesde} 
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rango Hasta</label>
                  <input 
                    type="date" 
                    value={fechaHasta} 
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition h-9 shrink-0"
                >
                  Generar Informe
                </button>
              </form>
            </div>

            {/* Resultado del Informe Visual */}
            {informeResult && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-805 font-bold uppercase px-2 py-0.5 rounded">PDF Oficial de Oficinas Técnicas</span>
                    <h3 className="text-lg font-extrabold text-slate-800 mt-2">{informeResult.nombre}</h3>
                    <p className="text-xs text-slate-400">Intervalo analítico de fechas: {informeResult.rango}</p>
                  </div>
                  <div className="text-right text-xs mt-3 sm:mt-0 font-mono text-slate-500">
                    <p>Licencia FITA: <strong>A81622SH</strong></p>
                    <p>Promedio Técnico: <strong className="text-emerald-500">{informeResult.promedioControl}</strong></p>
                  </div>
                </div>

                {/* Métricas Visuales bento */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Flechas Totales</span>
                    <span className="text-xl font-bold text-slate-800">{informeResult.flechasSemanales}</span>
                    <span className="text-[9px] block text-slate-400">Meta: {informeResult.objetivoFlechas}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Eficiencia / Score</span>
                    <span className="text-xl font-bold text-emerald-600">{informeResult.promedioControl} / 10</span>
                    <span className="text-[9px] block text-slate-400">Promedio general: {informeResult.promedioGrupo}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Estado de Ánimo</span>
                    <span className="text-xs font-bold text-indigo-700 truncate block mt-1">{informeResult.estadoAnimoPredominante}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">Fatiga autopercibida</span>
                    <span className="text-xl font-bold text-orange-650">{informeResult.cansancioMedio} / 10</span>
                    <span className="text-[9px] block text-slate-400">Nivel de estrés: Bajo</span>
                  </div>
                </div>

                {/* Gráfico de Evolución simple usando SVGs reactivos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-450 tracking-wider">Evolución de puntuaciones acumuladas (%)</h4>
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
                    <div className="h-28 flex items-end justify-between px-6 border-b border-slate-200">
                      {informeResult.evolucion.map((ev: any, i: number) => (
                        <div key={i} className="flex flex-col items-center w-12 gap-1 group">
                          {/* Columna */}
                          <div 
                            className="bg-indigo-650 rounded-t-lg w-7 hover:bg-[#ef233c] transition-all" 
                            style={{ height: `${(ev.score / 10) * 80}px` }}
                          ></div>
                          <span className="text-[9px] text-slate-600 font-bold">{ev.score}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{ev.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Retroalimentación Automática del Técnico */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-150">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={14} />
                    Asesoramiento Técnico Sugerido por IA
                  </h4>
                  <p className="text-xs text-emerald-950 mt-1.5 leading-relaxed italic">{informeResult.observacionIA}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL DE GESTIÓN DE ROSTER (MIEMBROS DE GRUPO) */}
        {mgmtGrupo && (() => {
          const grupoMiembros = miembrosList.filter(m => m.id_grupo === mgmtGrupo.id && m.estado === 'aceptado');
          const gMiembrosIds = miembrosList.filter(m => m.id_grupo === mgmtGrupo.id).map(m => m.id_arquero);
          
          // Filtrar deportistas inscritos según búsqueda
          const inscritosFiltrados = grupoMiembros.map(m => usuariosList.find(u => u.id_usuario === m.id_arquero))
            .filter((u): u is Usuario => !!u)
            .filter(u => 
              mgmtSearch.trim() === '' || 
              u.nombre.toLowerCase().includes(mgmtSearch.toLowerCase()) || 
              (u.apellidos || '').toLowerCase().includes(mgmtSearch.toLowerCase()) ||
              (u.licencia || '').toLowerCase().includes(mgmtSearch.toLowerCase())
            );

          // Filtrar deportistas disponibles en el club (rol arquero, activo, no en el grupo, coincide con búsqueda)
          const disponiblesFiltrados = usuariosList
            .filter(u => u.rol === 'arquero' && u.activo && !gMiembrosIds.includes(u.id_usuario))
            .filter(u => 
              mgmtSearch.trim() === '' || 
              u.nombre.toLowerCase().includes(mgmtSearch.toLowerCase()) || 
              (u.apellidos || '').toLowerCase().includes(mgmtSearch.toLowerCase()) ||
              (u.licencia || '').toLowerCase().includes(mgmtSearch.toLowerCase())
            );

          return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#ef233c] p-2 rounded-xl text-white">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm leading-tight">
                        Gestionar Planilla de Deportistas
                      </h3>
                      <p className="text-[10px] text-slate-300">
                        Grupo: <span className="text-yellow-400 font-bold uppercase">{mgmtGrupo.nombre_grupo}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMgmtGrupo(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                    title="Cerrar modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search control in modal */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={mgmtSearch}
                      onChange={(e) => setMgmtSearch(e.target.value)}
                      placeholder="Buscar deportista por nombre, apellidos o licencia federativa..."
                      className="w-full bg-white border border-slate-250 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    />
                  </div>
                  {mgmtSearch && (
                    <button 
                      onClick={() => setMgmtSearch('')} 
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline px-2 py-1"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Dos Columnas: Inscritos vs No Inscritos */}
                <div className="flex-1 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
                  
                  {/* COLUMNA IZQUIERDA: INSCRITOS */}
                  <div className="p-5 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Miembros del Grupo ({grupoMiembros.length})
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 font-mono font-black uppercase tracking-wider">Inscripción activa</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] md:max-h-[420px]">
                      {inscritosFiltrados.length === 0 ? (
                        <div className="py-12 text-center text-slate-450 italic text-xs">
                          {mgmtSearch ? 'Ningún miembro inscrito coincide con la búsqueda.' : 'No hay arqueros inscritos en este grupo de entrenamiento.'}
                        </div>
                      ) : (
                        inscritosFiltrados.map(u => (
                          <div key={u.id_usuario} className="flex justify-between items-center bg-slate-50 p-2.5 border border-slate-200 rounded-xl hover:border-slate-300 transition">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{u.nombre} {u.apellidos}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{u.licencia || '---'} • {u.email}</p>
                            </div>
                            <button
                              onClick={() => {
                                pedirConfirmacion(
                                  "Dar de Baja del Grupo de Entrenamiento",
                                  `¿Seguro que deseas dar de baja a ${u.nombre} ${u.apellidos} de "${mgmtGrupo.nombre_grupo}"?`,
                                  () => {
                                    onRemoveMiembroGrupo(mgmtGrupo.id, u.id_usuario);
                                    alert(`¡Se ha dado de baja de este grupo a ${u.nombre} con éxito!`);
                                  }
                                );
                              }}
                              className="p-1 px-2.5 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-[#ef233c] rounded-md transition cursor-pointer"
                              title="Dar de baja de este grupo de entrenamiento"
                            >
                              Dar de baja
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: DISPONIBLES EN EL CLUB */}
                  <div className="p-5 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Arqueros del Club Disponibles ({disponiblesFiltrados.length})
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 font-mono font-black uppercase tracking-wider">Roster general</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] md:max-h-[420px]">
                      {disponiblesFiltrados.length === 0 ? (
                        <div className="py-12 text-center text-slate-450 italic text-xs">
                          {mgmtSearch ? 'Ningún arquero disponible coincide con la búsqueda.' : 'No hay más deportistas activos en el club para agregar.'}
                        </div>
                      ) : (
                        disponiblesFiltrados.map(u => (
                          <div key={u.id_usuario} className="flex justify-between items-center bg-white p-2.5 border border-slate-200 rounded-xl hover:border-indigo-150 transition">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{u.nombre} {u.apellidos}</p>
                              <p className="text-[10px] text-indigo-650 font-mono">{u.licencia || 'ST-992'} • {u.email}</p>
                            </div>
                            <button
                              onClick={() => {
                                onAddMiembroDirecto(mgmtGrupo.id, u.id_usuario);
                              }}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition cursor-pointer"
                            >
                              Inscribir
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer del modal */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 text-right flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Cambios aplicados de inmediato al roster de entrenamiento.
                  </span>
                  <button
                    type="button"
                    onClick={() => setMgmtGrupo(null)}
                    className="py-2 px-5 bg-slate-900 hover:bg-slate-805 text-white text-[11px] font-extrabold uppercase rounded-lg transition cursor-pointer"
                  >
                    Finalizar y Guardar
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* TAB SCOUTING & ANALÍTICA */}
        {activeTab === 'scouting' && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-150">
              <Sparkles className="text-purple-600 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-slate-805">Módulos avanzados: IA Reports, Scouting y Analítica</h3>
                <p className="text-xs text-slate-400">Búsqueda rápida de atletas olímpicos y scouting técnico de marcas.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-900 text-white rounded-xl space-y-4">
                <span className="text-[8px] bg-red-600 font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-widest">COACH INTELLIGENCE</span>
                <h4 className="text-md font-extrabold text-white">Scouting Nacional & Federativo</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Realiza un análisis comparativo cruzado entre las planificaciones de tu club contra el histórico de marcas de la Federación. Permite anticipar marcas de corte para campeonatos nacionales y diseñar rutinas específicas a un arquero.
                </p>
                <button onClick={() => alert('Recuperando datos actualizados de la delegación...')} className="text-xs font-bold bg-white text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 transition">
                  Iniciar Módulo Scouting
                </button>
              </div>

              <div className="p-5 bg-slate-940 text-slate-100 rounded-xl space-y-4 border border-slate-800">
                <span className="text-[8px] bg-indigo-650 font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-widest text-indigo-100">SCOUTING IANSEO</span>
                <h4 className="text-md font-bold text-white">Ianseo Atletas Integración</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Busca marcas y perfiles de los mejores arqueros del mundo directamente a través de códigos de licencia integrando la base de datos de atletas Ianseo.
                </p>
                <div className="flex gap-2.5">
                  <input type="text" placeholder="Licencia Ianseo..." className="bg-slate-800 text-white text-xs p-2 rounded-lg border border-slate-705 text-slate-150" />
                  <button onClick={() => alert('Buscando en la pasarela de Ianseo.net...')} className="bg-[#ef233c] text-white text-xs font-bold px-3 py-2 rounded-lg">
                    Scraping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUADRO DE CONFIRMACIÓN CUSTOM */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4 animate-fadeIn" id="custom-confirm-modal">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-sm overflow-hidden flex flex-col">
              <div className="bg-slate-900 text-white p-4 flex items-center gap-2">
                <div className="bg-red-500 p-1.5 rounded-lg text-white">
                  <Trash2 size={16} />
                </div>
                <h4 className="font-extrabold text-xs uppercase tracking-wide">
                  Confirmación Requerida
                </h4>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold uppercase tracking-wide rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wide rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
