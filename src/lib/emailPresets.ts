/**
 * Email Provider Presets
 * 
 * Pre-configured SMTP/IMAP settings for popular email providers
 * Makes setup easier for users - they just select provider and enter credentials
 */

export interface EmailPreset {
  id: string;
  name: string;
  logo?: string; // Optional logo URL
  smtp: {
    host: string;
    port: number;
    encryption: 'tls' | 'ssl' | 'none';
  };
  imap: {
    host: string;
    port: number;
    encryption: 'ssl' | 'tls' | 'none';
  };
  instructions?: string; // Setup instructions
  setupUrl?: string; // Link to provider's setup guide
  requiresAppPassword?: boolean; // If true, show warning about app passwords
}

export const EMAIL_PRESETS: Record<string, EmailPreset> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    logo: 'https://www.google.com/gmail/about/static/images/logo-gmail.png',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: true,
    instructions: `Voor Gmail moet je een App-specifiek wachtwoord gebruiken:
    
1. Ga naar je Google Account (myaccount.google.com)
2. Klik op "Beveiliging" in het linkermenu
3. Schakel "Verificatie in twee stappen" in (als nog niet gedaan)
4. Scroll naar "App-wachtwoorden" onder "Verificatie in twee stappen"
5. Klik op "App-wachtwoorden"
6. Selecteer "Mail" en "Ander (Aangepaste naam)"
7. Voer "Flow Focus CRM" in als naam
8. Kopieer het gegenereerde 16-cijferige wachtwoord
9. Gebruik dit wachtwoord hieronder (niet je normale Gmail wachtwoord!)`,
    setupUrl: 'https://support.google.com/accounts/answer/185833',
  },

  outlook: {
    id: 'outlook',
    name: 'Outlook / Office 365',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: false,
    instructions: `Voor Outlook/Office 365:
    
1. Gebruik je volledige email adres als gebruikersnaam
2. Gebruik je normale Outlook wachtwoord
3. Als je 2FA (twee-factor authenticatie) hebt ingeschakeld, maak dan een app-wachtwoord aan:
   - Ga naar account.microsoft.com
   - Klik op "Beveiliging"
   - Ga naar "Geavanceerde beveiligingsopties"
   - Onder "App-wachtwoorden" klik op "Nieuw app-wachtwoord maken"`,
    setupUrl: 'https://support.microsoft.com/nl-nl/office/pop-imap-en-smtp-instellingen-8361e398-8af4-4e97-b147-6c6c4ac95353',
  },

  yahoo: {
    id: 'yahoo',
    name: 'Yahoo Mail',
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: true,
    instructions: `Voor Yahoo Mail moet je een App-wachtwoord gebruiken:
    
1. Ga naar je Yahoo Account beveiliging (login.yahoo.com/account/security)
2. Klik op "App-wachtwoorden genereren"
3. Selecteer "Andere app"
4. Voer "Flow Focus CRM" in
5. Klik op "Genereren"
6. Kopieer het gegenereerde wachtwoord
7. Gebruik dit wachtwoord hieronder`,
    setupUrl: 'https://help.yahoo.com/kb/generate-manage-third-party-passwords-sln15241.html',
  },

  icloud: {
    id: 'icloud',
    name: 'iCloud Mail',
    smtp: {
      host: 'smtp.mail.me.com',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'imap.mail.me.com',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: true,
    instructions: `Voor iCloud Mail moet je een App-specifiek wachtwoord gebruiken:
    
1. Ga naar appleid.apple.com
2. Log in met je Apple ID
3. Ga naar "Beveiliging"
4. Onder "App-specifieke wachtwoorden" klik op "Genereer wachtwoord"
5. Voer "Flow Focus CRM" in als label
6. Klik op "Aanmaken"
7. Kopieer het gegenereerde wachtwoord
8. Gebruik dit wachtwoord hieronder`,
    setupUrl: 'https://support.apple.com/nl-nl/HT204397',
  },

  zoho: {
    id: 'zoho',
    name: 'Zoho Mail',
    smtp: {
      host: 'smtp.zoho.com',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'imap.zoho.com',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: false,
    instructions: `Voor Zoho Mail:
    
1. Gebruik je Zoho email adres als gebruikersnaam
2. Gebruik je normale Zoho wachtwoord
3. Als IMAP nog niet is ingeschakeld:
   - Ga naar Zoho Mail Settings
   - Klik op "Mail Accounts"
   - Schakel "IMAP Access" in`,
    setupUrl: 'https://www.zoho.com/mail/help/imap-access.html',
  },

  hostnet: {
    id: 'hostnet',
    name: 'Hostnet (Smans Onderhoud)',
    smtp: {
      host: 'smtp.hostnet.nl',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: 'imap.hostnet.nl',
      port: 993,
      encryption: 'ssl',
    },
    requiresAppPassword: false,
    instructions: `Voor Hostnet email:
    
1. Gebruik je volledige email adres als gebruikersnaam (bijv. info@smansonderhoud.nl)
2. Gebruik je email wachtwoord (zoals ingesteld in Hostnet controle panel)
3. SMTP server: smtp.hostnet.nl poort 587 met TLS
4. IMAP server: imap.hostnet.nl poort 993 met SSL
5. Als het niet werkt, controleer je wachtwoord in het Hostnet controle panel`,
    setupUrl: 'https://www.hostnet.nl/support/email',
  },

  custom: {
    id: 'custom',
    name: 'Aangepast / Anders',
    smtp: {
      host: '',
      port: 587,
      encryption: 'tls',
    },
    imap: {
      host: '',
      port: 993,
      encryption: 'ssl',
    },
    instructions: `Voor aangepaste email providers:
    
1. Vraag je email provider naar de SMTP en IMAP server instellingen
2. Deze vind je meestal in de documentatie of helpdesk van je provider
3. Je hebt nodig:
   - SMTP server adres en poort (meestal 587 of 465)
   - IMAP server adres en poort (meestal 993 of 143)
   - Gebruikersnaam (vaak je email adres)
   - Wachtwoord
   - Of SSL/TLS encryptie nodig is`,
  },
};

/**
 * Get preset by ID
 */
export function getPresetById(id: string): EmailPreset | null {
  return EMAIL_PRESETS[id] || null;
}

/**
 * Get all presets as array
 */
export function getAllPresets(): EmailPreset[] {
  return Object.values(EMAIL_PRESETS);
}

/**
 * Get common presets (excluding 'custom')
 */
export function getCommonPresets(): EmailPreset[] {
  return Object.values(EMAIL_PRESETS).filter(p => p.id !== 'custom');
}

/**
 * Detect provider from email address
 */
export function detectProviderFromEmail(email: string): EmailPreset | null {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return null;

  // Map domains to presets
  const domainMap: Record<string, string> = {
    'gmail.com': 'gmail',
    'googlemail.com': 'gmail',
    'outlook.com': 'outlook',
    'hotmail.com': 'outlook',
    'live.com': 'outlook',
    'office365.com': 'outlook',
    'yahoo.com': 'yahoo',
    'yahoo.nl': 'yahoo',
    'yahoo.co.uk': 'yahoo',
    'icloud.com': 'icloud',
    'me.com': 'icloud',
    'mac.com': 'icloud',
    'zoho.com': 'zoho',
    'zohomail.com': 'zoho',
    'smansonderhoud.nl': 'hostnet',
    'hostnet.nl': 'hostnet',
  };

  const presetId = domainMap[domain];
  return presetId ? EMAIL_PRESETS[presetId] : null;
}

/**
 * Validate email configuration
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmailConfig(config: {
  smtp: Partial<EmailPreset['smtp']>;
  imap: Partial<EmailPreset['imap']>;
  smtpUsername?: string;
  smtpPassword?: string;
  imapUsername?: string;
  imapPassword?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate SMTP
  if (!config.smtp.host) {
    errors.push({ field: 'smtp.host', message: 'SMTP server is verplicht' });
  }
  if (!config.smtp.port || config.smtp.port <= 0 || config.smtp.port > 65535) {
    errors.push({ field: 'smtp.port', message: 'SMTP poort moet tussen 1 en 65535 zijn' });
  }
  if (!config.smtpUsername) {
    errors.push({ field: 'smtpUsername', message: 'SMTP gebruikersnaam is verplicht' });
  }
  if (!config.smtpPassword) {
    errors.push({ field: 'smtpPassword', message: 'SMTP wachtwoord is verplicht' });
  }

  // Validate IMAP
  if (!config.imap.host) {
    errors.push({ field: 'imap.host', message: 'IMAP server is verplicht' });
  }
  if (!config.imap.port || config.imap.port <= 0 || config.imap.port > 65535) {
    errors.push({ field: 'imap.port', message: 'IMAP poort moet tussen 1 en 65535 zijn' });
  }
  if (!config.imapUsername) {
    errors.push({ field: 'imapUsername', message: 'IMAP gebruikersnaam is verplicht' });
  }
  if (!config.imapPassword) {
    errors.push({ field: 'imapPassword', message: 'IMAP wachtwoord is verplicht' });
  }

  return errors;
}

/**
 * Get recommended encryption for port
 */
export function getRecommendedEncryption(port: number, protocol: 'smtp' | 'imap'): 'tls' | 'ssl' | 'none' {
  if (protocol === 'smtp') {
    if (port === 465) return 'ssl';
    if (port === 587 || port === 25 || port === 2525) return 'tls';
  } else if (protocol === 'imap') {
    if (port === 993) return 'ssl';
    if (port === 143) return 'tls';
  }
  return 'tls'; // Default to TLS
}

