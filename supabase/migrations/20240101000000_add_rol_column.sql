-- ============================================
-- MIGRACIÓN: Sistema de roles
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Agregar columna rol a medicos
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'medico' CHECK (rol IN ('admin', 'medico', 'secretario'));

-- 2. Tu usuario como admin (jorgediaz@hotmail.com)
UPDATE medicos SET rol = 'admin' WHERE email = 'jorgediaz@hotmail.com';

-- 3. Verificar
SELECT email, rol FROM medicos ORDER BY email;
