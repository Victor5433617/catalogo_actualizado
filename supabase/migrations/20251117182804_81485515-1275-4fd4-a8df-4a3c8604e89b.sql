-- Create credit applications table
CREATE TABLE public.credit_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  numero_cedula TEXT NOT NULL,
  direccion TEXT NOT NULL,
  gastos_mensuales NUMERIC NOT NULL,
  ingreso_mensual NUMERIC NOT NULL,
  monto_credito NUMERIC NOT NULL,
  plazo_meses INTEGER NOT NULL,
  cedula_front_url TEXT,
  cedula_back_url TEXT,
  factura_ande_url TEXT,
  certificado_trabajo_url TEXT,
  referencia_1_nombre TEXT NOT NULL,
  referencia_1_telefono TEXT NOT NULL,
  referencia_1_direccion TEXT NOT NULL,
  referencia_2_nombre TEXT NOT NULL,
  referencia_2_telefono TEXT NOT NULL,
  referencia_2_direccion TEXT NOT NULL,
  gastos_familiares_aproximado NUMERIC NOT NULL,
  gastos_energia NUMERIC NOT NULL,
  gastos_alquiler NUMERIC NOT NULL DEFAULT 0,
  gastos_combustible NUMERIC NOT NULL DEFAULT 0,
  gastos_internet NUMERIC NOT NULL,
  cuotas_bancarias_cooperativas TEXT,
  ingreso_ventas_contribuyente NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.credit_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for credit applications
CREATE POLICY "Anyone can submit credit application" 
ON public.credit_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all credit applications" 
ON public.credit_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update credit applications" 
ON public.credit_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_credit_applications_updated_at
BEFORE UPDATE ON public.credit_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for credit documents
INSERT INTO storage.buckets (id, name, public) VALUES ('credit-documents', 'credit-documents', false);

-- Create policies for credit documents bucket
CREATE POLICY "Anyone can upload credit documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'credit-documents');

CREATE POLICY "Admins can view credit documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'credit-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete credit documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'credit-documents' AND has_role(auth.uid(), 'admin'::app_role));