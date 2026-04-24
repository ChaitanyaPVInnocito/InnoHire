ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_job_location text NOT NULL DEFAULT 'bangalore',
ADD COLUMN IF NOT EXISTS default_experience_range text NOT NULL DEFAULT '3-5';