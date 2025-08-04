-- Add comprehensive UI translations for chat system and multi-language support

-- Insert Dutch translations (base language)
INSERT INTO ui_translations (translation_key, language_code, translated_text, context) VALUES
-- Chat translations
('chat.translated', 'nl', 'Vertaald', 'chat'),
('chat.translating', 'nl', 'Vertalen...', 'chat'),
('chat.translation_error', 'nl', 'Vertaling mislukt', 'chat'),
('chat.low_confidence', 'nl', 'Vertrouwensniveau van vertaling is laag', 'chat'),
('chat.cached_translation', 'nl', 'Gecachte vertaling', 'chat'),
('chat.original_message', 'nl', 'Oorspronkelijk bericht', 'chat'),
('chat.show_translation', 'nl', 'Toon vertaling', 'chat'),
('chat.hide_translation', 'nl', 'Verberg vertaling', 'chat'),
('chat.translate_message', 'nl', 'Vertaal bericht', 'chat'),
('chat.auto_translate', 'nl', 'Automatisch vertalen', 'chat'),
('chat.language_detected', 'nl', 'Taal gedetecteerd', 'chat'),
('chat.confidence_score', 'nl', 'Betrouwbaarheidsscore', 'chat'),

-- Settings translations
('settings.language_preferences', 'nl', 'Taalinstellingen', 'settings'),
('settings.interface_language', 'nl', 'Interface Taal', 'settings'),
('settings.interface_language_description', 'nl', 'Taal voor menu\'s, knoppen en interface-elementen', 'settings'),
('settings.chat_language', 'nl', 'Voorkeurstaal Chat', 'settings'),
('settings.chat_language_description', 'nl', 'Berichten worden naar deze taal vertaald', 'settings'),
('settings.translation_options', 'nl', 'Vertalingsopties', 'settings'),
('settings.enable_chat_translation', 'nl', 'Chatvertaling inschakelen', 'settings'),
('settings.chat_translation_description', 'nl', 'Vertaal berichten automatisch naar je voorkeurstaal', 'settings'),
('settings.auto_detect_language', 'nl', 'Taal automatisch detecteren', 'settings'),
('settings.auto_detect_description', 'nl', 'Detecteer automatisch de taal van inkomende berichten', 'settings'),
('settings.language_updated', 'nl', 'Taalinstellingen zijn bijgewerkt', 'settings'),
('settings.language_update_failed', 'nl', 'Bijwerken van taalinstellingen is mislukt', 'settings'),
('settings.supported_languages', 'nl', 'Ondersteunde Talen', 'settings'),
('settings.translation_info', 'nl', 'Als vertaling is ingeschakeld, zie je zowel het oorspronkelijke bericht als de vertaling in chatgesprekken.', 'settings'),

-- Common additional translations
('common.retry', 'nl', 'Opnieuw proberen', 'common'),
('common.saving', 'nl', 'Opslaan...', 'common'),
('common.language', 'nl', 'Taal', 'common'),
('common.original', 'nl', 'Oorspronkelijk', 'common'),
('common.translation', 'nl', 'Vertaling', 'common'),
('common.confidence', 'nl', 'Vertrouwen', 'common'),
('common.auto', 'nl', 'Automatisch', 'common'),
('common.manual', 'nl', 'Handmatig', 'common'),

-- English translations
('chat.translated', 'en', 'Translated', 'chat'),
('chat.translating', 'en', 'Translating...', 'chat'),
('chat.translation_error', 'en', 'Translation failed', 'chat'),
('chat.low_confidence', 'en', 'Translation confidence is low', 'chat'),
('chat.cached_translation', 'en', 'Cached translation', 'chat'),
('chat.original_message', 'en', 'Original message', 'chat'),
('chat.show_translation', 'en', 'Show translation', 'chat'),
('chat.hide_translation', 'en', 'Hide translation', 'chat'),
('chat.translate_message', 'en', 'Translate message', 'chat'),
('chat.auto_translate', 'en', 'Auto translate', 'chat'),
('chat.language_detected', 'en', 'Language detected', 'chat'),
('chat.confidence_score', 'en', 'Confidence score', 'chat'),

('settings.language_preferences', 'en', 'Language Preferences', 'settings'),
('settings.interface_language', 'en', 'Interface Language', 'settings'),
('settings.interface_language_description', 'en', 'Language for menus, buttons, and interface elements', 'settings'),
('settings.chat_language', 'en', 'Preferred Chat Language', 'settings'),
('settings.chat_language_description', 'en', 'Messages will be translated to this language', 'settings'),
('settings.translation_options', 'en', 'Translation Options', 'settings'),
('settings.enable_chat_translation', 'en', 'Enable Chat Translation', 'settings'),
('settings.chat_translation_description', 'en', 'Automatically translate messages to your preferred language', 'settings'),
('settings.auto_detect_language', 'en', 'Auto-detect Language', 'settings'),
('settings.auto_detect_description', 'en', 'Automatically detect the language of incoming messages', 'settings'),
('settings.language_updated', 'en', 'Language settings have been updated', 'settings'),
('settings.language_update_failed', 'en', 'Failed to update language settings', 'settings'),
('settings.supported_languages', 'en', 'Supported Languages', 'settings'),
('settings.translation_info', 'en', 'When translation is enabled, you will see both the original message and its translation in chat conversations.', 'settings'),

('common.retry', 'en', 'Retry', 'common'),
('common.saving', 'en', 'Saving...', 'common'),
('common.language', 'en', 'Language', 'common'),
('common.original', 'en', 'Original', 'common'),
('common.translation', 'en', 'Translation', 'common'),
('common.confidence', 'en', 'Confidence', 'common'),
('common.auto', 'en', 'Auto', 'common'),
('common.manual', 'en', 'Manual', 'common'),

-- Polish translations
('chat.translated', 'pl', 'Przetłumaczono', 'chat'),
('chat.translating', 'pl', 'Tłumaczenie...', 'chat'),
('chat.translation_error', 'pl', 'Tłumaczenie nie powiodło się', 'chat'),
('chat.low_confidence', 'pl', 'Pewność tłumaczenia jest niska', 'chat'),
('chat.cached_translation', 'pl', 'Tłumaczenie w pamięci podręcznej', 'chat'),
('chat.original_message', 'pl', 'Oryginalna wiadomość', 'chat'),
('chat.show_translation', 'pl', 'Pokaż tłumaczenie', 'chat'),
('chat.hide_translation', 'pl', 'Ukryj tłumaczenie', 'chat'),
('chat.translate_message', 'pl', 'Przetłumacz wiadomość', 'chat'),
('chat.auto_translate', 'pl', 'Automatyczne tłumaczenie', 'chat'),
('chat.language_detected', 'pl', 'Wykryto język', 'chat'),
('chat.confidence_score', 'pl', 'Wynik pewności', 'chat'),

('settings.language_preferences', 'pl', 'Preferencje językowe', 'settings'),
('settings.interface_language', 'pl', 'Język interfejsu', 'settings'),
('settings.interface_language_description', 'pl', 'Język dla menu, przycisków i elementów interfejsu', 'settings'),
('settings.chat_language', 'pl', 'Preferowany język czatu', 'settings'),
('settings.chat_language_description', 'pl', 'Wiadomości będą tłumaczone na ten język', 'settings'),
('settings.translation_options', 'pl', 'Opcje tłumaczenia', 'settings'),
('settings.enable_chat_translation', 'pl', 'Włącz tłumaczenie czatu', 'settings'),
('settings.chat_translation_description', 'pl', 'Automatycznie tłumacz wiadomości na preferowany język', 'settings'),
('settings.auto_detect_language', 'pl', 'Automatyczne wykrywanie języka', 'settings'),
('settings.auto_detect_description', 'pl', 'Automatycznie wykrywaj język przychodzących wiadomości', 'settings'),
('settings.language_updated', 'pl', 'Ustawienia językowe zostały zaktualizowane', 'settings'),
('settings.language_update_failed', 'pl', 'Nie udało się zaktualizować ustawień językowych', 'settings'),
('settings.supported_languages', 'pl', 'Obsługiwane języki', 'settings'),
('settings.translation_info', 'pl', 'Gdy tłumaczenie jest włączone, zobaczysz zarówno oryginalną wiadomość, jak i jej tłumaczenie w rozmowach czatu.', 'settings'),

('common.retry', 'pl', 'Spróbuj ponownie', 'common'),
('common.saving', 'pl', 'Zapisywanie...', 'common'),
('common.language', 'pl', 'Język', 'common'),
('common.original', 'pl', 'Oryginalny', 'common'),
('common.translation', 'pl', 'Tłumaczenie', 'common'),
('common.confidence', 'pl', 'Pewność', 'common'),
('common.auto', 'pl', 'Auto', 'common'),
('common.manual', 'pl', 'Ręcznie', 'common')

ON CONFLICT (translation_key, language_code) DO UPDATE SET
  translated_text = EXCLUDED.translated_text,
  updated_at = NOW();

-- Add UI navigation translations
INSERT INTO ui_translations (translation_key, language_code, translated_text, context) VALUES
-- Navigation (Dutch)
('nav.dashboard', 'nl', 'Dashboard', 'navigation'),
('nav.projects', 'nl', 'Projecten', 'navigation'),
('nav.invoices', 'nl', 'Facturen', 'navigation'),
('nav.quotes', 'nl', 'Offertes', 'navigation'),
('nav.customers', 'nl', 'Klanten', 'navigation'),
('nav.users', 'nl', 'Gebruikers', 'navigation'),
('nav.settings', 'nl', 'Instellingen', 'navigation'),
('nav.chat', 'nl', 'Chat', 'navigation'),
('nav.calendar', 'nl', 'Kalender', 'navigation'),

-- Navigation (English)
('nav.dashboard', 'en', 'Dashboard', 'navigation'),
('nav.projects', 'en', 'Projects', 'navigation'),
('nav.invoices', 'en', 'Invoices', 'navigation'),
('nav.quotes', 'en', 'Quotes', 'navigation'),
('nav.customers', 'en', 'Customers', 'navigation'),
('nav.users', 'en', 'Users', 'navigation'),
('nav.settings', 'en', 'Settings', 'navigation'),
('nav.chat', 'en', 'Chat', 'navigation'),
('nav.calendar', 'en', 'Calendar', 'navigation'),

-- Navigation (Polish)
('nav.dashboard', 'pl', 'Panel główny', 'navigation'),
('nav.projects', 'pl', 'Projekty', 'navigation'),
('nav.invoices', 'pl', 'Faktury', 'navigation'),
('nav.quotes', 'pl', 'Oferty', 'navigation'),
('nav.customers', 'pl', 'Klienci', 'navigation'),
('nav.users', 'pl', 'Użytkownicy', 'navigation'),
('nav.settings', 'pl', 'Ustawienia', 'navigation'),
('nav.chat', 'pl', 'Czat', 'navigation'),
('nav.calendar', 'pl', 'Kalendarz', 'navigation')

ON CONFLICT (translation_key, language_code) DO UPDATE SET
  translated_text = EXCLUDED.translated_text,
  updated_at = NOW();