-- FIX: Sta meer MIME types toe voor quote attachments
-- Het probleem: PDFs worden soms gedetecteerd als text/plain

-- Update de bucket om meer mime types toe te staan
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/x-pdf',
  'text/plain',  -- Sommige PDFs worden hierals gedetecteerd
  'application/octet-stream'  -- Fallback voor andere bestanden
]
WHERE id = 'quote-attachments';

-- Verificatie: check de bucket configuratie
SELECT id, name, allowed_mime_types, file_size_limit 
FROM storage.buckets 
WHERE id = 'quote-attachments';

