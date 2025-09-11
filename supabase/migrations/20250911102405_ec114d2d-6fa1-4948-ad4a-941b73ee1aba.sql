-- Insert test quote to test the workflow
INSERT INTO public.quotes (
  quote_number,
  customer_name,
  customer_email,
  project_title,
  quote_date,
  valid_until,
  message,
  items,
  subtotal,
  vat_amount,
  total_amount,
  status,
  public_token
) VALUES (
  'OFF-2025-0001',
  'Test Klant BV',
  'test@testklant.nl',
  'Test Installatie Project',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'Dit is een test offerte voor het testen van de workflow.',
  '[
    {
      "id": "block-1",
      "title": "Materialen",
      "type": "product",
      "order_index": 0,
      "subtotal": 1000,
      "vat_amount": 210,
      "items": [
        {
          "id": "item-1",
          "type": "product",
          "description": "Warmtepomp installatie",
          "quantity": 1,
          "unit_price": 800,
          "vat_rate": 21,
          "total": 800
        },
        {
          "id": "item-2", 
          "type": "product",
          "description": "Installatiekosten",
          "quantity": 1,
          "unit_price": 200,
          "vat_rate": 21,
          "total": 200
        }
      ]
    },
    {
      "id": "block-2",
      "title": "Extra diensten",
      "type": "product", 
      "order_index": 1,
      "subtotal": 500,
      "vat_amount": 105,
      "items": [
        {
          "id": "item-3",
          "type": "product",
          "description": "Onderhoudscontract 1 jaar",
          "quantity": 1,
          "unit_price": 500,
          "vat_rate": 21,
          "total": 500
        }
      ]
    }
  ]'::jsonb,
  1500.00,
  315.00,
  1815.00,
  'concept',
  'testquote123'
);