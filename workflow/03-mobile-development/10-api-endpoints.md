# API Endpoints & Edge Functions

## Supabase Configuration

### Base Configuration
```typescript
// Supabase Client Configuration
const supabaseUrl = 'https://pvesgvkyiaqmsudmmtkc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8'

// Database Tables Used by Mobile App
const tables = {
  profiles: 'profiles',
  projects: 'projects', 
  project_tasks: 'project_tasks',
  project_materials: 'project_materials',
  project_work_orders: 'project_work_orders',
  time_registrations: 'time_registrations',
  chat_channels: 'chat_channels',
  chat_messages: 'chat_messages',
  user_notifications: 'user_notifications'
}
```

## Core REST API Endpoints

### Authentication Endpoints

#### Sign In
```http
POST /auth/v1/token?grant_type=password
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "email": "monteur@smanscrm.nl",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid-here",
    "email": "monteur@smanscrm.nl",
    "role": "authenticated"
  }
}
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

#### Sign Out
```http
POST /auth/v1/logout
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
```

### User Profile Endpoints

#### Get Current User Profile
```http
GET /rest/v1/profiles?id=eq.user_id&select=*
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "full_name": "Jan de Monteur",
    "role": "Installateur",
    "status": "Actief",
    "language_preference": "nl",
    "timezone": "Europe/Amsterdam",
    "is_online": true,
    "last_seen": "2024-01-20T10:30:00Z"
  }
]
```

### Project Endpoints

#### Get Assigned Projects
```http
GET /rest/v1/projects?assigned_user_id=eq.user_id&select=*
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": "project-uuid",
    "title": "Badkamer renovatie",
    "description": "Complete badkamer renovatie inclusief tegels",
    "customer_name": "Familie Jansen",
    "assigned_user_id": "user-uuid",
    "status": "te-plannen",
    "date": "2024-01-25",
    "value": 15000.00,
    "location": "Hoofdstraat 123, Amsterdam",
    "created_at": "2024-01-20T08:00:00Z",
    "updated_at": "2024-01-20T08:00:00Z"
  }
]
```

#### Update Project Status
```http
PATCH /rest/v1/projects?id=eq.project_id
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "in-uitvoering",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

### Project Tasks Endpoints

#### Get Project Tasks
```http
GET /rest/v1/project_tasks?project_id=eq.project_uuid&select=*&order=order_index
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": "task-uuid",
    "project_id": "project-uuid",
    "block_title": "Voorbereidingen",
    "task_description": "Oude tegels verwijderen",
    "info_text": null,
    "is_info_block": false,
    "is_completed": false,
    "order_index": 0,
    "source_quote_item_id": "quote-item-123",
    "quote_item_type": "product"
  }
]
```

#### Complete Task
```http
PATCH /rest/v1/project_tasks?id=eq.task_id
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "is_completed": true,
  "updated_at": "2024-01-20T10:30:00Z"
}
```

### Time Registration Endpoints

#### Create Time Registration
```http
POST /rest/v1/time_registrations
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "user_id": "user-uuid",
  "project_id": "project-uuid",
  "start_time": "2024-01-20T08:00:00Z",
  "description": "Badkamer renovatie - dag 1"
}
```

#### End Time Registration
```http
PATCH /rest/v1/time_registrations?id=eq.time_reg_id
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "end_time": "2024-01-20T17:00:00Z",
  "break_duration": 30
}
```

#### Get Time Registrations
```http
GET /rest/v1/time_registrations?user_id=eq.user_id&project_id=eq.project_id&select=*
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Materials Management Endpoints

#### Add Project Material
```http
POST /rest/v1/project_materials
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "project_id": "project-uuid",
  "material_name": "Badkamertegels 30x30cm",
  "quantity": 25,
  "unit_price": 12.50,
  "total_cost": 312.50,
  "supplier": "Tegelhuis Amsterdam",
  "added_by": "user-uuid"
}
```

#### Get Project Materials
```http
GET /rest/v1/project_materials?project_id=eq.project_uuid&select=*
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJHUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Chat Endpoints

#### Get User Chat Channels
```http
GET /rest/v1/chat_participants?user_id=eq.user_id&select=channel_id,chat_channels(*)
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Send Chat Message
```http
POST /rest/v1/chat_messages
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "channel_id": "channel-uuid",
  "user_id": "user-uuid",
  "content": "Project update: badkamer tegels geplaatst",
  "message_type": "text"
}
```

#### Get Chat Messages
```http
GET /rest/v1/chat_messages?channel_id=eq.channel_uuid&select=*&order=created_at.desc&limit=50
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## File Storage Endpoints

### Upload Project Photo
```http
POST /storage/v1/object/project-photos/project_id/photo_filename.jpg
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: image/jpeg

[Binary image data]
```

### Download/Get Photo URL
```http
GET /storage/v1/object/public/project-photos/project_id/photo_filename.jpg
Host: pvesgvkyiaqmsudmmtkc.supabase.co
```

### Get Signed URL for Private Files
```http
POST /storage/v1/object/sign/receipts/project_id/receipt_filename.jpg
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
ApiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "expiresIn": 3600
}
```

## Edge Functions

### Available Edge Functions

#### 1. Generate Work Order PDF
```http
POST /functions/v1/generate-work-order-pdf
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
Content-Type: application/json

{
  "work_order_id": "work-order-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "pdf_url": "https://pvesgvkyiaqmsudmmtkc.supabase.co/storage/v1/object/public/work-orders/work-order-uuid.pdf"
}
```

#### 2. Voice to Text Conversion
```http
POST /functions/v1/voice-to-text
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",
  "language": "nl"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Dit is de geconverteerde tekst van de spraakopname"
}
```

#### 3. AI Text Enhancement
```http
POST /functions/v1/ai-text-enhancement
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
Content-Type: application/json

{
  "text": "korte beschrijving van het werk",
  "context": "project_description",
  "language": "nl"
}
```

**Response:**
```json
{
  "success": true,
  "enhanced_text": "Professionele en gedetailleerde beschrijving van het uitgevoerde werk inclusief alle relevante details."
}
```

#### 4. Send Push Notification
```http
POST /functions/v1/send-push-notification
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer service_role_key
Content-Type: application/json

{
  "user_id": "user-uuid",
  "title": "Nieuw project toegewezen",
  "body": "U heeft een nieuw project: Badkamer renovatie",
  "data": {
    "project_id": "project-uuid",
    "type": "project_assignment"
  }
}
```

#### 5. Project Completion Email
```http
POST /functions/v1/send-completion-email
Host: pvesgvkyiaqmsudmmtkc.supabase.co
Authorization: Bearer access_token_here
Content-Type: application/json

{
  "project_id": "project-uuid",
  "work_order_id": "work-order-uuid"
}
```

## Real-time Subscriptions

### Project Updates Subscription
```typescript
// Subscribe to project changes
supabase
  .channel('project-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'projects',
    filter: `assigned_user_id=eq.${userId}`
  }, (payload) => {
    console.log('Project updated:', payload)
  })
  .subscribe()
```

### Chat Messages Subscription
```typescript
// Subscribe to new chat messages
supabase
  .channel(`chat:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `channel_id=eq.${channelId}`
  }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe()
```

### Task Completion Subscription
```typescript
// Subscribe to task updates for a project
supabase
  .channel(`project-tasks:${projectId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'project_tasks',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    console.log('Task updated:', payload)
  })
  .subscribe()
```

## Error Handling

### Common Error Responses

#### Authentication Error
```json
{
  "code": "invalid_credentials",
  "message": "Invalid login credentials",
  "hint": null,
  "details": null
}
```

#### Permission Error
```json
{
  "code": "42501",
  "message": "insufficient_privilege",
  "hint": null,
  "details": "The user does not have permission to perform this action"
}
```

#### Not Found Error
```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "hint": null,
  "details": null
}
```

#### Network Error Handling
```typescript
// iOS Example
enum APIError: Error {
    case networkUnavailable
    case invalidResponse
    case authenticationRequired
    case permissionDenied
    case serverError(String)
}

func handleSupabaseError(_ error: Error) -> APIError {
    // Parse and handle different error types
    if let postgrestError = error as? PostgrestError {
        switch postgrestError.code {
        case "42501":
            return .permissionDenied
        case "invalid_credentials":
            return .authenticationRequired
        default:
            return .serverError(postgrestError.message)
        }
    }
    return .networkUnavailable
}
```

```kotlin
// Android Example
sealed class ApiException(message: String) : Exception(message) {
    object NetworkUnavailable : ApiException("No network connection")
    object AuthenticationRequired : ApiException("Authentication required")
    object PermissionDenied : ApiException("Permission denied")
    data class ServerError(val code: String, override val message: String) : ApiException(message)
}

fun handleSupabaseException(throwable: Throwable): ApiException {
    return when (throwable) {
        is UnknownHostException -> ApiException.NetworkUnavailable
        is HttpException -> {
            when (throwable.code()) {
                401 -> ApiException.AuthenticationRequired
                403 -> ApiException.PermissionDenied
                else -> ApiException.ServerError(
                    throwable.code().toString(),
                    throwable.message()
                )
            }
        }
        else -> ApiException.ServerError("unknown", throwable.message ?: "Unknown error")
    }
}
```

## Rate Limiting & Quotas

### Supabase Limits
- **Database connections**: 60 concurrent connections
- **API requests**: 500 requests per second
- **Storage uploads**: 50MB per file
- **Edge function timeout**: 60 seconds
- **Realtime connections**: 200 concurrent connections

### Mobile App Guidelines
- Implement exponential backoff for failed requests
- Cache frequently accessed data locally
- Use pagination for large datasets
- Batch multiple operations when possible
- Implement request deduplication

### Request Optimization
```typescript
// Batch multiple updates
const batchUpdate = async (updates: TaskUpdate[]) => {
  const { data, error } = await supabase
    .from('project_tasks')
    .upsert(updates)
    .select()
  
  return { data, error }
}

// Use pagination for large lists
const getPaginatedProjects = async (page: number, limit: number = 20) => {
  const from = page * limit
  const to = from + limit - 1
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .range(from, to)
    .order('updated_at', { ascending: false })
  
  return { data, error }
}
```

This API documentation provides:
- Complete REST API endpoint reference
- Edge function specifications
- Real-time subscription examples
- Error handling strategies
- Performance optimization guidelines
- Rate limiting considerations