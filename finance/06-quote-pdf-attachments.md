# 06 - Quote PDF Attachments

## Problem
- No way to attach PDFs to quotes
- Customers can't see attached documents
- Admins have no easy way to add attachments

## Current Implementation
- Quotes only contain text/items
- No file attachment system
- No document management

## Solution
1. **File Storage Setup**
   - Use Supabase Storage for PDF files
   - Create 'quote-attachments' bucket
   - Proper file organization by quote ID

2. **Admin Upload Interface**
   - File upload component in quote form
   - Drag & drop PDF upload
   - File size and type validation

3. **Customer View**
   - Attachments visible in public quote view
   - Download links for PDFs
   - File icons and names displayed

4. **Database Schema**
   - Store attachment metadata in quotes table
   - File URLs, names, sizes, upload timestamps

## Database Changes
```sql
-- Update quotes table for attachments
ALTER TABLE quotes ADD COLUMN attachments JSONB DEFAULT '[]';

-- Storage bucket (create via Supabase dashboard)
-- Bucket: quote-attachments
-- Public access for signed URLs
```

## Storage Bucket Policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload quote attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quote-attachments');

-- Allow public read access for quote attachments
CREATE POLICY "Public read access for quote attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'quote-attachments');
```

## Files to Modify
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Add file upload
- `src/components/quotes/FileAttachmentsManager.tsx` - New component
- `src/components/quotes/MultiBlockQuotePreview.tsx` - Show attachments
- `src/pages/PublicQuote.tsx` - Display attachments for customers

## Attachment Component
```jsx
const FileAttachmentsManager = ({ quoteId, attachments, onAttachmentsChange }) => {
  const handleFileUpload = async (files) => {
    // Upload to Supabase Storage
    // Update attachments array
    // Call onAttachmentsChange
  };

  return (
    <div className="attachments-manager">
      <FileUploadZone onUpload={handleFileUpload} />
      <AttachmentsList attachments={attachments} />
    </div>
  );
};
```

## Implementation Priority
**MEDIUM** - Enhances quote professional appearance

## Dependencies
- Quote system must be stable
- Supabase Storage setup required

## Testing
- Upload PDF to quote → file stored correctly
- Public quote view → attachments visible
- Download attachment → file accessible
- File size limits → enforced properly
- Only PDF files → validation works