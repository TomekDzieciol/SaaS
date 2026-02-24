-- Zezwól zalogowanym na aktualizację kategorii (kto może, weryfikuje Server Action po e-mailu admina)
CREATE POLICY "Authenticated can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
