-- 대시보드에서 anon 키만 쓸 때 (선택). service_role 쓰면 불필요.
ALTER TABLE public.hecto_promo_influencers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hecto_promo_influencers_select_anon" ON public.hecto_promo_influencers;
CREATE POLICY "hecto_promo_influencers_select_anon"
  ON public.hecto_promo_influencers
  FOR SELECT
  TO anon
  USING (true);
