-- Create partner_applications table
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  ande_bill_url TEXT,
  cedula_front_url TEXT,
  cedula_back_url TEXT,
  has_iva BOOLEAN DEFAULT false,
  iva_movements_url TEXT,
  tax_compliance_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit application)
CREATE POLICY "Anyone can submit partner application"
ON public.partner_applications
FOR INSERT
WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.partner_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.partner_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false);

-- RLS for partner documents bucket
CREATE POLICY "Anyone can upload partner documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'partner-documents');

CREATE POLICY "Admins can view partner documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'partner-documents' AND has_role(auth.uid(), 'admin'::app_role));