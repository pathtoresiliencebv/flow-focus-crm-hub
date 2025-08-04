-- Performance optimization migration
-- Add comprehensive indexes for frequently queried columns

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_assigned_user_id ON projects(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status_assigned_user ON projects(status, assigned_user_id);

-- Project tasks indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_is_completed ON project_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_project_tasks_block_title ON project_tasks(block_title);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_completed ON project_tasks(project_id, is_completed);

-- Planning items indexes  
CREATE INDEX IF NOT EXISTS idx_planning_items_assigned_user_id ON planning_items(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_start_date ON planning_items(start_date);
CREATE INDEX IF NOT EXISTS idx_planning_items_status ON planning_items(status);
CREATE INDEX IF NOT EXISTS idx_planning_items_project_id ON planning_items(project_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_user_date ON planning_items(assigned_user_id, start_date);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_name ON quotes(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes(public_token) WHERE public_token IS NOT NULL;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_source_quote_id ON invoices(source_quote_id) WHERE source_quote_id IS NOT NULL;

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_type ON invoice_items(type);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order_index ON invoice_items(invoice_id, order_index);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Chat channels indexes
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_created_by ON chat_channels(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_channels_project_id ON chat_channels(project_id) WHERE project_id IS NOT NULL;

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_mobile_dashboard ON projects(assigned_user_id, status) 
  WHERE status IN ('gepland', 'in-uitvoering', 'herkeuring');

CREATE INDEX IF NOT EXISTS idx_planning_mobile_view ON planning_items(assigned_user_id, start_date, status) 
  WHERE status IN ('Gepland', 'In uitvoering');

CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(status, due_date) 
  WHERE status IN ('verzonden', 'concept');

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_projects_title_search ON projects USING gin(to_tsvector('dutch', title));
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('dutch', name));
CREATE INDEX IF NOT EXISTS idx_quotes_search ON quotes USING gin(to_tsvector('dutch', customer_name || ' ' || COALESCE(project_title, '')));

-- Optimize frequently used RLS policies with indexes
CREATE INDEX IF NOT EXISTS idx_projects_rls_optimization ON projects(id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_rls_optimization ON planning_items(id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_rls_optimization ON chat_messages(id, sender_id);

-- Add table statistics refresh function
CREATE OR REPLACE FUNCTION refresh_table_statistics()
RETURNS void AS $$
BEGIN
  -- Refresh statistics for better query planning
  ANALYZE projects;
  ANALYZE project_tasks;
  ANALYZE planning_items;
  ANALYZE quotes;
  ANALYZE invoices;
  ANALYZE invoice_items;
  ANALYZE chat_messages;
  ANALYZE chat_channels;
  ANALYZE profiles;
  ANALYZE customers;
  
  RAISE NOTICE 'Table statistics refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create maintenance function for index health
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::text,
    s.tablename::text,
    s.indexname::text,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan ASC;
END;
$$ LANGUAGE plpgsql;

-- Optimize query for mobile dashboard
CREATE OR REPLACE VIEW mobile_project_dashboard AS
SELECT 
  p.id,
  p.title,
  p.status,
  p.assigned_user_id,
  p.customer_id,
  c.name as customer_name,
  p.created_at,
  COUNT(pt.id) as total_tasks,
  COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as completed_tasks,
  CASE 
    WHEN COUNT(pt.id) = 0 THEN 0
    ELSE ROUND((COUNT(CASE WHEN pt.is_completed = true THEN 1 END) * 100.0) / COUNT(pt.id))
  END as completion_percentage
FROM projects p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN project_tasks pt ON p.id = pt.project_id
WHERE p.status IN ('gepland', 'in-uitvoering', 'herkeuring')
GROUP BY p.id, p.title, p.status, p.assigned_user_id, p.customer_id, c.name, p.created_at;

-- Enable RLS on the view (it inherits from base tables)
-- Views don't need explicit RLS but will respect base table policies