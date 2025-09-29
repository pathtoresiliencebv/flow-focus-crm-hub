# API Documentation - Flow Focus CRM Hub

Complete API documentation for the Flow Focus CRM Hub backend services, including Supabase Edge Functions, database schema, and integration endpoints.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [Edge Functions](#edge-functions)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [File Storage](#file-storage)
7. [Translation Services](#translation-services)
8. [Email Services](#email-services)
9. [Push Notifications](#push-notifications)
10. [Error Handling](#error-handling)

## 🌐 Overview

### Base URLs
- **Production**: `https://your-project.supabase.co`
- **Staging**: `https://your-staging-project.supabase.co`
- **Development**: `http://localhost:54321`

### API Versioning
- Current Version: `v1`
- All Edge Functions: `/functions/v1/function-name`

### Request/Response Format
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (`2024-08-04T12:00:00.000Z`)

## 🔐 Authentication

### Authentication Methods
1. **Email/Password**: Traditional email authentication
2. **Magic Link**: Passwordless email authentication  
3. **OAuth**: Google, GitHub, etc.
4. **Mobile Biometric**: Face ID, Touch ID, Fingerprint

### Headers
```http
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
Content-Type: application/json
```

### JWT Token Structure
```json
{
  "aud": "authenticated",
  "exp": 1691155200,
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "user_metadata": {
    "full_name": "John Doe",
    "role": "Monteur"
  }
}
```

## 🗄️ Database Schema

### Core Tables

#### Users & Profiles
```sql
-- profiles table
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "avatar_url": "string",
  "role": "Administrator | Administratie | Monteur",
  "phone": "string",
  "status": "Actief | Inactief",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Projects
```sql
-- projects table
{
  "id": "uuid",
  "title": "string",
  "description": "text",
  "customer_name": "string", 
  "customer_email": "string",
  "customer_phone": "string",
  "address": "string",
  "status": "Planning | In Progress | On Hold | Completed | Cancelled",
  "priority": "Low | Medium | High",
  "due_date": "date",
  "completion_date": "date",
  "completion_id": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Project Completions
```sql
-- project_completions table
{
  "id": "uuid",
  "project_id": "uuid",
  "installer_id": "uuid", 
  "completion_date": "date",
  "work_performed": "text",
  "materials_used": "text",
  "recommendations": "text",
  "notes": "text",
  "customer_satisfaction": "integer", // 1-5
  "customer_signature": "text",
  "installer_signature": "text",
  "pdf_url": "string",
  "status": "draft | completed | sent",
  "email_sent_at": "timestamp",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Chat System
```sql
-- chat_channels table
{
  "id": "uuid",
  "name": "string",
  "type": "direct | group | project",
  "project_id": "uuid",
  "created_by": "uuid",
  "created_at": "timestamp"
}

-- chat_messages table  
{
  "id": "uuid",
  "channel_id": "uuid",
  "user_id": "uuid",
  "content": "text",
  "message_type": "text | image | file | voice",
  "file_url": "string",
  "detected_language": "string",
  "original_language": "string", 
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Translation System
```sql
-- user_language_preferences table
{
  "id": "uuid",
  "user_id": "uuid",
  "preferred_language": "string", // ISO 639-1
  "ui_language": "string",
  "chat_translation_enabled": "boolean",
  "auto_detect_language": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}

-- message_translations table
{
  "id": "uuid", 
  "message_id": "uuid",
  "original_text": "text",
  "translated_text": "text",
  "source_language": "string",
  "target_language": "string",
  "confidence": "decimal(3,2)",
  "translation_provider": "string",
  "created_at": "timestamp"
}
```

## ⚡ Edge Functions

### 1. Translate Message

**Endpoint**: `POST /functions/v1/translate-message`

**Description**: Translates chat messages using Google Translate API with caching.

**Request**:
```json
{
  "text": "Hallo, hoe gaat het?",
  "fromLanguage": "nl",
  "toLanguage": "en", 
  "messageId": "uuid-optional"
}
```

**Response**:
```json
{
  "translatedText": "Hello, how are you?",
  "originalText": "Hallo, hoe gaat het?",
  "fromLanguage": "nl",
  "toLanguage": "en",
  "confidence": 0.98,
  "cached": false
}
```

**Error Response**:
```json
{
  "translatedText": "Hallo, hoe gaat het?",
  "originalText": "Hallo, hoe gaat het?", 
  "fromLanguage": "unknown",
  "toLanguage": "en",
  "confidence": 0,
  "error": "Translation failed"
}
```

### 2. Generate Completion PDF

**Endpoint**: `POST /functions/v1/generate-completion-pdf`

**Description**: Generates PDF report for completed projects and sends email to customer.

**Request**:
```json
{
  "completionData": {
    "project_id": "uuid",
    "installer_id": "uuid",
    "completion_date": "2024-08-04",
    "work_performed": "Installed new windows",
    "materials_used": "PVC windows, sealing materials",
    "recommendations": "Annual maintenance recommended",
    "notes": "Customer very satisfied",
    "customer_satisfaction": 5,
    "customer_signature": "data:image/png;base64,...",
    "installer_signature": "data:image/png;base64,...",
    "photos": [
      {
        "id": "photo-1",
        "url": "https://storage.supabase.co/...",
        "description": "Before installation",
        "category": "before"
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "completion_id": "uuid",
  "pdf_url": "https://storage.supabase.co/.../completion_report.html",
  "email_sent": true,
  "message": "Project completion processed successfully"
}
```

### 3. Send Completion Email

**Endpoint**: `POST /functions/v1/send-completion-email`

**Description**: Sends professional completion email to customers.

**Request**:
```json
{
  "to": "customer@example.com",
  "customer_name": "John Smith",
  "project_title": "Window Installation",
  "project_address": "123 Main St, Amsterdam",
  "installer_name": "Mike Johnson",
  "completion_date": "2024-08-04",
  "customer_satisfaction": 5,
  "work_performed": "Installed new PVC windows",
  "recommendations": "Annual maintenance recommended",
  "pdf_url": "https://storage.supabase.co/.../report.html"
}
```

**Response**:
```json
{
  "success": true,
  "email_id": "resend-email-id",
  "message": "Completion email sent successfully"
}
```

### 4. Auth Mobile

**Endpoint**: `POST /functions/v1/auth-mobile`

**Description**: Mobile-specific authentication handling with biometric support.

**Request**:
```json
{
  "action": "biometric_auth",
  "user_id": "uuid",
  "biometric_data": {
    "type": "face_id",
    "result": "success"
  }
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1691155200
  }
}
```

## 🔄 Real-time Subscriptions

### Chat Messages
```typescript
// Subscribe to new messages in a channel
const subscription = supabase
  .channel(`chat_messages:${channelId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `channel_id=eq.${channelId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

### Project Updates
```typescript
// Subscribe to project status changes
const subscription = supabase
  .channel('project_updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public', 
      table: 'projects',
    },
    (payload) => {
      console.log('Project updated:', payload.new);
    }
  )
  .subscribe();
```

### User Presence
```typescript
// Track user presence
const channel = supabase.channel('online_users');

channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState();
    console.log('Presence state:', newState);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      });
    }
  });
```

## 📁 File Storage

### Storage Buckets
- **project-photos**: Project completion photos
- **completion-reports**: Generated PDF reports  
- **avatars**: User profile images
- **attachments**: Chat attachments

### Upload File
```typescript
const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    
  if (error) throw error;
  
  return data;
};
```

### Get Public URL
```typescript
const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
};
```

### Delete File
```typescript
const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
    
  if (error) throw error;
};
```

## 🌍 Translation Services

### Supported Languages
```json
[
  { "code": "nl", "name": "Dutch", "native": "Nederlands", "flag": "🇳🇱" },
  { "code": "en", "name": "English", "native": "English", "flag": "🇬🇧" },
  { "code": "pl", "name": "Polish", "native": "Polski", "flag": "🇵🇱" },
  { "code": "de", "name": "German", "native": "Deutsch", "flag": "🇩🇪" },
  { "code": "fr", "name": "French", "native": "Français", "flag": "🇫🇷" }
]
```

### Translation API Usage
```typescript
const translateText = async (text: string, targetLanguage: string) => {
  const { data, error } = await supabase.functions.invoke('translate-message', {
    body: {
      text,
      toLanguage: targetLanguage,
    },
  });
  
  if (error) throw error;
  return data;
};
```

### Language Detection
```typescript
const detectLanguage = async (text: string) => {
  const { data, error } = await supabase.functions.invoke('translate-message', {
    body: {
      text,
      toLanguage: 'en', // Required but not used for detection
    },
  });
  
  if (error) throw error;
  return data.fromLanguage;
};
```

## 📧 Email Services

### Email Templates
- **Project Completion**: Professional completion report
- **Welcome**: New user onboarding
- **Password Reset**: Account recovery
- **Notification**: System notifications

### Send Email
```typescript
const sendEmail = async (emailData: EmailData) => {
  const { data, error } = await supabase.functions.invoke('send-completion-email', {
    body: emailData,
  });
  
  if (error) throw error;
  return data;
};
```

### Email Status Tracking
```typescript
// Check email delivery status
const checkEmailStatus = async (emailId: string) => {
  // Implementation depends on email provider (Resend, SendGrid, etc.)
  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });
  
  return response.json();
};
```

## 🔔 Push Notifications

### Register Device Token
```typescript
const registerPushToken = async (token: string, userId: string) => {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: 'ios', // or 'android'
      created_at: new Date().toISOString(),
    });
    
  if (error) throw error;
};
```

### Send Push Notification
```typescript
const sendPushNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data?: any
) => {
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      user_ids: userIds,
      title,
      body,
      data,
    },
  });
  
  if (error) throw error;
  return data;
};
```

## ❌ Error Handling

### Error Types
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}
```

### Common Error Codes
- `PGRST301`: Row Level Security violation
- `PGRST116`: No rows returned (404 equivalent)
- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation
- `42501`: Insufficient privilege

### Error Response Format
```json
{
  "error": {
    "code": "PGRST301",
    "message": "Row level security policy violated",
    "details": "User does not have permission to access this resource",
    "hint": "Check user permissions and RLS policies"
  }
}
```

### Handling Errors
```typescript
const handleSupabaseError = (error: any) => {
  switch (error.code) {
    case 'PGRST301':
      return 'Access denied. Please check your permissions.';
    case 'PGRST116': 
      return 'Resource not found.';
    case '23505':
      return 'This item already exists.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};
```

## 📊 Analytics & Monitoring

### Performance Logging
```typescript
const logPerformance = async (
  pageName: string,
  action: string,
  duration: number
) => {
  const { error } = await supabase
    .from('performance_logs')
    .insert({
      user_id: user.id,
      page_name: pageName,
      action,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
    
  if (error) console.error('Performance logging failed:', error);
};
```

### Error Logging
```typescript
const logError = async (
  error: Error,
  context: {
    component: string;
    action: string;
    additionalData?: any;
  }
) => {
  const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { error: logError } = await supabase
    .from('error_logs')
    .insert({
      error_id: errorId,
      message: error.message,
      stack_trace: error.stack,
      category: context.component,
      component: context.component,
      action: context.action,
      additional_data: context.additionalData || {},
      user_id: user?.id,
      timestamp: new Date().toISOString(),
    });
    
  if (logError) console.error('Error logging failed:', logError);
  return errorId;
};
```

## 🔒 Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Example: Admins can see all data  
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );
```

### API Security
- All endpoints require valid JWT token
- Rate limiting implemented on Edge Functions
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Data Privacy
- Personal data encrypted at rest
- Secure transmission (HTTPS/TLS)
- GDPR compliance features
- Data retention policies
- Audit logging

## 📝 API Testing

### Example Test Suite
```typescript
// tests/api/projects.test.ts
describe('Projects API', () => {
  test('should create new project', async () => {
    const projectData = {
      title: 'Test Project',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      address: '123 Main St',
      status: 'Planning',
    };
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
      
    expect(error).toBe(null);
    expect(data.title).toBe(projectData.title);
  });
  
  test('should translate message', async () => {
    const { data, error } = await supabase.functions.invoke('translate-message', {
      body: {
        text: 'Hallo wereld',
        toLanguage: 'en',
      },
    });
    
    expect(error).toBe(null);
    expect(data.translatedText).toBe('Hello world');
  });
});
```

---

This API documentation provides comprehensive coverage of all backend services and endpoints in the Flow Focus CRM Hub application. Use this reference for integration and development work.