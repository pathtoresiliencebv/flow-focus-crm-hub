/**
 * iCal (.ics) Generation Utility
 * Generates RFC 5545 compliant iCalendar files for planning appointments
 */

interface ICalEvent {
  uid: string;
  summary: string; // Event title
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendees?: Array<{
    name: string;
    email: string;
    role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'CHAIR';
  }>;
  url?: string; // Confirmation URL
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  priority?: number; // 0-9, 1 is highest
  alarms?: Array<{
    action: 'DISPLAY' | 'EMAIL';
    trigger: string; // e.g., '-PT24H' for 24 hours before
    description?: string;
  }>;
}

/**
 * Format date to iCal format: YYYYMMDDTHHMMSSZ
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format current timestamp for iCal DTSTAMP
 */
function formatICalTimestamp(): string {
  return formatICalDate(new Date());
}

/**
 * Escape special characters for iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold lines to max 75 characters (RFC 5545 requirement)
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  
  const lines: string[] = [];
  let currentLine = line.substring(0, 75);
  let remaining = line.substring(75);
  
  lines.push(currentLine);
  
  while (remaining.length > 0) {
    currentLine = ' ' + remaining.substring(0, 74); // Space prefix for continuation
    remaining = remaining.substring(74);
    lines.push(currentLine);
  }
  
  return lines.join('\r\n');
}

/**
 * Generate iCal (.ics) content for a planning event
 */
export function generateICalEvent(event: ICalEvent): string {
  const lines: string[] = [];
  
  // BEGIN VCALENDAR
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//SMANS CRM//Planning System//NL');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:REQUEST');
  
  // BEGIN VEVENT
  lines.push('BEGIN:VEVENT');
  
  // UID (unique identifier)
  lines.push(`UID:${event.uid}`);
  
  // DTSTAMP (timestamp of creation)
  lines.push(`DTSTAMP:${formatICalTimestamp()}`);
  
  // DTSTART (start date/time)
  lines.push(`DTSTART:${formatICalDate(event.startDate)}`);
  
  // DTEND (end date/time)
  lines.push(`DTEND:${formatICalDate(event.endDate)}`);
  
  // SUMMARY (title)
  lines.push(foldLine(`SUMMARY:${escapeICalText(event.summary)}`));
  
  // DESCRIPTION (optional)
  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`));
  }
  
  // LOCATION (optional)
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICalText(event.location)}`));
  }
  
  // STATUS (optional, default: CONFIRMED)
  lines.push(`STATUS:${event.status || 'CONFIRMED'}`);
  
  // PRIORITY (optional, default: 5)
  lines.push(`PRIORITY:${event.priority ?? 5}`);
  
  // ORGANIZER (optional)
  if (event.organizerEmail) {
    const cn = event.organizerName ? `;CN=${escapeICalText(event.organizerName)}` : '';
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  
  // ATTENDEES (optional)
  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach(attendee => {
      const role = attendee.role || 'REQ-PARTICIPANT';
      const cn = `;CN=${escapeICalText(attendee.name)}`;
      const rsvp = ';RSVP=TRUE'; // Request RSVP
      const partstat = ';PARTSTAT=NEEDS-ACTION'; // Initial status
      
      lines.push(`ATTENDEE;ROLE=${role}${cn}${rsvp}${partstat}:mailto:${attendee.email}`);
    });
  }
  
  // URL (optional - for confirmation link)
  if (event.url) {
    lines.push(foldLine(`URL:${event.url}`));
  }
  
  // ALARMS (reminders)
  if (event.alarms && event.alarms.length > 0) {
    event.alarms.forEach(alarm => {
      lines.push('BEGIN:VALARM');
      lines.push(`ACTION:${alarm.action}`);
      lines.push(`TRIGGER:${alarm.trigger}`);
      
      if (alarm.description) {
        lines.push(foldLine(`DESCRIPTION:${escapeICalText(alarm.description)}`));
      }
      
      lines.push('END:VALARM');
    });
  }
  
  // END VEVENT
  lines.push('END:VEVENT');
  
  // END VCALENDAR
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Generate iCal file for a SMANS CRM planning appointment
 */
export function generatePlanningICalFile(params: {
  planningId: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  customerName: string;
  customerEmail: string;
  monteurName?: string;
  confirmationUrl?: string;
}): string {
  return generateICalEvent({
    uid: `planning-${params.planningId}@smanscrm.nl`,
    summary: params.title,
    description: params.description,
    location: params.location,
    startDate: params.startDateTime,
    endDate: params.endDateTime,
    organizerName: params.monteurName || 'SMANS BV',
    organizerEmail: 'planning@smansbv.nl',
    attendees: [
      {
        name: params.customerName,
        email: params.customerEmail,
        role: 'REQ-PARTICIPANT'
      }
    ],
    url: params.confirmationUrl,
    status: 'TENTATIVE', // Waiting for confirmation
    priority: 5,
    alarms: [
      {
        action: 'DISPLAY',
        trigger: '-PT24H', // 24 hours before
        description: 'Herinnering: Afspraak morgen bij SMANS BV'
      },
      {
        action: 'DISPLAY',
        trigger: '-PT1H', // 1 hour before
        description: 'Herinnering: Afspraak over 1 uur'
      }
    ]
  });
}

/**
 * Convert iCal string to base64 for email attachment
 */
export function icalToBase64(icalContent: string): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(icalContent, 'utf8').toString('base64');
  } else {
    // Browser environment
    return btoa(unescape(encodeURIComponent(icalContent)));
  }
}

/**
 * Generate file download for iCal
 */
export function downloadICalFile(icalContent: string, filename: string = 'afspraak.ics'): void {
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Example usage:
 * 
 * const icalContent = generatePlanningICalFile({
 *   planningId: '12345-67890',
 *   title: 'Kozijn installatie',
 *   description: 'Installatie nieuwe kozijnen woonkamer',
 *   location: 'Kerkstraat 123, Amsterdam',
 *   startDateTime: new Date('2025-01-15T09:00:00'),
 *   endDateTime: new Date('2025-01-15T17:00:00'),
 *   customerName: 'Jan Jansen',
 *   customerEmail: 'jan@example.com',
 *   monteurName: 'Piet Monteur',
 *   confirmationUrl: 'https://smanscrm.nl/confirm/12345-67890'
 * });
 * 
 * // For email attachment:
 * const base64IcalAttachment = icalToBase64(icalContent);
 * 
 * // For browser download:
 * downloadICalFile(icalContent, 'smans-afspraak.ics');
 */

