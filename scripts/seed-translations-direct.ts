/**
 * Direct Translation Seeding Script (No File System Dependencies)
 * Seeds common UI translations directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';

const LANGUAGES = ['nl', 'en', 'pl', 'ro', 'tr'];

// Common translations voor key UI elementen
const COMMON_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Buttons
  'button_save': {
    nl: 'Opslaan',
    en: 'Save',
    pl: 'Zapisz',
    ro: 'Salvează',
    tr: 'Kaydet'
  },
  'button_cancel': {
    nl: 'Annuleren',
    en: 'Cancel',
    pl: 'Anuluj',
    ro: 'Anulează',
    tr: 'İptal'
  },
  'button_delete': {
    nl: 'Verwijderen',
    en: 'Delete',
    pl: 'Usuń',
    ro: 'Șterge',
    tr: 'Sil'
  },
  'button_edit': {
    nl: 'Bewerken',
    en: 'Edit',
    pl: 'Edytuj',
    ro: 'Editează',
    tr: 'Düzenle'
  },
  'button_add': {
    nl: 'Toevoegen',
    en: 'Add',
    pl: 'Dodaj',
    ro: 'Adaugă',
    tr: 'Ekle'
  },
  'button_new': {
    nl: 'Nieuw',
    en: 'New',
    pl: 'Nowy',
    ro: 'Nou',
    tr: 'Yeni'
  },
  'button_close': {
    nl: 'Sluiten',
    en: 'Close',
    pl: 'Zamknij',
    ro: 'Închide',
    tr: 'Kapat'
  },
  'button_send': {
    nl: 'Verzenden',
    en: 'Send',
    pl: 'Wyślij',
    ro: 'Trimite',
    tr: 'Gönder'
  },
  'button_search': {
    nl: 'Zoeken',
    en: 'Search',
    pl: 'Szukaj',
    ro: 'Caută',
    tr: 'Ara'
  },
  'button_filter': {
    nl: 'Filteren',
    en: 'Filter',
    pl: 'Filtruj',
    ro: 'Filtrează',
    tr: 'Filtrele'
  },
  
  // Navigation
  'nav_dashboard': {
    nl: 'Dashboard',
    en: 'Dashboard',
    pl: 'Panel',
    ro: 'Panou de control',
    tr: 'Gösterge Paneli'
  },
  'nav_quotes': {
    nl: 'Offertes',
    en: 'Quotes',
    pl: 'Oferty',
    ro: 'Oferte',
    tr: 'Teklifler'
  },
  'nav_invoices': {
    nl: 'Facturen',
    en: 'Invoices',
    pl: 'Faktury',
    ro: 'Facturi',
    tr: 'Faturalar'
  },
  'nav_projects': {
    nl: 'Projecten',
    en: 'Projects',
    pl: 'Projekty',
    ro: 'Proiecte',
    tr: 'Projeler'
  },
  'nav_customers': {
    nl: 'Klanten',
    en: 'Customers',
    pl: 'Klienci',
    ro: 'Clienți',
    tr: 'Müşteriler'
  },
  'nav_planning': {
    nl: 'Planning',
    en: 'Planning',
    pl: 'Planowanie',
    ro: 'Planificare',
    tr: 'Planlama'
  },
  'nav_time': {
    nl: 'Tijd',
    en: 'Time',
    pl: 'Czas',
    ro: 'Timp',
    tr: 'Zaman'
  },
  'nav_receipts': {
    nl: 'Bonnetjes',
    en: 'Receipts',
    pl: 'Paragony',
    ro: 'Chitanțe',
    tr: 'Makbuzlar'
  },
  'nav_settings': {
    nl: 'Instellingen',
    en: 'Settings',
    pl: 'Ustawienia',
    ro: 'Setări',
    tr: 'Ayarlar'
  },
  
  // Status
  'status_active': {
    nl: 'Actief',
    en: 'Active',
    pl: 'Aktywny',
    ro: 'Activ',
    tr: 'Aktif'
  },
  'status_inactive': {
    nl: 'Inactief',
    en: 'Inactive',
    pl: 'Nieaktywny',
    ro: 'Inactiv',
    tr: 'Pasif'
  },
  'status_pending': {
    nl: 'In afwachting',
    en: 'Pending',
    pl: 'Oczekujący',
    ro: 'În așteptare',
    tr: 'Beklemede'
  },
  'status_completed': {
    nl: 'Voltooid',
    en: 'Completed',
    pl: 'Zakończony',
    ro: 'Finalizat',
    tr: 'Tamamlandı'
  },
  'status_approved': {
    nl: 'Goedgekeurd',
    en: 'Approved',
    pl: 'Zatwierdzony',
    ro: 'Aprobat',
    tr: 'Onaylandı'
  },
  'status_rejected': {
    nl: 'Afgekeurd',
    en: 'Rejected',
    pl: 'Odrzucony',
    ro: 'Respins',
    tr: 'Reddedildi'
  },
  
  // Messages
  'message_loading': {
    nl: 'Laden...',
    en: 'Loading...',
    pl: 'Ładowanie...',
    ro: 'Se încarcă...',
    tr: 'Yükleniyor...'
  },
  'message_saving': {
    nl: 'Opslaan...',
    en: 'Saving...',
    pl: 'Zapisywanie...',
    ro: 'Se salvează...',
    tr: 'Kaydediliyor...'
  },
  'message_success': {
    nl: 'Gelukt!',
    en: 'Success!',
    pl: 'Sukces!',
    ro: 'Succes!',
    tr: 'Başarılı!'
  },
  'message_error': {
    nl: 'Fout opgetreden',
    en: 'Error occurred',
    pl: 'Wystąpił błąd',
    ro: 'A apărut o eroare',
    tr: 'Hata oluştu'
  },
  'message_confirm_delete': {
    nl: 'Weet je zeker dat je dit wilt verwijderen?',
    en: 'Are you sure you want to delete this?',
    pl: 'Czy na pewno chcesz to usunąć?',
    ro: 'Sigur doriți să ștergeți acest lucru?',
    tr: 'Bunu silmek istediğinizden emin misiniz?'
  },
  
  // Form labels
  'label_name': {
    nl: 'Naam',
    en: 'Name',
    pl: 'Nazwa',
    ro: 'Nume',
    tr: 'Ad'
  },
  'label_email': {
    nl: 'E-mail',
    en: 'Email',
    pl: 'E-mail',
    ro: 'E-mail',
    tr: 'E-posta'
  },
  'label_phone': {
    nl: 'Telefoon',
    en: 'Phone',
    pl: 'Telefon',
    ro: 'Telefon',
    tr: 'Telefon'
  },
  'label_address': {
    nl: 'Adres',
    en: 'Address',
    pl: 'Adres',
    ro: 'Adresă',
    tr: 'Adres'
  },
  'label_date': {
    nl: 'Datum',
    en: 'Date',
    pl: 'Data',
    ro: 'Dată',
    tr: 'Tarih'
  },
  'label_description': {
    nl: 'Omschrijving',
    en: 'Description',
    pl: 'Opis',
    ro: 'Descriere',
    tr: 'Açıklama'
  },
  'label_price': {
    nl: 'Prijs',
    en: 'Price',
    pl: 'Cena',
    ro: 'Preț',
    tr: 'Fiyat'
  },
  'label_quantity': {
    nl: 'Aantal',
    en: 'Quantity',
    pl: 'Ilość',
    ro: 'Cantitate',
    tr: 'Miktar'
  },
  'label_total': {
    nl: 'Totaal',
    en: 'Total',
    pl: 'Razem',
    ro: 'Total',
    tr: 'Toplam'
  }
};

async function main() {
  console.log('🚀 Starting direct translation seeding...\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Build translations array
  const translations: Array<{
    translation_key: string;
    language_code: string;
    translated_text: string;
    context: string;
  }> = [];

  for (const [key, langMap] of Object.entries(COMMON_TRANSLATIONS)) {
    for (const lang of LANGUAGES) {
      if (langMap[lang]) {
        translations.push({
          translation_key: key,
          language_code: lang,
          translated_text: langMap[lang],
          context: 'common_ui'
        });
      }
    }
  }

  console.log(`📦 Prepared ${translations.length} translations`);
  console.log(`   Keys: ${Object.keys(COMMON_TRANSLATIONS).length}`);
  console.log(`   Languages: ${LANGUAGES.join(', ')}\n`);

  // Batch insert
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < translations.length; i += BATCH_SIZE) {
    const batch = translations.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('ui_translations')
      .upsert(batch, {
        onConflict: 'translation_key,language_code'
      });

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }

    inserted += batch.length;
    console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted}/${translations.length}`);
  }

  console.log(`\n✅ Successfully seeded ${inserted} translations!`);
  console.log('\n📊 Summary:');
  console.log(`   - ${Object.keys(COMMON_TRANSLATIONS).length} translation keys`);
  console.log(`   - ${LANGUAGES.length} languages (${LANGUAGES.join(', ')})`);
  console.log(`   - ${inserted} total translations in database`);
  console.log('\n🎉 Translation system ready to use!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

