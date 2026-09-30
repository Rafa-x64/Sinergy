-- Sincronizar secuencias autoincrementales de PostgreSQL con los valores máximos actuales
DO $$
DECLARE
  r RECORD;
  max_id BIGINT;
BEGIN
  FOR r IN 
    SELECT 
      c.table_name,
      c.column_name,
      pg_get_serial_sequence(quote_ident(c.table_name), c.column_name) AS sequence_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
      AND c.column_default LIKE 'nextval%'
  LOOP
    IF r.sequence_name IS NOT NULL THEN
      EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_id;
      IF max_id > 0 THEN
        EXECUTE format('SELECT setval(%L, %s, true)', r.sequence_name, max_id);
      ELSE
        EXECUTE format('SELECT setval(%L, 1, false)', r.sequence_name);
      END IF;
    END IF;
  END LOOP;
END $$;
