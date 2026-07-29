CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION crear_medico(
  p_nombre TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_medico JSON;
  v_sr_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhenRsbXNnd3d0bGJidnNoeGV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE2NTk3NywiZXhwIjoyMDk0NzQxOTc3fQ.gSwLCcKk9-F390z3aUftXuyvkMBkJvItgu8qYzjMOmM';
  v_req_id BIGINT;
  v_retries INT := 0;
BEGIN
  v_user_id := (SELECT id FROM auth.users WHERE email = p_email LIMIT 1);
  
  IF v_user_id IS NULL THEN
    v_req_id := net.http_post(
      url := 'https://daztlmsgwwtlbbvshxet.supabase.co/auth/v1/admin/users',
      body := jsonb_build_object('email', p_email, 'password', p_password, 'email_confirm', true),
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'apikey', v_sr_key,
        'Authorization', format('Bearer %s', v_sr_key)
      )
    );

    LOOP
      PERFORM pg_sleep(0.3);
      v_user_id := (SELECT id FROM auth.users WHERE email = p_email LIMIT 1);
      EXIT WHEN v_user_id IS NOT NULL OR v_retries >= 15;
      v_retries := v_retries + 1;
    END LOOP;

    IF v_user_id IS NULL THEN
      RETURN json_build_object('error', 'No se pudo crear el usuario en Supabase Auth');
    END IF;
  END IF;

  INSERT INTO medicos (auth_user_id, email, nombre, rol)
  VALUES (v_user_id, p_email, p_nombre, 'medico')
  ON CONFLICT (auth_user_id) DO UPDATE SET nombre = p_nombre
  RETURNING json_build_object('id', id, 'nombre', nombre, 'email', email) INTO v_medico;

  RETURN v_medico;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
