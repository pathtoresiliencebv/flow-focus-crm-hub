# DreamFlow - Complete Supabase Database Schema Documentation

**Version:** 1.0  
**Last Updated:** October 7, 2025  
**Target Platform:** Mobile Application (iOS & Android)  
**Database:** Supabase (PostgreSQL)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Schema (auth)](#authentication-schema-auth)
3. [Public Schema - Core Tables](#public-schema---core-tables)
4. [Public Schema - Communication](#public-schema---communication)
5. [Public Schema - Projects & Planning](#public-schema---projects--planning)
6. [Public Schema - Financial](#public-schema---financial)
7. [Public Schema - Email System](#public-schema---email-system)
8. [Public Schema - Notifications](#public-schema---notifications)
9. [Public Schema - Analytics & Compliance](#public-schema---analytics--compliance)
10. [Realtime Schema](#realtime-schema)
11. [Storage Schema](#storage-schema)
12. [Vault Schema](#vault-schema)
13. [Mobile App Integration Guide](#mobile-app-integration-guide)
14. [Security & RLS Policies](#security--rls-policies)
15. [Best Practices](#best-practices)

---

## Overview

This documentation provides a comprehensive guide to the Supabase database schema for the SMANS CRM mobile application built with DreamFlow. The system is designed to support a multi-role CRM platform with real-time communication, project management, financial tracking, and compliance features.

### Key Features

- **Multi-tenant Architecture**: Support for multiple users with role-based access control
- **Real-time Synchronization**: Live updates for chat, projects, and planning
- **Offline-First Design**: Queue system for offline message handling
- **Comprehensive Audit Trail**: Full compliance and audit logging
- **Secure File Storage**: Encrypted file uploads with access control
- **Multi-language Support**: Translation cache and language detection

### User Roles

The system supports the following user roles (defined in `user_role` ENUM):

- **Administrator**: Full system access, can manage all resources
- **Administratie**: Administrative staff, handles quotes, invoices, and customer management
- **Installateur**: Field workers/installers, access to assigned projects and planning
- **Verkoper**: Sales staff, manages customers and quotes
- **Bekijker**: View-only access (default role)

---

## Authentication Schema (auth)

The `auth` schema is managed by Supabase and handles user authentication, sessions, and identity management.

### auth.users

**Purpose**: Core user authentication table managed by Supabase Auth.

**Key Fields**:
- `id` (uuid, PK): Unique user identifier
- `email` (varchar): User's email address
- `encrypted_password` (varchar): Hashed password
- `email_confirmed_at` (timestamptz): Email verification timestamp
- `last_sign_in_at` (timestamptz): Last login time
- `raw_app_meta_data` (jsonb): Application metadata
- `raw_user_meta_data` (jsonb): User profile metadata
- `phone` (text): Phone number (optional)
- `is_sso_user` (boolean): Single sign-on flag
- `is_anonymous` (boolean): Anonymous user flag

**Mobile App Usage**:
- Authentication via Supabase Auth SDK
- Email/password login
- Password recovery
- Session management

### auth.sessions

**Purpose**: Tracks active user sessions.

**Key Fields**:
- `id` (uuid, PK): Session identifier
- `user_id` (uuid, FK → auth.users): User reference
- `created_at` (timestamptz): Session start time
- `refreshed_at` (timestamp): Last token refresh
- `user_agent` (text): Device/browser information
- `ip` (inet): IP address

**Mobile App Usage**:
- Automatic session management via Supabase SDK
- Token refresh handling
- Multi-device support

### auth.identities

**Purpose**: Manages multiple authentication providers per user (email, OAuth, etc.).

**Key Fields**:
- `id` (uuid, PK): Identity identifier
- `user_id` (uuid, FK → auth.users): User reference
- `provider` (text): Auth provider (email, google, etc.)
- `identity_data` (jsonb): Provider-specific data
- `last_sign_in_at` (timestamptz): Last login via this provider

**Mobile App Usage**:
- Social login integration
- Multiple auth methods per user

### auth.mfa_factors & auth.mfa_challenges

**Purpose**: Multi-factor authentication support.

**Mobile App Usage**:
- Optional MFA for enhanced security
- TOTP/SMS verification

---

## Public Schema - Core Tables

### public.profiles

**Purpose**: Extended user profile information beyond authentication.

**Key Fields**:
- `id` (uuid, PK, FK → auth.users): User identifier
- `full_name` (text): Display name
- `role` (user_role): User role (Administrator, Administratie, Installateur, Verkoper, Bekijker)
- `status` (user_status): Account status (Actief, Inactief, Geblokkeerd)
- `last_seen` (timestamptz): Last activity timestamp
- `is_online` (boolean): Online status indicator
- `language_preference` (varchar): Preferred language (nl, en, etc.)
- `timezone` (varchar): User timezone (default: Europe/Amsterdam)
- `language_detection_enabled` (boolean): Auto-detect language
- `chat_language` (varchar): Chat language preference

**Mobile App Usage**:
```typescript
// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Update online status
await supabase
  .from('profiles')
  .update({ 
    is_online: true, 
    last_seen: new Date().toISOString() 
  })
  .eq('id', userId);
```

**Realtime**: ✅ Enabled for presence indicators

### public.customers

**Purpose**: Customer/client management.

**Key Fields**:
- `id` (uuid, PK): Customer identifier
- `name` (text): Customer name
- `email` (text): Email address
- `phone` (text): Phone number
- `address` (text): Street address
- `city` (text): City
- `company_name` (text): Company name (optional)
- `kvk_number` (varchar): Chamber of Commerce number (Netherlands)
- `btw_number` (varchar): VAT number
- `status` (customer_status): Actief, Inactief, Prospect, Verloren
- `notes` (text): Additional notes
- `email_addresses` (jsonb): Multiple email addresses
- `invoice_address` (jsonb): Billing address
- `shipping_address` (jsonb): Delivery address
- `user_id` (uuid, FK → auth.users): Creator reference

**Mobile App Usage**:
```typescript
// Search customers
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .ilike('name', `%${searchTerm}%`)
  .eq('status', 'Actief')
  .order('name');

// Create customer
const { data: newCustomer } = await supabase
  .from('customers')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+31612345678',
    address: 'Main Street 123',
    city: 'Amsterdam',
    status: 'Actief'
  })
  .select()
  .single();
```

**Access Control**:
- Administrator/Administratie/Verkoper: Full access
- Installateur: Read-only for assigned projects
- Bekijker: Read-only

### public.contacts

**Purpose**: Additional contact persons associated with users.

**Key Fields**:
- `id` (uuid, PK): Contact identifier
- `user_id` (uuid, FK → auth.users): Owner reference
- `name` (text): Contact name
- `email` (text): Email address
- `phone` (text): Phone number
- `company` (text): Company name

**Mobile App Usage**:
- Quick contact lookup
- Address book integration

### public.role_permissions

**Purpose**: Defines which permissions each role has.

**Key Fields**:
- `id` (bigint, PK): Permission mapping identifier
- `role` (user_role): User role
- `permission` (app_permission): Permission type

**Permissions** (app_permission ENUM):
- `view_dashboard`
- `manage_customers`
- `create_quotes`
- `manage_projects`
- `view_planning`
- `manage_planning`
- `view_chat`
- `manage_users`
- `view_reports`
- `manage_settings`
- `approve_receipts`
- `view_receipts`
- `manage_invoices`

**Mobile App Usage**:
```typescript
// Check user permissions
const { data: permissions } = await supabase
  .rpc('get_user_permissions', { user_id: userId });

// Example RLS policy check
const hasPermission = permissions.includes('manage_projects');
```

---

## Public Schema - Communication

### public.direct_messages

**Purpose**: One-to-one messaging between users.

**Key Fields**:
- `id` (uuid, PK): Message identifier
- `from_user_id` (uuid, FK → auth.users): Sender
- `to_user_id` (uuid, FK → auth.users): Recipient
- `content` (text): Message text
- `original_language` (text): Source language (default: nl)
- `translated_content` (jsonb): Translations in other languages
- `is_read` (boolean): Read status
- `media_type` (varchar): Type of media (image, video, audio, document)
- `media_url` (text): Storage URL for media
- `media_filename` (text): Original filename
- `media_size` (integer): File size in bytes
- `media_mime_type` (varchar): MIME type
- `voice_duration` (integer): Voice message duration (seconds)
- `created_at` (timestamptz): Timestamp

**Mobile App Usage**:
```typescript
// Send text message
const { data: message } = await supabase
  .from('direct_messages')
  .insert({
    from_user_id: currentUserId,
    to_user_id: recipientId,
    content: 'Hello!',
    original_language: 'nl'
  })
  .select()
  .single();

// Send media message
const { data: uploadedFile } = await supabase.storage
  .from('chat-media')
  .upload(`${userId}/${fileName}`, file);

const { data: mediaMessage } = await supabase
  .from('direct_messages')
  .insert({
    from_user_id: currentUserId,
    to_user_id: recipientId,
    media_type: 'image',
    media_url: uploadedFile.path,
    media_filename: fileName,
    media_mime_type: 'image/jpeg'
  })
  .select()
  .single();

// Mark as read
await supabase
  .from('direct_messages')
  .update({ is_read: true })
  .eq('to_user_id', currentUserId)
  .eq('is_read', false);

// Realtime subscription
const subscription = supabase
  .channel('direct_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'direct_messages',
    filter: `to_user_id=eq.${currentUserId}`
  }, (payload) => {
    // New message received
    handleNewMessage(payload.new);
  })
  .subscribe();
```

**Realtime**: ✅ Enabled for instant messaging

**Storage Buckets**:
- `chat-media`: Images, videos, documents
- `voice-messages`: Audio recordings

### public.chat_channels

**Purpose**: Group chat channels for teams and projects.

**Key Fields**:
- `id` (uuid, PK): Channel identifier
- `name` (text): Channel name
- `type` (text): Channel type (general, project, team, support)
- `project_id` (uuid, FK → projects): Associated project (optional)
- `created_by` (uuid): Creator user ID
- `is_active` (boolean): Active status
- `is_direct_message` (boolean): DM flag
- `participants` (jsonb): Array of participant user IDs

**Mobile App Usage**:
```typescript
// Create project channel
const { data: channel } = await supabase
  .from('chat_channels')
  .insert({
    name: 'Project Alpha Team',
    type: 'project',
    project_id: projectId,
    created_by: userId,
    participants: [userId, installerId, adminId]
  })
  .select()
  .single();

// List user channels
const { data: channels } = await supabase
  .from('chat_channels')
  .select('*, chat_messages(count)')
  .contains('participants', [userId])
  .eq('is_active', true);
```

### public.chat_messages

**Purpose**: Messages within chat channels.

**Key Fields**:
- `id` (uuid, PK): Message identifier
- `channel_id` (uuid, FK → chat_channels): Channel reference
- `sender_id` (uuid): Sender user ID
- `content` (text): Message text
- `message_type` (text): text, file, image, system
- `file_url` (text): Attached file URL
- `file_name` (text): Original filename
- `translated_content` (jsonb): Translations
- `reply_to_id` (uuid, FK → chat_messages): Reply reference
- `is_edited` (boolean): Edit flag
- `delivery_status` (text): sent, delivered, failed
- `read_by` (jsonb): Array of user IDs who read the message

**Mobile App Usage**:
```typescript
// Send channel message
const { data: message } = await supabase
  .from('chat_messages')
  .insert({
    channel_id: channelId,
    sender_id: userId,
    content: 'Team update',
    message_type: 'text'
  })
  .select()
  .single();

// Reply to message
const { data: reply } = await supabase
  .from('chat_messages')
  .insert({
    channel_id: channelId,
    sender_id: userId,
    content: 'Thanks for the update!',
    reply_to_id: originalMessageId
  })
  .select()
  .single();

// Mark as read
await supabase
  .from('chat_messages')
  .update({ 
    read_by: supabase.sql`read_by || ${JSON.stringify([userId])}`
  })
  .eq('id', messageId);
```

**Realtime**: ✅ Enabled for group chat

### public.chat_participants

**Purpose**: Manages channel membership.

**Key Fields**:
- `id` (uuid, PK): Participant record ID
- `channel_id` (uuid, FK → chat_channels): Channel reference
- `user_id` (uuid): Participant user ID
- `role` (text): admin, moderator, member
- `joined_at` (timestamptz): Join timestamp
- `last_read_at` (timestamptz): Last read timestamp

**Mobile App Usage**:
```typescript
// Add participant to channel
await supabase
  .from('chat_participants')
  .insert({
    channel_id: channelId,
    user_id: newUserId,
    role: 'member'
  });

// Update last read
await supabase
  .from('chat_participants')
  .update({ last_read_at: new Date().toISOString() })
  .eq('channel_id', channelId)
  .eq('user_id', userId);
```

### public.chat_message_reactions

**Purpose**: Emoji reactions to messages.

**Key Fields**:
- `id` (uuid, PK): Reaction identifier
- `message_id` (uuid, FK → chat_messages): Message reference
- `user_id` (uuid): User who reacted
- `emoji` (text): Emoji character (👍, ❤️, etc.)

**Mobile App Usage**:
```typescript
// Add reaction
await supabase
  .from('chat_message_reactions')
  .insert({
    message_id: messageId,
    user_id: userId,
    emoji: '👍'
  });

// Remove reaction
await supabase
  .from('chat_message_reactions')
  .delete()
  .eq('message_id', messageId)
  .eq('user_id', userId)
  .eq('emoji', '👍');
```

### public.chat_typing_indicators

**Purpose**: Real-time typing indicators.

**Key Fields**:
- `id` (uuid, PK): Indicator ID
- `channel_id` (uuid, FK → chat_channels): Channel reference
- `user_id` (uuid): User who is typing
- `is_typing` (boolean): Typing status
- `updated_at` (timestamptz): Last update

**Mobile App Usage**:
```typescript
// Set typing indicator
await supabase
  .from('chat_typing_indicators')
  .upsert({
    channel_id: channelId,
    user_id: userId,
    is_typing: true
  });

// Clear typing indicator (after 3 seconds)
setTimeout(async () => {
  await supabase
    .from('chat_typing_indicators')
    .update({ is_typing: false })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
}, 3000);
```

**Realtime**: ✅ Enabled for live typing indicators

### public.offline_message_queue

**Purpose**: Queue for messages sent while offline.

**Key Fields**:
- `id` (uuid, PK): Queue item ID
- `user_id` (uuid): Sender user ID
- `channel_id` (uuid): Target channel
- `content` (text): Message content
- `message_type` (text): Message type
- `temp_id` (text): Temporary client-side ID
- `is_synced` (boolean): Sync status
- `synced_at` (timestamptz): Sync timestamp

**Mobile App Usage**:
```typescript
// Queue message while offline
const tempId = crypto.randomUUID();
await localDB.insert('offline_queue', {
  temp_id: tempId,
  user_id: userId,
  channel_id: channelId,
  content: 'Offline message',
  message_type: 'text',
  is_synced: false
});

// Sync when back online
const { data: queuedMessages } = await supabase
  .from('offline_message_queue')
  .select('*')
  .eq('user_id', userId)
  .eq('is_synced', false);

for (const msg of queuedMessages) {
  await supabase.from('chat_messages').insert({
    channel_id: msg.channel_id,
    sender_id: msg.user_id,
    content: msg.content
  });
  
  await supabase
    .from('offline_message_queue')
    .update({ is_synced: true, synced_at: new Date() })
    .eq('id', msg.id);
}
```

### public.translation_cache

**Purpose**: Caches translated messages for performance.

**Key Fields**:
- `id` (uuid, PK): Cache entry ID
- `source_text` (text): Original text
- `source_language` (varchar): Source language code
- `target_language` (varchar): Target language code
- `translated_text` (text): Translated text
- `context_type` (varchar): chat, email, document
- `confidence` (numeric): Translation confidence score
- `usage_count` (integer): Number of times used
- `last_used_at` (timestamptz): Last access time

**Mobile App Usage**:
```typescript
// Check cache before translating
const { data: cached } = await supabase
  .from('translation_cache')
  .select('translated_text')
  .eq('source_text', originalText)
  .eq('source_language', 'nl')
  .eq('target_language', 'en')
  .single();

if (cached) {
  return cached.translated_text;
} else {
  // Call translation API
  const translated = await translateAPI(originalText, 'nl', 'en');
  
  // Cache result
  await supabase
    .from('translation_cache')
    .insert({
      source_text: originalText,
      source_language: 'nl',
      target_language: 'en',
      translated_text: translated,
      context_type: 'chat'
    });
  
  return translated;
}
```

---

## Public Schema - Projects & Planning

### public.projects

**Purpose**: Core project management.

**Key Fields**:
- `id` (uuid, PK): Project identifier
- `title` (text): Project name
- `customer_id` (uuid, FK → customers): Customer reference
- `date` (date): Project date
- `value` (numeric): Project value (€)
- `status` (project_status): te-plannen, in-uitvoering, afgerond, geannuleerd
- `description` (text): Project description
- `user_id` (uuid, FK → auth.users): Creator
- `assigned_user_id` (uuid): Assigned installer
- `quote_id` (uuid, FK → quotes): Source quote
- `completion_date` (date): Completion date
- `completion_id` (uuid, FK → project_completions): Completion report

**Mobile App Usage**:
```typescript
// Fetch assigned projects (Installateur)
const { data: projects } = await supabase
  .from('projects')
  .select(`
    *,
    customers(*),
    project_tasks(*)
  `)
  .eq('assigned_user_id', userId)
  .in('status', ['te-plannen', 'in-uitvoering'])
  .order('date');

// Update project status
await supabase
  .from('projects')
  .update({ 
    status: 'in-uitvoering',
    updated_at: new Date().toISOString()
  })
  .eq('id', projectId);

// Create project from quote
const { data: project } = await supabase
  .from('projects')
  .insert({
    title: 'Installation Project',
    customer_id: customerId,
    quote_id: quoteId,
    status: 'te-plannen',
    value: 5000.00
  })
  .select()
  .single();
```

**Realtime**: ✅ Enabled for status updates

**Access Control**:
- Administrator/Administratie/Verkoper: Full access
- Installateur: Only assigned projects
- Bekijker: Read-only

### public.project_tasks

**Purpose**: Task checklist for projects.

**Key Fields**:
- `id` (uuid, PK): Task identifier
- `project_id` (uuid, FK → projects): Project reference
- `block_title` (text): Task block title
- `task_description` (text): Task details
- `is_info_block` (boolean): Information-only block
- `info_text` (text): Information content
- `is_completed` (boolean): Completion status
- `order_index` (integer): Display order
- `source_quote_item_id` (text): Original quote item reference
- `source_quote_block_id` (text): Original quote block reference
- `quote_item_type` (text): product, service, text

**Mobile App Usage**:
```typescript
// Fetch project tasks
const { data: tasks } = await supabase
  .from('project_tasks')
  .select('*')
  .eq('project_id', projectId)
  .order('order_index');

// Toggle task completion
await supabase
  .from('project_tasks')
  .update({ 
    is_completed: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', taskId);

// Calculate progress
const totalTasks = tasks.filter(t => !t.is_info_block).length;
const completedTasks = tasks.filter(t => t.is_completed && !t.is_info_block).length;
const progress = (completedTasks / totalTasks) * 100;
```

### public.project_completions

**Purpose**: Project completion reports with signatures.

**Key Fields**:
- `id` (uuid, PK): Completion identifier
- `project_id` (uuid, FK → projects): Project reference
- `installer_id` (uuid, FK → auth.users): Installer reference
- `completion_date` (date): Completion date
- `work_performed` (text): Work description
- `materials_used` (text): Materials list
- `recommendations` (text): Recommendations
- `notes` (text): Additional notes
- `customer_satisfaction` (integer): Rating 1-5
- `customer_signature` (text): Base64 encoded signature
- `installer_signature` (text): Base64 encoded signature
- `pdf_url` (text): Generated PDF report URL
- `status` (varchar): draft, completed, sent
- `email_sent_at` (timestamptz): Email sent timestamp
- `original_work_performed` (text): Original language version
- `installer_language` (varchar): Installer's language

**Mobile App Usage**:
```typescript
// Create completion report
const { data: completion } = await supabase
  .from('project_completions')
  .insert({
    project_id: projectId,
    installer_id: userId,
    completion_date: new Date().toISOString().split('T')[0],
    work_performed: 'Installed solar panels',
    materials_used: '10x Solar Panel 400W, 1x Inverter',
    customer_satisfaction: 5,
    customer_signature: customerSignatureBase64,
    installer_signature: installerSignatureBase64,
    status: 'completed'
  })
  .select()
  .single();

// Update project with completion
await supabase
  .from('projects')
  .update({ 
    completion_id: completion.id,
    completion_date: completion.completion_date,
    status: 'afgerond'
  })
  .eq('id', projectId);
```

**Signature Handling**:
```typescript
// Capture signature from canvas
const canvas = signatureCanvas.current;
const signatureBase64 = canvas.toDataURL('image/png');

// Save to database
await supabase
  .from('project_completions')
  .update({ customer_signature: signatureBase64 })
  .eq('id', completionId);
```

### public.completion_photos

**Purpose**: Photos attached to completion reports.

**Key Fields**:
- `id` (uuid, PK): Photo identifier
- `completion_id` (uuid, FK → project_completions): Completion reference
- `photo_url` (text): Storage URL
- `description` (text): Photo description
- `category` (varchar): before, during, after, issue
- `file_name` (varchar): Original filename
- `file_size` (bigint): File size in bytes

**Mobile App Usage**:
```typescript
// Upload photo
const { data: uploadedPhoto } = await supabase.storage
  .from('completion-reports')
  .upload(`${projectId}/${Date.now()}.jpg`, photoFile);

const { data: publicURL } = supabase.storage
  .from('completion-reports')
  .getPublicUrl(uploadedPhoto.path);

// Save photo metadata
await supabase
  .from('completion_photos')
  .insert({
    completion_id: completionId,
    photo_url: publicURL.publicUrl,
    category: 'after',
    file_name: photoFile.name,
    file_size: photoFile.size
  });

// Fetch completion photos
const { data: photos } = await supabase
  .from('completion_photos')
  .select('*')
  .eq('completion_id', completionId)
  .order('uploaded_at');
```

**Storage Bucket**: `completion-reports`

### public.planning_items

**Purpose**: Calendar/agenda items for scheduling.

**Key Fields**:
- `id` (uuid, PK): Planning item identifier
- `user_id` (uuid, FK → auth.users): Creator
- `assigned_user_id` (uuid, FK → auth.users): Assigned user (installer)
- `project_id` (uuid): Associated project (optional)
- `title` (text): Planning title
- `description` (text): Details
- `start_date` (date): Date
- `start_time` (time): Start time
- `end_time` (time): End time
- `location` (text): Address/location
- `status` (text): Gepland, In uitvoering, Voltooid, Geannuleerd
- `google_calendar_event_id` (text): Google Calendar sync ID
- `last_synced_at` (timestamptz): Last sync timestamp

**Mobile App Usage**:
```typescript
// Fetch installer's planning
const { data: planning } = await supabase
  .from('planning_items')
  .select(`
    *,
    projects(
      title,
      customers(name, address, city)
    )
  `)
  .eq('assigned_user_id', userId)
  .gte('start_date', startOfWeek)
  .lte('start_date', endOfWeek)
  .order('start_date', { ascending: true })
  .order('start_time', { ascending: true });

// Create planning item
const { data: newPlanning } = await supabase
  .from('planning_items')
  .insert({
    user_id: adminId,
    assigned_user_id: installerId,
    project_id: projectId,
    title: 'Solar Panel Installation',
    start_date: '2025-10-15',
    start_time: '09:00',
    end_time: '17:00',
    location: 'Amsterdam, Main Street 123',
    status: 'Gepland'
  })
  .select()
  .single();

// Check availability
const { data: conflicts } = await supabase
  .from('planning_items')
  .select('*')
  .eq('assigned_user_id', installerId)
  .eq('start_date', targetDate)
  .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

if (conflicts.length > 0) {
  alert('Installer is not available at this time');
}
```

**Realtime**: ✅ Enabled for schedule updates

### public.calendar_events

**Purpose**: Advanced calendar system with recurring events.

**Key Fields**:
- `id` (uuid, PK): Event identifier
- `user_id` (uuid): Event owner
- `title` (text): Event title
- `description` (text): Event description
- `start_datetime` (timestamptz): Start time
- `end_datetime` (timestamptz): End time
- `is_all_day` (boolean): All-day event flag
- `location` (text): Location
- `category` (calendar_event_category): persoonlijk, werk, project, klant
- `privacy_level` (calendar_privacy_level): private, public, confidential
- `color_code` (text): Display color
- `is_recurring` (boolean): Recurring event flag
- `recurrence_pattern` (calendar_recurrence_pattern): none, daily, weekly, monthly, yearly
- `recurrence_interval` (integer): Repeat interval
- `recurrence_end_date` (date): End date for recurrence
- `parent_event_id` (uuid): Parent event for recurring instances
- `project_id` (uuid, FK → projects): Associated project
- `customer_id` (uuid, FK → customers): Associated customer
- `reminder_minutes_before` (integer[]): Reminder times
- `assigned_to_role` (user_role): Role assignment
- `assigned_to_user` (uuid): User assignment
- `is_team_event` (boolean): Team event flag

**Mobile App Usage**:
```typescript
// Create recurring event
const { data: event } = await supabase
  .from('calendar_events')
  .insert({
    user_id: userId,
    title: 'Weekly Team Meeting',
    start_datetime: '2025-10-08T10:00:00Z',
    end_datetime: '2025-10-08T11:00:00Z',
    is_recurring: true,
    recurrence_pattern: 'weekly',
    recurrence_interval: 1,
    recurrence_end_date: '2025-12-31',
    category: 'werk',
    reminder_minutes_before: [15, 60]
  })
  .select()
  .single();
```

### public.calendar_event_shares

**Purpose**: Share calendar events with other users.

**Key Fields**:
- `id` (uuid, PK): Share identifier
- `event_id` (uuid, FK → calendar_events): Event reference
- `shared_with_user_id` (uuid): Recipient user ID
- `permission_level` (text): view, edit

**Mobile App Usage**:
```typescript
// Share event
await supabase
  .from('calendar_event_shares')
  .insert({
    event_id: eventId,
    shared_with_user_id: recipientId,
    permission_level: 'view'
  });
```

### public.project_materials

**Purpose**: Track materials used in projects.

**Key Fields**:
- `id` (uuid, PK): Material record ID
- `project_id` (uuid, FK → projects): Project reference
- `material_name` (text): Material name
- `quantity` (numeric): Quantity used
- `unit_price` (numeric): Price per unit
- `total_cost` (numeric): Total cost
- `supplier` (text): Supplier name
- `receipt_photo_url` (text): Receipt photo URL
- `added_by` (uuid): User who added the material

**Mobile App Usage**:
```typescript
// Add material
await supabase
  .from('project_materials')
  .insert({
    project_id: projectId,
    material_name: 'Solar Panel 400W',
    quantity: 10,
    unit_price: 250.00,
    total_cost: 2500.00,
    supplier: 'Solar Supplies BV',
    added_by: userId
  });
```

### public.project_receipts

**Purpose**: Receipts/bonnetjes for project expenses.

**Key Fields**:
- `id` (uuid, PK): Receipt identifier
- `project_id` (uuid, FK → projects): Project reference
- `receipt_date` (date): Purchase date
- `supplier` (text): Supplier name
- `total_amount` (numeric): Total amount
- `description` (text): Description
- `receipt_photo_url` (text): Receipt photo URL
- `category` (text): material, fuel, tool, other
- `added_by` (uuid): User who added the receipt

**Mobile App Usage**:
```typescript
// Upload receipt photo
const { data: uploadedReceipt } = await supabase.storage
  .from('receipts')
  .upload(`${projectId}/${Date.now()}.jpg`, receiptPhoto);

const { data: publicURL } = supabase.storage
  .from('receipts')
  .getPublicUrl(uploadedReceipt.path);

// Save receipt
await supabase
  .from('project_receipts')
  .insert({
    project_id: projectId,
    receipt_date: '2025-10-07',
    supplier: 'Hardware Store',
    total_amount: 125.50,
    description: 'Tools and materials',
    receipt_photo_url: publicURL.publicUrl,
    category: 'material',
    added_by: userId
  });
```

**Storage Bucket**: `receipts`

### public.receipts

**Purpose**: General receipts (not project-specific) for approval.

**Key Fields**:
- `id` (uuid, PK): Receipt identifier
- `user_id` (uuid, FK → auth.users): User who submitted
- `email_from` (text): Email sender (if from email)
- `subject` (text): Email subject
- `amount` (numeric): Receipt amount
- `description` (text): Description
- `category` (text): Category
- `receipt_file_url` (text): File URL
- `receipt_file_name` (text): Filename
- `receipt_file_type` (text): MIME type
- `status` (text): pending, approved, rejected
- `approved_by` (uuid): Approver user ID
- `approved_at` (timestamptz): Approval timestamp
- `rejection_reason` (text): Rejection reason
- `email_message_id` (text): Source email ID

**Mobile App Usage**:
```typescript
// Submit receipt
const { data: uploadedFile } = await supabase.storage
  .from('receipts')
  .upload(`${userId}/${Date.now()}.pdf`, receiptFile);

const { data: receipt } = await supabase
  .from('receipts')
  .insert({
    user_id: userId,
    amount: 45.00,
    description: 'Fuel for company vehicle',
    category: 'fuel',
    receipt_file_url: uploadedFile.path,
    receipt_file_name: receiptFile.name,
    receipt_file_type: receiptFile.type,
    status: 'pending'
  })
  .select()
  .single();

// Approve receipt (Admin/Administratie)
await supabase
  .from('receipts')
  .update({
    status: 'approved',
    approved_by: adminId,
    approved_at: new Date().toISOString()
  })
  .eq('id', receiptId);

// Reject receipt
await supabase
  .from('receipts')
  .update({
    status: 'rejected',
    approved_by: adminId,
    approved_at: new Date().toISOString(),
    rejection_reason: 'Receipt is not clear, please resubmit'
  })
  .eq('id', receiptId);

// Realtime subscription for status updates
const subscription = supabase
  .channel('receipts')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'receipts',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.status === 'approved') {
      showNotification('Receipt approved! ✅');
    } else if (payload.new.status === 'rejected') {
      showNotification(`Receipt rejected: ${payload.new.rejection_reason}`);
    }
  })
  .subscribe();
```

**Realtime**: ✅ Enabled for approval notifications

**Storage Bucket**: `receipts`

---

## Public Schema - Financial

### public.quotes

**Purpose**: Customer quotations.

**Key Fields**:
- `id` (uuid, PK): Quote identifier
- `quote_number` (text, UNIQUE): Quote number (e.g., OFF-2025-001)
- `customer_name` (text): Customer name
- `customer_email` (text): Customer email
- `project_title` (text): Project title
- `quote_date` (date): Quote date
- `valid_until` (date): Expiration date
- `message` (text): Custom message
- `items` (jsonb): Quote items array
- `subtotal` (numeric): Subtotal amount
- `vat_amount` (numeric): VAT amount
- `total_amount` (numeric): Total amount
- `status` (text): concept, sent, approved, rejected, expired
- `public_token` (text, UNIQUE): Public access token
- `admin_signature_data` (text): Admin signature (Base64)
- `client_signature_data` (text): Client signature (Base64)
- `client_signed_at` (timestamptz): Client signature timestamp
- `client_name` (text): Client name
- `payment_terms` (jsonb): Payment terms array
- `attachments` (jsonb): Attachments array
- `is_archived` (boolean): Archive flag
- `archived_by` (uuid): User who archived

**Mobile App Usage**:
```typescript
// Fetch quotes (Verkoper/Administratie)
const { data: quotes } = await supabase
  .from('quotes')
  .select('*')
  .eq('is_archived', false)
  .order('quote_date', { ascending: false });

// Create quote
const { data: quote } = await supabase
  .from('quotes')
  .insert({
    quote_number: 'OFF-2025-042',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    project_title: 'Solar Panel Installation',
    quote_date: '2025-10-07',
    valid_until: '2025-11-07',
    items: [
      {
        description: 'Solar Panel 400W',
        quantity: 10,
        unit_price: 250.00,
        vat_rate: 21,
        total: 2500.00
      }
    ],
    subtotal: 2500.00,
    vat_amount: 525.00,
    total_amount: 3025.00,
    status: 'concept'
  })
  .select()
  .single();

// Generate public link
const publicToken = crypto.randomUUID();
await supabase
  .from('quotes')
  .update({ 
    public_token: publicToken,
    status: 'sent'
  })
  .eq('id', quoteId);

const publicLink = `https://app.example.com/quote/${publicToken}`;
```

**Access Control**:
- Administrator/Administratie/Verkoper: Full access
- Installateur/Bekijker: Read-only

### public.invoices

**Purpose**: Customer invoices.

**Key Fields**:
- `id` (uuid, PK): Invoice identifier
- `invoice_number` (text, UNIQUE): Invoice number (e.g., FACT-2025-001)
- `customer_name` (text): Customer name
- `customer_email` (text): Customer email
- `project_title` (text): Project title
- `invoice_date` (date): Invoice date
- `due_date` (date): Payment due date
- `message` (text): Custom message
- `subtotal` (numeric): Subtotal amount
- `vat_amount` (numeric): VAT amount
- `total_amount` (numeric): Total amount
- `status` (text): concept, sent, paid, overdue, cancelled
- `source_quote_id` (uuid, FK → quotes): Source quote
- `payment_term_sequence` (integer): Payment term number
- `total_payment_terms` (integer): Total payment terms
- `original_quote_total` (numeric): Original quote total
- `attachments` (jsonb): Attachments array
- `payment_status` (text): pending, processing, paid, failed, refunded
- `payment_date` (timestamptz): Payment date
- `payment_method` (text): Payment method
- `stripe_checkout_session_id` (text): Stripe session ID
- `stripe_payment_intent_id` (text): Stripe payment intent ID
- `payment_link_url` (text): Payment link
- `payment_failure_reason` (text): Failure reason
- `sent_date` (timestamptz): Sent date
- `expires_date` (date): Expiration date
- `payment_terms` (jsonb): Payment terms array

**Mobile App Usage**:
```typescript
// Fetch invoices (Administratie)
const { data: invoices } = await supabase
  .from('invoices')
  .select('*')
  .eq('is_archived', false)
  .order('invoice_date', { ascending: false });

// Create invoice from quote
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    invoice_number: 'FACT-2025-042',
    customer_name: quote.customer_name,
    customer_email: quote.customer_email,
    project_title: quote.project_title,
    invoice_date: '2025-10-07',
    due_date: '2025-10-21',
    subtotal: quote.subtotal,
    vat_amount: quote.vat_amount,
    total_amount: quote.total_amount,
    source_quote_id: quote.id,
    status: 'sent',
    payment_status: 'pending'
  })
  .select()
  .single();
```

**Access Control**:
- Administrator/Administratie: Full access
- Others: No access

### public.invoice_items

**Purpose**: Line items for invoices.

**Key Fields**:
- `id` (uuid, PK): Item identifier
- `invoice_id` (uuid, FK → invoices): Invoice reference
- `type` (text): product, service, text
- `description` (text): Item description
- `quantity` (integer): Quantity
- `unit_price` (numeric): Price per unit
- `vat_rate` (integer): VAT rate (%)
- `total` (numeric): Total amount
- `order_index` (integer): Display order
- `block_title` (text): Block title
- `block_order` (integer): Block order
- `item_formatting` (jsonb): Formatting options

**Mobile App Usage**:
```typescript
// Add invoice items
await supabase
  .from('invoice_items')
  .insert([
    {
      invoice_id: invoiceId,
      type: 'product',
      description: 'Solar Panel 400W',
      quantity: 10,
      unit_price: 250.00,
      vat_rate: 21,
      total: 2500.00,
      order_index: 0
    },
    {
      invoice_id: invoiceId,
      type: 'service',
      description: 'Installation',
      quantity: 1,
      unit_price: 500.00,
      vat_rate: 21,
      total: 500.00,
      order_index: 1
    }
  ]);
```

### public.quote_settings

**Purpose**: Global quote/invoice settings.

**Key Fields**:
- `id` (uuid, PK): Settings identifier
- `terms_and_conditions` (text): Terms and conditions text
- `company_name` (text): Company name
- `company_address` (text): Company address
- `company_postal_code` (text): Postal code
- `company_city` (text): City
- `company_country` (text): Country
- `company_vat_number` (text): VAT number
- `company_kvk_number` (text): KVK number
- `default_attachments` (jsonb): Default attachments array

**Mobile App Usage**:
```typescript
// Fetch settings
const { data: settings } = await supabase
  .from('quote_settings')
  .select('*')
  .single();

// Use in quote/invoice generation
const quoteHTML = `
  <div>
    <h1>${settings.company_name}</h1>
    <p>${settings.company_address}</p>
    <p>${settings.company_postal_code} ${settings.company_city}</p>
    <!-- ... -->
  </div>
`;
```

**Access Control**:
- Administrator/Administratie: Full access
- Others: Read-only

### public.company_settings

**Purpose**: User-specific company settings.

**Key Fields**:
- `id` (uuid, PK): Settings identifier
- `user_id` (uuid): User reference
- `company_name` (text): Company name
- `address` (text): Address
- `postal_code` (text): Postal code
- `city` (text): City
- `country` (text): Country
- `kvk_number` (text): KVK number
- `btw_number` (text): BTW number
- `general_terms` (text): General terms
- `default_attachments` (jsonb): Default attachments

**Mobile App Usage**: Similar to `quote_settings`

---

## Public Schema - Email System

### public.email_accounts

**Purpose**: Email account configurations (SMTP/IMAP).

**Key Fields**:
- `id` (uuid, PK): Account identifier
- `user_id` (uuid, FK → profiles): User reference
- `email_address` (varchar): Email address
- `display_name` (varchar): Display name
- `smtp_host` (text): SMTP server
- `smtp_port` (integer): SMTP port
- `smtp_username` (text): SMTP username
- `smtp_password` (text): Encrypted SMTP password
- `smtp_encryption` (text): tls, ssl, none
- `imap_host` (text): IMAP server
- `imap_port` (integer): IMAP port (default: 993)
- `imap_username` (text): IMAP username
- `imap_password` (text): Encrypted IMAP password
- `imap_encryption` (text): ssl, tls, none
- `sync_enabled` (boolean): Auto-sync enabled
- `sync_interval` (integer): Sync interval (minutes)
- `auto_sync` (boolean): Auto-sync flag
- `last_sync_at` (timestamptz): Last sync timestamp
- `connection_status` (text): unconfigured, testing, connected, error
- `last_error` (text): Last error message
- `is_active` (boolean): Active status
- `is_primary` (boolean): Primary account flag

**Mobile App Usage**:
```typescript
// Fetch user email accounts
const { data: accounts } = await supabase
  .from('email_accounts')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

// Note: Email functionality is typically web-only
// Mobile app may display email status but not full email client
```

**Access Control**: User-specific (own accounts only)

### public.email_messages

**Purpose**: Stored email messages.

**Key Fields**:
- `id` (uuid, PK): Message identifier
- `user_id` (uuid, FK → auth.users): User reference
- `direction` (text): inbound, outbound
- `from_email` (text): Sender email
- `to_email` (text[]): Recipients
- `cc_email` (text[]): CC recipients
- `bcc_email` (text[]): BCC recipients
- `subject` (text): Email subject
- `body_html` (text): HTML body
- `body_text` (text): Plain text body
- `attachments` (jsonb): Attachments array
- `status` (text): unread, read, archived, sent, draft, failed
- `is_starred` (boolean): Starred flag
- `folder` (text): inbox, sent, drafts, archive, trash
- `thread_id` (uuid): Thread identifier
- `in_reply_to` (uuid, FK → email_messages): Reply reference
- `external_message_id` (text, UNIQUE): External message ID
- `sent_at` (timestamptz): Sent timestamp
- `received_at` (timestamptz): Received timestamp
- `read_at` (timestamptz): Read timestamp

**Mobile App Usage**: Typically not used in mobile app (web-only feature)

### public.emails

**Purpose**: Alternative email storage table.

**Key Fields**: Similar to `email_messages`

**Mobile App Usage**: Typically not used in mobile app

---

## Public Schema - Notifications

### public.user_notifications

**Purpose**: In-app notifications for users.

**Key Fields**:
- `id` (uuid, PK): Notification identifier
- `user_id` (uuid): Recipient user ID
- `title` (text): Notification title
- `message` (text): Notification message
- `type` (text): info, success, warning, error, project, chat, receipt
- `reference_type` (text): project, quote, invoice, message, receipt
- `reference_id` (uuid): Referenced resource ID
- `is_read` (boolean): Read status

**Mobile App Usage**:
```typescript
// Fetch unread notifications
const { data: notifications } = await supabase
  .from('user_notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Mark as read
await supabase
  .from('user_notifications')
  .update({ is_read: true })
  .eq('id', notificationId);

// Realtime subscription
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'user_notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    showPushNotification(payload.new.title, payload.new.message);
  })
  .subscribe();
```

**Realtime**: ✅ Enabled for instant notifications

### public.notification_preferences

**Purpose**: User notification preferences.

**Key Fields**:
- `id` (uuid, PK): Preference identifier
- `user_id` (uuid, UNIQUE): User reference
- `email_notifications` (boolean): Email notifications enabled
- `push_notifications` (boolean): Push notifications enabled
- `chat_notifications` (boolean): Chat notifications enabled
- `project_notifications` (boolean): Project notifications enabled
- `quote_notifications` (boolean): Quote notifications enabled
- `browser_notifications` (boolean): Browser notifications enabled
- `email_digest_frequency` (text): daily, weekly, never
- `quiet_hours_start` (time): Quiet hours start time
- `quiet_hours_end` (time): Quiet hours end time
- `weekend_notifications` (boolean): Weekend notifications enabled
- `notification_sound` (boolean): Sound enabled
- `instant_notifications` (boolean): Instant notifications enabled
- `notification_schedule` (jsonb): Schedule configuration

**Mobile App Usage**:
```typescript
// Fetch user preferences
const { data: prefs } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update preferences
await supabase
  .from('notification_preferences')
  .upsert({
    user_id: userId,
    push_notifications: true,
    chat_notifications: true,
    project_notifications: true,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00'
  });

// Check if notifications should be sent
const now = new Date();
const currentTime = now.toTimeString().slice(0, 8);
const isQuietHours = currentTime >= prefs.quiet_hours_start || 
                     currentTime <= prefs.quiet_hours_end;

if (!isQuietHours && prefs.push_notifications) {
  sendPushNotification(notification);
}
```

### public.push_subscriptions

**Purpose**: Web Push notification subscriptions.

**Key Fields**:
- `id` (uuid, PK): Subscription identifier
- `user_id` (uuid): User reference
- `endpoint` (text): Push endpoint URL
- `subscription_data` (jsonb): Subscription keys
- `is_active` (boolean): Active status

**Mobile App Usage**:
```typescript
// Register push subscription (mobile)
const pushToken = await Notifications.getExpoPushTokenAsync();

await supabase
  .from('push_subscriptions')
  .insert({
    user_id: userId,
    endpoint: pushToken.data,
    subscription_data: {
      type: 'expo',
      token: pushToken.data
    },
    is_active: true
  });
```

### public.notification_queue

**Purpose**: Queued notifications for delayed delivery.

**Key Fields**:
- `id` (uuid, PK): Queue item identifier
- `user_id` (uuid): Recipient user ID
- `notification_type` (text): Notification type
- `title` (text): Notification title
- `message` (text): Notification message
- `payload` (jsonb): Additional data
- `scheduled_for` (timestamptz): Scheduled delivery time
- `priority` (integer): Priority (1-10)
- `retry_count` (integer): Retry attempts
- `max_retries` (integer): Max retry attempts
- `status` (text): pending, sent, failed, cancelled
- `processed_at` (timestamptz): Processing timestamp

**Mobile App Usage**: Backend-managed, not directly accessed by mobile app

---

## Public Schema - Analytics & Compliance

### public.audit_logs

**Purpose**: Comprehensive audit trail for compliance.

**Key Fields**:
- `id` (uuid, PK): Log entry identifier
- `user_id` (uuid, FK → auth.users): User who performed action
- `action_type` (varchar): Action type (create, update, delete, view, login, etc.)
- `resource_type` (varchar): Resource type (project, customer, quote, etc.)
- `resource_id` (uuid): Resource identifier
- `details` (jsonb): Action details
- `ip_address` (inet): IP address
- `user_agent` (text): User agent string
- `session_id` (varchar): Session identifier
- `timestamp` (timestamptz): Action timestamp
- `severity` (varchar): info, warning, critical
- `compliance_relevant` (boolean): Compliance flag

**Mobile App Usage**:
```typescript
// Audit logs are typically auto-generated by RLS policies
// Example: Log project view
await supabase
  .from('audit_logs')
  .insert({
    user_id: userId,
    action_type: 'view',
    resource_type: 'project',
    resource_id: projectId,
    details: { screen: 'project_detail' },
    severity: 'info'
  });
```

**Access Control**: Administrator only

### public.compliance_events

**Purpose**: Compliance-related events and violations.

**Key Fields**:
- `id` (uuid, PK): Event identifier
- `event_type` (varchar): Event type
- `severity` (varchar): low, medium, high, critical
- `description` (text): Event description
- `user_id` (uuid): Related user
- `resource_affected` (varchar): Affected resource
- `compliance_standard` (varchar): GDPR, ISO27001, etc.
- `remediation_required` (boolean): Remediation flag
- `remediation_status` (varchar): pending, in_progress, completed
- `detected_at` (timestamptz): Detection timestamp
- `resolved_at` (timestamptz): Resolution timestamp
- `metadata` (jsonb): Additional metadata

**Mobile App Usage**: Backend-managed, not directly accessed by mobile app

### public.consent_records

**Purpose**: User consent tracking (GDPR compliance).

**Key Fields**:
- `id` (uuid, PK): Consent record identifier
- `user_id` (uuid, FK → auth.users): User reference
- `consent_type` (varchar): Consent type
- `purpose` (text): Purpose description
- `given_at` (timestamptz): Consent timestamp
- `withdrawn_at` (timestamptz): Withdrawal timestamp
- `is_active` (boolean): Active status
- `consent_source` (varchar): Source (app, web, email)
- `legal_basis` (varchar): Legal basis
- `data_categories` (text[]): Data categories
- `expiry_date` (timestamptz): Expiration date

**Mobile App Usage**:
```typescript
// Request consent
const { data: consent } = await supabase
  .from('consent_records')
  .insert({
    user_id: userId,
    consent_type: 'data_processing',
    purpose: 'Process project data and communications',
    consent_source: 'mobile_app',
    legal_basis: 'consent',
    data_categories: ['personal', 'communication', 'location']
  })
  .select()
  .single();

// Withdraw consent
await supabase
  .from('consent_records')
  .update({
    withdrawn_at: new Date().toISOString(),
    is_active: false
  })
  .eq('id', consentId);
```

### public.privacy_settings

**Purpose**: User privacy preferences.

**Key Fields**:
- `id` (uuid, PK): Settings identifier
- `user_id` (uuid, UNIQUE, FK → auth.users): User reference
- `data_processing_consent` (jsonb): Consent details
- `marketing_consent` (boolean): Marketing consent
- `analytics_consent` (boolean): Analytics consent
- `third_party_sharing` (boolean): Third-party sharing consent
- `data_export_requests` (jsonb): Export request history
- `deletion_requests` (jsonb): Deletion request history
- `privacy_preferences` (jsonb): Additional preferences

**Mobile App Usage**:
```typescript
// Fetch privacy settings
const { data: privacy } = await supabase
  .from('privacy_settings')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update privacy settings
await supabase
  .from('privacy_settings')
  .upsert({
    user_id: userId,
    marketing_consent: false,
    analytics_consent: true,
    third_party_sharing: false
  });

// Request data export
await supabase
  .from('privacy_settings')
  .update({
    data_export_requests: supabase.sql`
      data_export_requests || ${JSON.stringify([{
        requested_at: new Date().toISOString(),
        status: 'pending'
      }])}
    `
  })
  .eq('user_id', userId);
```

### public.data_retention_policies

**Purpose**: Data retention policy definitions.

**Key Fields**:
- `id` (uuid, PK): Policy identifier
- `policy_name` (varchar): Policy name
- `data_type` (varchar): Data type
- `retention_period_days` (integer): Retention period
- `description` (text): Policy description
- `legal_basis` (text): Legal basis
- `automatic_deletion` (boolean): Auto-delete flag
- `archive_before_deletion` (boolean): Archive flag
- `is_active` (boolean): Active status

**Mobile App Usage**: Backend-managed, not directly accessed by mobile app

### public.conversation_analytics

**Purpose**: Analytics for chat conversations.

**Key Fields**:
- `id` (uuid, PK): Analytics record identifier
- `conversation_participants` (uuid[]): Participant user IDs
- `project_id` (uuid): Associated project
- `date` (date): Analytics date
- `message_count` (integer): Number of messages
- `avg_response_time` (interval): Average response time
- `sentiment_score` (numeric): Sentiment score
- `language_distribution` (jsonb): Language usage
- `topic_keywords` (text[]): Extracted keywords

**Mobile App Usage**: Read-only for analytics dashboards

### public.conversation_insights

**Purpose**: AI-generated conversation insights.

**Key Fields**:
- `id` (uuid, PK): Insight identifier
- `user_id` (uuid): User reference
- `project_id` (uuid): Project reference
- `insight_type` (varchar): Insight type
- `title` (varchar): Insight title
- `description` (text): Insight description
- `data` (jsonb): Insight data
- `severity` (varchar): info, warning, critical
- `is_read` (boolean): Read status

**Mobile App Usage**: Display insights in analytics section

---

## Realtime Schema

### realtime.messages

**Purpose**: Realtime message delivery system (managed by Supabase).

**Key Fields**:
- `id` (uuid, PK): Message identifier
- `topic` (text): Channel topic
- `extension` (text): Extension type
- `payload` (jsonb): Message payload
- `event` (text): Event type
- `private` (boolean): Private message flag
- `inserted_at` (timestamp): Insertion timestamp

**Mobile App Usage**: Automatic via Supabase Realtime SDK

### realtime.subscription

**Purpose**: Active realtime subscriptions.

**Key Fields**:
- `id` (bigint, PK): Subscription identifier
- `subscription_id` (uuid): Subscription UUID
- `entity` (regclass): Table name
- `filters` (user_defined_filter[]): Subscription filters
- `claims` (jsonb): JWT claims
- `claims_role` (regrole): User role

**Mobile App Usage**: Automatic via Supabase Realtime SDK

**Example Realtime Subscriptions**:
```typescript
// Subscribe to direct messages
const messagesChannel = supabase
  .channel('direct_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'direct_messages',
    filter: `to_user_id=eq.${userId}`
  }, (payload) => {
    handleNewMessage(payload.new);
  })
  .subscribe();

// Subscribe to project updates
const projectsChannel = supabase
  .channel('projects')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'projects',
    filter: `assigned_user_id=eq.${userId}`
  }, (payload) => {
    handleProjectUpdate(payload.new);
  })
  .subscribe();

// Subscribe to planning changes
const planningChannel = supabase
  .channel('planning')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'planning_items',
    filter: `assigned_user_id=eq.${userId}`
  }, (payload) => {
    handlePlanningChange(payload);
  })
  .subscribe();

// Subscribe to receipt approvals
const receiptsChannel = supabase
  .channel('receipts')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'receipts',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.status !== payload.old.status) {
      handleReceiptStatusChange(payload.new);
    }
  })
  .subscribe();

// Unsubscribe when component unmounts
useEffect(() => {
  return () => {
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(projectsChannel);
    supabase.removeChannel(planningChannel);
    supabase.removeChannel(receiptsChannel);
  };
}, []);
```

---

## Storage Schema

### storage.buckets

**Purpose**: Storage bucket definitions.

**Key Fields**:
- `id` (text, PK): Bucket identifier
- `name` (text): Bucket name
- `owner` (uuid): Owner user ID
- `public` (boolean): Public access flag
- `file_size_limit` (bigint): Max file size
- `allowed_mime_types` (text[]): Allowed MIME types

**Mobile App Buckets**:

1. **`chat-media`**
   - Purpose: Chat images, videos, documents
   - Public: No
   - Max Size: 10MB per file
   - Allowed Types: image/*, video/*, application/pdf, application/msword

2. **`voice-messages`**
   - Purpose: Voice recordings
   - Public: No
   - Max Size: 5MB per file
   - Allowed Types: audio/*

3. **`completion-reports`**
   - Purpose: Project completion photos
   - Public: No
   - Max Size: 10MB per file
   - Allowed Types: image/*

4. **`receipts`**
   - Purpose: Receipt photos and PDFs
   - Public: No
   - Max Size: 10MB per file
   - Allowed Types: image/*, application/pdf

5. **`quote-attachments`**
   - Purpose: Quote/invoice attachments
   - Public: No (token-based access)
   - Max Size: 10MB per file
   - Allowed Types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*

**Mobile App Usage**:
```typescript
// Upload file to storage
const { data: uploadedFile, error } = await supabase.storage
  .from('chat-media')
  .upload(`${userId}/${Date.now()}_${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

if (error) {
  console.error('Upload error:', error);
  return;
}

// Get public URL (for public buckets)
const { data: publicURL } = supabase.storage
  .from('chat-media')
  .getPublicUrl(uploadedFile.path);

// Get signed URL (for private buckets)
const { data: signedURL } = await supabase.storage
  .from('receipts')
  .createSignedUrl(uploadedFile.path, 3600); // 1 hour expiry

// Download file
const { data: downloadedFile } = await supabase.storage
  .from('completion-reports')
  .download(filePath);

// Delete file
await supabase.storage
  .from('chat-media')
  .remove([filePath]);

// List files in directory
const { data: files } = await supabase.storage
  .from('receipts')
  .list(`${userId}/`, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  });
```

### storage.objects

**Purpose**: Individual file metadata.

**Key Fields**:
- `id` (uuid, PK): Object identifier
- `bucket_id` (text, FK → storage.buckets): Bucket reference
- `name` (text): File path/name
- `owner` (uuid): Owner user ID
- `metadata` (jsonb): File metadata
- `user_metadata` (jsonb): Custom metadata

**Mobile App Usage**: Automatic via Storage SDK

---

## Vault Schema

### vault.secrets

**Purpose**: Encrypted secrets storage (e.g., API keys, passwords).

**Key Fields**:
- `id` (uuid, PK): Secret identifier
- `name` (text): Secret name
- `description` (text): Secret description
- `secret` (text): Encrypted secret value
- `key_id` (uuid): Encryption key ID
- `nonce` (bytea): Encryption nonce

**Mobile App Usage**: Backend-managed, not directly accessed by mobile app

**Example** (Backend Edge Function):
```typescript
// Store encrypted password
await supabase
  .from('vault.secrets')
  .insert({
    name: 'smtp_password',
    description: 'SMTP password for email account',
    secret: encryptedPassword
  });

// Retrieve and decrypt
const { data: secret } = await supabase
  .from('vault.secrets')
  .select('secret')
  .eq('name', 'smtp_password')
  .single();

const decryptedPassword = decrypt(secret.secret);
```

---

## Mobile App Integration Guide

### Authentication Flow

```typescript
// 1. Sign Up
const { data: authData, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});

// 2. Sign In
const { data: session, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});

// 3. Get Current User
const { data: { user } } = await supabase.auth.getUser();

// 4. Get User Profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// 5. Sign Out
await supabase.auth.signOut();

// 6. Password Reset
await supabase.auth.resetPasswordForEmail('user@example.com');
```

### Offline Support Strategy

```typescript
// 1. Local Database (SQLite)
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('smans_crm.db');

// 2. Queue Offline Actions
const queueOfflineAction = async (action) => {
  await db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO offline_queue (action_type, payload, created_at) VALUES (?, ?, ?)',
      [action.type, JSON.stringify(action.payload), new Date().toISOString()]
    );
  });
};

// 3. Sync When Online
const syncOfflineQueue = async () => {
  const queue = await getOfflineQueue();
  
  for (const item of queue) {
    try {
      switch (item.action_type) {
        case 'send_message':
          await supabase.from('direct_messages').insert(item.payload);
          break;
        case 'update_task':
          await supabase.from('project_tasks').update(item.payload.data).eq('id', item.payload.id);
          break;
        case 'upload_photo':
          await uploadPhoto(item.payload);
          break;
      }
      
      // Remove from queue
      await removeFromQueue(item.id);
    } catch (error) {
      console.error('Sync error:', error);
      // Keep in queue for retry
    }
  }
};

// 4. Network Status Listener
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncOfflineQueue();
  }
});
```

### Push Notifications Setup

```typescript
import * as Notifications from 'expo-notifications';

// 1. Request Permission
const { status } = await Notifications.requestPermissionsAsync();

if (status !== 'granted') {
  alert('Push notifications permission required');
  return;
}

// 2. Get Push Token
const pushToken = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id'
});

// 3. Register Token with Supabase
await supabase
  .from('push_subscriptions')
  .insert({
    user_id: userId,
    endpoint: pushToken.data,
    subscription_data: {
      type: 'expo',
      token: pushToken.data
    },
    is_active: true
  });

// 4. Handle Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 5. Listen for Notifications
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
});

Notifications.addNotificationResponseReceivedListener(response => {
  console.log('Notification tapped:', response);
  // Navigate to relevant screen
  const { reference_type, reference_id } = response.notification.request.content.data;
  
  if (reference_type === 'project') {
    navigation.navigate('ProjectDetail', { projectId: reference_id });
  } else if (reference_type === 'message') {
    navigation.navigate('ChatDetail', { userId: reference_id });
  }
});
```

### File Upload with Progress

```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// 1. Pick Image
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0];
  }
};

// 2. Pick Document
const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });

  if (result.type === 'success') {
    return result;
  }
};

// 3. Upload with Progress
const uploadFile = async (file, bucketName, path) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.mimeType || 'application/octet-stream',
    name: file.name || 'file'
  });

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, formData, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setUploadProgress(percent);
      }
    });

  if (error) throw error;
  return data;
};

// 4. Usage Example
const handleUploadReceipt = async () => {
  try {
    setUploading(true);
    
    const file = await pickImage();
    if (!file) return;

    const fileName = `${userId}/${Date.now()}.jpg`;
    const uploadedFile = await uploadFile(file, 'receipts', fileName);

    const { data: publicURL } = supabase.storage
      .from('receipts')
      .getPublicUrl(uploadedFile.path);

    await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        receipt_file_url: publicURL.publicUrl,
        receipt_file_name: file.name,
        receipt_file_type: file.mimeType,
        status: 'pending'
      });

    alert('Receipt uploaded successfully!');
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed');
  } finally {
    setUploading(false);
  }
};
```

### Realtime Presence

```typescript
// 1. Set Up Presence Channel
const presenceChannel = supabase.channel('online_users', {
  config: {
    presence: {
      key: userId,
    },
  },
});

// 2. Track User Presence
presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    const onlineUsers = Object.keys(state).map(key => state[key][0]);
    setOnlineUsers(onlineUsers);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });

// 3. Update Database Presence
const updatePresence = async (isOnline) => {
  await supabase
    .from('profiles')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
    .eq('id', userId);
};

// 4. App State Listener
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    updatePresence(true);
  } else if (nextAppState === 'background') {
    updatePresence(false);
  }
});
```

---

## Security & RLS Policies

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

**profiles**:
- Users can view all profiles
- Users can only update their own profile

**customers**:
- Administrator/Administratie/Verkoper: Full access
- Installateur: Read-only for assigned projects
- Bekijker: Read-only

**projects**:
- Administrator/Administratie/Verkoper: Full access
- Installateur: Only assigned projects
- Bekijker: Read-only

**direct_messages**:
- Users can only view messages where they are sender or recipient
- Users can only send messages as themselves

**planning_items**:
- Administrator/Administratie: Full access
- Installateur: Only assigned items
- Verkoper: Read-only
- Bekijker: No access

**receipts**:
- Users can view/create their own receipts
- Administrator/Administratie: Approve/reject all receipts

**quotes/invoices**:
- Administrator/Administratie/Verkoper: Full access
- Others: No access

### Example RLS Policies

```sql
-- Projects: Installateurs can only see assigned projects
CREATE POLICY "Installateurs can view assigned projects"
ON projects FOR SELECT
USING (
  CASE
    WHEN get_user_role(auth.uid()) = 'Installateur' 
      THEN assigned_user_id = auth.uid()
    ELSE true
  END
);

-- Direct Messages: Users can only see their own messages
CREATE POLICY "Users can view their messages"
ON direct_messages FOR SELECT
USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Receipts: Users can create their own receipts
CREATE POLICY "Users can create receipts"
ON receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Receipts: Admin can approve/reject
CREATE POLICY "Admin can approve receipts"
ON receipts FOR UPDATE
USING (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);
```

---

## Best Practices

### 1. Error Handling

```typescript
const fetchProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('assigned_user_id', userId);

    if (error) {
      // Log error for debugging
      console.error('Supabase error:', error);
      
      // Show user-friendly message
      if (error.code === 'PGRST116') {
        alert('No projects found');
      } else if (error.message.includes('permission denied')) {
        alert('You do not have permission to view this data');
      } else {
        alert('An error occurred. Please try again.');
      }
      
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred');
    return [];
  }
};
```

### 2. Pagination

```typescript
const ITEMS_PER_PAGE = 20;

const fetchProjectsPaginated = async (page = 0) => {
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data,
    totalPages: Math.ceil(count / ITEMS_PER_PAGE),
    currentPage: page
  };
};
```

### 3. Optimistic Updates

```typescript
const toggleTaskCompletion = async (taskId, currentStatus) => {
  // Optimistically update UI
  setTasks(tasks.map(task => 
    task.id === taskId 
      ? { ...task, is_completed: !currentStatus }
      : task
  ));

  try {
    const { error } = await supabase
      .from('project_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    // Revert on error
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, is_completed: currentStatus }
        : task
    ));
    
    alert('Failed to update task');
  }
};
```

### 4. Batch Operations

```typescript
// Insert multiple items at once
const createMultipleTasks = async (projectId, tasks) => {
  const tasksToInsert = tasks.map((task, index) => ({
    project_id: projectId,
    block_title: task.title,
    task_description: task.description,
    order_index: index
  }));

  const { data, error } = await supabase
    .from('project_tasks')
    .insert(tasksToInsert)
    .select();

  if (error) throw error;
  return data;
};
```

### 5. Caching Strategy

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'projects_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchProjectsWithCache = async () => {
  // Check cache first
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
  }

  // Fetch from Supabase
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) throw error;

  // Cache result
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  return data;
};

// Clear cache on logout
const clearCache = async () => {
  await AsyncStorage.multiRemove([
    'projects_cache',
    'customers_cache',
    'planning_cache'
  ]);
};
```

### 6. Connection Monitoring

```typescript
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
    
    if (state.isConnected) {
      // Sync offline queue
      syncOfflineQueue();
    }
  });

  return () => unsubscribe();
}, []);

// Show offline indicator
{!isOnline && (
  <View style={styles.offlineBanner}>
    <Text>You are offline. Changes will sync when online.</Text>
  </View>
)}
```

---

## Summary

This documentation provides a comprehensive overview of the Supabase database schema for the SMANS CRM mobile application. The system is designed with:

- **Security First**: Row Level Security on all tables
- **Real-time Capabilities**: Live updates for chat, projects, and planning
- **Offline Support**: Queue system for offline operations
- **Compliance**: Full audit trail and GDPR compliance
- **Scalability**: Optimized queries and caching strategies
- **Multi-role Access**: Fine-grained permissions per user role

For DreamFlow implementation, focus on:

1. **Core Features**: Chat, Projects, Planning, Receipts
2. **User Roles**: Implement role-based UI and access control
3. **Realtime**: Enable live updates for critical features
4. **Offline**: Implement offline queue and sync
5. **Push Notifications**: Set up Expo push notifications
6. **File Uploads**: Implement photo/document uploads to Storage
7. **Signatures**: Canvas-based signature capture with Base64 encoding

**Next Steps**:
1. Set up Supabase client in DreamFlow
2. Implement authentication flow
3. Create screens based on user roles
4. Implement realtime subscriptions
5. Set up offline support
6. Configure push notifications
7. Test RLS policies thoroughly

---

**End of Documentation**
