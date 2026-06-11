ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_days integer;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS validity_start date;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS validity_end date;