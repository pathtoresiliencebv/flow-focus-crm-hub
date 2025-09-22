# Supabase Integration Guide

## Connection Details

### Supabase Project Configuration
```
Project URL: https://pvesgvkyiaqmsudmmtkc.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8

Project ID: pvesgvkyiaqmsudmmtkc
Region: eu-west-1
```

### SDK Integration

#### iOS (Swift)
```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://pvesgvkyiaqmsudmmtkc.supabase.co")!,
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"
)
```

#### Android (Kotlin)
```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.realtime.Realtime

val supabase = createSupabaseClient(
    supabaseUrl = "https://pvesgvkyiaqmsudmmtkc.supabase.co",
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"
) {
    install(GoTrue)
    install(Postgrest)
    install(Storage)
    install(Realtime)
}
```

## Database Schema & Tables

### Core Tables for Mobile App

#### 1. profiles
```sql
-- User profiles (monteurs)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role user_role DEFAULT 'Installateur',
  status user_status DEFAULT 'Actief',
  language_preference varchar DEFAULT 'nl',
  timezone varchar DEFAULT 'Europe/Amsterdam',
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);
```

#### 2. projects
```sql
-- Projects assigned to monteurs
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  customer_id uuid NOT NULL,
  assigned_user_id uuid, -- Monteur assigned to project
  quote_id uuid,
  status project_status DEFAULT 'te-plannen',
  project_status text DEFAULT 'te-plannen',
  date date,
  value numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid
);
```

#### 3. project_tasks
```sql
-- Tasks generated from quotes
CREATE TABLE project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  block_title text NOT NULL,
  task_description text,
  info_text text,
  is_info_block boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  source_quote_item_id text,
  source_quote_block_id text,
  quote_item_type text DEFAULT 'product',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 4. project_materials
```sql
-- Materials used in projects
CREATE TABLE project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  material_name text NOT NULL,
  quantity numeric,
  unit_price numeric,
  total_cost numeric,
  supplier text,
  receipt_photo_url text,
  added_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 5. project_work_orders
```sql
-- Work orders and delivery documentation
CREATE TABLE project_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  work_order_number text NOT NULL,
  client_signature_data text,
  client_name text,
  monteur_signature_data text,
  summary_text text,
  work_photos jsonb DEFAULT '[]',
  delivery_photos jsonb DEFAULT '[]',
  is_delivery_complete boolean DEFAULT false,
  signed_at timestamp with time zone,
  delivery_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 6. time_registrations
```sql
-- Time tracking for projects
CREATE TABLE time_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  break_duration integer DEFAULT 0,
  description text,
  hourly_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 7. chat_channels & chat_messages
```sql
-- Chat functionality
CREATE TABLE chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'direct',
  is_direct_message boolean DEFAULT false,
  participants jsonb DEFAULT '[]',
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  file_url text,
  file_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Row Level Security (RLS) Policies

### Projects Access
```sql
-- Monteurs can only see assigned projects
CREATE POLICY "Users can view projects based on role" ON projects
FOR SELECT USING (
  CASE
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);

-- Monteurs can update their assigned projects
CREATE POLICY "Authorized users can update projects" ON projects
FOR UPDATE USING (
  CASE
    WHEN get_user_role(auth.uid()) = ANY(ARRAY['Administrator', 'Administratie']) THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);
```

### Project Tasks Access
```sql
CREATE POLICY "Users can view project tasks" ON project_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_tasks.project_id
  )
);

CREATE POLICY "Users can manage project tasks" ON project_tasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_tasks.project_id
  )
);
```

### Materials Access
```sql
CREATE POLICY "Users can view project materials for accessible projects" ON project_materials
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_materials.project_id
  )
);

CREATE POLICY "Users can create project materials" ON project_materials
FOR INSERT WITH CHECK (
  added_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_materials.project_id
  )
);
```

## API Operations Examples

### Authentication
```swift
// iOS Login
func signIn(email: String, password: String) async throws {
    try await supabase.auth.signIn(email: email, password: password)
}

// Session management
func getCurrentUser() async throws -> User? {
    return try await supabase.auth.user()
}
```

### Project Operations
```kotlin
// Android - Fetch assigned projects
suspend fun getAssignedProjects(): List<Project> {
    return supabase.from("projects")
        .select("*")
        .eq("assigned_user_id", getCurrentUserId())
        .decodeList<Project>()
}

// Update project status
suspend fun updateProjectStatus(projectId: String, status: String) {
    supabase.from("projects")
        .update(mapOf("status" to status))
        .eq("id", projectId)
        .execute()
}
```

### Task Management
```swift
// iOS - Get project tasks
func getProjectTasks(projectId: String) async throws -> [ProjectTask] {
    return try await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", value: projectId)
        .order("order_index")
        .execute()
        .value
}

// Complete task
func completeTask(taskId: String) async throws {
    try await supabase
        .from("project_tasks")
        .update(["is_completed": true])
        .eq("id", value: taskId)
        .execute()
}
```

### Time Registration
```kotlin
// Start time registration
data class TimeRegistration(
    val id: String? = null,
    val user_id: String,
    val project_id: String,
    val start_time: String,
    val end_time: String? = null,
    val description: String? = null
)

suspend fun startTimeRegistration(projectId: String): String {
    val registration = TimeRegistration(
        user_id = getCurrentUserId(),
        project_id = projectId,
        start_time = Instant.now().toString()
    )
    
    return supabase.from("time_registrations")
        .insert(registration)
        .select("id")
        .decodeSingle<TimeRegistration>()
        .id!!
}
```

### Material Management
```swift
// Add project material
struct ProjectMaterial: Codable {
    let id: String?
    let project_id: String
    let material_name: String
    let quantity: Double?
    let unit_price: Double?
    let supplier: String?
    let receipt_photo_url: String?
    let added_by: String
}

func addMaterial(_ material: ProjectMaterial) async throws {
    try await supabase
        .from("project_materials")
        .insert(material)
        .execute()
}
```

## File Storage Integration

### Storage Buckets
```
- project-photos: Project work photos
- delivery-photos: Project delivery photos  
- receipts: Receipt/invoice photos
- chat-files: Chat file attachments
```

### Upload Operations
```kotlin
// Android - Upload photo
suspend fun uploadProjectPhoto(
    projectId: String, 
    photoData: ByteArray,
    category: String
): String {
    val fileName = "${projectId}/${category}/${UUID.randomUUID()}.jpg"
    
    return supabase.storage
        .from("project-photos")
        .upload(fileName, photoData)
        .data.path
}

// Get signed URL for display
suspend fun getPhotoUrl(path: String): String {
    return supabase.storage
        .from("project-photos")
        .createSignedUrl(path, 3600) // 1 hour expiry
}
```

## Real-time Subscriptions

### Project Updates
```swift
// iOS - Listen to project changes
func subscribeToProjectUpdates() {
    Task {
        for await change in supabase.realtime
            .channel("projects")
            .on(.update, schema: "public", table: "projects") { change in
                // Handle project update
                await handleProjectUpdate(change)
            }
            .subscribe() {
                // Handle subscription updates
            }
    }
}
```

### Chat Messages
```kotlin
// Android - Listen to new chat messages
fun subscribeToChat(channelId: String) {
    lifecycleScope.launch {
        supabase.realtime
            .channel("chat:$channelId")
            .on(PostgresAction.INSERT) { change ->
                val message = change.decodeRecord<ChatMessage>()
                handleNewMessage(message)
            }
            .subscribe()
    }
}
```

## Edge Functions Integration

### Available Edge Functions
```
1. generate-quote-pdf - Generate PDF from quote data
2. generate-invoice-pdf - Generate PDF from invoice data  
3. send-completion-email - Send project completion notification
4. quote-approval-automation - Handle quote approval workflow
5. ai-text-enhancement - Enhance text using AI
6. voice-to-text - Convert voice recordings to text
```

### Edge Function Calls
```swift
// iOS - Call edge function
func generateWorkOrderPDF(workOrderId: String) async throws -> Data {
    let response = try await supabase.functions
        .invoke("generate-work-order-pdf", parameters: [
            "work_order_id": workOrderId
        ])
    
    return response.data
}
```

## Error Handling

### Network Error Handling
```kotlin
sealed class ApiResult<T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error<T>(val exception: Exception) : ApiResult<T>()
}

suspend fun <T> safeApiCall(apiCall: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(apiCall())
    } catch (e: Exception) {
        ApiResult.Error(e)
    }
}
```

### RLS Policy Violations
```swift
// Handle permission errors
func handleSupabaseError(_ error: Error) {
    if let supabaseError = error as? SupabaseError {
        switch supabaseError {
        case .api(let apiError):
            if apiError.code == "42501" { // Insufficient privilege
                showInsufficientPermissionsAlert()
            }
        default:
            showGenericErrorAlert()
        }
    }
}
```