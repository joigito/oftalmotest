-- ============================================
-- MIGRACIÓN: Admin Médicos CRUD
-- ============================================
-- RLS policies + SECURITY DEFINER functions
-- ============================================

-- 1. RLS: Admin puede ver todos los médicos
CREATE POLICY "Admin ve todos los medicos" ON medicos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol = 'admin')
  );

-- 2. RLS: Admin puede actualizar cualquier médico
CREATE POLICY "Admin actualiza medicos" ON medicos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol = 'admin')
  );

-- 3. RLS: Admin puede eliminar médicos
CREATE POLICY "Admin elimina medicos" ON medicos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM medicos m WHERE m.auth_user_id = auth.uid() AND m.rol = 'admin')
  );

-- 4. Función: actualizar médico (nombre, email, rol)
CREATE OR REPLACE FUNCTION actualizar_medico(
  p_medico_id UUID,
  p_nombre TEXT,
  p_email TEXT,
  p_rol TEXT
) RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE medicos SET
    nombre = p_nombre,
    email = p_email,
    rol = p_rol
  WHERE id = p_medico_id;
END;
$$;

-- 5. Función: eliminar médico con limpieza
CREATE OR REPLACE FUNCTION eliminar_medico(
  p_medico_id UUID
) RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- Desvincular pruebas
  UPDATE pruebas SET medico_id = NULL WHERE medico_id = p_medico_id;
  -- Desvincular creador en turnos
  UPDATE turnos SET creado_por = NULL WHERE creado_por = p_medico_id;
  -- DELETE cascade a turnos y medico_paciente, auth.user queda huérfano
  DELETE FROM medicos WHERE id = p_medico_id;
END;
$$;

-- ============================================
-- DOWN: Revertir esta migración
-- ============================================
-- DROP POLICY IF EXISTS "Admin ve todos los medicos" ON medicos;
-- DROP POLICY IF EXISTS "Admin actualiza medicos" ON medicos;
-- DROP POLICY IF EXISTS "Admin elimina medicos" ON medicos;
-- DROP FUNCTION IF EXISTS actualizar_medico(UUID, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS eliminar_medico(UUID);
