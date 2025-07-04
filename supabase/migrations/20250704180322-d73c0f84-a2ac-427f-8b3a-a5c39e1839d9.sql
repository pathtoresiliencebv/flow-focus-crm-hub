-- Add notification template for quote approval emails
INSERT INTO notification_templates (
  name, 
  description, 
  template_type, 
  subject_template, 
  body_template, 
  variables, 
  is_active
) VALUES (
  'quote_approved_admin_notification',
  'Notification sent to admin when a quote is approved by client',
  'email',
  'Offerte {{quote_number}} goedgekeurd door {{customer_name}}',
  '<div style="background-color: #dc2626; padding: 20px; text-align: center; color: white;">
    <img src="{{logo_url}}" alt="SMANS" style="max-height: 60px; margin-bottom: 10px;">
    <h1 style="color: white; margin: 10px 0;">Offerte Goedgekeurd!</h1>
  </div>
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <p>Goed nieuws! De offerte <strong>{{quote_number}}</strong> voor klant <strong>{{customer_name}}</strong> is goedgekeurd.</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Offerte Details:</h3>
      <p><strong>Klant:</strong> {{customer_name}}</p>
      <p><strong>Project:</strong> {{project_title}}</p>
      <p><strong>Bedrag:</strong> {{total_amount}}</p>
      <p><strong>Goedgekeurd op:</strong> {{approved_date}}</p>
    </div>
    <p>De PDF van de goedgekeurde offerte is als bijlage toegevoegd.</p>
    <p>Het project en concept factuur zijn automatisch aangemaakt in het systeem.</p>
  </div>',
  '[
    "quote_number",
    "customer_name", 
    "project_title",
    "total_amount",
    "approved_date",
    "logo_url"
  ]'::jsonb,
  true
);