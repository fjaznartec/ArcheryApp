import React, { useState } from 'react';
import { Target, ShieldAlert, Award, Calendar, BookOpen, Mail, UserPlus, LogIn, Database, ChevronRight, Copy, Check, Users } from 'lucide-react';
import { Usuario, NoticiasActividades, GrupoEntrenamiento, UserRole } from '../types';
import { SUAPBASE_SQL_SCHEMA } from '../db/supabase-schema';

interface PublicPageProps {
  noticias: NoticiasActividades[];
  grupos: GrupoEntrenamiento[];
  usuariosExistentes: Usuario[];
  onRegister: (nuevoUsuario: Usuario) => void;
  onLogin: (usuario: Usuario) => void;
  onMockUserSwitch: (rol: 'admin' | 'tecnico_principal' | 'tecnico_auxiliar' | 'arquero') => void;
}

export default function PublicPage({
  noticias,
  grupos,
  usuariosExistentes,
  onRegister,
  onLogin,
  onMockUserSwitch
}: PublicPageProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'noticias' | 'grupos' | 'documentos' | 'base_de_datos' | 'contacto'>('inicio');
  
  // Formulario Registro State
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRol, setRegRol] = useState<UserRole>('arquero');
  const [regNacimiento, setRegNacimiento] = useState('2004-05-15');
  const [regLicencia, setRegLicencia] = useState('');
  const [regClub, setRegClub] = useState('Club Arco Silense');
  const [regFotoUrl, setRegFotoUrl] = useState('');

  // Formulario Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // SQL Copy State
  const [sqlCopied, setSqlCopied] = useState(false);

  // Simulación foto de perfil al azar
  const handleRandomAvatar = () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const rand = ids[Math.floor(Math.random() * ids.length)];
    setRegFotoUrl(`https://images.unsplash.com/photo-${rand === 1 ? '1534528741775-53994a69daeb' : (rand === 2 ? '1507003211169-0a1dd7228f2d' : '1500648767791-00dcc994a43e')}?w=150&h=150&fit=crop`);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regApellidos || !regEmail) {
      alert('Por favor, completa los campos requeridos (Nombre, Apellidos y Email).');
      return;
    }

    // El requerimiento ordena insertar inicialmente con activo = False
    const nuevoUsuario: Usuario = {
      id_usuario: 'usr-' + Math.random().toString(36).substr(2, 9),
      nombre: regNombre,
      apellidos: regApellidos,
      email: regEmail,
      rol: regRol,
      fecha_nacimiento: regNacimiento,
      licencia: regLicencia || `LIC-${Math.floor(Math.random() * 90000 + 10000)}`,
      id_club: regClub,
      activo: false, // ¡Requerimiento crítico de flujo!
      fecha_alta: new Date().toISOString()
    };

    if (regFotoUrl) {
      nuevoUsuario.fotografia_url = regFotoUrl;
    } else {
      // Foto genérica de tiro con arco
      nuevoUsuario.fotografia_url = 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=150&h=150&fit=crop';
    }

    onRegister(nuevoUsuario);
    alert(`¡Registro completado! Tu cuenta se creó con 'activo = False' por seguridad. Un administrador de ArcheryApp debe validar tu perfil para que puedas iniciar sesión.`);
    
    // Limpiar formulario de registro
    setRegNombre('');
    setRegApellidos('');
    setRegEmail('');
    setRegLicencia('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const u = usuariosExistentes.find(us => us.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!u) {
      setLoginError('El correo electrónico no coincide con ninguna cuenta registrada.');
      return;
    }

    // Validar estado de activación (activo = False)
    if (!u.activo) {
      setLoginError('Cuenta inactiva. Tu registro como arquero o técnico requiere validación previa del Administrador de la plataforma.');
      return;
    }

    onLogin(u);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUAPBASE_SQL_SCHEMA);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="landing_publico">
      {/* Header Landing */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#ef233c] text-white p-2 rounded-xl flex items-center justify-center">
              <Target size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">Archery<span className="text-[#ef233c]">App</span></span>
            </div>
          </div>

          <nav className="hidden md:flex gap-1">
            <button 
              onClick={() => setActiveTab('inicio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'inicio' ? 'bg-[#ef233c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Inicio/Acceso
            </button>
            <button 
              onClick={() => setActiveTab('noticias')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'noticias' ? 'bg-[#ef233c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Noticias & Actividades
            </button>
            <button 
              onClick={() => setActiveTab('grupos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'grupos' ? 'bg-[#ef233c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Grupos
            </button>
            <button 
              onClick={() => setActiveTab('documentos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'documentos' ? 'bg-[#ef233c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Instrucciones / Documentos
            </button>
            <button 
              onClick={() => setActiveTab('base_de_datos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'base_de_datos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1`}
            >
              <Database size={12} />
              Supabase SQL
            </button>
            <button 
              onClick={() => setActiveTab('contacto')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'contacto' ? 'bg-[#ef233c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Contacto
            </button>
          </nav>

          {/* Quick Mock Mode Switcher inside public area for demo convenience */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold self-center mr-1 hidden sm:inline">DEMO ACCESO RÁPIDO:</span>
            <button 
              onClick={() => onMockUserSwitch('admin')}
              className="px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-[10px] font-bold rounded-md uppercase"
              title="Acceso inmediato directo como Administrador"
            >
              Admin
            </button>
            <button 
              onClick={() => onMockUserSwitch('tecnico_principal')}
              className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px] font-bold rounded-md uppercase"
              title="Acceso inmediato directo como Técnico Principal"
            >
              Téc. Principal
            </button>
            <button 
              onClick={() => onMockUserSwitch('tecnico_auxiliar')}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-[10px] font-bold rounded-md uppercase"
              title="Acceso inmediato directo como Técnico Auxiliar"
            >
              Téc. Auxiliar
            </button>
            <button 
              onClick={() => onMockUserSwitch('arquero')}
              className="px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-bold rounded-md uppercase"
              title="Acceso inmediato directo como Arquero Activo"
            >
              Arquero
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Areas based on tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'inicio' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Pitch / Intro */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <Award size={13} strokeWidth={2} />
                <span>Proyecto de Ingeniería de Arquería Deportiva</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 leading-tight tracking-tight">
                Plataforma de Alto Rendimiento para <span className="text-[#ef233c]">Tiro con Arco</span>
              </h1>
              <p className="text-slate-600 text-base leading-relaxed">
                ArcheryApp es una solución de software modular e integral diseñada para unificar la planificación del cuerpo técnico con el entrenamiento diario del arquero. Cuenta con dianas interactivas configurables FITA, contador rápido para control de volumen de disparo y un motor analítico avanzado.
              </p>

              {/* Bento-like mini features */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border-l-4 border-amber-400 p-4 rounded-r-xl shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest mb-1">DIANA INTERACTIVA</h3>
                  <p className="text-[11px] text-slate-500">Mapeo oficial de impactos para 122cm, triple vertical Recurvo/Compuesto y cálculos de puntuación precisos de X a M.</p>
                </div>
                <div className="bg-white border-l-4 border-[#ef233c] p-4 rounded-r-xl shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest mb-1">PLANIFICACIÓN</h3>
                  <p className="text-[11px] text-slate-500">Gestión de periodización táctica: Macrociclos, Mesociclos y Microciclos grupales o personalizados por el técnico.</p>
                </div>
                <div className="bg-white border-l-4 border-teal-400 p-4 rounded-r-xl shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest mb-1">DIARIO DE ARQUERO</h3>
                  <p className="text-[11px] text-slate-500">Registro de sensaciones mentales, estado físico, variaciones de visor en setups e informes directos de feedback.</p>
                </div>
              </div>

              {/* Probar la plataforma quickly */}
              <div className="p-4 bg-amber-50-custom border border-amber-100 rounded-xl flex items-start gap-3">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-900 leading-normal">
                  <p className="font-bold mb-1">Control de Acceso de Roles (RBAC):</p>
                  Por defecto, al registrarte la cuenta quedará como <strong>Inactiva (activo=False)</strong>. Puedes ingresar con el correo registrado y luego cambiar de Rol arriba a "Admin" para ver a los usuarios pendientes y aprobarlos. ¡Es intuitivo y simula el flujo real de base de datos de producción!
                </div>
              </div>
            </div>

            {/* Right side: Login & Register Forms */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Acceso Form */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-md p-6">
                <h3 className="text-md font-extrabold text-slate-850 mb-4 flex items-center gap-1.5">
                  <LogIn size={20} className="text-[#ef233c]" />
                  Ingreso a ArcheryApp
                </h3>
                
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico Registrado</label>
                    <input 
                      type="email" 
                      placeholder="arquero.campeon@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  
                  {loginError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg font-medium">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg shadow-sm transition"
                  >
                    Iniciar Sesión
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-105 flex justify-between text-[11px] text-slate-400">
                  <span>Prueba con: <strong>archery.coach.fjan@gmail.com</strong></span>
                  <span className="text-[#ef233c]">Estado: Coach Activo</span>
                </div>
              </div>

              {/* Registro Form */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-md p-6">
                <h3 className="text-md font-extrabold text-slate-850 mb-3 flex items-center gap-1.5">
                  <UserPlus size={20} className="text-[#ef233c]" />
                  Formulario de Registro
                </h3>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre *</label>
                      <input 
                        type="text" 
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Apellidos *</label>
                      <input 
                        type="text" 
                        required
                        value={regApellidos}
                        onChange={(e) => setRegApellidos(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="usuario@dominio.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de Nacimiento</label>
                      <input 
                        type="date" 
                        value={regNacimiento}
                        onChange={(e) => setRegNacimiento(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rol Solicitado</label>
                      <select 
                        value={regRol}
                        onChange={(e) => setRegRol(e.target.value as UserRole)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="arquero">Arquero</option>
                        <option value="tecnico_principal">Técnico Principal</option>
                        <option value="tecnico_auxiliar">Técnico Auxiliar</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nº Licencia (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="71992A"
                        value={regLicencia}
                        onChange={(e) => setRegLicencia(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Club Federado</label>
                      <input 
                        type="text" 
                        value={regClub}
                        onChange={(e) => setRegClub(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between">
                      <span>Fotografía de Perfil (Simular almacenamiento)</span>
                      <button 
                        type="button" 
                        onClick={handleRandomAvatar}
                        className="text-[#ef233c] hover:underline font-extrabold text-[9px]"
                      >
                        [Elegir Foto Demo]
                      </button>
                    </label>
                    <input 
                      type="text" 
                      placeholder="https://images.unsplash.com/..."
                      value={regFotoUrl}
                      onChange={(e) => setRegFotoUrl(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-850 focus:outline-none"
                    />
                    {regFotoUrl && (
                      <div className="mt-2 flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg">
                        <img src={regFotoUrl} className="w-10 h-10 rounded-full object-cover border" alt="preview" />
                        <span className="text-[10px] text-slate-500 truncate">{regFotoUrl}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition"
                  >
                    Registrar Cuenta Nueva
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'noticias' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Canal de Noticias y Actividades Federadas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n) => (
                <div key={n.id} className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                        n.tipo === 'competicion' ? 'bg-rose-100 text-[#ef233c]' : n.tipo === 'actividad' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {n.tipo}
                      </span>
                      {n.nivel_competicion && (
                        <span className="text-[10px] text-slate-400 font-semibold">{n.nivel_competicion}</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800 mb-2">{n.titulo}</h3>
                    <p className="text-xs text-slate-550 leading-relaxed line-clamp-3">{n.contenido}</p>
                  </div>
                  <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Creado: {n.fecha_creacion.split('T')[0]}</span>
                    <button onClick={() => alert(n.contenido)} className="text-[#ef233c] hover:underline font-bold flex items-center">
                      Leer más <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'grupos' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Grupos de Entrenamiento Activos</h2>
            <p className="text-sm text-slate-500">Muestra los grupos coordinados por la escuela técnica del club.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grupos.map((g) => (
                <div key={g.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 inline-block mb-3">
                      <Users size={18} />
                    </div>
                    <h3 className="text-md font-bold text-slate-800 mb-1">{g.nombre_grupo}</h3>
                    <p className="text-xs text-slate-500 mb-4">Director Técnico: <strong className="text-slate-700">{g.nombre_tecnico || 'Desconocido'}</strong></p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-400">
                    <span>Estado: <strong>Inscripciones Abiertas</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-800">Documentos e Instrucciones del Club</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <BookOpen size={20} className="text-[#ef233c]" />
                <h3 className="font-bold text-sm text-slate-800">Guía de Diana Triple Spot Vertical</h3>
                <p className="text-xs text-slate-500">Especial para modalidades de Sala (18 metros). Divide la puntuación por tanda alternando entre el spot superior, central e inferior para evitar rotura de flechas (Robin Hoods).</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <Calendar size={20} className="text-[#ef233c]" />
                <h3 className="font-bold text-sm text-slate-800">Protocolo de Planificación Deportiva</h3>
                <p className="text-xs text-slate-500">Macro/Meso/Microciclo asignado por entrenadores de nivel FITA. Los arqueros deben registrar su diario y flechas diariamente para retroalimentación automatizada.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'base_de_datos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Database className="text-slate-900" />
                  Arquitectura Supabase (PostgreSQL Schema)
                </h2>
                <p className="text-xs text-slate-500">Script SQL oficial generado para reproducir el modelo relacional relativas, triggers nativos y políticas RLS (Row Level Security)</p>
              </div>
              
              <button 
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                {sqlCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {sqlCopied ? '¡Copiado!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Estructura del Proyecto */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Arquitectura de Proyecto Recomendada</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para implementar esta WebApp de alto rendimiento de manera segura y escalable, proponemos la siguiente organización de directorios en un entorno moderno de React / Vite con Supabase Client.
                </p>
                <div className="bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded-xl overflow-x-auto select-all leading-normal whitespace-pre">
{`archeryapp-front/
├── .env.local             # Variables (SUPABASE_URL)
├── supabase/              # Configuración local CLI
│   ├── config.toml
│   └── migrations/        # Scripts SQL autogenerados
├── src/
│   ├── components/        # Componentes Modulares
│   │   ├── ui/            # UI Genérica (Botones)
│   │   ├── DianaInteractiva.tsx # Diana Interactiva
│   │   └── ContadorFlechas.tsx  # Contador Rápido
│   ├── db/
│   │   └── supabase-schema.ts   # Declaración SQL
│   ├── hooks/
│   │   └── useSupabase.ts # Hooks reactivos de BD
│   ├── views/
│   │   ├── AdminDashboard.tsx
│   │   ├── TecnicoDashboard.tsx
│   │   ├── ArqueroDashboard.tsx
│   │   └── PublicLanding.tsx
│   ├── lib/
│   │   └── supabaseClient.ts # Singleton Supabase SDK
│   ├── types.ts           # Interfaces TypeScript
│   ├── index.css          # Tailwind Estilos
│   ├── App.tsx            # Ruteador principal
│   └── main.tsx
├── package.json
└── tsconfig.json`}
                </div>
              </div>

              {/* Contenedor del código SQL */}
              <div className="lg:col-span-8 bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-400 font-mono">SUPABASE_MIGRATION_INITIAL.sql</span>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded">PostgreSQL v15+</span>
                </div>
                <div className="p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[500px]">
                  <pre className="whitespace-pre">{SUAPBASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacto' && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 max-w-xl mx-auto text-center shadow-sm">
            <Mail size={32} className="mx-auto text-[#ef233c]" />
            <h2 className="text-xl font-bold text-slate-800">Ponte en contacto con la Escuela de Tiro con Arco</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              ¿Eres administrador, técnico o arquero buscando incorporarte a las competiciones o requieres que tu club federado configure una estancia en base de datos dedicada?
            </p>
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-slate-650 text-left">
              <p>📍 <strong>Instalaciones:</strong> Club Asirio d Tiro con Arco, Huelva.</p>
              <p>✉️ <strong>Email Técnico Asignado:</strong> archery.coach.fjan@gmail.com</p>
              <p>📞 <strong>Soporte Técnico de Plataforma de Entrenamiento:</strong> +34 687 567 832</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© 2026 ArcheryApp - Plataforma para el tiro con arco. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
