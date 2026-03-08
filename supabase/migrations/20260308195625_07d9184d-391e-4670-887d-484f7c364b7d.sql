
-- Add image_url column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to update their product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');
