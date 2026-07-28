-- ============================================
-- MIGRACIÓN: Modelo Médico-Paciente compartido
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Crear tabla médicos (1:1 con auth.users)
CREATE TABLE IF NOT EXISTS medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para lookup rápido por auth_user_id
CREATE INDEX IF NOT EXISTS idx_medicos_auth_user_id ON medicos(auth_user_id);

-- 2. Tabla pivote médico-paciente (muchos a muchos)
CREATE TABLE IF NOT EXISTS medico_paciente (
  medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (medico_id, paciente_id)
);

CREATE INDEX IF NOT EXISTS idx_medico_paciente_paciente ON medico_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medico_paciente_activo ON medico_paciente(medico_id, activo) WHERE activo = TRUE;

-- 3. Modificar tabla pacientes: quitar consultorio_id (opcional, hacer en pasos)
-- Primero agregar columna médico_creador_id para auditoría
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medico_creador_id UUID REFERENCES medicos(id);

-- 4. Modificar tabla pruebas: cambiar consultorio_id por medico_id
ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS medico_id UUID REFERENCES medicos(id);

-- 5. Poblar medico_id en pruebas existentes (asumir consultorio fijo → buscar médico asociado)
-- NOTA: Ejecutar solo si hay datos existentes y tenés un médico por defecto
-- UPDATE pruebas SET medico_id = (SELECT id FROM medicos LIMIT 1) WHERE medico_id IS NULL;

-- 6. Hacer medico_id NOT NULL en pruebas (después de poblar)
-- ALTER TABLE pruebas ALTER COLUMN medico_id SET NOT NULL;

-- 7. Opcional: quitar consultorio_id de pacientes y pruebas (después de migrar datos)
-- ALTER TABLE pacientes DROP COLUMN IF EXISTS consultorio_id;
-- ALTER TABLE pruebas DROP COLUMN IF EXISTS consultorio_id;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medico_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruebas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: medicos
-- ============================================
-- Cada médico ve su propio registro
CREATE POLICY "Medico ve su perfil" ON medicos
  FOR SELECT USING (auth_user_id = auth.uid());

-- Médico puede actualizar su propio perfil
CREATE POLICY "Medico actualiza su perfil" ON medicos
  FOR UPDATE USING (auth_user_id = auth.uid());

-- ============================================
-- POLÍTICAS: pacientes
-- ============================================
-- Médico ve pacientes vinculados a él (activos)
CREATE POLICY "Medico ve sus pacientes" ON pacientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medico_paciente mp
      JOIN medicos m ON m.id = mp.medico_id
      WHERE mp.paciente_id = pacientes.id
        AND mp.activo = TRUE
        AND m.auth_user_id = auth.uid()
    )
  );

-- Médico puede CREAR pacientes (se vincula automáticamente via trigger/app)
CREATE POLICY "Medico crea pacientes" ON pacientes
  FOR INSERT WITH CHECK (true);

-- Médico puede ACTUALIZAR sus pacientes
CREATE POLICY "Medico actualiza sus pacientes" ON pacientes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM medico_paciente mp
      JOIN medicos m ON m.id = mp.medico_id
      WHERE mp.paciente_id = pacientes.id
        AND mp.activo = TRUE
        AND m.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: medico_paciente
-- ============================================
-- Médico ve sus vínculos
CREATE POLICY "Medico ve sus vinculos" ON medico_paciente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = medico_paciente.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Médico puede CREAR vínculos (al crear paciente o vincular existente)
CREATE POLICY "Medico crea vinculos" ON medico_paciente
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = medico_paciente.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Médico puede ACTUALIZAR sus vínculos (desactivar/activar)
CREATE POLICY "Medico actualiza sus vinculos" ON medico_paciente
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = medico_paciente.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: pruebas
-- ============================================
-- Médico ve sus pruebas (las que él realizó)
CREATE POLICY "Medico ve sus pruebas" ON pruebas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = pruebas.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Médico ve TODAS las pruebas de SUS pacientes (historial compartido)
CREATE POLICY "Medico ve historial de sus pacientes" ON pruebas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medico_paciente mp
      JOIN medicos m ON m.id = mp.medico_id
      WHERE mp.paciente_id = pruebas.paciente_id
        AND mp.activo = TRUE
        AND m.auth_user_id = auth.uid()
    )
  );

-- Médico puede CREAR pruebas (para sus pacientes)
CREATE POLICY "Medico crea pruebas" ON pruebas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medico_paciente mp
      JOIN medicos m ON m.id = mp.medico_id
      WHERE mp.paciente_id = pruebas.paciente_id
        AND mp.activo = TRUE
        AND m.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGER: Auto-vincular paciente al médico que lo crea
-- ============================================
CREATE OR REPLACE FUNCTION vincular_paciente_a_medico()
RETURNS TRIGGER AS $$
DECLARE
  v_medico_id UUID;
BEGIN
  -- Buscar médico del usuario autenticado
  SELECT id INTO v_medico_id FROM medicos WHERE auth_user_id = auth.uid();
  
  IF v_medico_id IS NOT NULL THEN
    -- Guardar quién lo creó
    NEW.medico_creador_id := v_medico_id;
    
    -- Crear vínculo automáticamente (INSERT en medico_paciente)
    INSERT INTO medico_paciente (medico_id, paciente_id, activo)
    VALUES (v_medico_id, NEW.id, TRUE)
    ON CONFLICT (medico_id, paciente_id) DO UPDATE SET activo = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_vincular_paciente ON pacientes;
CREATE TRIGGER trigger_vincular_paciente
  AFTER INSERT ON pacientes
  FOR EACH ROW EXECUTE FUNCTION vincular_paciente_a_medico();

-- ============================================
-- FUNCIÓN AUXILIAR: Obtener médico actual
-- ============================================
CREATE OR REPLACE FUNCTION get_current_medico_id()
RETURNS UUID AS $$
  SELECT id FROM medicos WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- NOTAS DE APLICACIÓN
-- ============================================
-- 1. Ejecutar este SQL en Supabase Dashboard → SQL Editor
-- 2. Después crear registro en 'medicos' para cada usuario:
--    INSERT INTO medicos (auth_user_id, nombre, email)
--    VALUES ('uuid-del-auth-user', 'Dr. Juan Pérez', 'juan@email.com');
-- 3. En el código: quitar consultorioId hardcodeado, usar get_current_medico_id()
-- 4. Al crear paciente: NO pasar medico_id, el trigger lo vincula automáticamente
-- 5. Al guardar prueba: medico_id = get_current_medico_id()