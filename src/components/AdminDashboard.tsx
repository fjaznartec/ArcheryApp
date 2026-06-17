import React, { useState } from 'react';
import { Usuario, NoticiasActividades, ActividadTipo, NivelCompeticion, UserRole } from '../types';
import { UserCheck, UserX, PlusCircle, Newspaper, Trophy, Users, BarChart2, ShieldCheck, Check, Pencil, Trash2, Eye, X, Save, Shield } from 'lucide-react';

interface AdminDashboardProps {
  usuarioActual: Usuario;
  usuariosList: Usuario[];
  noticiasList: NoticiasActividades[];
  onToggleUserActive: (id: string) => void;
  onDeleteUsuario: (id: string) => void;
  onUpdateUsuario: (usuario: Usuario) => void;
  onAddNoticia: (noticia: NoticiasActividades) => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  usuarioActual,
  usuariosList,
  noticiasList,
  onToggleUserActive,
  onDeleteUsuario,
  onUpdateUsuario,
  onAddNoticia,
  onLogout
}: AdminDashboardProps) {
  const [rolFiltro, setRolFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  // --- Estados de Visualización y Edición de Perfiles ---
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Formulario de edición
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('arquero');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('');
  const [editLicencia, setEditLicencia] = useState('');
  const [editIdClub, setEditIdClub] = useState('');
  const [editActivo, setEditActivo] = useState(false);
  const [editFotografiaUrl, setEditFotografiaUrl] = useState('');

  const startReading = (u: Usuario) => {
    setSelectedUser(u);
    setIsEditing(false);
  };

  const startEditing = (u: Usuario) => {
    setSelectedUser(u);
    setIsEditing(true);
    setEditNombre(u.nombre);
    setEditApellidos(u.apellidos || '');
    setEditEmail(u.email);
    setEditRol(u.rol);
    setEditFechaNacimiento(u.fecha_nacimiento || '');
    setEditLicencia(u.licencia || '');
    setEditIdClub(u.id_club || '');
    setEditActivo(u.activo);
    setEditFotografiaUrl(u.fotografia_url || '');
  };

  const handleGuardarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const uActualizado: Usuario = {
      ...selectedUser,
      nombre: editNombre,
      apellidos: editApellidos,
      email: editEmail,
      rol: editRol,
      fecha_nacimiento: editFechaNacimiento,
      licencia: editLicencia,
      id_club: editIdClub || undefined,
      activo: editActivo,
      fotografia_url: editFotografiaUrl || undefined
    };

    onUpdateUsuario(uActualizado);
    alert('¡Usuario modificado con éxito!');
    setSelectedUser(null);
    setIsEditing(false);
  };

  // Formulario de Contenido
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [tipoContent, setTipoContent] = useState<ActividadTipo>('noticia');
  const [nivelComp, setNivelComp] = useState<NivelCompeticion>('Autonómico');

  const handleCrearContenido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !contenido) {
      alert('Completa el título y contenido.');
      return;
    }

    const nuevaNoticia: NoticiasActividades = {
      id: 'not-' + Date.now(),
      tipo: tipoContent,
      titulo,
      contenido,
      fecha_creacion: new Date().toISOString(),
      nivel_competicion: tipoContent === 'competicion' ? nivelComp : undefined
    };

    onAddNoticia(nuevaNoticia);
    alert('¡Noticia/Actividad guardada exitosamente y publicada en la web pública!');
    setTitulo('');
    setContenido('');
  };

  const usuariosFiltrados = usuariosList.filter(u => {
    const cumpleRol = rolFiltro === 'todos' || u.rol === rolFiltro;
    const cumpleEstado = estadoFiltro === 'todos' || 
      (estadoFiltro === 'activos' && u.activo) || 
      (estadoFiltro === 'inactivos' && !u.activo);
    return cumpleRol && cumpleEstado;
  });

  // Estadísticas analíticas
  const totalUsuarios = usuariosList.length;
  const inactivosCount = usuariosList.filter(u => !u.activo).length;
  const activosCount = usuariosList.filter(u => u.activo).length;
  const entrenadoresCount = usuariosList.filter(u => u.rol === 'tecnico_principal' || u.rol === 'tecnico_auxiliar').length;
  const arquerosCount = usuariosList.filter(u => u.rol === 'arquero').length;

  return (
    <div className="bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8" id="admin_dashboard">
      
      {/* Header superior del panel admin */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white p-2 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Panel de Administración General</h2>
            <p className="text-xs text-slate-500">Bienvenido, {usuarioActual.nombre} {usuarioActual.apellidos} • <span className="font-bold text-purple-600">Admin</span></p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
        >
          Cerrar Sesión Panel
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Bento Dashboard de Stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Usuarios Totales</span>
              <span className="text-2xl font-black text-slate-800">{totalUsuarios}</span>
            </div>
            <Users className="text-indigo-500" size={24} />
          </div>
          <div className="bg-[#ef233c] text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-red-200">Por Validar (Inactivos)</span>
              <span className="text-2xl font-black">{inactivosCount}</span>
            </div>
            <UserX size={24} />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Entrenadores</span>
              <span className="text-2xl font-black text-slate-800">{entrenadoresCount}</span>
            </div>
            <Trophy className="text-amber-500" size={24} />
          </div>
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Arqueros Federados</span>
              <span className="text-2xl font-black text-emerald-400">{arquerosCount}</span>
            </div>
            <BarChart2 size={24} />
          </div>
        </div>

        {/* Sección Izquierda: Gestión y Modificación de Usuarios */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-md font-extrabold text-slate-850">CRUD & Validación de Perfiles de Usuario</h3>
              <p className="text-xs text-slate-400">Habilita o rechaza el acceso de arqueros para que inicien sesión con su rol asignado.</p>
            </div>

            {/* Filtros rápidos */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={rolFiltro} 
                onChange={(e) => setRolFiltro(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700"
              >
                <option value="todos">Todos los Roles</option>
                <option value="admin">Administradores</option>
                <option value="tecnico_principal">Técnicos Principales</option>
                <option value="tecnico_auxiliar">Técnicos Auxiliares</option>
                <option value="arquero">Arqueros</option>
              </select>
              <select 
                value={estadoFiltro} 
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700"
              >
                <option value="todos">Cualquier Estado</option>
                <option value="activos">Aprobados (Activos)</option>
                <option value="inactivos">Bloqueados (Inactivos)</option>
              </select>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-4 py-3">Usuario / Perfil</th>
                  <th className="px-4 py-3">Rol Solicitado</th>
                  <th className="px-4 py-3">Licencia</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones de Aprobación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-150 text-slate-700">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">No hay registros con los filtros seleccionados.</td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id_usuario} className="hover:bg-slate-50">
                      <td className="px-4 py-3 flex items-center gap-2.5">
                        <img 
                          src={u.fotografia_url || 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100&h=100&fit=crop'} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-100" 
                          alt="avatar" 
                        />
                        <div>
                          <p className="font-bold text-slate-800">{u.nombre} {u.apellidos}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.rol === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : u.rol === 'tecnico_principal' 
                            ? 'bg-blue-105 text-blue-700' 
                            : u.rol === 'tecnico_auxiliar' 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.rol === 'admin' 
                            ? 'Admin' 
                            : u.rol === 'tecnico_principal' 
                            ? 'Tec. Principal' 
                            : u.rol === 'tecnico_auxiliar' 
                            ? 'Tec. Auxiliar' 
                            : 'Arquero'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-500">{u.licencia || '---'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.activo ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.activo ? 'Activo / Aprobado' : 'Inactivo / Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => startReading(u)}
                            title="Leer Datos de Registro (Ver Ficha)"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition active:scale-95 flex items-center justify-center cursor-pointer"
                          >
                            <Eye size={13} />
                          </button>
                          
                          <button
                            onClick={() => startEditing(u)}
                            title="Modificar Datos de Registro"
                            className="p-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition active:scale-95 flex items-center justify-center cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            onClick={() => onToggleUserActive(u.id_usuario)}
                            title={u.activo ? 'Colocar como Inactivo' : 'Validar y Aprobar'}
                            className={`p-1.5 rounded-lg border transition active:scale-95 flex items-center justify-center cursor-pointer ${
                              u.activo 
                                ? 'bg-amber-50 text-amber-655 border-amber-200 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.activo ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>

                          <button
                            onClick={() => onDeleteUsuario(u.id_usuario)}
                            title="Eliminar Registro de Usuario"
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition active:scale-95 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección Derecha: Publicación de Noticias y Eventos */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-md font-extrabold text-slate-850 flex items-center gap-1.5">
              <PlusCircle className="text-purple-600" size={18} />
              Gestor de Contenidos
            </h3>
            <p className="text-xs text-slate-400">Publica avisos federativos, actividades oficiales y competiciones en el panel público.</p>
          </div>

          <form onSubmit={handleCrearContenido} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Entrada</label>
              <select 
                value={tipoContent} 
                onChange={(e) => setTipoContent(e.target.value as ActividadTipo)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700"
              >
                <option value="noticia">Noticia general</option>
                <option value="actividad">Actividad del club</option>
                <option value="competicion">Competición Oficial</option>
              </select>
            </div>

            {tipoContent === 'competicion' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nivel Competición</label>
                <select 
                  value={nivelComp} 
                  onChange={(e) => setNivelComp(e.target.value as NivelCompeticion)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700"
                >
                  <option value="Autonómico">Autonómico</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título del Anuncio</label>
              <input 
                type="text" 
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 placeholder-slate-400"
                placeholder="Ej. Campeonato Autonómico de Sala 18m"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción / Contenido</label>
              <textarea 
                required
                rows={4}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 placeholder-slate-400"
                placeholder="Escribe el cuerpo del anuncio o bases de la actividad oficial aquí..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              Publicar Contenido
            </button>
          </form>

          {/* Historial rápido de creados recientemente */}
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Publicaciones Recientes</span>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {noticiasList.slice(0, 3).map((n) => (
                <div key={n.id} className="p-2.5 bg-slate-50 rounded-lg flex gap-1.5 items-start">
                  <Newspaper className="text-slate-400 shrink-0 mt-0.5" size={13} />
                  <div>
                    <p className="font-bold text-[11px] text-slate-800 truncate">{n.titulo}</p>
                    <p className="text-[9px] text-slate-400">Tipo: <strong className="text-purple-600">{n.tipo}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE DETALLES O EDICIÓN DE USUARIO */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del modal */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="bg-purple-600 p-1.5 rounded-lg text-white">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">
                    {isEditing ? 'Modificar Registro de Usuario' : 'Ficha de Registro Completa'}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    ID: {selectedUser.id_usuario}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setIsEditing(false); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo del modal (Scrollable si es largo) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Información de cabecera visual */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <img 
                  src={isEditing ? editFotografiaUrl || 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100&h=100&fit=crop' : selectedUser.fotografia_url || 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100&h=100&fit=crop'} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-purple-500"
                  alt="Perfil"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {isEditing ? `${editNombre} ${editApellidos}` : `${selectedUser.nombre} ${selectedUser.apellidos}`}
                  </h4>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {isEditing ? editEmail : selectedUser.email}
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-black text-[9px] uppercase tracking-wide">
                      {isEditing ? editRol : selectedUser.rol}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${
                      (isEditing ? editActivo : selectedUser.activo) ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {(isEditing ? editActivo : selectedUser.activo) ? 'Activo' : 'Pendiente / Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing ? (
                /* --- FORMULARIO DE EDICIÓN (MODIFICAR) --- */
                <form onSubmit={handleGuardarUsuario} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Nombre *</label>
                      <input 
                        type="text"
                        required
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Apellidos *</label>
                      <input 
                        type="text"
                        required
                        value={editApellidos}
                        onChange={(e) => setEditApellidos(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Email *</label>
                      <input 
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Licencia Federativa *</label>
                      <input 
                        type="text"
                        required
                        value={editLicencia}
                        onChange={(e) => setEditLicencia(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Rol Asignado</label>
                      <select 
                        value={editRol}
                        onChange={(e) => setEditRol(e.target.value as UserRole)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-bold animate-none"
                      >
                        <option value="arquero">Arquero Federado</option>
                        <option value="tecnico_principal">Técnico Principal</option>
                        <option value="tecnico_auxiliar">Técnico Auxiliar</option>
                        <option value="admin">Administrador General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Fecha de Nacimiento *</label>
                      <input 
                        type="date"
                        required
                        value={editFechaNacimiento}
                        onChange={(e) => setEditFechaNacimiento(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">ID de Club</label>
                      <input 
                        type="text"
                        value={editIdClub}
                        onChange={(e) => setEditIdClub(e.target.value)}
                        placeholder="Club de origen"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Fotografía URL (Dejar vacío para predeterminada)</label>
                      <input 
                        type="url"
                        value={editFotografiaUrl}
                        onChange={(e) => setEditFotografiaUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... o similar"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex bg-slate-50 p-3.5 border border-slate-150 rounded-lg items-center justify-between">
                    <div>
                      <span className="block font-bold text-slate-800 text-xs">Estado de Cuenta Activa *</span>
                      <span className="text-[10px] text-slate-400">Determina si el usuario tiene permiso completo de inicio de sesión.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editActivo}
                        onChange={(e) => setEditActivo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Save size={14} />
                      Guardar Cambios Registro
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition"
                    >
                      Volver a Ficha
                    </button>
                  </div>
                </form>
              ) : (
                /* --- VISTA DE LECTURA (LEER DATOS) --- */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Nombre de Pila</span>
                      <span className="font-bold text-slate-800 text-[13px]">{selectedUser.nombre}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Apellidos</span>
                      <span className="font-bold text-slate-800 text-[13px]">{selectedUser.apellidos}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Correo Electrónico</span>
                      <span className="font-mono text-slate-700 text-[11px] font-bold">{selectedUser.email}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Licencia Federativa</span>
                      <span className="font-mono text-indigo-700 text-[11px] font-extrabold">{selectedUser.licencia || 'Ninguna registrada'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Fecha de Nacimiento</span>
                      <span className="font-medium text-slate-700">{selectedUser.fecha_nacimiento || 'No registrada'}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Identificador de Club</span>
                      <span className="font-mono text-slate-655 font-bold">{selectedUser.id_club || '---'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Fecha de Alta Sistema</span>
                      <span className="font-medium text-slate-500">{selectedUser.fecha_alta ? new Date(selectedUser.fecha_alta).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase font-extrabold text-slate-400">Estado de Validación</span>
                      <span className={`font-extrabold text-[11px] ${selectedUser.activo ? 'text-teal-600' : 'text-red-500'}`}>
                        {selectedUser.activo ? 'Validado y Habilitado' : 'Pendiente de Validación'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => startEditing(selectedUser)}
                      className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-705 text-white text-[11px] font-extrabold uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Pencil size={13} />
                      Modificar estos Datos
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setIsEditing(false); }}
                      className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-705 text-[11px] font-bold rounded-lg transition"
                    >
                      Cerrar Ficha
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
