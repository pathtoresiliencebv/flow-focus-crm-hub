
export interface QuoteItem {
  id: string;
  type: 'product' | 'textblock';
  description: string;
  quantity?: number;
  unit_price?: number;
  vat_rate: number;
  total?: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

export interface QuoteBlock {
  id: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  vat_amount: number;
  order_index: number;
}

export interface Quote {
  id?: string;
  quote_number: string;
  customer_name: string;
  customer_email?: string;
  project_title?: string;
  quote_date: string;
  valid_until: string;
  message?: string;
  blocks: QuoteBlock[];
  total_amount: number;
  total_vat_amount: number;
  status: string;
  public_token?: string;
  admin_signature_data?: string;
  client_signature_data?: string;
  client_name?: string;
  client_signed_at?: string;
}
