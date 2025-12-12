-- Create push_subscriptions table for storing web push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(id_cliente, endpoint)
);

-- Create index for faster lookups by id_cliente
CREATE INDEX idx_push_subscriptions_id_cliente ON public.push_subscriptions(id_cliente);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow insert for authenticated users (their own subscription)
CREATE POLICY "Users can insert own subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy: Allow select for authenticated users (their own subscription)
CREATE POLICY "Users can select own subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Allow delete for authenticated users (their own subscription)
CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (true);

-- Create policy: Allow update for authenticated users (their own subscription)
CREATE POLICY "Users can update own subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING (true);

-- Create table for rate limiting push notifications
CREATE TABLE public.push_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'register' or 'send'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for rate limit lookups
CREATE INDEX idx_push_rate_limits_lookup ON public.push_rate_limits(id_cliente, action_type, created_at);

-- Enable RLS on rate limits table
ALTER TABLE public.push_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.push_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create table for push notification audit logs
CREATE TABLE public.push_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id_cliente TEXT,
  recipient_id_cliente TEXT NOT NULL,
  nr_atendimento TEXT,
  title TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit log lookups
CREATE INDEX idx_push_audit_logs_created ON public.push_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.push_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage audit logs
CREATE POLICY "Service role can manage audit logs"
ON public.push_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);