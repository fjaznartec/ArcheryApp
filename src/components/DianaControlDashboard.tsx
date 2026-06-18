import React, { useState, useMemo } from 'react';
import { ControlTiro, ImpactoFlecha } from '../types';
import { Target, BarChart2, Award, Info, ChevronRight, Sparkles, Filter, Eye } from 'lucide-react';

interface DianaControlDashboardProps {
  idArquero: string;
  controlesList: ControlTiro[];
  impactosList: ImpactoFlecha[];
  tituloDashboard?: string;
}

export default function DianaControlDashboard({
  idArquero,
  controlesList,
  impactosList,
  tituloDashboard = 'Dashboard Analítico de Dianas de Control'
}: DianaControlDashboardProps) {
  // Filter controls for this archer
  const arqueroControles = useMemo(() => {
    return controlesList.filter(c => c.id_arquero === idArquero);
  }, [controlesList, idArquero]);

  // Selected control state
  const [selectedControlId, setSelectedControlId] = useState<string>(
    arqueroControles[0]?.id || ''
  );

  // Fallback to update selected control if active archer has changed or controls populated
  React.useEffect(() => {
    if (arqueroControles.length > 0 && !arqueroControles.some(c => c.id === selectedControlId)) {
      setSelectedControlId(arqueroControles[0].id);
    }
  }, [arqueroControles, selectedControlId]);

  const selectedControl = useMemo(() => {
    return arqueroControles.find(c => c.id === selectedControlId);
  }, [arqueroControles, selectedControlId]);

  // Impacts of the selected control
  const controlImpacts = useMemo(() => {
    if (!selectedControlId) return [];
    return impactosList.filter(imp => imp.id_control === selectedControlId);
  }, [impactosList, selectedControlId]);

  // Filters inside selected control
  const [serieFilter, setSerieFilter] = useState<number | 'todas'>('todas');
  const [tandaFilter, setTandaFilter] = useState<number | 'todas'>('todas');

  // Filtered impacts to render
  const filteredImpacts = useMemo(() => {
    return controlImpacts.filter(imp => {
      const matchSerie = serieFilter === 'todas' || imp.serie === serieFilter;
      const matchTanda = tandaFilter === 'todas' || imp.tanda === tandaFilter;
      return matchSerie && matchTanda;
    });
  }, [controlImpacts, serieFilter, tandaFilter]);

  // Compute stats
  const stats = useMemo(() => {
    if (controlImpacts.length === 0) return { totalScore: 0, count: 0, avg: 0, xCount: 0, goldCount: 0 };
    
    let totalScore = 0;
    let count = 0;
    let xCount = 0;
    let goldCount = 0; // X, 10, 9 are yellow (gold) in archery

    controlImpacts.forEach(imp => {
      count++;
      const val = imp.valor_impacto;
      if (val === 'X') {
        totalScore += 10;
        xCount++;
        goldCount++;
      } else {
        const parsed = parseInt(val);
        if (!isNaN(parsed)) {
          totalScore += parsed;
          if (parsed >= 9) {
            goldCount++;
          }
        }
      }
    });

    return {
      totalScore,
      count,
      avg: count > 0 ? parseFloat((totalScore / count).toFixed(2)) : 0,
      xCount,
      goldCount
    };
  }, [controlImpacts]);

  // Grouped by tanda scores for grid breakdown
  const tandasBreakdown = useMemo(() => {
    const groups: { [key: string]: { score: number, arrows: string[], label: string, serie: number, tanda: number } } = {};
    controlImpacts.forEach(imp => {
      const key = `${imp.serie}-${imp.tanda}`;
      if (!groups[key]) {
        groups[key] = {
          score: 0,
          arrows: [],
          label: `S${imp.serie} - Tanda ${imp.tanda}`,
          serie: imp.serie,
          tanda: imp.tanda
        };
      }
      groups[key].arrows.push(imp.valor_impacto);
      const numericVal = imp.valor_impacto === 'X' ? 10 : parseInt(imp.valor_impacto) || 0;
      groups[key].score += numericVal;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.serie !== b.serie) return a.serie - b.serie;
      return a.tanda - b.tanda;
    });
  }, [controlImpacts]);

  // Helper to resolve plotting points
  const pointsWithCoordinates = useMemo(() => {
    return filteredImpacts.map((imp, idx) => {
      // If impact has saved coordinates, use them
      if (typeof imp.x === 'number' && typeof imp.y === 'number') {
        return {
          x: imp.x,
          y: imp.y,
          value: imp.valor_impacto,
          originalIdx: imp.flecha_index,
          tanda: imp.tanda,
          serie: imp.serie
        };
      }

      // Fallback: Calculate beautiful scatter circles on the correct ring deterministically
      const center = 150;
      const tipoDiana = selectedControl?.tipo_diana || '122 cm';
      const maxAnillos = tipoDiana === '80 cm reducida' ? 6 : (tipoDiana.startsWith('Tr. Vertical') ? 5 : 10);
      const ringWidth = 140 / maxAnillos;

      let minR = 0;
      let maxR = 140;

      const val = imp.valor_impacto;
      if (val !== 'M') {
        let numVal = val === 'X' ? 10 : parseInt(val);
        if (isNaN(numVal)) numVal = 9;
        
        const ringIdx = 10 - numVal;
        minR = ringIdx * ringWidth;
        maxR = (ringIdx + 1) * ringWidth;
        
        if (val === 'X' && !tipoDiana.startsWith('Tr. Vertical')) {
          minR = 0;
          maxR = ringWidth * 0.4;
        }
      } else {
        minR = 141;
        maxR = 148;
      }

      // Deterministic pseudo-random circle placement
      const seed = imp.serie * 100 + imp.tanda * 10 + imp.flecha_index;
      const angle = (seed * 1.6180339887) % (2 * Math.PI);
      const r = minR + ((seed % 7) / 7) * (maxR - minR - 3) + 2;

      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        value: val,
        originalIdx: imp.flecha_index,
        tanda: imp.tanda,
        serie: imp.serie
      };
    });
  }, [filteredImpacts, selectedControl]);

  // Render SVG concentric target circles
  const renderConcentricCircles = () => {
    const center = 150;
    const maxR = 140;
    const tipo = selectedControl?.tipo_diana || '122 cm';

    if (tipo === '122 cm' || tipo === '60 cm' || tipo === '80 cm completa') {
      const step = maxR / 10;
      return (
        <>
          <circle cx={center} cy={center} r={step * 10} className="fill-white stroke-slate-350 stroke-1" />
          <circle cx={center} cy={center} r={step * 9} className="fill-white stroke-slate-350 stroke-1" />
          
          <circle cx={center} cy={center} r={step * 8} className="fill-slate-900 stroke-slate-750 stroke-1" />
          <circle cx={center} cy={center} r={step * 7} className="fill-slate-900 stroke-slate-750 stroke-1" />
          
          <circle cx={center} cy={center} r={step * 6} className="fill-[#00b4d8] stroke-[#0096c7] stroke-1" />
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0096c7] stroke-1" />
          
          <circle cx={center} cy={center} r={step * 4} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
          
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          
          {tipo === '122 cm' && (
            <circle cx={center} cy={center} r={step * 0.5} className="fill-none stroke-[#e76f51] stroke-1 stroke-dasharray" strokeDasharray="3,2" />
          )}

          <line x1={center - 5} y1={center} x2={center + 5} y2={center} className="stroke-stone-900 stroke-1" />
          <line x1={center} y1={center - 5} x2={center} y2={center + 5} className="stroke-stone-900 stroke-1" />
          
          <text x={center} y={center + step * 9.5} className="text-[7px] fill-slate-400 font-bold" textAnchor="middle">1</text>
          <text x={center} y={center + step * 8.5} className="text-[7px] fill-slate-400 font-bold" textAnchor="middle">2</text>
          <text x={center} y={center + step * 7.5} className="text-[7px] fill-slate-300 font-bold" textAnchor="middle">3</text>
          <text x={center} y={center + step * 6.5} className="text-[7px] fill-slate-300 font-bold" textAnchor="middle">4</text>
          <text x={center} y={center + step * 5.5} className="text-[7px] fill-stone-800 font-bold" textAnchor="middle">5</text>
          <text x={center} y={center + step * 4.5} className="text-[7px] fill-stone-800 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.5} className="text-[7px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.5} className="text-[7px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.5} className="text-[7px] fill-stone-850 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    if (tipo === '80 cm reducida') {
      const step = maxR / 6;
      return (
        <>
          <circle cx={center} cy={center} r={step * 6} className="fill-[#00b4d8] stroke-[#0096c7] stroke-1" />
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0096c7] stroke-1" />
          
          <circle cx={center} cy={center} r={step * 4} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
          
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />

          <line x1={center - 5} y1={center} x2={center + 5} y2={center} className="stroke-stone-900 stroke-1" />
          <line x1={center} y1={center - 5} x2={center} y2={center + 5} className="stroke-stone-900 stroke-1" />

          <text x={center} y={center + step * 5.5} className="text-[9px] fill-stone-800 font-bold" textAnchor="middle">5</text>
          <text x={center} y={center + step * 4.5} className="text-[9px] fill-stone-800 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.5} className="text-[9px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.5} className="text-[9px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.5} className="text-[9px] fill-stone-800 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    // Default to Triple Spot (Tr. Vertical Recurve or Compound)
    const step = maxR / 5;
    const isComp = tipo === 'Tr. Vertical [C]';
    return (
      <>
        <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0096c7] stroke-1" />
        <circle cx={center} cy={center} r={step * 4} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
        <circle cx={center} cy={center} r={step * 3} className="fill-[#e63946] stroke-[#d62828] stroke-1" />
        <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
        
        {isComp ? (
          <>
            <circle cx={center} cy={center} r={step * 0.5} className="fill-none stroke-[#e63946] stroke-1 stroke-dasharray" strokeDasharray="2,2" />
            <circle cx={center} cy={center} r={step * 1} className="fill-none stroke-stone-850 stroke-1" />
          </>
        ) : (
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
        )}

        <line x1={center - 5} y1={center} x2={center + 5} y2={center} className="stroke-stone-900 stroke-1" />
        <line x1={center} y1={center - 5} x2={center} y2={center + 5} className="stroke-stone-900 stroke-1" />

        <text x={center} y={center + step * 4.6} className="text-[9px] fill-stone-800 font-bold" textAnchor="middle">6</text>
        <text x={center} y={center + step * 3.6} className="text-[9px] fill-white font-bold" textAnchor="middle">7</text>
        <text x={center} y={center + step * 2.6} className="text-[9px] fill-white font-bold" textAnchor="middle">8</text>
        <text x={center} y={center + step * 1.6} className="text-[9px] fill-stone-800 font-bold" textAnchor="middle">9</text>
      </>
    );
  };

  return (
    <div id="diana-control-dashboard" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-6">
      
      {/* Cabecera / Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Target className="text-indigo-600 animate-pulse" size={18} />
            {tituloDashboard}
          </h3>
          <p className="text-xs text-slate-500">
            Ficha de dispersión gráfica interactiva de impactos y control estadístico por tanda.
          </p>
        </div>

        {arqueroControles.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Historial:</label>
            <select
              value={selectedControlId}
              onChange={(e) => {
                setSelectedControlId(e.target.value);
                setSerieFilter('todas');
                setTandaFilter('todas');
              }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 w-full md:w-72 shadow-2xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {arqueroControles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre_control} ({c.fecha}) • {c.distancia}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {arqueroControles.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto">
          <Info size={36} className="mx-auto text-slate-450 mb-3" />
          <h4 className="font-extrabold text-slate-850 text-sm mb-1">Sin controles completados aún</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            El arquero todavía no ha guardado ningún Control de Precisión Integral en el simulador de diana.
          </p>
          <div className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full inline-block">
            Módulo Oficial FITA homologado
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LADO IZQUIERDO: RENDER Diana SVG + Filtros rápidos */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-4">
            
            {/* Cabecera Diana info */}
            <div className="w-full text-center space-y-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-black rounded text-[9px] uppercase tracking-wide">
                DIANA: {selectedControl?.tipo_diana} • {selectedControl?.distancia}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Puntos dibujados: <span className="font-bold text-indigo-600">{filteredImpacts.length}</span> de <span className="font-bold">{controlImpacts.length}</span>
              </p>
            </div>

            {/* SVG Target Canvas */}
            <div className="relative bg-white border border-slate-150 p-4 rounded-full shadow-md flex items-center justify-center">
              <svg
                width="280"
                height="280"
                viewBox="0 0 300 300"
                className="max-w-[260px] drop-shadow-md select-none"
              >
                {/* Safe outer circle frame */}
                <circle cx="150" cy="150" r="148" className="fill-slate-50 stroke-slate-200 stroke-2" />
                
                {/* Concentric rings */}
                {renderConcentricCircles()}

                {/* Plot impact points */}
                {pointsWithCoordinates.map((p, idx) => {
                  return (
                    <g key={idx} className="transition-all hover:scale-110">
                      {/* Arrow hit shadow */}
                      <circle cx={p.x + 1} cy={p.y + 1} r="4" className="fill-black opacity-30" />
                      {/* Arrow pin head with FITA contrast */}
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        className={`${p.value === 'X' || p.value === '10' ? 'fill-emerald-500 stroke-stone-900' : 'fill-[#eeef20] stroke-stone-900'} stroke-1`} 
                      />
                      {/* Round-Arrow Info tip/number */}
                      <text 
                        x={p.x} 
                        y={p.y - 5.5} 
                        className="text-[6.5px] fill-stone-900 font-black stroke-white stroke-2" 
                        textAnchor="middle"
                      >
                        S{p.serie}
                      </text>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="1" 
                        className="fill-black"
                      />
                    </g>
                  );
                })}
              </svg>

              {filteredImpacts.length === 0 && (
                <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-3xs rounded-full flex items-center justify-center p-3 text-center">
                  <p className="text-[11px] font-bold text-slate-500">
                    Selecciona filtros compatibles para ver impactos.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Filters */}
            <div className="w-full space-y-3 bg-white p-3 border border-slate-150 rounded-xl shadow-3xs">
              <h5 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Filter size={12} className="text-slate-500" />
                Filtros de Visor Gráfico
              </h5>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Serie</label>
                  <select
                    value={serieFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSerieFilter(val === 'todas' ? 'todas' : parseInt(val));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="todas">Todas</option>
                    {Array.from({ length: selectedControl?.tandas_por_serie || 1 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Serie {num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Tanda / Ronda</label>
                  <select
                    value={tandaFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTandaFilter(val === 'todas' ? 'todas' : parseInt(val));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="todas">Todas</option>
                    {Array.from({ length: selectedControl?.tandas_por_serie || 1 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Tanda {num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* LADO DERECHO: ESTADÍSTICAS + BREAKDOWN TANDAS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            
            {/* Macro general stats */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase text-indigo-400 leading-none mb-1">Puntuación</p>
                <span className="text-base font-black text-indigo-750">{stats.totalScore}</span>
                <p className="text-[8px] font-medium text-indigo-400 leading-none mt-1">puntos totales</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase text-emerald-400 leading-none mb-1">Flechas</p>
                <span className="text-base font-black text-emerald-750">{stats.count}</span>
                <p className="text-[8px] font-medium text-emerald-400 leading-none mt-1">disparadas</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase text-amber-500 leading-none mb-1">Media flecha</p>
                <span className="text-base font-black text-amber-750">{stats.avg}</span>
                <p className="text-[8px] font-medium text-amber-500 leading-none mt-1">promedio FITA</p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase text-rose-400 leading-none mb-1">Clavos X / 10</p>
                <span className="text-base font-black text-rose-750">{stats.xCount} Xs</span>
                <p className="text-[8px] font-medium text-rose-400 leading-none mt-1">amarillo centro</p>
              </div>
            </div>

            {/* Gold Ratio Indicator */}
            {stats.count > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Porbabilidad en la zona Oro (X, 10, 9)</span>
                  <span className="text-amber-500 font-extrabold">{Math.round((stats.goldCount / stats.count) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(stats.goldCount / stats.count) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Grid breakdown of Tandas */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase text-slate-705 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <BarChart2 size={13} className="text-indigo-500" />
                Desglose Analítico por Tandas
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                {tandasBreakdown.map((tb, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 border rounded-xl flex flex-col justify-between text-xs transition duration-150 ${
                      (serieFilter === 'todas' || tb.serie === serieFilter) && (tandaFilter === 'todas' || tb.tanda === tandaFilter)
                        ? 'bg-indigo-50/30 border-indigo-200' 
                        : 'bg-white border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center pb-1 border-b border-dashed border-slate-100">
                      <span className="font-extrabold text-slate-700 text-[10px]">{tb.label}</span>
                      <span className="font-black text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded text-[10px]">
                        {tb.score} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 overflow-x-auto">
                      {tb.arrows.map((arr, i) => (
                        <span 
                          key={i} 
                          className={`w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full border shadow-3xs ${
                            arr === 'X' || arr === '10' || arr === '9' 
                              ? 'bg-amber-100 border-amber-300 text-amber-800' 
                              : arr === '8' || arr === '7' 
                              ? 'bg-red-100 border-red-300 text-red-800'
                              : arr === '6' || arr === '5'
                              ? 'bg-teal-100 border-teal-300 text-teal-800'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {arr}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trainer Automatics / Archer Comments */}
            {selectedControl?.comentarios && (
              <div className="bg-amber-50/30 border border-amber-200/50 p-3 rounded-xl flex items-start gap-2 text-xs">
                <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-slate-700">
                  <p className="font-bold text-[10px] text-amber-700 uppercase tracking-wide">Comentarios Registrados:</p>
                  <p className="italic leading-relaxed text-slate-600">"{selectedControl.comentarios}"</p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
