import React, { useState, useEffect } from 'react';
import { Usuario, GrupoEntrenamiento, MiembroGrupo, Planificacion, Sesion, Ejercicio, DiarioEntrada, DiarioTipoEntrada, DiarioPrivacidad, ControlTiro, ImpactoFlecha, SetupRutina } from '../types';
import { BookOpen, Target, Compass, Award, Calendar, Settings, Sparkles, Plus, Trash2, Heart, Search, Eye, EyeOff, Check, ExternalLink, Clock, Activity, Printer } from 'lucide-react';
import { generateSessionPDF } from '../lib/pdfGenerator';
import DianaInteractiva from './DianaInteractiva';
import ContadorFlechas from './ContadorFlechas';

interface ArqueroDashboardProps {
  usuarioActual: Usuario;
  usuariosList?: Usuario[];
  gruposList: GrupoEntrenamiento[];
  miembrosList: MiembroGrupo[];
  planificaciones: Planificacion[];
  ejerciciosList: Ejercicio[];
  sesionesList?: Sesion[];
  diariosList: DiarioEntrada[];
  controlesList: ControlTiro[];
  setupsList: SetupRutina[];
  onAddDiario: (d: DiarioEntrada) => void;
  onAddControlTiro: (c: ControlTiro, imps: ImpactoFlecha[]) => void;
  onApplyGrupo: (idGrupo: string) => void;
  onAddSetup: (s: SetupRutina) => void;
  onRemoveSetup?: (id: string) => void;
  onUpdateSetup?: (s: SetupRutina) => void;
  onUpdateSesion?: (s: Sesion) => void;
  onLogout: () => void;
}

export default function ArqueroDashboard({
  usuarioActual,
  usuariosList = [],
  gruposList,
  miembrosList,
  planificaciones,
  ejerciciosList,
  sesionesList = [],
  diariosList,
  controlesList,
  setupsList,
  onAddDiario,
  onAddControlTiro,
  onApplyGrupo,
  onAddSetup,
  onRemoveSetup,
  onUpdateSetup,
  onUpdateSesion,
  onLogout
}: ArqueroDashboardProps) {
  const [activeTab, setActiveTab] = useState<'flechas' | 'controles' | 'diario' | 'planes' | 'entrenos' | 'grupos' | 'setups' | 'ianseo'>('flechas');
  const [activeConfigTab, setActiveConfigTab] = useState<'visor' | 'rutinas' | 'objetivo_mental' | 'material'>('visor');
  const [filtroSesion, setFiltroSesion] = useState<'todos' | 'pendientes' | 'completados'>('todos');

  // Diario Form state
  const [diarioTitulo, setDiarioTitulo] = useState('');
  const [diarioTipo, setDiarioTipo] = useState<DiarioTipoEntrada>('Entrenamiento');
  const [diarioAnimo, setDiarioAnimo] = useState('Motivado');
  const [diarioEnergia, setDiarioEnergia] = useState(8);
  const [diarioArchivo, setDiarioArchivo] = useState('');
  const [diarioPrivacidad, setDiarioPrivacidad] = useState<DiarioPrivacidad>('privada');
  const [diarioCuerpo, setDiarioCuerpo] = useState('');

  // Setup Form state (diferenciados en 4 apartados)
  const [visorDistancia, setVisorDistancia] = useState('70m');
  const [visorDistanciaOtro, setVisorDistanciaOtro] = useState('');
  const [visorMedida, setVisorMedida] = useState('5.4');
  const [visorLibras, setVisorLibras] = useState('');
  const [visorObjetivoMental, setVisorObjetivoMental] = useState('');

  const [objetivoMentalText, setObjetivoMentalText] = useState('');

  const [rutinaNombre, setRutinaNombre] = useState('');
  const [rutinaDescripcion, setRutinaDescripcion] = useState('');
  const [rutinaObjId, setRutinaObjId] = useState('');

  // Material Form state
  const [materialTipo, setMaterialTipo] = useState('Cuerpo');
  const [materialTipoOtro, setMaterialTipoOtro] = useState('');
  const [materialNombre, setMaterialNombre] = useState('');
  const [materialEspecificaciones, setMaterialEspecificaciones] = useState('');

  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);

  // Ianseo state
  const [ianseoLicencia, setIanseoLicencia] = useState(usuarioActual.licencia || '71992A');
  const [ianseoData, setIanseoData] = useState<any | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  // Buscar grupos
  const [buscarGrupoTerm, setBuscarGrupoTerm] = useState('');

  const handleCrearDiario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diarioTitulo || !diarioCuerpo) {
      alert('Por favor, indica un título y contenido para la entrada del diario.');
      return;
    }

    const nuevaEntrada: DiarioEntrada = {
      id: 'dia-' + Date.now(),
      id_arquero: usuarioActual.id_usuario,
      fecha: new Date().toISOString().split('T')[0],
      titulo: diarioTitulo,
      tipo_entrada: diarioTipo,
      estado_animo: diarioAnimo,
      nivel_energia_cansancio: diarioEnergia,
      archivo_url: diarioArchivo || undefined,
      privacidad: diarioPrivacidad,
      anotaciones_tecnico: '' // Inicialmente vacio, para rellenar por el coach
    };

    onAddDiario(nuevaEntrada);
    alert('¡Entrada de diario guardada exitosamente!');
    setDiarioTitulo('');
    setDiarioCuerpo('');
  };

  // Handlers para las 3 configuraciones
  const handleSaveVisor = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDistancia = visorDistancia === 'Otro' ? visorDistanciaOtro.trim() : visorDistancia;
    if (!finalDistancia) {
      alert('Por favor especifica la distancia o selecciona una.');
      return;
    }
    if (!visorMedida) {
      alert('Por favor rellena todos los campos requeridos del visor.');
      return;
    }

    if (editingSetupId) {
      const updated: SetupRutina = {
        id: editingSetupId,
        id_arquero: usuarioActual.id_usuario,
        tipo: 'setup',
        datos_json: {
          distancia: finalDistancia,
          visor: visorMedida,
          libras: visorLibras.trim() || undefined,
          objetivo_mental: visorObjetivoMental.trim() || undefined
        }
      };
      onUpdateSetup?.(updated);
      alert('¡Configuración de visor actualizada exitosamente!');
      setEditingSetupId(null);
    } else {
      const nuevo: SetupRutina = {
        id: 'visor-' + Date.now(),
        id_arquero: usuarioActual.id_usuario,
        tipo: 'setup',
        datos_json: {
          distancia: finalDistancia,
          visor: visorMedida,
          libras: visorLibras.trim() || undefined,
          objetivo_mental: visorObjetivoMental.trim() || undefined
        }
      };
      onAddSetup(nuevo);
      alert('¡Configuración de visor guardada exitosamente!');
    }
    setVisorDistancia('70m');
    setVisorDistanciaOtro('');
    setVisorMedida('5.4');
    setVisorLibras('');
    setVisorObjetivoMental('');
  };

  const handleSaveObjetivoMental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetivoMentalText.trim()) {
      alert('Por favor describe tu objetivo mental.');
      return;
    }

    if (editingSetupId) {
      const updated: SetupRutina = {
        id: editingSetupId,
        id_arquero: usuarioActual.id_usuario,
        tipo: 'objetivo_mental',
        datos_json: {
          objetivo: objetivoMentalText
        }
      };
      onUpdateSetup?.(updated);
      alert('¡Objetivo mental actualizado exitosamente!');
      setEditingSetupId(null);
    } else {
      const nuevo: SetupRutina = {
        id: 'obj-' + Date.now(),
        id_arquero: usuarioActual.id_usuario,
        tipo: 'objetivo_mental',
        datos_json: {
          objetivo: objetivoMentalText
        }
      };
      onAddSetup(nuevo);
      alert('¡Objetivo mental guardado exitosamente!');
    }
    setObjetivoMentalText('');
  };

  const handleSaveRutina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutinaNombre.trim() || !rutinaDescripcion.trim()) {
      alert('Por favor indica un nombre y descripción para la rutina.');
      return;
    }

    if (editingSetupId) {
      const updated: SetupRutina = {
        id: editingSetupId,
        id_arquero: usuarioActual.id_usuario,
        tipo: 'rutina',
        datos_json: {
          nombre: rutinaNombre,
          descripcion: rutinaDescripcion,
          objetivo_mental_id: rutinaObjId
        }
      };
      onUpdateSetup?.(updated);
      alert('¡Rutina técnica actualizada exitosamente!');
      setEditingSetupId(null);
    } else {
      const nuevo: SetupRutina = {
        id: 'rutina-' + Date.now(),
        id_arquero: usuarioActual.id_usuario,
        tipo: 'rutina',
        datos_json: {
          nombre: rutinaNombre,
          descripcion: rutinaDescripcion,
          objetivo_mental_id: rutinaObjId
        }
      };
      onAddSetup(nuevo);
      alert('¡Rutina técnica guardada exitosamente!');
    }
    setRutinaNombre('');
    setRutinaDescripcion('');
    setRutinaObjId('');
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTipo = materialTipo === 'Otro' ? materialTipoOtro.trim() : materialTipo;
    if (!finalTipo) {
      alert('Por favor especifica el tipo de material o añade uno nuevo.');
      return;
    }
    if (!materialNombre.trim()) {
      alert('Por favor indica el nombre o modelo del material.');
      return;
    }

    if (editingSetupId) {
      const updated: SetupRutina = {
        id: editingSetupId,
        id_arquero: usuarioActual.id_usuario,
        tipo: 'material',
        datos_json: {
          tipo_material: finalTipo,
          nombre: materialNombre,
          especificaciones: materialEspecificaciones
        }
      };
      onUpdateSetup?.(updated);
      alert('¡Componente de material actualizado exitosamente!');
      setEditingSetupId(null);
    } else {
      const nuevo: SetupRutina = {
        id: 'mat-' + Date.now(),
        id_arquero: usuarioActual.id_usuario,
        tipo: 'material',
        datos_json: {
          tipo_material: finalTipo,
          nombre: materialNombre,
          especificaciones: materialEspecificaciones
        }
      };
      onAddSetup(nuevo);
      alert('¡Componente de material guardado exitosamente!');
    }
    setMaterialTipo('Cuerpo');
    setMaterialTipoOtro('');
    setMaterialNombre('');
    setMaterialEspecificaciones('');
  };

  const handleEditClick = (s: SetupRutina) => {
    setEditingSetupId(s.id);
    if (s.tipo === 'setup') {
      const predefinedDistancias = ['12m', '15m', '18m', '30m', '40m', '50m', '60m', '70m', '90m'];
      const currentDist = s.datos_json.distancia || '70m';
      if (predefinedDistancias.includes(currentDist)) {
        setVisorDistancia(currentDist);
        setVisorDistanciaOtro('');
      } else {
        setVisorDistancia('Otro');
        setVisorDistanciaOtro(currentDist);
      }
      setVisorMedida(s.datos_json.visor || '5.4');
      setVisorLibras(s.datos_json.libras || '');
      setVisorObjetivoMental(s.datos_json.objetivo_mental || '');
    } else if (s.tipo === 'objetivo_mental') {
      setObjetivoMentalText(s.datos_json.objetivo || '');
    } else if (s.tipo === 'rutina') {
      setRutinaNombre(s.datos_json.nombre || '');
      setRutinaDescripcion(s.datos_json.descripcion || '');
      setRutinaObjId(s.datos_json.objetivo_mental_id || '');
    } else if (s.tipo === 'material') {
      const predefined = ['Cuerpo', 'Palas', 'Visor', 'Índice', 'Reposaflechas', 'Botón'];
      const currentTipo = s.datos_json.tipo_material || '';
      if (predefined.includes(currentTipo)) {
        setMaterialTipo(currentTipo);
        setMaterialTipoOtro('');
      } else {
        setMaterialTipo('Otro');
        setMaterialTipoOtro(currentTipo);
      }
      setMaterialNombre(s.datos_json.nombre || '');
      setMaterialEspecificaciones(s.datos_json.especificaciones || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingSetupId(null);
    setVisorDistancia('70m');
    setVisorDistanciaOtro('');
    setVisorMedida('5.4');
    setVisorLibras('');
    setVisorObjetivoMental('');
    setObjetivoMentalText('');
    setRutinaNombre('');
    setRutinaDescripcion('');
    setRutinaObjId('');
    setMaterialTipo('Cuerpo');
    setMaterialTipoOtro('');
    setMaterialNombre('');
    setMaterialEspecificaciones('');
  };

  const handleIanseoScrape = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    
    // Simular consulta / scraping a ianseo.net/TourList.php
    setTimeout(() => {
      setIanseoData({
        licencia: ianseoLicencia,
        arquero: `${usuarioActual.nombre} ${usuarioActual.apellidos}`,
        club: usuarioActual.id_club || 'Club Arco Silense',
        eventos: [
          { torneo: 'Campeonato Nacional de España Absoluto', modalidad: 'Recurve Men', ranking: '9º Lugar', puntuacion: '654 pts @ 70m FITA' },
          { torneo: 'XIX Trofeo San Isidro - FITA Aire Libre', modalidad: 'Recurve Men', ranking: '3º Lugar (Bronce)', puntuacion: '650 pts @ 70m' },
          { torneo: 'Gran Premio de España - Cáceres 2026', modalidad: 'Recurve Men', ranking: '17º Lugar', puntuacion: '641 pts' }
        ]
      });
      setIsScraping(false);
    }, 1500);
  };

  // Filtrar grupos por término de búsqueda
  const gruposFiltrados = gruposList.filter(g => 
    g.nombre_grupo.toLowerCase().includes(buscarGrupoTerm.toLowerCase())
  );

  const getGrupoEstado = (idGrupo: string) => {
    const miembro = miembrosList.find(m => m.id_grupo === idGrupo && m.id_arquero === usuarioActual.id_usuario);
    return miembro ? miembro.estado : 'sin_solicitar';
  };

  // Filtrar diarios de este arquero
  const misDiarios = diariosList.filter(d => d.id_arquero === usuarioActual.id_usuario);

  // Filtrar setups de este arquero
  const misSetups = setupsList.filter(s => s.id_arquero === usuarioActual.id_usuario);

  // Planificaciones disponibles (tanto individuales como del grupo en el que está el arquero)
  const misGruposAceptadosIDs = miembrosList
    .filter(m => m.id_arquero === usuarioActual.id_usuario && m.estado === 'aceptado')
    .map(m => m.id_grupo);

  const misPlanificaciones = planificaciones.filter(p => 
    (p.tipo === 'individual' && p.id_arquero === usuarioActual.id_usuario) ||
    (p.tipo === 'grupo' && p.id_grupo && misGruposAceptadosIDs.includes(p.id_grupo))
  );

  const esSesionCompletada = (s: Sesion) => {
    return (s.completada_por_arqueros || []).includes(usuarioActual.id_usuario);
  };

  const misSesionesRaw = (sesionesList || []).filter(s => 
    (s.asignado_a === 'arquero' && s.id_arquero === usuarioActual.id_usuario) ||
    (s.asignado_a === 'grupo' && s.id_grupo && misGruposAceptadosIDs.includes(s.id_grupo))
  );

  const pendingCount = misSesionesRaw.filter(s => !esSesionCompletada(s)).length;
  const completedCount = misSesionesRaw.filter(s => esSesionCompletada(s)).length;
  const totalCount = misSesionesRaw.length;

  const misSesiones = misSesionesRaw.filter(s => {
    if (filtroSesion === 'pendientes') {
      return !esSesionCompletada(s);
    }
    if (filtroSesion === 'completados') {
      return esSesionCompletada(s);
    }
    return true;
  });

  misSesiones.sort((a, b) => {
    const da = a.fecha_asignada || '';
    const db = b.fecha_asignada || '';
    if (filtroSesion === 'pendientes') {
      return da.localeCompare(db); // Ascendente
    } else {
      return db.localeCompare(da); // Descendente
    }
  });

  const handleToggleSesionCompletada = (s: Sesion) => {
    if (!onUpdateSesion) return;
    const completas = s.completada_por_arqueros || [];
    const isCompleted = completas.includes(usuarioActual.id_usuario);
    
    let updatedCompleted: string[] = [];
    let calculatedArrows = 0;

    if (!isCompleted) {
      // Auto-complete ALL exercises
      updatedCompleted = s.ejercicios_ids || [];
      s.ejercicios_ids.forEach(eid => {
        const ej = ejerciciosList.find(e => e.id === eid);
        calculatedArrows += (ej?.intensidad_flechas_repeticion || 0);
      });
    } else {
      // Clear completed exercises
      updatedCompleted = [];
      calculatedArrows = 0;
    }

    const updatedCompletas = isCompleted 
      ? completas.filter(uid => uid !== usuarioActual.id_usuario)
      : [...completas, usuarioActual.id_usuario];
    
    onUpdateSesion({
      ...s,
      completada_por_arqueros: updatedCompletas,
      completada: !isCompleted && updatedCompletas.length > 0,
      ejercicios_completados_arqueros: {
        ...(s.ejercicios_completados_arqueros || {}),
        [usuarioActual.id_usuario]: updatedCompleted,
      },
      flechas_completadas_arqueros: {
        ...(s.flechas_completadas_arqueros || {}),
        [usuarioActual.id_usuario]: calculatedArrows,
      }
    });
  };

  const handleToggleEjercicioCompletado = (s: Sesion, ejId: string) => {
    if (!onUpdateSesion) return;
    
    const currentCompleted = s.ejercicios_completados_arqueros?.[usuarioActual.id_usuario] || [];
    const updatedCompleted = currentCompleted.includes(ejId)
      ? currentCompleted.filter(id => id !== ejId)
      : [...currentCompleted, ejId];
      
    // Re-calculate arrows based on completed exercises
    let totalFlechas = 0;
    s.ejercicios_ids.forEach(eid => {
      if (updatedCompleted.includes(eid)) {
        const ej = ejerciciosList.find(e => e.id === eid);
        totalFlechas += (ej?.intensidad_flechas_repeticion || 0);
      }
    });

    const updatedSesion: Sesion = {
      ...s
    };

    if (!updatedSesion.ejercicios_completados_arqueros) {
      updatedSesion.ejercicios_completados_arqueros = {};
    }
    updatedSesion.ejercicios_completados_arqueros[usuarioActual.id_usuario] = updatedCompleted;

    if (!updatedSesion.flechas_completadas_arqueros) {
      updatedSesion.flechas_completadas_arqueros = {};
    }
    updatedSesion.flechas_completadas_arqueros[usuarioActual.id_usuario] = totalFlechas;

    // If ALL exercises are completed, we can also set the whole session as completed.
    const allCompleted = s.ejercicios_ids && s.ejercicios_ids.length > 0 && s.ejercicios_ids.every(id => updatedCompleted.includes(id));
    const completas = s.completada_por_arqueros || [];
    const isSessionCompleted = completas.includes(usuarioActual.id_usuario);

    if (allCompleted && !isSessionCompleted) {
      updatedSesion.completada_por_arqueros = [...completas, usuarioActual.id_usuario];
      updatedSesion.completada = true;
    } else if (!allCompleted && isSessionCompleted) {
      updatedSesion.completada_por_arqueros = completas.filter(uid => uid !== usuarioActual.id_usuario);
      updatedSesion.completada = updatedSesion.completada_por_arqueros.length > 0;
    }

    onUpdateSesion(updatedSesion);
  };

  const handleSetFlechasReales = (s: Sesion, num: number) => {
    if (!onUpdateSesion) return;
    
    const updatedSesion: Sesion = { ...s };
    if (!updatedSesion.flechas_completadas_arqueros) {
      updatedSesion.flechas_completadas_arqueros = {};
    }
    updatedSesion.flechas_completadas_arqueros[usuarioActual.id_usuario] = Math.max(0, num);
    
    onUpdateSesion(updatedSesion);
  };

  const planesGrupales = misPlanificaciones.filter(p => p.tipo === 'grupo');
  const planesIndividuales = misPlanificaciones.filter(p => p.tipo === 'individual');

  const renderPlanCard = (p: Planificacion, deGrupo: boolean, grupoNombre: string | null) => {
    return (
      <div key={p.id} className="p-6 bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-200 rounded-2xl relative space-y-4 shadow-3xs">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                deGrupo ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-105 text-rose-850'
              }`}>
                Plan {deGrupo ? `Grupal: ${grupoNombre}` : 'Individual'}
              </span>
              {p.temporada && (
                <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-800 rounded uppercase tracking-wider border border-slate-200">
                  🧭 {p.temporada}
                </span>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-1.5">
              <Activity size={16} className="text-[#ef233c]" />
              Macrociclo: {p.macrociclo}
            </h4>
          </div>
          {(p.fecha_inicio || p.fecha_fin) && (
            <span className="text-[10px] text-slate-500 font-mono font-bold bg-white border px-2 py-0.5 rounded-lg">
              📅 {p.fecha_inicio || '---'} a {p.fecha_fin || '---'}
            </span>
          )}
        </div>

        {p.objetivos_macrociclo && (
          <div className="bg-white/80 p-3 rounded-xl border border-dashed border-indigo-150">
            <span className="block text-[9px] uppercase font-extrabold text-indigo-700 tracking-wider mb-1">Objetivos del Macrociclo</span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{p.objetivos_macrociclo}</p>
          </div>
        )}

        {/* Overview fallback boxes if list is empty */}
        {(!p.mesociclos_lista || p.mesociclos_lista.length === 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-xl border border-slate-150">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Mesociclo de Referencia</span>
              <span className="text-xs font-bold text-indigo-700">{p.mesociclo || 'General'}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-150">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Foco / Microciclo Técnico</span>
              <span className="text-xs text-slate-655 font-medium leading-relaxed block">{p.microciclo || 'Técnica de suelto y expansión'}</span>
            </div>
          </div>
        )}

        {/* Structured Mesociclos List */}
        {p.mesociclos_lista && p.mesociclos_lista.length > 0 && (
          <div className="space-y-4 pt-2">
            <h5 className="text-xs font-bold uppercase text-slate-450 tracking-wider">Mesociclos del Ciclo</h5>
            <div className="grid md:grid-cols-2 gap-4">
              {p.mesociclos_lista.map((meso) => (
                <div key={meso.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {meso.tipo_mesociclo}
                      </span>
                      <h6 className="text-xs font-bold text-slate-800 mt-1">{meso.nombre}</h6>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono font-bold whitespace-nowrap">
                      📅 {meso.fecha_inicio} a {meso.fecha_fin}
                    </span>
                  </div>

                  {/* Microciclos within the mesociclo */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-[#ef233c]">Microciclos asignados:</span>
                    {(!meso.microciclos || meso.microciclos.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic">No hay microciclos guardados.</p>
                    ) : (
                      <div className="space-y-2">
                        {meso.microciclos.map((micro) => (
                          <div key={micro.id} className="p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-mono">
                                {micro.nombre}
                              </span>
                              {micro.volumen_flechas && (
                                <span className="text-[8px] font-bold text-slate-500 font-mono">
                                  🏹 Est. {micro.volumen_flechas} flechas
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-slate-800 text-[11px] leading-tight mb-1">{micro.enfoque_principal}</p>
                            {micro.objetivos && (
                              <p className="text-[10px] text-slate-500 bg-white p-1 rounded border-l-2 border-indigo-200 italic leading-relaxed">
                                {micro.objetivos}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planned Competitions */}
        {p.competiciones && p.competiciones.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h5 className="text-xs font-bold uppercase text-slate-455 tracking-wider">Competiciones Programadas</h5>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {p.competiciones.map((c) => (
                <div key={c.id} className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5 shadow-5xs hover:border-[#ef233c] transition duration-200">
                  <div className="flex justify-between items-start flex-wrap gap-1">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                      c.importancia === 'Alta' ? 'bg-red-500 text-white' : c.importancia === 'Media' ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.importancia}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono font-bold bg-slate-50 px-1 py-0.2 rounded border">
                      {c.fecha}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {c.nombre}
                  </p>
                  {c.comentarios && (
                    <p className="text-[10px] italic text-slate-450 leading-relaxed bg-slate-50/50 p-1 rounded border">
                      {c.comentarios}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8" id="arquero_dashboard">
      
      {/* Header del Arquero */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <img 
            src={usuarioActual.fotografia_url || 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100&h=100&fit=crop'} 
            className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
            alt="foto_perfil" 
          />
          <div>
            <h2 className="text-lg font-black text-slate-800">Panel del Arquero</h2>
            <p className="text-xs text-slate-500">Bienvenido, {usuarioActual.nombre} {usuarioActual.apellidos} • Licencia: <span className="font-mono font-bold text-[#ef233c]">{usuarioActual.licencia || '---'}</span></p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg max-w-full">
          <button 
            onClick={() => setActiveTab('flechas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'flechas' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Contador Flechas
          </button>
          <button 
            onClick={() => setActiveTab('controles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'controles' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Diana de Control
          </button>
          <button 
            onClick={() => setActiveTab('diario')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'diario' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Mi Diario / Mental
          </button>
          <button 
            onClick={() => setActiveTab('planes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'planes' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Mis Planes
          </button>
          <button 
            onClick={() => setActiveTab('entrenos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'entrenos' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Mis Entrenos
          </button>
          <button 
            onClick={() => setActiveTab('grupos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'grupos' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Mis Grupos
          </button>
          <button 
            onClick={() => setActiveTab('setups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'setups' ? 'bg-[#ef233c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Configuración
          </button>
          <button 
            onClick={() => setActiveTab('ianseo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${activeTab === 'ianseo' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'} flex items-center gap-1`}
          >
            <ExternalLink size={11} />
            Ianseo Connect
          </button>
          <button 
            onClick={onLogout}
            className="px-2.5 py-1.5 hover:bg-slate-200 text-xs font-extrabold text-slate-500 rounded"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* TAB CONTADOR FLECHAS RAPIDO */}
        {activeTab === 'flechas' && (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <ContadorFlechas idArquero={usuarioActual.id_usuario} />
            </div>
            <div className="md:col-span-4 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
              <div className="text-center p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <Compass className="text-[#ef233c] mx-auto" size={24} />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Consejo Técnico FITA</h4>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  "El tiro perfecto consta de estabilidad e inercia. Procura no usar el clicker como un freno, sino como un disparador natural que se activa mediante la expansión constante de la escápula."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB DIANA INTERACTIVA */}
        {activeTab === 'controles' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                  <Target size={16} />
                  Control Oficial de Tiros (Diana Interactiva)
                </h3>
                <p className="text-[11px] text-slate-400">Guarda series estructuradas de precisión y visualiza los impactos en dianas concéntricas.</p>
              </div>
            </div>
            <DianaInteractiva idArquero={usuarioActual.id_usuario} onSaveControl={onAddControlTiro} />
          </div>
        )}

        {/* TAB DIARIO EMOCIONAL Y DE ENTRENAMIENTO */}
        {activeTab === 'diario' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Formulario Diario */}
            <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-850 flex items-center gap-1.5">
                <BookOpen className="text-[#ef233c]" size={18} />
                Añadir Entrada en Mi Diario de Tiro
              </h3>
              <p className="text-xs text-slate-400">Registra tus sensaciones mentales, clima, problemas con disparador o clicker, o apuntes físicos.</p>

              <form onSubmit={handleCrearDiario} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título de la Entrada *</label>
                  <input 
                    type="text" 
                    required
                    value={diarioTitulo}
                    onChange={(e) => setDiarioTitulo(e.target.value)}
                    placeholder="Ej. Sensación técnica a 70m - Viento racheado"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Entrada</label>
                    <select 
                      value={diarioTipo} 
                      onChange={(e) => setDiarioTipo(e.target.value as DiarioTipoEntrada)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                    >
                      <option value="Rutina mental">Rutina mental</option>
                      <option value="Pensamiento libre">Pensamiento libre</option>
                      <option value="He ayudado a otros">He ayudado a otros</option>
                      <option value="Entrenamiento">Entrenamiento</option>
                      <option value="Apunte técnico">Apunte técnico</option>
                      <option value="Apunte material">Apunte material</option>
                      <option value="Apunte físico">Apunte físico</option>
                      <option value="Antes de la competición">Antes de la competición</option>
                      <option value="Durante la Competición">Durante la Competición</option>
                      <option value="Después de la competición">Después de la competición</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Privacidad del Diario</label>
                    <select 
                      value={diarioPrivacidad} 
                      onChange={(e) => setDiarioPrivacidad(e.target.value as DiarioPrivacidad)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                    >
                      <option value="privada">Privada (Solo mía)</option>
                      <option value="visible_tecnicos">Compartido con Técnicos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ánimo / Foco</label>
                    <select 
                      value={diarioAnimo} 
                      onChange={(e) => setDiarioAnimo(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                    >
                      <option value="Excelente">Excelente / Focalizado</option>
                      <option value="Motivado">Motivado</option>
                      <option value="Calmado">Calmado</option>
                      <option value="Cansado">Cansado</option>
                      <option value="Frustrado">Frustrado con Clicker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Energía / Fatiga: {diarioEnergia}/10</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={diarioEnergia}
                      onChange={(e) => setDiarioEnergia(Number(e.target.value))}
                      className="w-full accent-[#ef233c] cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enlazar archivo / Imagen (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    value={diarioArchivo}
                    onChange={(e) => setDiarioArchivo(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Anotaciones del Diario *</label>
                  <textarea 
                    required
                    rows={4}
                    value={diarioCuerpo}
                    onChange={(e) => setDiarioCuerpo(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="Escribe hoy tus sensaciones técnicas detalladas aquí..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-sm"
                >
                  Guardar en Mi Diario
                </button>
              </form>
            </div>

            {/* Listado de Entradas guardadas */}
            <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-800">Mi Historial Reciente de Diario</h3>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {misDiarios.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Tu diario está vacío de momento. Añade un apunte arriba.</p>
                ) : (
                  misDiarios.map((d) => (
                    <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{d.fecha}</span>
                        <div className="flex gap-1.5">
                          <span className="text-[9px] bg-red-100 text-[#ef233c] font-bold px-2 py-0.5 rounded">
                            {d.tipo_entrada}
                          </span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-805 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            {d.privacidad === 'privada' ? <EyeOff size={10} /> : <Eye size={10} />}
                            {d.privacidad}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-800">{d.titulo}</h4>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans">
                        Ánimo: <span className="font-semibold text-slate-700">{d.estado_animo}</span> • Energía: <span className="font-bold text-amber-600">{d.nivel_energia_cansancio}/10</span>
                      </p>

                      {/* Espacio para la respuesta del técnico */}
                      <div className="pt-2.5 border-t border-slate-200 mt-2 text-xs">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-1">Feedback de tu Entrenador:</span>
                        {d.anotaciones_tecnico ? (
                          <p className="p-2 bg-indigo-50 text-indigo-900 rounded-lg italic font-medium">"{d.anotaciones_tecnico}"</p>
                        ) : (
                          <p className="p-1 px-2.5 bg-slate-100 text-slate-400 rounded text-[11px] italic">Esperando que el cuerpo técnico revise tu diario...</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
               {/* TAB PLANES DE ENTRENAMIENTO EXCLUSIVOS */}
        {activeTab === 'planes' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                <Calendar className="text-[#ef233c]" size={20} />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Tu Planificación Deportiva / Macrociclos</h3>
                  <p className="text-xs text-slate-400">Visualiza los macrociclos, mesociclos y microciclos técnicos activos asignados a ti de forma individual o grupal.</p>
                </div>
              </div>

              {/* SECCIÓN: PLANIFICACIONES GRUPALES */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-805 uppercase tracking-wider bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                  <span>👥</span> Planificaciones de los Grupos en los que estás ({planesGrupales.length})
                </h4>
                {planesGrupales.length === 0 ? (
                  <p className="text-xs text-slate-450 italic bg-slate-50 rounded-lg p-3 text-center border border-dashed">
                    No tienes planes asignados de forma grupal actualmente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {planesGrupales.map((p) => {
                      const deGrupo = p.tipo === 'grupo';
                      const grupoNombre = deGrupo && p.id_grupo 
                        ? (gruposList.find(g => g.id === p.id_grupo)?.nombre_grupo || 'Tu Grupo')
                        : null;
                      return renderPlanCard(p, deGrupo, grupoNombre);
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN: PLANIFICACIONES INDIVIDUALES */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-rose-850 uppercase tracking-wider bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-2">
                  <span>👤</span> Planificaciones Individuales / Personalizadas ({planesIndividuales.length})
                </h4>
                {planesIndividuales.length === 0 ? (
                  <p className="text-xs text-slate-450 italic bg-slate-50 rounded-lg p-3 text-center border border-dashed">
                    No tienes planes individuales asignados actualmente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {planesIndividuales.map((p) => {
                      const deGrupo = p.tipo === 'grupo';
                      const grupoNombre = deGrupo && p.id_grupo 
                        ? (gruposList.find(g => g.id === p.id_grupo)?.nombre_grupo || 'Tu Grupo')
                        : null;
                      return renderPlanCard(p, deGrupo, grupoNombre);
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB SESIONES DE ENTRENAMIENTO Y EJERCICIOS */}
        {activeTab === 'entrenos' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 w-full bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                <Target className="text-[#ef233c]" size={20} />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Tus Sesiones de Entrenamiento / Entrenos</h3>
                  <p className="text-xs text-slate-450">Marca el progreso de tus entrenamientos programados. Indica si has completado o no cada una de las sesiones.</p>
                </div>
              </div>

              {/* Sesiones de Entrenamiento Asignadas */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Sesiones Programadas ({misSesiones.length})
                  </span>
                  
                  {/* Selector de Filtros de Sesiones */}
                  <div className="flex bg-slate-150/80 p-1 rounded-xl w-fit gap-1 self-start sm:self-auto border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setFiltroSesion('todos')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${
                        filtroSesion === 'todos' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      Todas ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroSesion('pendientes')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${
                        filtroSesion === 'pendientes' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      ⚠️ Pendientes ({pendingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroSesion('completados')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${
                        filtroSesion === 'completados' 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      🟢 Completadas ({completedCount})
                    </button>
                  </div>
                </div>
                
                {misSesiones.length === 0 ? (
                  <p className="text-xs text-slate-450 italic bg-slate-50 border p-6 text-center rounded-xl border-dashed">
                    {filtroSesion === 'pendientes' 
                      ? '🎉 ¡Al día! No tienes entrenamientos pendientes actualmente.'
                      : filtroSesion === 'completados'
                      ? 'Aún no has completado entrenamientos. ¡Marca ejercicios de tus sesiones para completarlas!'
                      : 'No tienes sesiones de entrenamiento específicas programadas a tu nombre o grupo.'}
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-5">
                    {misSesiones.map((s) => {
                      const grupoName = s.asignado_a === 'grupo' 
                        ? (gruposList.find(g => g.id === s.id_grupo)?.nombre_grupo || 'Tu Grupo')
                        : null;
                      
                      const completada = esSesionCompletada(s);

                      const totalFlechasSesion = s.ejercicios_ids?.reduce((acc, eid) => {
                        const ej = ejerciciosList.find(e => e.id === eid);
                        return acc + (ej?.intensidad_flechas_repeticion || 0);
                      }, 0) || 0;
                      
                      return (
                        <div 
                          key={s.id} 
                          className={`border rounded-2xl p-5 shadow-3xs space-y-4 transition-all duration-200 flex flex-col justify-between ${
                            completada 
                              ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400' 
                              : 'bg-slate-50/50 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  s.tipo_entrenamiento === 'Técnico' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : s.tipo_entrenamiento === 'Físico'
                                    ? 'bg-green-100 text-green-800'
                                    : s.tipo_entrenamiento === 'Psicológico'
                                    ? 'bg-purple-100 text-[#6f42c1]'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  Entrenamiento {s.tipo_entrenamiento}
                                </span>
                                <h4 className="font-extrabold text-xs text-slate-800 mt-1.5 leading-snug">{s.titulo}</h4>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border">{s.fecha_asignada}</span>
                                {grupoName && (
                                  <span className="text-[9px] text-indigo-700 font-bold bg-indigo-55 px-1.5 py-0.5 rounded inline-block mt-1">
                                    {grupoName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {s.comentarios && (
                              <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-150 leading-relaxed">
                                &ldquo;{s.comentarios}&rdquo;
                              </p>
                            )}

                            <div className="space-y-2">
                              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                Ejercicios asignados ({s.ejercicios_ids?.length || 0}) • Pulsa para completar:
                              </span>
                              {s.ejercicios_ids && s.ejercicios_ids.filter(eid => ejerciciosList.some(e => e.id === eid)).length > 0 ? (
                                <div className="space-y-1.55">
                                  {s.ejercicios_ids.map(eid => {
                                    const ej = ejerciciosList.find(e => e.id === eid);
                                    if (!ej) return null;
                                    const ejCompletado = (s.ejercicios_completados_arqueros?.[usuarioActual.id_usuario] || []).includes(ej.id);
                                    
                                    return (
                                      <div 
                                        key={eid} 
                                        onClick={() => handleToggleEjercicioCompletado(s, ej.id)}
                                        className={`text-xs p-2.5 rounded-lg border flex justify-between items-center shadow-4xs transition duration-150 cursor-pointer ${
                                          ejCompletado 
                                            ? 'bg-emerald-50/40 border-emerald-250 hover:bg-emerald-50' 
                                            : 'bg-white border-slate-200 hover:border-indigo-200'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                                          <div
                                            className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                              ejCompletado 
                                                ? 'bg-emerald-600 border-transparent text-white scale-105' 
                                                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                                            }`}
                                          >
                                            {ejCompletado && <Check size={11} className="stroke-[3.5px]" />}
                                          </div>
                                          <div className="min-w-0">
                                            <p className={`font-bold transition-all ${ejCompletado ? 'text-slate-450 line-through' : 'text-slate-700'}`}>{ej.nombre}</p>
                                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{ej.descripcion}</p>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-0.5">
                                          <p className="font-mono text-[10px] font-bold text-slate-500 flex items-center justify-end gap-1">
                                            <Clock size={11} className="text-slate-450" />
                                            {ej.duracion} min
                                          </p>
                                          <p className="font-mono text-[10px] text-indigo-700 font-bold">
                                            🏹 {ej.intensidad_flechas_repeticion} f.
                                          </p>
                                          <p className="font-mono text-[9px] text-[#ef233c] font-black">{ej.densidad_repeticiones}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-455 italic">No hay ejercicios asignados a esta sesión.</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
                            {/* Panel horizontal de flechas y progresos */}
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              {/* Conteos dinámicos */}
                              <div className="flex items-center gap-3 text-[10px] flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-medium">Intensidad planificada:</span>
                                  <span className="font-extrabold font-mono text-[#ef233c] bg-red-50 p-0.5 px-2 rounded-md border-red-100 border">{s.intensidad}%</span>
                                </div>
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase flex items-center gap-1">
                                  🎯 Planificado: {totalFlechasSesion} flechas
                                </span>
                                {(() => {
                                  const completedQty = (s.ejercicios_completados_arqueros?.[usuarioActual.id_usuario] || []).length;
                                  const totalQty = s.ejercicios_ids?.length || 0;
                                  const flechasCompletadas = s.flechas_completadas_arqueros?.[usuarioActual.id_usuario] ?? 0;
                                  
                                  return (
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase flex items-center gap-1 border ${
                                      flechasCompletadas === totalFlechasSesion && totalFlechasSesion > 0
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                                    }`}>
                                      🏹 Completado: {flechasCompletadas} / {totalFlechasSesion} f. ({completedQty}/{totalQty} ej)
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Ajuste manual de flechas completadas */}
                              {(() => {
                                const flechasCompletadas = s.flechas_completadas_arqueros?.[usuarioActual.id_usuario] ?? 0;
                                return (
                                  <div className="flex items-center gap-2 py-1 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                                    <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wide">Ajuste Flechas:</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSetFlechasReales(s, flechasCompletadas - 6)}
                                        className="text-slate-400 hover:text-[#ef233c] font-black text-xs px-1 cursor-pointer transition-colors"
                                        title="Restar una tanda de 6 flechas"
                                      >
                                        -6
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetFlechasReales(s, flechasCompletadas - 1)}
                                        className="text-slate-400 hover:text-[#ef233c] font-black text-xs px-1 cursor-pointer transition-colors"
                                        title="Restar 1 flecha"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        value={flechasCompletadas}
                                        onChange={(e) => handleSetFlechasReales(s, parseInt(e.target.value) || 0)}
                                        className="w-10 text-center text-xs font-mono font-bold text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSetFlechasReales(s, flechasCompletadas + 1)}
                                        className="text-slate-400 hover:text-emerald-600 font-bold text-xs px-1 cursor-pointer transition-colors"
                                        title="Sumar 1 flecha"
                                      >
                                        +
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetFlechasReales(s, flechasCompletadas + 6)}
                                        className="text-slate-400 hover:text-emerald-600 font-bold text-xs px-1 cursor-pointer transition-colors"
                                        title="Sumar una tanda de 6 flechas"
                                      >
                                        +6
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <span className="text-[10px] text-slate-400 italic">Cada ejercicio completado registra flechas automáticamente. Puedes reajustarlas libremente.</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* EXPORT TO PDF BUTTON */}
                              <button
                                onClick={() => {
                                  const nameToPass = grupoName ? `${usuarioActual.nombre} (${grupoName})` : usuarioActual.nombre;
                                  generateSessionPDF(s, ejerciciosList, nameToPass, usuariosList);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 hover:border-indigo-100 transition duration-150 cursor-pointer shadow-3xs"
                                title="Imprimir / Guardar como PDF"
                              >
                                <Printer size={13} />
                                <span>Imprimir</span>
                              </button>

                              {/* TOGGLE WORKOUT COMPLETION BUTTON */}
                              <button
                                onClick={() => handleToggleSesionCompletada(s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 duration-200 ${
                                  completada 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200'
                                }`}
                              >
                              {completada ? (
                                <>
                                  <Check size={14} className="stroke-[3px]" />
                                  ✓ Completado
                                </>
                              ) : (
                                <>
                                  <div className="w-2.5 h-2.5 rounded-full border border-slate-400" />
                                  Marcar como Completado
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>

              {/* Ejercicios del Club Sugeridos */}
              <div className="pt-6 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Rutinas de Ejercicios del Club a Practicar</span>
                <div className="grid md:grid-cols-2 gap-4">
                  {ejerciciosList.map((ej) => (
                    <div key={ej.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-white transition flex justify-between items-start shadow-4xs">
                      <div className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 p-0.5 px-1.5 rounded uppercase">{ej.tipo_ejercicio}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-0.5">
                            <Clock size={11} /> {ej.duracion} min
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">{ej.nombre}</h4>
                        <p className="text-xs text-slate-500 leading-normal">{ej.descripcion}</p>
                        <p className="text-[10px] text-[#ef233c] font-black pt-1">Densidad: {ej.densidad_repeticiones}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB BUSCAR GRUPOS DE ENTRENAMIENTO */}
        {activeTab === 'grupos' && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="text-[#ef233c]" size={18} />
                  Buscador de Grupos y Escuelas Técnicas
                </h3>
                <p className="text-xs text-slate-405">Localiza y postula una solicitud formal de admisión al grupo que prefieras.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Buscar escuela, modalidad..."
                  value={buscarGrupoTerm}
                  onChange={(e) => setBuscarGrupoTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gruposFiltrados.map((g) => {
                const status = getGrupoEstado(g.id);
                return (
                  <div key={g.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-850 text-sm">{g.nombre_grupo}</h4>
                      <p className="text-xs text-slate-500 mb-4">Instructor: <strong>{g.nombre_tecnico || 'Delegado Técnico'}</strong></p>
                    </div>

                    <div className="pt-3 border-t flex justify-between items-center text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-450">FITA Certificado</span>
                      {status === 'aceptado' ? (
                        <span className="text-[9px] bg-teal-100 text-teal-800 font-extrabold p-1 px-2.5 rounded uppercase">
                          Aceptado / Miembro
                        </span>
                      ) : status === 'pendiente_solicitud' ? (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold p-1 px-2.5 rounded uppercase">
                          Pendiente de Aprobación
                        </span>
                      ) : (
                        <button
                          onClick={() => onApplyGrupo(g.id)}
                          className="px-3 py-1 bg-[#ef233c] hover:bg-[#d90429] text-white text-[10px] font-bold uppercase rounded shadow-xs active:scale-95 transition"
                        >
                          Solicitar Unirse
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB SETUPS DE DISTANCIA DEL VISOR */}
        {activeTab === 'setups' && (
          <div className="space-y-6">
            {/* Header de Configuración */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Settings size={16} className="text-[#ef233c]" />
                  Configuración Deportiva del Arquero
                </h3>
                <p className="text-[11px] text-slate-500">Administra tus marcas mecánicas del visor, objetivos de enfoque mental, rutinas técnicas de tiro y equipamiento.</p>
              </div>
              
              {/* Selector de Apartados */}
              <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1 border border-slate-300/30 self-start sm:self-center flex-wrap">
                <button
                  onClick={() => { setActiveConfigTab('visor'); handleCancelEdit(); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeConfigTab === 'visor' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  🎯 Visor
                </button>
                <button
                  onClick={() => { setActiveConfigTab('objetivo_mental'); handleCancelEdit(); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeConfigTab === 'objetivo_mental' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  🧠 Objetivo Mental
                </button>
                <button
                  onClick={() => { setActiveConfigTab('rutinas'); handleCancelEdit(); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeConfigTab === 'rutinas' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  📋 Rutinas
                </button>
                <button
                  onClick={() => { setActiveConfigTab('material'); handleCancelEdit(); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeConfigTab === 'material' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  🛠️ Material
                </button>
              </div>
            </div>

            {/* SECCIÓN 1: CONFIGURACIÓN DE VISOR */}
            {activeConfigTab === 'visor' && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Formulario */}
                <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2">
                    {editingSetupId ? '✏️ Editar Marca de Visor' : '➕ Configurar Nueva Marca de Visor'}
                  </h4>
                  <form onSubmit={handleSaveVisor} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Distancia de Diana</label>
                      <select 
                        value={visorDistancia} 
                        onChange={(e) => setVisorDistancia(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                      >
                        <option value="12m">12 metros (Escuela)</option>
                        <option value="15m">15 metros</option>
                        <option value="18m">18 metros (Sala)</option>
                        <option value="30m">30 metros (Iniciación)</option>
                        <option value="40m">40 metros</option>
                        <option value="50m">50 metros (Compuesto)</option>
                        <option value="60m">60 metros (Cadete)</option>
                        <option value="70m">70 metros (Olímpico)</option>
                        <option value="90m">90 metros (Larga Distancia)</option>
                        <option value="Otro">⚙️ Otro (Especificar...)</option>
                      </select>
                    </div>

                    {visorDistancia === 'Otro' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Especificar Distancia Personalizada</label>
                        <input
                          type="text"
                          required
                          value={visorDistanciaOtro}
                          onChange={(e) => setVisorDistanciaOtro(e.target.value)}
                          placeholder="Ej. 25m, Recorrido Campo, bosque..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medida del Visor (Número / Altura)</label>
                      <input 
                        type="text" 
                        required
                        value={visorMedida}
                        onChange={(e) => setVisorMedida(e.target.value)}
                        placeholder="Ej. 5.4 o 4.85"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Potencia en Palas (Libras / Opcional)</label>
                      <input 
                        type="text" 
                        value={visorLibras}
                        onChange={(e) => setVisorLibras(e.target.value)}
                        placeholder="Ej. 40 lbs o 38#"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivo / Enfoque Mental Específico (Opcional)</label>
                      <textarea 
                        rows={2}
                        value={visorObjetivoMental}
                        onChange={(e) => setVisorObjetivoMental(e.target.value)}
                        placeholder="Ej. Sentir el clíker sobre la punta, alineación ocular con la fibra..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                      >
                        {editingSetupId ? 'Actualizar Visor' : 'Guardar Visor'}
                      </button>
                      {editingSetupId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                    <span>Marcas de Visor Registradas</span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal">({misSetups.filter(s => s.tipo === 'setup').length} registradas)</span>
                  </h4>
                  
                  <div className="grid sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {misSetups.filter(s => s.tipo === 'setup').length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 col-span-2">No tienes marcas de visor registradas aún.</p>
                    ) : (
                      misSetups.filter(s => s.tipo === 'setup').map((s) => (
                        <div key={s.id} className="p-3.5 bg-slate-50/70 border border-slate-150 rounded-xl hover:border-indigo-200 transition relative">
                          <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded absolute top-3 right-3">
                            {s.datos_json.distancia}
                          </span>
                          
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Distancia</p>
                          <div className="mt-1 text-xs space-y-1">
                            <p className="text-slate-700">🎯 Visor: <span className="font-mono font-black text-rose-600 text-sm">{s.datos_json.visor}</span></p>
                            {s.datos_json.libras && <p className="text-[10px] text-slate-500">💪 Potencia: {s.datos_json.libras}</p>}
                            {s.datos_json.objetivo_mental && <p className="text-[10px] text-slate-400 italic">"{s.datos_json.objetivo_mental}"</p>}
                          </div>

                          <div className="flex gap-2.5 mt-3 pt-2 border-t border-slate-200 justify-end">
                            <button
                              onClick={() => handleEditClick(s)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if(confirm('¿Seguro que deseas eliminar esta marca de visor?')) {
                                  onRemoveSetup?.(s.id);
                                }
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 2: CONFIGURACIÓN DE OBJETIVO MENTAL */}
            {activeConfigTab === 'objetivo_mental' && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Formulario */}
                <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2">
                    {editingSetupId ? '✏️ Editar Objetivo Mental' : '➕ Definir Objetivo Mental'}
                  </h4>
                  <form onSubmit={handleSaveObjetivoMental} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción del Objetivo Mental</label>
                      <textarea 
                        required
                        rows={4}
                        value={objetivoMentalText}
                        onChange={(e) => setObjetivoMentalText(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed"
                        placeholder="Ej. Mantener los hombros bajos y alinear el punto de mira con el amarillo de forma rítmica..."
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                      >
                        {editingSetupId ? 'Actualizar Objetivo' : 'Guardar Objetivo'}
                      </button>
                      {editingSetupId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                    <span>Objetivos Mentales Disponibles</span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal">({misSetups.filter(s => s.tipo === 'objetivo_mental').length} definidos)</span>
                  </h4>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {misSetups.filter(s => s.tipo === 'objetivo_mental').length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10">No tienes objetivos mentales configurados todavía.</p>
                    ) : (
                      misSetups.filter(s => s.tipo === 'objetivo_mental').map((s) => (
                        <div key={s.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-xl transition">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs text-slate-550 bg-indigo-50/50 p-1 px-2 rounded border border-indigo-100 font-bold uppercase font-mono text-[9px] tracking-wider shrink-0">
                              🧠 ID: {s.id.slice(-5)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 font-medium italic mt-2.5 leading-relaxed bg-white p-2.5 border border-slate-200 rounded-lg">
                            &ldquo;{s.datos_json.objetivo}&rdquo;
                          </p>

                          <div className="flex gap-2 mt-2 justify-end font-semibold">
                            <button
                              onClick={() => handleEditClick(s)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if(confirm('¿Seguro que deseas eliminar este objetivo mental? Las rutinas que lo usen quedarán desvinculadas.')) {
                                  onRemoveSetup?.(s.id);
                                }
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 3: CONFIGURACIÓN DE RUTINAS */}
            {activeConfigTab === 'rutinas' && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Formulario */}
                <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2">
                    {editingSetupId ? '✏️ Editar Rutina Técnica' : '➕ Configurar Nueva Rutina'}
                  </h4>
                  
                  <form onSubmit={handleSaveRutina} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre de la Rutina</label>
                      <input 
                        type="text" 
                        required
                        value={rutinaNombre}
                        onChange={(e) => setRutinaNombre(e.target.value)}
                        placeholder="Ej. Rutina de Calentamiento / Foco con Clicker"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción de la Rutina</label>
                      <textarea 
                        required
                        rows={3}
                        value={rutinaDescripcion}
                        onChange={(e) => setRutinaDescripcion(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed"
                        placeholder="Describe detalladamente los pasos físicos y mecánicos de la rutina..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asignar Objetivo Mental Asociado</label>
                      <select
                        value={rutinaObjId}
                        onChange={(e) => setRutinaObjId(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                      >
                        <option value="">-- Ninguno o Sin vincular --</option>
                        {misSetups.filter(s => s.tipo === 'objetivo_mental').map((o) => (
                          <option key={o.id} value={o.id}>
                            🧠 {o.datos_json.objetivo.substring(0, 50)}...
                          </option>
                        ))}
                      </select>
                      {misSetups.filter(s => s.tipo === 'objetivo_mental').length === 0 && (
                        <p className="text-[9px] text-amber-600 mt-1">⚠️ No has definido ningún objetivo mental en el apartado correspondiente todavía.</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                      >
                        {editingSetupId ? 'Actualizar Rutina' : 'Guardar Rutina'}
                      </button>
                      {editingSetupId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                    <span>Rutinas Técnicas Registradas</span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal">({misSetups.filter(s => s.tipo === 'rutina').length} rutinas)</span>
                  </h4>

                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {misSetups.filter(s => s.tipo === 'rutina').length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10">No hay rutinas técnicas registradas.</p>
                    ) : (
                      misSetups.filter(s => s.tipo === 'rutina').map((s) => {
                        // Buscar el objetivo mental asignado para mostrarlo
                        const objAsignado = misSetups.find(obj => obj.id === s.datos_json.objetivo_mental_id);
                        return (
                          <div key={s.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-xl space-y-2">
                            <h5 className="font-extrabold text-slate-800 text-xs text-indigo-700">
                              📋 {s.datos_json.nombre}
                            </h5>
                            
                            <p className="text-xs text-slate-600 leading-relaxed font-sans mt-1 bg-white p-2.5 border border-slate-200 rounded-md">
                              {s.datos_json.descripcion}
                            </p>

                            {objAsignado ? (
                              <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 border border-amber-200 rounded-lg">
                                <span className="font-extrabold text-amber-800 uppercase block text-[9px] tracking-wide mb-0.5">🧠 Objetivo Mental Asociado:</span>
                                &ldquo;{objAsignado.datos_json.objetivo}&rdquo;
                              </div>
                            ) : s.datos_json.objetivo_mental_id ? (
                              <div className="text-[10px] text-slate-400 bg-red-50 p-1 px-2 border border-red-150 rounded italic whitespace-normal">
                                ⚠️ El objetivo mental asociado ya no existe.
                              </div>
                            ) : null}

                            <div className="flex gap-2 pt-1 border-t border-slate-100 justify-end">
                              <button
                                onClick={() => handleEditClick(s)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  if(confirm('¿Seguro que deseas eliminar esta rutina técnica?')) {
                                    onRemoveSetup?.(s.id);
                                  }
                                }}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 4: CONFIGURACIÓN DE MATERIAL */}
            {activeConfigTab === 'material' && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Formulario */}
                <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2">
                    {editingSetupId ? '✏️ Editar Componente de Material' : '➕ Registrar Nuevo Componente'}
                  </h4>
                  
                  <form onSubmit={handleSaveMaterial} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Material</label>
                      <select
                        value={materialTipo}
                        onChange={(e) => setMaterialTipo(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                      >
                        <option value="Cuerpo">🏹 Cuerpo (Riser)</option>
                        <option value="Palas">💪 Palas (Limbs)</option>
                        <option value="Visor">🎯 Visor (Sight)</option>
                        <option value="Índice">📏 Índice (Peep / Clícker / Visor Pin)</option>
                        <option value="Reposaflechas">🪵 Reposaflechas (Rest)</option>
                        <option value="Botón">🔘 Botón Presión (Plunger)</option>
                        <option value="Otro">⚙️ Otro (Especifique...)</option>
                      </select>
                    </div>

                    {materialTipo === 'Otro' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Especificar Tipo de Material</label>
                        <input
                          type="text"
                          required
                          value={materialTipoOtro}
                          onChange={(e) => setMaterialTipoOtro(e.target.value)}
                          placeholder="Ej. Estabilización, Cuerda, Dragonera..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre / Modelo / Marca del Material</label>
                      <input 
                        type="text" 
                        required
                        value={materialNombre}
                        onChange={(e) => setMaterialNombre(e.target.value)}
                        placeholder="Ej. Hoyt Formula XD"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Especificaciones y Características del Material</label>
                      <textarea 
                        required
                        rows={4}
                        value={materialEspecificaciones}
                        onChange={(e) => setMaterialEspecificaciones(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed"
                        placeholder="Ej. Talla 25 pulgadas, color negro mate. Ajustes de clicks del botón. Libras de tensión reales, etc."
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
                      >
                        {editingSetupId ? 'Actualizar Material' : 'Guardar Material'}
                      </button>
                      {editingSetupId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                    <span>Inventario de Material de Tiro</span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal">({misSetups.filter(s => s.tipo === 'material').length} componentes)</span>
                  </h4>

                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {misSetups.filter(s => s.tipo === 'material').length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-10">No has registrado ningún material deportivo todavía.</p>
                    ) : (
                      misSetups.filter(s => s.tipo === 'material').map((s) => (
                        <div key={s.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-xl space-y-2">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🛡️ {s.datos_json.tipo_material}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-semibold">ID: {s.id.slice(-5)}</span>
                          </div>
                          
                          <h5 className="font-extrabold text-slate-805 text-sm">
                            {s.datos_json.nombre}
                          </h5>
                          
                          {s.datos_json.especificaciones && (
                            <div className="text-xs text-slate-600 bg-white p-2.5 border border-slate-200 rounded-md">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Especificaciones & Ajustes:</span>
                              <p className="leading-relaxed whitespace-pre-wrap font-sans text-slate-705">{s.datos_json.especificaciones}</p>
                            </div>
                          )}

                          <div className="flex gap-2.5 pt-2 border-t border-slate-150 justify-end font-semibold">
                            <button
                              onClick={() => handleEditClick(s)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if(confirm('¿Seguro que deseas eliminar este material deportivo de tu inventario?')) {
                                  onRemoveSetup?.(s.id);
                                }
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                            >
                              Eliminar
                            </button>
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

        {/* TAB IANSEO CONNECT ATLETAS SCRAPING */}
        {activeTab === 'ianseo' && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-150">
              <Compass className="text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-slate-805">Integración / Scraping Oficial Atletas Ianseo</h3>
                <p className="text-xs text-slate-400">Consulta resultados e historiales de torneos homologados FITA en ianseo.net mediante número de licencia federativa.</p>
              </div>
            </div>

            <form onSubmit={handleIanseoScrape} className="grid sm:grid-cols-3 gap-3 bg-slate-50 p-4 border rounded-xl items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Licencia de Tiro con Arco</label>
                <input 
                  type="text" 
                  value={ianseoLicencia}
                  onChange={(e) => setIanseoLicencia(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono"
                  placeholder="Ej. 71992A"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isScraping}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition h-9 disabled:opacity-50"
                >
                  {isScraping ? 'Conectando con ianseo.net/TourList.php...' : 'Buscar Atleta & Extraer Puntuaciones FITA'}
                </button>
              </div>
            </form>

            {ianseoData && (
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <div>
                    <h4 className="font-black text-slate-800 text-base">{ianseoData.arquero}</h4>
                    <p className="text-xs text-slate-400">Club Sincronizado: {ianseoData.club} • Licencia: {ianseoData.licencia}</p>
                  </div>
                  <span className="text-[9px] bg-red-100 text-[#ef233c] font-bold px-2 py-0.5 rounded self-center">
                    PASARELA OFICIAL
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Torneos recientes homologados de tiro del deportista:</span>
                  <div className="space-y-2.5">
                    {ianseoData.eventos.map((e: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{e.torneo}</p>
                          <p className="text-[10px] text-slate-400">Categoría: {e.modalidad}</p>
                        </div>
                        <div className="text-right text-xs mt-1 sm:mt-0">
                          <p className="font-extrabold text-emerald-600">{e.ranking}</p>
                          <p className="text-[10px] text-slate-500 font-mono italic">{e.puntuacion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
