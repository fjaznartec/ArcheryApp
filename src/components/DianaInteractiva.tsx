import React, { useState, useRef, useEffect } from 'react';
import { Target, Trash2, ArrowRight, Save, Plus, RotateCcw, AlertTriangle, HelpCircle } from 'lucide-react';
import { TipoDiana, ControlDistancia, ImpactoFlecha, ControlTiro } from '../types';

interface DianaInteractivaProps {
  idArquero: string;
  onSaveControl?: (control: ControlTiro, impactos: ImpactoFlecha[]) => void;
}

interface PlotPoint {
  x: number;
  y: number;
  value: string;
  spot?: 'upper' | 'middle' | 'lower';
}

export default function DianaInteractiva({ idArquero, onSaveControl }: DianaInteractivaProps) {
  const [distancia, setDistancia] = useState<ControlDistancia>('70m');
  const [tipoDiana, setTipoDiana] = useState<TipoDiana>('122 cm');
  const [nombreControl, setNombreControl] = useState('Control Semanal Oficial');
  
  // Tanda y Serie actual
  const [selectedTanda, setSelectedTanda] = useState(1);
  const [selectedSerie, setSelectedSerie] = useState(1);
  const [flechasPorTanda, setFlechasPorTanda] = useState(6);
  const [numeroTandas, setNumeroTandas] = useState(6); // Total tandas
  
  // Lista de impactos del control actual en memoria
  const [impactos, setImpactos] = useState<ImpactoFlecha[]>([]);
  // Puntos visuales para pintar en la diana (con coordenadas relativas 0-300)
  const [puntosDiana, setPuntosDiana] = useState<PlotPoint[]>([]);
  // Spot seleccionado en dianas triples ('upper', 'middle', 'lower')
  const [activeSpot, setActiveSpot] = useState<'upper' | 'middle' | 'lower'>('middle');

  const svgRef = useRef<SVGSVGElement>(null);

  // Reajustar flechas por tanda dependiendo del tipo de diana
  useEffect(() => {
    if (tipoDiana.startsWith('Tr. Vertical')) {
      setFlechasPorTanda(3);
    } else {
      setFlechasPorTanda(6);
    }
  }, [tipoDiana]);

  // Limpiar impactos de la tanda actual
  const handleClearTanda = () => {
    setImpactos(prev => prev.filter(imp => !(imp.serie === selectedSerie && imp.tanda === selectedTanda)));
    setPuntosDiana(prev => tipoDiana.startsWith('Tr. Vertical') 
      ? prev.filter(p => p.spot !== activeSpot) 
      : []
    );
  };

  // Limpiar todo el control
  const handleResetTodo = () => {
    if (window.confirm('¿Seguro que deseas reiniciar todo el control? Se perderán las puntuaciones actuales.')) {
      setImpactos([]);
      setPuntosDiana([]);
      setSelectedTanda(1);
      setSelectedSerie(1);
    }
  };

  // Calcular valor según física de diana y distancia del clic al centro
  const resolveHit = (distanceFromCenter: number, dx: number, dy: number): { value: string; dist: number } => {
    // El radio máximo del círculo de la diana es de 140px (de un contenedor de 300px, con margen de 10px)
    // El radio total real R = 140px. Dividido en los anillos correspondientes.
    const maxR = 140;

    if (distanceFromCenter > maxR) {
      return { value: 'M', dist: distanceFromCenter };
    }

    if (tipoDiana === '122 cm') {
      // 10 anillos de igual ancho (14px cada uno) + X (anillo interior menor a 7px)
      const ringWidth = maxR / 10; // 14px
      const ring = Math.floor(distanceFromCenter / ringWidth);
      
      if (distanceFromCenter <= ringWidth * 0.5) {
        return { value: 'X', dist: distanceFromCenter };
      }
      
      const score = 10 - ring;
      const finalScore = score < 1 ? 1 : score;
      return { value: String(finalScore), dist: distanceFromCenter };
    } 
    
    if (tipoDiana === '60 cm' || tipoDiana === '80 cm completa') {
      // 10 anillos de igual ancho (14px cada uno)
      const ringWidth = maxR / 10; // 14px
      const ring = Math.floor(distanceFromCenter / ringWidth);
      const score = 10 - ring;
      const finalScore = score < 1 ? 1 : score;
      return { value: String(finalScore), dist: distanceFromCenter };
    }

    if (tipoDiana === '80 cm reducida') {
      // Solo anillos 10, 9, 8, 7, 6, 5. El total de radio maxR (140) se divide entre 6 anillos.
      // Ancho anillo = 140 / 6 = 23.33px
      const ringWidth = maxR / 6;
      const ring = Math.floor(distanceFromCenter / ringWidth);
      const score = 10 - ring;
      // Cualquier impacto fuera de 5 (ring >= 6) es fallo (M)
      if (score < 5) return { value: 'M', dist: distanceFromCenter };
      return { value: String(score), dist: distanceFromCenter };
    }

    if (tipoDiana === 'Tr. Vertical [R]') {
      // Recurvo Triple Spot: Anillos 10, 9, 8, 7, 6. Total 5 anillos.
      // Ancho anillo = 140 / 5 = 28px
      const ringWidth = maxR / 5;
      const ring = Math.floor(distanceFromCenter / ringWidth);
      const score = 10 - ring;
      if (score < 6) return { value: 'M', dist: distanceFromCenter };
      return { value: String(score), dist: distanceFromCenter };
    }

    if (tipoDiana === 'Tr. Vertical [C]') {
      // Compuesto Triple Spot: Anillos 10 (solo 10 interior), 9, 8, 7, 6.
      // En compuesto el 10 es solo la mitad del tamaño (10 de recurvo). 
      // Ancho normal de anillo = 140 / 5 = 28px. 
      // El 10 compuesto mide 14px (la mitad del primero).
      const ringWidth = maxR / 5; // 28px
      if (distanceFromCenter <= ringWidth * 0.5) {
        return { value: '10', dist: distanceFromCenter }; // En compuesto, el 10 es el anillo interior.
      }
      
      const ring = Math.floor(distanceFromCenter / ringWidth);
      const score = 10 - ring;
      if (score < 6) return { value: 'M', dist: distanceFromCenter };
      // Si cae en el anillo amarillo exterior, es un 9 (ya que el 10 es ultra-reducido)
      if (score === 10 && distanceFromCenter > ringWidth * 0.5) {
        return { value: '9', dist: distanceFromCenter };
      }
      return { value: String(score), dist: distanceFromCenter };
    }

    return { value: 'M', dist: distanceFromCenter };
  };

  const handleTargetClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    
    // Obtener la caja del SVG para calcular coordenadas relativas reales
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Escalar la coordenada al tamaño nominal del SVG que es 300x300
    const x = (clickX / rect.width) * 300;
    const y = (clickY / rect.height) * 300;

    // Centro del target depende si es triple spot o diana simple
    let targetCenterX = 150;
    let targetCenterY = 150;
    let currentSpot: 'upper' | 'middle' | 'lower' | undefined = undefined;

    if (tipoDiana.startsWith('Tr. Vertical')) {
      currentSpot = activeSpot;
      // En la diana triple visual, podemos pintar las 3 dianas, pero para la toma de medidas
      // simulamos el impacto en la diana activa que se muestra en grande.
      // O si preferimos, dividimos verticalmente la pantalla.
      // Para máxima diversión técnica: El SVG actual representa la diana del Spot Activo!
      // Por tanto, el centro siempre es (150, 150).
    }

    const dx = x - targetCenterX;
    const dy = y - targetCenterY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    const hit = resolveHit(distanceFromCenter, dx, dy);
    
    // Validar si ya hemos llenado las flechas de la tanda actual
    const currentImps = impactos.filter(imp => imp.serie === selectedSerie && imp.tanda === selectedTanda);
    if (currentImps.length >= flechasPorTanda) {
      alert(`Ya has registrado las ${flechasPorTanda} flechas para la Tanda ${selectedTanda}, Serie ${selectedSerie}. Por favor, avanza a la siguiente tanda.`);
      return;
    }

    // Agregar impacto
    const nuevoImpacto: ImpactoFlecha = {
      id_control: 'temp-control-id',
      serie: selectedSerie,
      tanda: selectedTanda,
      flecha_index: currentImps.length + 1,
      valor_impacto: hit.value
    };

    setImpactos(prev => [...prev, nuevoImpacto]);
    setPuntosDiana(prev => [...prev, { x, y, value: hit.value, spot: currentSpot }]);

    // Si es diana triple, podemos sugerir avanzar o rotar spot activado
    if (tipoDiana.startsWith('Tr. Vertical')) {
      if (activeSpot === 'upper') setActiveSpot('middle');
      else if (activeSpot === 'middle') setActiveSpot('lower');
      else setActiveSpot('upper');
    }
  };

  // Agregar puntuación manualmente por teclado numérico rápido
  const handleQuickScore = (value: string) => {
    const currentImps = impactos.filter(imp => imp.serie === selectedSerie && imp.tanda === selectedTanda);
    if (currentImps.length >= flechasPorTanda) {
      alert(`Tanda llena. Avanza a la siguiente.`);
      return;
    }

    const nuevoImpacto: ImpactoFlecha = {
      id_control: 'temp-control-id',
      serie: selectedSerie,
      tanda: selectedTanda,
      flecha_index: currentImps.length + 1,
      valor_impacto: value
    };

    setImpactos(prev => [...prev, nuevoImpacto]);

    // Para colocar un punto visual aleatorio dentro del anillo de esa puntuación
    // Esto asegura que la diana siga poblándose visualmente aunque usen el teclado rápido!
    let minR = 0;
    let maxR = 140;
    const center = 150;
    
    const maxAnillos = tipoDiana === '80 cm reducida' ? 6 : (tipoDiana.startsWith('Tr. Vertical') ? 5 : 10);
    const ringWidth = 140 / maxAnillos;

    if (value !== 'M') {
      let numVal = value === 'X' ? 10 : parseInt(value);
      if (tipoDiana === '80 cm reducida') {
        const ringIdx = 10 - numVal;
        minR = ringIdx * ringWidth;
        maxR = (ringIdx + 1) * ringWidth;
      } else if (tipoDiana.startsWith('Tr. Vertical')) {
        const ringIdx = 10 - numVal;
        minR = ringIdx * ringWidth;
        maxR = (ringIdx + 1) * ringWidth;
      } else {
        const ringIdx = 10 - numVal;
        minR = ringIdx * ringWidth;
        maxR = (ringIdx + 1) * ringWidth;
        if (value === 'X') {
          minR = 0;
          maxR = ringWidth * 0.5;
        }
      }
    } else {
      minR = 141;
      maxR = 148;
    }

    const r = minR + Math.random() * (maxR - minR);
    const angle = Math.random() * Math.PI * 2;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);

    setPuntosDiana(prev => [...prev, { x, y, value }]);
  };

  // Convertir valores de impacto a numéricos para los cálculos
  const getNumericValue = (val: string): number => {
    if (val === 'X') return 10;
    if (val === 'M') return 0;
    return parseInt(val) || 0;
  };

  // Totales generales
  const totalPuntos = impactos.reduce((acc, imp) => acc + getNumericValue(imp.valor_impacto), 0);
  const totalFlechas = impactos.length;
  const promedioFlecha = totalFlechas > 0 ? (totalPuntos / totalFlechas).toFixed(2) : '0.00';
  const conteoX = impactos.filter(imp => imp.valor_impacto === 'X').length;
  const conteoDieces = impactos.filter(imp => imp.valor_impacto === '10' || imp.valor_impacto === 'X').length;

  // Filtrar impactos de la tanda actual
  const impactosTandaActual = impactos.filter(
    imp => imp.serie === selectedSerie && imp.tanda === selectedTanda
  ).sort((a,b) => a.flecha_index - b.flecha_index);

  const sumaTandaActual = impactosTandaActual.reduce((acc, imp) => acc + getNumericValue(imp.valor_impacto), 0);

  // Avanzar tanda
  const handleNextTanda = () => {
    if (selectedTanda < numeroTandas) {
      setSelectedTanda(prev => prev + 1);
      // Limpiar puntos visuales de la diana si no es de spots o queremos tanda limpia
      if (!tipoDiana.startsWith('Tr. Vertical')) {
        setPuntosDiana([]);
      }
    } else {
      // Si llegamos a la tana límite, sugerir guardar o avanzar serie
      alert('¡Has completado todas las tandas de esta serie! Ya puedes guardar el control de tiro.');
    }
  };

  // Guardar control completo
  const handleGuardarControl = () => {
    if (impactos.length === 0) {
      alert('No puedes guardar un control sin impactos.');
      return;
    }

    const nuevoControl: ControlTiro = {
      id: 'ctrl-' + Date.now(),
      id_arquero: idArquero,
      nombre_control: nombreControl,
      fecha: new Date().toISOString().split('T')[0],
      distancia,
      tipo_diana: tipoDiana,
      flechas_por_serie: flechasPorTanda,
      tandas_por_serie: numeroTandas,
      comentarios: `Control completado de ${totalFlechas} flechas. Puntuación Total: ${totalPuntos}.`
    };

    if (onSaveControl) {
      // Pasar datos al padre
      onSaveControl(nuevoControl, impactos);
      alert('¡Control de tiro guardado exitosamente!');
      
      // Resetear estado
      setImpactos([]);
      setPuntosDiana([]);
      setSelectedTanda(1);
      setSelectedSerie(1);
    } else {
      alert('Control guardado localmente en esta sesión demo.');
    }
  };

  // Renderizar anillos concéntricos según el tipo de diana seleccionado
  const renderDianaCircles = () => {
    const center = 150;
    const maxR = 140;

    // Config de colores estándar de Arquería FITA
    // Amarillo/Oro: Anillos 10, 9
    // Rojo: Anillos 8, 7
    // Azul claro: Anillos 6, 5
    // Negro: Anillos 4, 3 (Texto en blanco)
    // Blanco: Anillos 2, 1 (Texto en negro)
    
    if (tipoDiana === '122 cm' || tipoDiana === '60 cm' || tipoDiana === '80 cm completa') {
      const step = maxR / 10; // 14px cada uno
      return (
        <>
          {/* Anillo 1 (Blanco) */}
          <circle cx={center} cy={center} r={step * 10} className="fill-white stroke-gray-300 stroke-1" />
          <circle cx={center} cy={center} r={step * 9} className="fill-white stroke-gray-300 stroke-1" />
          
          {/* Anillos 3-4 (Negro) */}
          <circle cx={center} cy={center} r={step * 8} className="fill-stone-900 stroke-stone-700 stroke-1" />
          <circle cx={center} cy={center} r={step * 7} className="fill-stone-900 stroke-stone-700 stroke-1" />
          
          {/* Anillos 5-6 (Azul) */}
          <circle cx={center} cy={center} r={step * 6} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          
          {/* Anillos 7-8 (Rojo) */}
          <circle cx={center} cy={center} r={step * 4} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          
          {/* Anillos 9-10 (Oro/Amarillo) */}
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          
          {/* Anillo X (En 122cm) */}
          {tipoDiana === '122 cm' && (
            <circle cx={center} cy={center} r={step * 0.5} className="fill-none stroke-[#e76f51] stroke-1 stroke-dasharray" strokeDasharray="3,3" />
          )}

          {/* Cruz del centro */}
          <line x1={center - 4} y1={center} x2={center + 4} y2={center} className="stroke-stone-800 stroke-1" />
          <line x1={center} y1={center - 4} x2={center} y2={center + 4} className="stroke-stone-800 stroke-1" />
          
          {/* Textos de los Anillos */}
          <text x={center} y={center + step * 9.5} className="text-[8px] fill-stone-500 font-bold text-center" textAnchor="middle">1</text>
          <text x={center} y={center + step * 8.5} className="text-[8px] fill-stone-500 font-bold" textAnchor="middle">2</text>
          <text x={center} y={center + step * 7.5} className="text-[8px] fill-white font-bold" textAnchor="middle">3</text>
          <text x={center} y={center + step * 6.5} className="text-[8px] fill-white font-bold" textAnchor="middle">4</text>
          <text x={center} y={center + step * 5.5} className="text-[8px] fill-stone-800 font-bold" textAnchor="middle">5</text>
          <text x={center} y={center + step * 4.5} className="text-[8px] fill-stone-800 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.5} className="text-[8px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.5} className="text-[8px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.5} className="text-[8px] fill-stone-800 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    if (tipoDiana === '80 cm reducida') {
      // Solo anillos 10 hasta 5 (6 anillos). Ancho = 140 / 6 = 23.33px
      const step = maxR / 6;
      return (
        <>
          {/* Anillos 5-6 (Azul) */}
          <circle cx={center} cy={center} r={step * 6} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          
          {/* Anillos 7-8 (Rojo) */}
          <circle cx={center} cy={center} r={step * 4} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          
          {/* Anillos 9-10 (Oro/Amarillo) */}
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />

          {/* Cruz del centro */}
          <line x1={center - 4} y1={center} x2={center + 4} y2={center} className="stroke-stone-800 stroke-1" />
          <line x1={center} y1={center - 4} x2={center} y2={center + 4} className="stroke-stone-800 stroke-1" />

          <text x={center} y={center + step * 5.5} className="text-[10px] fill-stone-800 font-bold" textAnchor="middle">5</text>
          <text x={center} y={center + step * 4.5} className="text-[10px] fill-stone-800 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.5} className="text-[10px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.5} className="text-[10px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.5} className="text-[10px] fill-stone-800 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    if (tipoDiana === 'Tr. Vertical [R]') {
      // Recurvo Triple Spot: Anillos 10 hasta 6 (5 anillos). Paso = 140 / 5 = 28px
      const step = maxR / 5;
      return (
        <>
          {/* Anillo 6 (Azul exterior) */}
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          
          {/* Anillos 7-8 (Rojo) */}
          <circle cx={center} cy={center} r={step * 4} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          
          {/* Anillos 9-10 (Oro/Amarillo) */}
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          <circle cx={center} cy={center} r={step * 1} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />

          {/* Cruz del centro */}
          <line x1={center - 4} y1={center} x2={center + 4} y2={center} className="stroke-stone-800 stroke-1" />
          <line x1={center} y1={center - 4} x2={center} y2={center + 4} className="stroke-stone-800 stroke-1" />

          <text x={center} y={center + step * 4.6} className="text-[10px] fill-stone-850 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.6} className="text-[10px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.6} className="text-[10px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.6} className="text-[10px] fill-stone-800 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    if (tipoDiana === 'Tr. Vertical [C]') {
      // Compuesto Triple Spot: 10 (reducido a la mitad), 9, 8, 7, 6. Paso = 28px.
      const step = maxR / 5;
      return (
        <>
          {/* Anillo 6 (Azul exterior) */}
          <circle cx={center} cy={center} r={step * 5} className="fill-[#00b4d8] stroke-[#0077b6] stroke-1" />
          
          {/* Anillos 7-8 (Rojo) */}
          <circle cx={center} cy={center} r={step * 4} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          <circle cx={center} cy={center} r={step * 3} className="fill-[#ef233c] stroke-[#d90429] stroke-1" />
          
          {/* Anillos 9-10 (Oro/Amarillo) */}
          <circle cx={center} cy={center} r={step * 2} className="fill-[#ffd166] stroke-[#f4a261] stroke-1" />
          {/* El 10 de compuesto es de tamaño mitad */}
          <circle cx={center} cy={center} r={step * 0.5} className="fill-none stroke-[#ef233c] stroke-1 stroke-dasharray" strokeDasharray="2,2" />
          <circle cx={center} cy={center} r={step * 1} className="fill-none stroke-stone-800 stroke-1" />

          {/* Cruz del centro */}
          <line x1={center - 4} y1={center} x2={center + 4} y2={center} className="stroke-stone-800 stroke-1" />
          <line x1={center} y1={center - 4} x2={center} y2={center + 4} className="stroke-stone-800 stroke-1" />

          <text x={center} y={center + step * 4.6} className="text-[10px] fill-stone-850 font-bold" textAnchor="middle">6</text>
          <text x={center} y={center + step * 3.6} className="text-[10px] fill-white font-bold" textAnchor="middle">7</text>
          <text x={center} y={center + step * 2.6} className="text-[10px] fill-white font-bold" textAnchor="middle">8</text>
          <text x={center} y={center + step * 1.6} className="text-[10px] fill-stone-800 font-bold" textAnchor="middle">9</text>
        </>
      );
    }

    return null;
  };

  // Obtener los valores válidos según el tipo de diana para el teclado rápido
  const getBotonesValidos = () => {
    if (tipoDiana === 'Tr. Vertical [R]' || tipoDiana === 'Tr. Vertical [C]') {
      return ['10', '9', '8', '7', '6', 'M'];
    }
    if (tipoDiana === '80 cm reducida') {
      return ['10', '9', '8', '7', '6', '5', 'M'];
    }
    if (tipoDiana === '122 cm') {
      return ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
    }
    // Dianas de 60cm y 80cm completas
    return ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6" id="diana_interactiva_modulo">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Lado Izquierdo: Configuración y Diana */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre del Control</label>
              <input 
                type="text" 
                value={nombreControl} 
                onChange={(e) => setNombreControl(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Distancia</label>
              <select 
                value={distancia} 
                onChange={(e) => setDistancia(e.target.value as ControlDistancia)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="12m">12m</option>
                <option value="18m">18m</option>
                <option value="30m">30m</option>
                <option value="40m">40m</option>
                <option value="50m">50m</option>
                <option value="60m">60m</option>
                <option value="70m">70m</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo Diana</label>
              <select 
                value={tipoDiana} 
                onChange={(e) => {
                  setTipoDiana(e.target.value as TipoDiana);
                  setImpactos([]);
                  setPuntosDiana([]);
                }}
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="122 cm">122 cm completa (X, 10-1)</option>
                <option value="80 cm completa">80 cm completa (10-1)</option>
                <option value="80 cm reducida">80 cm reducida (10-5)</option>
                <option value="60 cm">60 cm completa (10-1)</option>
                <option value="Tr. Vertical [R]">Tr. Vertical Recurvo (10-6)</option>
                <option value="Tr. Vertical [C]">Tr. Vertical Compuesto (10-6)</option>
              </select>
            </div>
          </div>

          {/* Selector de Spot (si es triple vertical) */}
          {tipoDiana.startsWith('Tr. Vertical') && (
            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveSpot('upper')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${activeSpot === 'upper' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-250'}`}
              >
                Spot Superior
              </button>
              <button 
                onClick={() => setActiveSpot('middle')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${activeSpot === 'middle' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-250'}`}
              >
                Spot Central
              </button>
              <button 
                onClick={() => setActiveSpot('lower')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${activeSpot === 'lower' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-250'}`}
              >
                Spot Inferior
              </button>
            </div>
          )}

          {/* DIANA INTERACTIVA SVG */}
          <div className="relative bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center shadow-inner select-none cursor-crosshair">
            <svg 
              ref={svgRef}
              width="300" 
              height="300" 
              viewBox="0 0 300 300" 
              onClick={handleTargetClick}
              className="drop-shadow-lg max-w-[280px] sm:max-w-xs md:max-w-sm"
              id="svg_target_canvas"
            >
              {/* Fondo gris de seguridad */}
              <circle cx="150" cy="150" r="148" className="fill-slate-100 stroke-slate-300 stroke-2" />
              
              {/* Dibujar círculos concéntricos según la diana */}
              {renderDianaCircles()}

              {/* Pintar los impactos registrados */}
              {puntosDiana.map((p, idx) => {
                const isCurrentSpot = !tipoDiana.startsWith('Tr. Vertical') || p.spot === activeSpot;
                if (!isCurrentSpot) return null;
                
                return (
                  <g key={idx}>
                    {/* Sombra de flecha */}
                    <circle cx={p.x + 1} cy={p.y + 1} r="4" className="fill-black opacity-30" />
                    {/* Clavo de impacto con color de contraste */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="3.5" 
                      className={`${p.value === 'X' || p.value === '10' ? 'fill-emerald-500' : 'fill-[#eeef20]'} stroke-black stroke-1`} 
                    />
                    {/* Número pequeño del índice de la flecha */}
                    <text x={p.x} y={p.y - 5} className="text-[6px] fill-black font-extrabold stroke-white stroke-1" textAnchor="middle">{idx + 1}</text>
                  </g>
                );
              })}
            </svg>
            
            {tipoDiana.startsWith('Tr. Vertical') && (
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Spot Activo: {activeSpot === 'upper' ? 'Superior' : activeSpot === 'middle' ? 'Central' : 'Inferior'}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center gap-1">
            <HelpCircle size={12} />
            Haz clic directamente sobre la diana para puntuar y ver el impacto gráfico.
          </p>

          {/* Teclado de Entrada Rápida */}
          <div className="w-full mt-4">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-2">Entrada Rápida por Botones</span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 justify-center">
              {getBotonesValidos().map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleQuickScore(btn)}
                  className="h-10 text-sm font-bold rounded-lg border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition active:scale-95 flex items-center justify-center shadow-sm text-slate-800"
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Estado, Puntuaciones de la Tanda y Estadísticas */}
        <div className="lg:w-80 flex flex-col gap-4">
          
          {/* Fila superior: Serie, Tanda, Flechas */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-500">PROGRESO DEL CONTROL</span>
              <div className="flex gap-1.5 text-xs font-bold text-slate-800">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">T {selectedTanda}/{numeroTandas}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">Flechas en Tanda actual:</span>
              <span className="text-sm font-bold text-slate-800">
                {impactosTandaActual.length} / {flechasPorTanda}
              </span>
            </div>

            {/* Lista visual de flechas de la tanda actual */}
            <div className="flex gap-1 flex-wrap min-h-[36px] bg-white p-2 rounded-lg border border-slate-150 items-center justify-center mb-3">
              {impactosTandaActual.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Esperando impactos...</span>
              ) : (
                impactosTandaActual.map((imp) => (
                  <span 
                    key={imp.flecha_index}
                    className={`w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full shadow-sm text-white border ${
                      imp.valor_impacto === 'X' || imp.valor_impacto === '10' 
                        ? 'bg-amber-500 border-amber-600' 
                        : (parseInt(imp.valor_impacto) >= 8 
                          ? 'bg-rose-500 border-rose-600' 
                          : (parseInt(imp.valor_impacto) >= 5 
                            ? 'bg-sky-500 border-sky-600' 
                            : 'bg-stone-600 border-stone-700'))
                    }`}
                  >
                    {imp.valor_impacto}
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClearTanda}
                disabled={impactosTandaActual.length === 0}
                className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Trash2 size={13} />
                Limpiar Tanda
              </button>
              <button
                onClick={handleNextTanda}
                disabled={impactosTandaActual.length < flechasPorTanda || selectedTanda === numeroTandas}
                className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-[#ef233c] text-white hover:bg-[#d90429] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                Próx. Tanda
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Estadísticas en Vivo */}
          <div className="bg-slate-900 text-white rounded-xl p-4 relative overflow-hidden shadow-md">
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-red-650 rounded-full opacity-10 filter blur-xl"></div>
            
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Estadísticas en vivo</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <span className="block text-[10px] text-slate-400">PUNTUACIÓN</span>
                <span className="text-2xl font-bold tracking-tight text-white">{totalPuntos}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">FLECHAS</span>
                <span className="text-2xl font-bold tracking-tight text-emerald-400">{totalFlechas}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
              <div>
                <span className="block text-[9px] text-slate-400">PROMEDIO</span>
                <span className="text-sm font-semibold text-indigo-300">{promedioFlecha}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400">X (Centro)</span>
                <span className="text-sm font-semibold text-amber-400">{conteoX}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400">9s/10s</span>
                <span className="text-sm font-semibold text-rose-300">{conteoDieces}</span>
              </div>
            </div>
          </div>

          {/* Guardar Control */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleGuardarControl}
              disabled={impactos.length === 0}
              className="w-full py-2.5 px-4 text-xs font-bold tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Save size={14} />
              GUARDAR CONTROL EN DIARIO
            </button>
            <button
              onClick={handleResetTodo}
              className="w-full py-2 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              Reiniciar Todo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
