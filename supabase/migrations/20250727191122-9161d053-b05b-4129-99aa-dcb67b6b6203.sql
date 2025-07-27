-- Create receipts table for receipt management
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_from TEXT,
  subject TEXT,
  amount DECIMAL(10,2),
  description TEXT,
  category TEXT,
  receipt_file_url TEXT NOT NULL,
  receipt_file_name TEXT NOT NULL,
  receipt_file_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  email_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on receipts table
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for receipts
CREATE POLICY "Users can view receipts" 
ON public.receipts 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

CREATE POLICY "Users can create their own receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update receipts" 
ON public.receipts 
FOR UPDATE 
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

CREATE POLICY "Users can update their own pending receipts" 
ON public.receipts 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false);

-- Create storage policies for receipts bucket
CREATE POLICY "Users can view receipts they uploaded" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
);

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all receipts" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'receipts' AND 
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Create trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();