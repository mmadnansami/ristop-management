GRANT INSERT ON public.subscription_requests TO anon;

DROP POLICY IF EXISTS subreq_anon_insert ON public.subscription_requests;
CREATE POLICY subreq_anon_insert
ON public.subscription_requests
FOR INSERT
TO anon
WITH CHECK (
  length(btrim(name)) >= 1
  AND length(btrim(name)) <= 120
  AND length(btrim(email)) >= 3
  AND length(btrim(email)) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(phone)) >= 5
  AND length(btrim(phone)) <= 30
  AND length(btrim(transaction_id)) >= 3
  AND length(btrim(transaction_id)) <= 120
  AND payment_method = ANY (ARRAY['bkash', 'nagad', 'rocket', 'bank'])
  AND amount > 0
  AND amount <= 1000000
  AND status = 'pending'::req_status
  AND notes IS NULL
);