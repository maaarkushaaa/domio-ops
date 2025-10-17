-- Allow deal owners to delete their own deals
DROP POLICY IF EXISTS deals_delete_owner ON public.deals;
CREATE POLICY deals_delete_owner ON public.deals
  FOR DELETE
  USING (auth.uid() = owner_id);
