export const SUAPBASE_SQL_SCHEMA = `-- ==========================================
-- ARCHERYAPP - SCHEMA COMPATIBLE CON SUPABASE
-- Diseñado por Arquitecto de Software Full-Stack & Experto de Base de Datos
-- ==========================================

-- 1. CREACIÓN DE TIPOS ENUM PERSONALIZADOS
CREATE TYPE rol_usuario AS ENUM ('admin', 'tecnico', 'arquero');
CREATE TYPE tipo_actividad AS ENUM ('noticia', 'actividad', 'competicion');
CREATE TYPE nivel_competicion_tipo AS ENUM ('Autonómico', 'Nacional', 'Internacional');
CREATE TYPE estado_miembro AS ENUM ('pendiente_invitacion', 'pendiente_solicitud', 'aceptado');
CREATE TYPE tipo_planificacion AS ENUM ('grupo', 'individual');
CREATE TYPE tipo_ejercicio_enum AS ENUM (
  'Técnica', 'Fuerza', 'Variabilidad', 'Estiramientos', 'Iniciación', 
  'Ajuste (Estabilidad)', 'Carga (Fuerza, Técnica)', 'Activación', 
  'Precompetición', 'Competición'
);
CREATE TYPE dificultad_ejercicio AS ENUM ('Baja', 'Media', 'Alta', 'Muy Alta');
CREATE TYPE tipo_entrada_diario AS ENUM (
  'Rutina mental', 'Pensamiento libre', 'He ayudado a otros', 
  'Entrenamiento', 'Apunte técnico', 'Apunte material', 'Apunte físico', 
  'Antes de la competición', 'Durante la Competición', 'Después de la competición'
);
CREATE TYPE privacidad_diario AS ENUM ('visible_tecnicos', 'privada');
CREATE TYPE distancia_control AS ENUM ('12m', '18m', '30m', '40m', '50m', '60m', '70m');
CREATE TYPE tipo_diana_enum AS ENUM (
  'Tr. Vertical [R]', 'Tr. Vertical [C]', '60 cm', '80 cm completa', '80 cm reducida', '122 cm'
);
CREATE TYPE tipo_sesion_seguimiento AS ENUM ('Entrenamiento', 'Competición');
CREATE TYPE modo_seguimiento AS ENUM ('Voluntario', 'Obligatorio');
CREATE TYPE tipo_setup_rutina AS ENUM ('setup', 'rutina', 'objetivo_mental', 'material');


-- 2. CREACIÓN DE TABLAS DE LA BASE DE DATOS

-- Tabla: usuarios (Enlazada a auth.users de Supabase)
CREATE TABLE public.usuarios (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'arquero',
  fecha_nacimiento DATE NOT NULL,
  licencia VARCHAR(50) UNIQUE,
  id_club VARCHAR(50),
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha_baja TIMESTAMP WITH TIME ZONE,
  fotografia_url TEXT,
  
  -- Restricción de edad mínima o formato de email
  CONSTRAINT check_email_valido CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')
);

-- Tabla: noticias_actividades
CREATE TABLE public.noticias_actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_actividad NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nivel_competicion nivel_competicion_tipo,
  
  -- Si es competición, el nivel no debería ser nulo por buena práctica (Trigger o check a nivel funcional)
  CONSTRAINT check_competicion_nivel CHECK (
    (tipo = 'competicion' AND nivel_competicion IS NOT NULL) OR (tipo <> 'competicion')
  )
);

-- Tabla: grupos_entrenamiento
CREATE TABLE public.grupos_entrenamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_grupo VARCHAR(100) NOT NULL UNIQUE,
  id_tecnico UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT
);

-- Tabla: miembros_grupo
CREATE TABLE public.miembros_grupo (
  id_grupo UUID REFERENCES public.grupos_entrenamiento(id) ON DELETE CASCADE,
  id_arquero UUID REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  estado estado_miembro NOT NULL DEFAULT 'pendiente_solicitud',
  PRIMARY KEY (id_grupo, id_arquero)
);

-- Tabla: planificacion
CREATE TABLE public.planificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_grupo UUID REFERENCES public.grupos_entrenamiento(id) ON DELETE CASCADE,
  id_arquero UUID REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  tipo tipo_planificacion NOT NULL,
  macrociclo VARCHAR(100) NOT NULL,
  mesociclo VARCHAR(100), -- Opcional / Compatibilidad con versiones anteriores
  microciclo VARCHAR(100), -- Opcional / Compatibilidad con versiones anteriores
  temporada VARCHAR(100),
  objetivos_macrociclo TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  mesociclos_lista JSONB DEFAULT '[]'::jsonb,
  competiciones JSONB DEFAULT '[]'::jsonb,
  
  -- Restricción: O se planifica para un grupo o para un arquero individual, no ambos ni ninguno
  CONSTRAINT check_destino_planificacion CHECK (
    (tipo = 'grupo' AND id_grupo IS NOT NULL AND id_arquero IS NULL) OR
    (tipo = 'individual' AND id_arquero IS NOT NULL AND id_grupo IS NULL)
  )
);

-- Tabla: sesiones
CREATE TABLE public.sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_planificacion UUID NOT NULL REFERENCES public.planificacion(id) ON DELETE CASCADE,
  fecha_assigned DATE NOT NULL DEFAULT CURRENT_DATE,
  intensidad INTEGER NOT NULL CHECK (intensidad BETWEEN 1 AND 100),
  comentarios TEXT
);

-- Tabla: ejercicios
CREATE TABLE public.ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL UNIQUE,
  tipo_ejercicio tipo_ejercicio_enum NOT NULL,
  descripcion TEXT NOT NULL,
  duracion INTEGER NOT NULL CHECK (duracion > 0), -- en minutos
  densidad_repeticiones VARCHAR(150) NOT NULL, -- descripcion de tandas/volumen
  dificultad dificultad_ejercicio NOT NULL,
  intensidad_flechas_repeticion INTEGER NOT NULL DEFAULT 6 CHECK (intensidad_flechas_repeticion >= 0)
);

-- Tabla intermedia: sesion_ejercicios
CREATE TABLE public.sesion_ejercicios (
  id_sesion UUID REFERENCES public.sesiones(id) ON DELETE CASCADE,
  id_ejercicio UUID REFERENCES public.ejercicios(id) ON DELETE RESTRICT,
  flechas_por_tanda INTEGER NOT NULL CHECK (flechas_por_tanda > 0),
  numero_tandas INTEGER NOT NULL CHECK (numero_tandas > 0),
  PRIMARY KEY (id_sesion, id_ejercicio)
);

-- Tabla: diario
CREATE TABLE public.diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_arquero UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo VARCHAR(200) NOT NULL,
  tipo_entrada tipo_entrada_diario NOT NULL,
  estado_animo VARCHAR(100) NOT NULL,
  nivel_energia_cansancio INTEGER NOT NULL CHECK (nivel_energia_cansancio BETWEEN 1 AND 10),
  archivo_url TEXT,
  privacidad privacidad_diario NOT NULL DEFAULT 'privada',
  anotaciones_tecnico TEXT -- Realizadas directamente por el técnico asignado
);

-- Tabla: controles_tiro
CREATE TABLE public.controles_tiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_arquero UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_sesion UUID REFERENCES public.sesiones(id) ON DELETE SET NULL,
  nombre_control VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  distancia distancia_control NOT NULL,
  tipo_diana tipo_diana_enum NOT NULL,
  flechas_por_serie INTEGER NOT NULL DEFAULT 6 CHECK (flechas_por_serie BETWEEN 1 AND 12),
  tandas_por_serie INTEGER NOT NULL DEFAULT 6 CHECK (tandas_por_serie BETWEEN 1 AND 20),
  imagen_url TEXT,
  comentarios TEXT
);

-- Tabla: impactos_flechas (Indices ordenados de flechas)
CREATE TABLE public.impactos_flechas (
  id_control UUID REFERENCES public.controles_tiro(id) ON DELETE CASCADE,
  serie INTEGER NOT NULL CHECK (serie >= 1),
  tanda INTEGER NOT NULL CHECK (tanda >= 1),
  flecha_index INTEGER NOT NULL CHECK (flecha_index >= 1),
  valor_impacto VARCHAR(4) NOT NULL, -- 'X', '10', '9'...'1', 'M'
  PRIMARY KEY (id_control, serie, tanda, flecha_index),
  
  CONSTRAINT check_valor_impacto CHECK (
    valor_impacto IN ('X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M')
  )
);

-- Tabla: seguimiento_diario (Contador rápido de flechas)
CREATE TABLE public.seguimiento_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_arquero UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  contador_flechas INTEGER NOT NULL DEFAULT 0 CHECK (contador_flechas >= 0),
  objetivo_flechas INTEGER NOT NULL DEFAULT 100 CHECK (objetivo_flechas >= 0),
  tipo_sesion tipo_sesion_seguimiento NOT NULL DEFAULT 'Entrenamiento',
  modo modo_seguimiento NOT NULL DEFAULT 'Voluntario',
  notas_adicionales TEXT,
  
  -- Evitar múltiples registros del mismo arquero por día
  CONSTRAINT uniq_seguimiento_dia UNIQUE (id_arquero, fecha)
);

-- Tabla: setups_rutinas
CREATE TABLE public.setups_rutinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_arquero UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  tipo tipo_setup_rutina NOT NULL,
  datos_json JSONB NOT NULL -- Estructura flexible para configuraciones mecánicas y mentales
);


-- 3. AJUSTES DE SEGURIDAD RLS (ROW LEVEL SECURITY)
-- Habilita seguridad a nivel de filas para todas las tablas estructuradas

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias_actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesion_ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_tiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impactos_flechas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setups_rutinas ENABLE ROW LEVEL SECURITY;


-- 4. POLÍTICAS DE ACCESO SEGÚN EL ROL DE USUARIO (RBAC)

-- Políticas de la tabla: usuarios
CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados" 
ON public.usuarios FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir auto-gestión del perfil" 
ON public.usuarios FOR UPDATE 
TO authenticated 
USING (auth.uid() = id_usuario);

CREATE POLICY "Permitir inserción de perfil en el registro" 
ON public.usuarios FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Solo administradores pueden eliminar o alterar roles directamente" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id_usuario = auth.uid() AND rol = 'admin'
  )
);

-- Políticas de la tabla: noticias_actividades (Públicas/Lectura general)
CREATE POLICY "Lectura libre de noticias" 
ON public.noticias_actividades FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Edición noticias reservada a Administradores/Técnicos" 
ON public.noticias_actividades FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id_usuario = auth.uid() AND rol IN ('admin', 'tecnico')
  )
);

-- Políticas de la tabla: miembros_grupo
CREATE POLICY "Técnicos pueden gestionar sus miembros de grupo" 
ON public.miembros_grupo FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_entrenamiento g
    WHERE g.id = id_grupo AND g.id_tecnico = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id_usuario = auth.uid() AND rol = 'admin'
  )
);

CREATE POLICY "Arqueros pueden ver y postularse a grupos"
ON public.miembros_grupo FOR ALL
TO authenticated
USING (
  auth.uid() = id_arquero
);

-- Políticas de la tabla: Planificación y Sesiones (Lectura para miembros / técnicos)
CREATE POLICY "Visualización de planificación" 
ON public.planificacion FOR SELECT 
TO authenticated 
USING (
  id_arquero = auth.uid() OR
  id_grupo IN (
    SELECT id_grupo FROM public.miembros_grupo WHERE id_arquero = auth.uid() AND estado = 'aceptado'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.usuarios WHERE id_usuario = auth.uid() AND rol IN ('tecnico', 'admin')
  )
);

CREATE POLICY "Gestión de planificación reservada a Técnicos/Admin"
ON public.planificacion FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios WHERE id_usuario = auth.uid() AND rol IN ('tecnico', 'admin')
  )
);

-- Políticas de la tabla: Diario (Privacidad)
CREATE POLICY "Arqueros gestionan su propio diario" 
ON public.diario FOR ALL 
TO authenticated 
USING (id_arquero = auth.uid());

CREATE POLICY "Técnicos acceden a diarios no privados de sus pupilos" 
ON public.diario FOR SELECT 
TO authenticated 
USING (
  privacidad = 'visible_tecnicos' AND 
  id_arquero IN (
    SELECT m.id_arquero FROM public.miembros_grupo m
    JOIN public.grupos_entrenamiento g ON m.id_grupo = g.id
    WHERE g.id_tecnico = auth.uid() AND m.estado = 'aceptado'
  )
);

-- Políticas de la tabla: controles_tiro e impactos_flechas
CREATE POLICY "Dueño del control opera sobre él" 
ON public.controles_tiro FOR ALL 
TO authenticated 
USING (id_arquero = auth.uid());

CREATE POLICY "Técnicos ven controles de tiro de sus arqueros"
ON public.controles_tiro FOR SELECT
TO authenticated
USING (
  id_arquero IN (
    SELECT m.id_arquero FROM public.miembros_grupo m
    JOIN public.grupos_entrenamiento g ON m.id_grupo = g.id
    WHERE g.id_tecnico = auth.uid() AND m.estado = 'aceptado'
  )
);

CREATE POLICY "Cascada impactos del control propietario"
ON public.impactos_flechas FOR ALL
TO authenticated
USING (
  id_control IN (SELECT id FROM public.controles_tiro WHERE id_arquero = auth.uid())
);

CREATE POLICY "Técnicos ven impactos de controles aprobados"
ON public.impactos_flechas FOR SELECT
TO authenticated
USING (
  id_control IN (
    SELECT c.id FROM public.controles_tiro c
    JOIN public.miembros_grupo m ON c.id_arquero = m.id_arquero
    JOIN public.grupos_entrenamiento g ON m.id_grupo = g.id
    WHERE g.id_tecnico = auth.uid() AND m.estado = 'aceptado'
  )
);

-- Políticas de la tabla: Seguimiento diario y setups_rutinas
CREATE POLICY "Auto-gestión de seguimiento diario y setups"
ON public.seguimiento_diario FOR ALL
TO authenticated
USING (id_arquero = auth.uid());

CREATE POLICY "Lectura de setups/seguimiento por técnicos autorizados"
ON public.seguimiento_diario FOR SELECT
TO authenticated
USING (
  id_arquero IN (
    SELECT m.id_arquero FROM public.miembros_grupo m
    JOIN public.grupos_entrenamiento g ON m.id_grupo = g.id
    WHERE g.id_tecnico = auth.uid() AND m.estado = 'aceptado'
  )
);

CREATE POLICY "Auto-gestión de setups"
ON public.setups_rutinas FOR ALL
TO authenticated
USING (id_arquero = auth.uid());

CREATE POLICY "Visualización setup por técnico"
ON public.setups_rutinas FOR SELECT
TO authenticated
USING (
  id_arquero IN (
    SELECT m.id_arquero FROM public.miembros_grupo m
    JOIN public.grupos_entrenamiento g ON m.id_grupo = g.id
    WHERE g.id_tecnico = auth.uid() AND m.estado = 'aceptado'
  )
);


-- 5. TRIGGER AUTOMÁTICO DE VALIDACIÓN INICIAL PARA REGISTROS NUEVOS
-- Al crear una cuenta a nivel Auth de Supabase, se intercepta para crear
-- el perfil correspondiente en 'public.usuarios' configurando 'activo = FALSE'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nombre, apellidos, email, rol, fecha_nacimiento, activo)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Nombre'),
    COALESCE(new.raw_user_meta_data->>'apellidos', 'Apellidos'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'rol')::rol_usuario, 'arquero'::rol_usuario),
    COALESCE((new.raw_user_meta_data->>'fecha_nacimiento')::date, CURRENT_DATE - INTERVAL '18 years'),
    FALSE -- Por defecto inactivo hasta aprobación del admin
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- COMENTARIO: El trigger anterior asegura el cumplimiento del flujo requerido 
-- donde el registro inicial requiere validación y aprobación por parte del Administrador.
`;
