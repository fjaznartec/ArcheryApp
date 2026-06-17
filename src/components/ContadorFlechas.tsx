import React, { useState, useEffect } from 'react';
import { Target, RotateCcw, Plus, Minus, Settings, Award, CheckCircle } from 'lucide-react';
import { SeguimientoDiario, SeguimientoTipoSesion, SeguimientoModo } from '../types';

interface ContadorFlechasProps {
  idArquero: string;
  onSave?: (entry: SeguimientoDiario) => void;
  initialCounts?: SeguimientoDiario;
}

export default function ContadorFlechas({ idArquero, onSave, initialCounts }: ContadorFlechasProps) {
  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const [count, setCount] = useState(0);
  const [objetivo, setObjetivo] = useState(120);
  const [tipoSesion, setTipoSesion] = useState<SeguimientoTipoSesion>('Entrenamiento');
  const [modo, setModo] = useState<SeguimientoModo>('Voluntario');
  const [notas, setNotas] = useState('');
  
  // Audio o vibraciones virtuales de click táctil
  const triggerClickFeedback = () => {
    // Si la API del Navegador lo permite, hacer una micro vibracion (para móviles en tab nueva)
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  useEffect(() => {
    // Cargar si ya existe registro para hoy en localStorage
    const saved = localStorage.getItem(`arrow_counter_${idArquero}_${getTodayDateString()}`);
    if (saved) {
      try {
        const parsed: SeguimientoDiario = JSON.parse(saved);
        setCount(parsed.contador_flechas);
        setObjetivo(parsed.objetivo_flechas);
        setTipoSesion(parsed.tipo_sesion);
        setModo(parsed.modo);
        setNotas(parsed.notas_adicionales || '');
      } catch (e) {
        console.error('Error parseando contador guardado', e);
      }
    } else if (initialCounts) {
      setCount(initialCounts.contador_flechas);
      setObjetivo(initialCounts.objetivo_flechas);
      setTipoSesion(initialCounts.tipo_sesion);
      setModo(initialCounts.modo);
      setNotas(initialCounts.notas_adicionales || '');
    }
  }, [idArquero, initialCounts]);

  const handleAdjust = (amount: number) => {
    triggerClickFeedback();
    setCount(prev => {
      const next = prev + amount;
      return next < 0 ? 0 : next;
    });
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar el contador a cero?')) {
      triggerClickFeedback();
      setCount(0);
    }
  };

  const handleGuardar = () => {
    const entry: SeguimientoDiario = {
      id: 'seg-' + Date.now(),
      id_arquero: idArquero,
      fecha: getTodayDateString(),
      contador_flechas: count,
      objetivo_flechas: objetivo,
      tipo_sesion: tipoSesion,
      modo,
      notas_adicionales: notas
    };

    localStorage.setItem(`arrow_counter_${idArquero}_${getTodayDateString()}`, JSON.stringify(entry));
    
    if (onSave) {
      onSave(entry);
    }
    alert('¡Seguimiento diario de flechas guardado correctamente!');
  };

  const percentProgress = Math.min(Math.round((count / objetivo) * 100), 100);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6" id="contador_flechas_modulo">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Contador de Flechas Rápido</h3>
            <p className="text-[11px] text-slate-400">Puntúa tus tiros diarios de forma compacta y táctil</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg">
          Hoy
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Visual Clicker Circular Core */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full bg-slate-900 flex flex-col items-center justify-center border-4 border-slate-800 shadow-xl select-none">
            <div className="absolute inset-0 rounded-full border border-white opacity-5"></div>
            
            <span className="text-red-500 font-mono text-[9px] tracking-widest uppercase font-semibold">Tanda flechas</span>
            
            {/* Pantalla LED del Contador */}
            <span className="text-5xl font-extrabold font-mono text-emerald-400 tracking-tight my-1 drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)]">
              {String(count).padStart(3, '0')}
            </span>
            
            <span className="text-[10px] text-slate-400">Meta: {objetivo}</span>
            
            {/* Botón de reinicio pequeño en físico */}
            <button 
              onClick={handleReset}
              title="Reiniciar"
              className="absolute bottom-3 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Medidor de Meta */}
          <div className="w-full mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progreso de hoy: {percentProgress}%</span>
              <span>{count} / {objetivo} flechas</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${percentProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Botones de Control del Clicker */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block text-center md:text-left mb-1">Mandos Rápidos</span>
          
          {/* Fila de Mutadores Principales */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAdjust(-1)}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200"
            >
              <Minus size={16} />
              Quitar 1
            </button>
            <button
              onClick={() => handleAdjust(1)}
              className="h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
            >
              <Plus size={16} />
              Sumar 1
            </button>
          </div>

          {/* Botones Rápidos de Series standard (6 flechas, 10, 12, etc.) */}
          <div className="grid grid-cols-4 gap-2">
            {['+6', '+8', '+10', '+12'].map((val) => {
              const num = parseInt(val);
              return (
                <button
                  key={val}
                  onClick={() => handleAdjust(num)}
                  className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition active:scale-95 text-xs shadow-sm"
                >
                  {val}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Sesión</label>
              <select 
                value={tipoSesion} 
                onChange={(e) => setTipoSesion(e.target.value as SeguimientoTipoSesion)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
              >
                <option value="Entrenamiento">Entrenamiento</option>
                <option value="Competición">Competición</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Modo Asignado</label>
              <select 
                value={modo} 
                onChange={(e) => setModo(e.target.value as SeguimientoModo)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
              >
                <option value="Voluntario">Voluntario</option>
                <option value="Obligatorio">Obligatorio</option>
              </select>
            </div>
          </div>

          <div className="mt-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ajustar Meta diaria</label>
            <input 
              type="range" 
              min="50" 
              max="300" 
              step="10"
              value={objetivo}
              onChange={(e) => setObjetivo(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="mt-1">
            <input 
              type="text" 
              placeholder="Notas rápidas de tus tiros..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Guardar Registro Directo */}
          <button
            onClick={handleGuardar}
            className="w-full mt-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <CheckCircle size={14} />
            GUARDAR REGISTRO DE FLECHAS
          </button>
        </div>
      </div>
    </div>
  );
}
