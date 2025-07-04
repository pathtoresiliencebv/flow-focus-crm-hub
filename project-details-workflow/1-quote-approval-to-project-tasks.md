# Quote Approval to Project Tasks Workflow

## Overzicht
Wanneer een offerte wordt goedgekeurd (status: 'goedgekeurd'), worden automatisch project taken gegenereerd voor de installateur.

## Automatische Taak Generatie

### Database Trigger
- **Trigger**: `trigger_auto_generate_project_tasks`
- **Functie**: `auto_generate_project_tasks()`
- **Activatie**: Wanneer quote status verandert naar 'goedgekeurd'

### Taak Types
1. **Product Taken**: Afklikbare taken voor installateur
   - Type: `product`
   - `is_info_block: false`
   - Komen uit quote product items

2. **Info Blokken**: Informatieve tekstblokken
   - Type: `textblock` 
   - `is_info_block: true`
   - Komen uit quote tekstblokken

### Gegenereerde Velden
- `project_id`: Gekoppeld project
- `block_title`: Naam van het quote blok
- `task_description`: Beschrijving van de taak
- `source_quote_block_id`: Referentie naar originele quote item
- `quote_item_type`: Type van het originele quote item
- `order_index`: Volgorde van de taken

## Installateur Interface
- Taken worden getoond in `MobileProjectView.tsx`
- Product taken kunnen worden afgevinkt
- Info blokken zijn alleen ter informatie
- Voortgang wordt bijgehouden per project

## Voordelen
- **Automatisering**: Geen handmatige taak creatie
- **Consistentie**: Alle quote items worden taken
- **Traceerbaarheid**: Link tussen quote en uitvoering
- **Efficiency**: Installateur ziet exact wat te doen

## Database Schema
```sql
-- Project tasks met quote koppeling
ALTER TABLE project_tasks 
ADD COLUMN source_quote_block_id TEXT,
ADD COLUMN quote_item_type TEXT DEFAULT 'product';
```

## Gebruik
1. Quote goedkeuren via admin interface
2. Systeem genereert automatisch taken
3. Installateur ziet taken in mobiele app
4. Taken afvinken tijdens uitvoering
5. Project opleveren met handtekeningen