-- Enable Row Level Security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Applications table policies
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft applications" ON public.applications
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- Documents table policies
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Appointments table policies
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id AND status IN ('scheduled', 'rescheduled'));

-- Payments table policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Analyses table policies (read-only for users)
CREATE POLICY "Users can view own AI analyses" ON public.ai_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Activity logs table policies (read-only for users)
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Saved jobs table policies
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON public.saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs" ON public.saved_jobs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON public.saved_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for secure operations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check if user owns an application
CREATE OR REPLACE FUNCTION public.user_owns_application(app_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.applications
        WHERE id = app_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's application stats
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
    total_applications BIGINT,
    active_applications BIGINT,
    completed_applications BIGINT,
    total_documents BIGINT,
    upcoming_appointments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT a.id) AS total_applications,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('draft', 'in_progress', 'submitted')) AS active_applications,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('approved', 'rejected')) AS completed_applications,
        COUNT(DISTINCT d.id) AS total_documents,
        COUNT(DISTINCT ap.id) FILTER (WHERE ap.appointment_date > NOW() AND ap.status = 'scheduled') AS upcoming_appointments
    FROM public.users u
    LEFT JOIN public.applications a ON u.id = a.user_id
    LEFT JOIN public.documents d ON u.id = d.user_id
    LEFT JOIN public.appointments ap ON u.id = ap.user_id
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;