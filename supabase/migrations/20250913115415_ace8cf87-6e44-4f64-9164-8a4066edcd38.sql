-- Test offerte aanmaken via een functie
INSERT INTO quotes (
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
  payment_terms,
  attachments
) VALUES (
  'OFF-2025-TEST-001',
  'Test Klant B.V.',
  'test@testklant.nl', 
  'Complete Badkamer Renovatie',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'Bedankt voor uw interesse in onze diensten. Hierbij ontvangt u onze offerte voor de badkamer renovatie.',
  '[
    {
      "id": "block-1",
      "title": "Sanitair & Tegels", 
      "type": "product",
      "order_index": 0,
      "subtotal": 2500.00,
      "vat_amount": 525.00,
      "items": [
        {
          "id": "item-1",
          "type": "product",
          "description": "Douche installatie compleet",
          "quantity": 1,
          "unit_price": 850.00,
          "vat_rate": 21,
          "total": 850.00
        },
        {
          "id": "item-2", 
          "type": "product",
          "description": "Tegels vloer en wand (20m²)",
          "quantity": 20,
          "unit_price": 45.00,
          "vat_rate": 21,
          "total": 900.00
        },
        {
          "id": "item-3",
          "type": "product", 
          "description": "Toilet en wastafel set",
          "quantity": 1,
          "unit_price": 750.00,
          "vat_rate": 21,
          "total": 750.00
        }
      ]
    },
    {
      "id": "block-2",
      "title": "Werkzaamheden",
      "type": "product", 
      "order_index": 1,
      "subtotal": 1800.00,
      "vat_amount": 378.00,
      "items": [
        {
          "id": "item-4",
          "type": "product",
          "description": "Loodgieterswerk (16 uur à €75)",
          "quantity": 16,
          "unit_price": 75.00,
          "vat_rate": 21,
          "total": 1200.00
        },
        {
          "id": "item-5",
          "type": "product",
          "description": "Tegelwerk (8 uur à €75)", 
          "quantity": 8,
          "unit_price": 75.00,
          "vat_rate": 21,
          "total": 600.00
        }
      ]
    },
    {
      "id": "block-3",
      "title": "Voorwaarden",
      "type": "textblock",
      "order_index": 2, 
      "subtotal": 0,
      "vat_amount": 0,
      "content": "Alle werkzaamheden worden uitgevoerd conform de geldende normen en volgens de planning.",
      "items": [
        {
          "id": "item-6",
          "type": "textblock",
          "description": "• Werkzaamheden worden uitgevoerd op werkdagen tussen 08:00-17:00\n• Materialen zijn inclusief transport\n• Garantie: 2 jaar op werkzaamheden, fabrieksgarantie op materialen",
          "vat_rate": 0,
          "formatting": {"bold": true}
        }
      ]
    }
  ]'::jsonb,
  4300.00,
  903.00,
  5203.00,
  'concept',
  '[
    {"percentage": 50, "description": "Vooruitbetaling bij start", "due_days": 0},
    {"percentage": 50, "description": "Restbetaling bij oplevering", "due_days": 30}
  ]'::jsonb,
  '[]'::jsonb
);