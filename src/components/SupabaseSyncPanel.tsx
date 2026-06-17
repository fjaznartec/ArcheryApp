import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, pushAllToSupabase, pullFromSupabase, SyncStatus } from '../lib/supabaseSync';
import { SUAPBASE_SQL_SCHEMA } from '../db/supabase-schema';
import { Database, RefreshCw, CheckCircle, XCircle, Copy, AlertCircle, Sparkles, Server } from 'lucide-react';
import { Usuario, GrupoEntrenamiento, MiembroGrupo, Planificacion, Ejercicio, Sesion, DiarioEntrada, ControlTiro, SetupRutina, ImpactoFlecha } from '../types';

interface SupabaseSyncPanelProps {
  // Pass current local states so they can be pushed or pulled
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
  // Callback when pulled data should overwrite/merge local states
  onSyncDataRetrieved?: (data: {
    usuarios?: Usuario[];
    setups?: SetupRutina[];
    diarios?: DiarioEntrada[];
    controles?: ControlTiro[];
    noticias?: any[];
  }) => void;
}

export default function SupabaseSyncPanel({
  usuarios,
  noticias,
  grupos,
  miembros,
  planificaciones,
  ejercicios,
  sesiones,
  diarios,
  controles,
  setups,
  onSyncDataRetrieved
}: SupabaseSyncPanelProps) {
  const [status, setStatus] = useState<SyncStatus>({
    connected: false,
    tablesVerified: {},
    loading: true
  });
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    const connectionStatus = await checkSupabaseConnection();
    setStatus(connectionStatus);
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUAPBASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushData = async () => {
    setSyncing(true);
    setSyncResult(null);

    // Retrieve full impactos from localStorage to include in the backup payload
    let localImpactos: ImpactoFlecha[] = [];
    try {
      const sImps = localStorage.getItem('archery_impactos');
      if (sImps) {
        localImpactos = JSON.parse(sImps);
      }
    } catch (e) {
      console.error(e);
    }

    const res = await pushAllToSupabase({
      usuarios,
      noticias,
      grupos,
      miembros,
      planificaciones,
      ejercicios,
      sesiones,
      diarios,
      controles,
      setups,
      impactos: localImpactos
    });

    setSyncing(false);
    if (res.success) {
      setSyncResult({
        success: true,
        message: '¡Datos locales sincronizados exitosamente con tu base de datos Supabase! Todas las tablas fueron alimentadas.'
      });
      // Recheck tables to update checkboxes
      testConnection();
    } else {
      setSyncResult({
        success: false,
        message: `Fallo de sincronización: ${res.error}. ¿Verificaste si creaste las tablas en la consola SQL de Supabase?`
      });
    }
  };

  const handlePullData = async () => {
    if (!onSyncDataRetrieved) return;
    setSyncing(true);
    setSyncResult(null);

    const res = await pullFromSupabase();
    setSyncing(false);

    if (res.success && res.data) {
      onSyncDataRetrieved(res.data);
      setSyncResult({
        success: true,
        message: '¡Datos cargados con éxito desde Supabase! Las colecciones locales de tu app han sido actualizadas.'
      });
    } else {
      setSyncResult({
        success: false,
        message: `Error al obtener información: ${res.error}`
      });
    }
  };

  // Helper to format table verification
  const verifiedTablesList = Object.entries(status.tablesVerified);
  const activeTablesCount = verifiedTablesList.filter(([_, exists]) => exists).length;
  const totalTables = verifiedTablesList.length;

  return (
    <div id="supabase-sync-panel" className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 max-w-4xl mx-auto my-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100">Enlace a Supabase Activo</h3>
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                Archery_App
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Enlazado a la dirección: <span className="font-mono text-[11px] text-indigo-300">https://bcjzhohbrkvyaojwogvk.supabase.co</span></p>
          </div>
        </div>

        <button 
          onClick={testConnection}
          disabled={status.loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg active:scale-95 transition disabled:opacity-50 font-bold"
        >
          <RefreshCw size={12} className={status.loading ? 'animate-spin' : ''} />
          Refrescar Conexión
        </button>
      </div>

      {/* Estado del Enlace */}
      <div className="grid md:grid-cols-12 gap-5 items-stretch">
        
        {/* Info & Controles */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  CONECTOR ONLINE
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-black bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  ERROR DE ENLACE
                </div>
              )}
              
              <div className="text-slate-400 text-xs font-semibold">
                Tablas creadas: <strong className="text-slate-100">{activeTablesCount} / {totalTables}</strong>
              </div>
            </div>

            {status.error ? (
              <div className="bg-rose-950/40 text-rose-300 border border-rose-900/40 rounded-lg p-3 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Incidencia detectada:</p>
                <code className="block leading-relaxed font-mono text-[10px] whitespace-pre-wrap">{status.error}</code>
              </div>
            ) : activeTablesCount === 0 ? (
              <div className="bg-amber-950/30 text-amber-300 border border-amber-900/30 rounded-lg p-3 text-xs leading-relaxed space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">⚠️ Tablas no inicializadas todavía:</p>
                <p>La conexión contra tu servidor Supabase funciona perfectamente, pero no se han encontrado las tablas del esquema en tu base de datos postgres.</p>
                <p className="text-[11px] text-slate-300 bg-amber-955/40 p-1.5 rounded font-medium">
                  Para proceder, despliega la pestaña morada de abajo, copia el script SQL y pégalo en el editor SQL de Supabase (SQL Editor › New Query › Run).
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                ¡Tu base de datos está completamente lista! Puedes subir tu historial local de tiro y configuraciones para respaldarlos permanentemente en la nube, o descargarlos.
              </p>
            )}
          </div>

          {/* Botoneras de Acción de Sync */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handlePushData}
              disabled={syncing || !status.connected}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500/35 rounded-xl transition font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:hover:bg-indigo-655"
            >
              <Server size={14} />
              {syncing ? 'Sincronizando...' : 'Subir Copia a Supabase'}
            </button>
            
            <button
              onClick={handlePullData}
              disabled={syncing || !status.connected || activeTablesCount === 0}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-100 border border-slate-700 rounded-xl transition font-bold text-xs uppercase tracking-wider disabled:opacity-40"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Cargar datos de la Nube
            </button>
          </div>

          {/* Resultados de las operaciones */}
          {syncResult && (
            <div className={`p-4 rounded-xl text-xs border leading-relaxed ${syncResult.success ? 'bg-emerald-950/30 text-emerald-300 border-emerald-900/30' : 'bg-rose-950/30 text-rose-300 border-rose-900/30'}`}>
              <p className="font-bold flex items-center gap-1.5">
                {syncResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                Resultado de Sincronización:
              </p>
              <p className="mt-1 font-semibold">{syncResult.message}</p>
            </div>
          )}

        </div>

        {/* Matrix de Tablas */}
        <div className="md:col-span-5 bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-400" />
            Tabla de Mapeo Supabase
          </h4>
          
          <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-[190px] pr-1">
            {verifiedTablesList.map(([tableName, exists]) => (
              <div key={tableName} className="flex justify-between items-center text-[11px] py-1 px-2.5 bg-slate-900/60 border border-slate-850/40 rounded-lg">
                <span className="font-mono text-slate-400">{tableName}</span>
                {exists ? (
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={10} /> Lista
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                    <XCircle size={10} /> Inexistente
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-[10px] text-slate-500 italic mt-3 text-center border-t border-slate-900 pt-2 shrink-0">
            Utiliza UUIDv4 de clave primaria para aislamiento
          </div>
        </div>

      </div>

      {/* SQL Script Accordion */}
      <div className="border-t border-slate-850/80 pt-3">
        <button
          onClick={() => setShowSql(!showSql)}
          className="w-full text-left flex justify-between items-center text-xs font-bold text-indigo-400 hover:text-indigo-300 py-1 transition"
        >
          <span>{showSql ? '⬇️ Ocultar' : '➡️ Desplegar'} Script SQL para configurar Supabase</span>
          <span className="text-[10px] opacity-70">Esquema Deportivo ArcheryApp</span>
        </button>

        {showSql && (
          <div className="mt-3.5 space-y-2.5 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-t-xl border-x border-t border-slate-800">
              <p className="text-[10px] text-slate-400 leading-tight">
                Copia este script completo y pégalo directamente en <strong>Supabase › SQL Editor</strong> para crear las tablas necesarias en 2 segundos.
              </p>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-[11px] font-bold active:scale-95 transition"
              >
                <Copy size={11} />
                {copied ? '¡Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            
            <div className="relative">
              <pre className="text-[10px] font-mono p-4 bg-slate-950 border border-slate-800 rounded-b-xl overflow-x-auto max-h-[220px] text-slate-300 leading-relaxed leading-5">
                {SUAPBASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
