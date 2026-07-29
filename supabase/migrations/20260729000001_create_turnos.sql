-- ============================================
-- MIGRACIÓN: Turnos (appointment scheduling)
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Crear tabla turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 30,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado')),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ,
  creado_por UUID NOT NULL REFERENCES medicos(id)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_turnos_medico_fecha ON turnos(medico_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);

-- 3. RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Política: médico ve sus propios turnos
CREATE POLICY "Medico ve sus turnos" ON turnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = turnos.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Política: admin/secretario ven todos los turnos
CREATE POLICY "Admin y secretario ven todos los turnos" ON turnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol IN ('admin', 'secretario')
    )
  );

-- Política: médico crea turnos (propios)
CREATE POLICY "Medico crea turnos" ON turnos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = turnos.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Política: admin crea turnos para cualquier médico
CREATE POLICY "Admin crea turnos" ON turnos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol IN ('admin', 'secretario')
    )
  );

-- Política: médico actualiza sus propios turnos
CREATE POLICY "Medico actualiza sus turnos" ON turnos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.id = turnos.medico_id AND m.auth_user_id = auth.uid()
    )
  );

-- Política: admin/secretario actualizan cualquier turno
CREATE POLICY "Admin y secretario actualizan turnos" ON turnos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol IN ('admin', 'secretario')
    )
  );

-- ============================================
-- DOWN: Descomentar para revertir
-- ============================================
-- DROP TABLE IF EXISTS turnos;
