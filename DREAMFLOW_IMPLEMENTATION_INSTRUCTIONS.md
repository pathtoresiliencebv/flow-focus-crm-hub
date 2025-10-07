# DreamFlow Implementation Instructions

**Date**: October 7, 2025  
**Project**: SMANS CRM Mobile App  
**Target**: Complete Supabase Integration

---

## Response to DreamFlow Questions

### Question 1: Which task should I start with?

**ANSWER: Start with Task A - Wire services to exact table mappings (FOUNDATION)**

**Reasoning**:
- This is the foundation for all other features
- Without correct table mappings, all other features will fail
- It's the lowest risk starting point
- It allows us to test basic CRUD operations before adding complexity

**Implementation Order (after A is complete):**
1. **Task A**: Wire services to exact table mappings ✅ START HERE
2. **Task C**: Add realtime chat subscriptions (most important for UX)
3. **Task B**: Implement receipt upload to Supabase Storage
4. **Task D**: Add offline message queue sync
5. **Task E**: Add notification queue integration

---

## Task A: Wire Services to Exact Table Mappings

### Priority 1: Core Authentication & Profiles

**Table**: `public.profiles`

**Required Fields**:
```typescript
interface Profile {
  id: string; // UUID, FK to auth.users
  full_name: string | null;
  role: 'Administrator' | 'Administratie' | 'Installateur' | 'Verkoper' | 'Bekijker';
  status: 'Actief' | 'Inactief' | 'Geblokkeerd';
  last_seen: string; // timestamptz
  is_online: boolean;
  language_preference: string; // default: 'nl'
  timezone: string; // default: 'Europe/Amsterdam'
  language_detection_enabled: boolean;
  chat_language: string; // default: 'nl'
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/profile_service.dart or profile_service.ts

class ProfileService {
  // Get current user profile
  async getCurrentProfile(userId: string): Promise<Profile>
  
  // Update profile
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>
  
  // Update online status
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void>
  
  // Get user by ID
  async getUserProfile(userId: string): Promise<Profile>
  
  // List all users (for chat user list)
  async listUsers(filters?: { role?: string, status?: string }): Promise<Profile[]>
}
```

**Example Query**:
```typescript
// Get current user profile
const { data: profile, error } = await supabase
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

---

### Priority 2: Direct Messages (Chat)

**Table**: `public.direct_messages`

**Required Fields**:
```typescript
interface DirectMessage {
  id: string; // UUID
  from_user_id: string; // UUID, FK to auth.users
  to_user_id: string; // UUID, FK to auth.users
  content: string | null; // Message text
  original_language: string; // default: 'nl'
  translated_content: Record<string, string> | null; // jsonb: { "en": "Hello", "de": "Hallo" }
  is_read: boolean; // default: false
  media_type: string | null; // 'image' | 'video' | 'audio' | 'document' | null
  media_url: string | null; // Storage URL
  media_filename: string | null;
  media_size: number | null; // bytes
  media_mime_type: string | null;
  voice_duration: number | null; // seconds
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/chat_service.dart or chat_service.ts

class ChatService {
  // Send text message
  async sendMessage(fromUserId: string, toUserId: string, content: string): Promise<DirectMessage>
  
  // Send media message
  async sendMediaMessage(
    fromUserId: string, 
    toUserId: string, 
    mediaFile: File, 
    mediaType: 'image' | 'video' | 'audio' | 'document'
  ): Promise<DirectMessage>
  
  // Get conversation between two users
  async getConversation(userId1: string, userId2: string, limit?: number): Promise<DirectMessage[]>
  
  // Mark messages as read
  async markAsRead(messageIds: string[]): Promise<void>
  
  // Get unread message count
  async getUnreadCount(userId: string): Promise<number>
  
  // Delete message
  async deleteMessage(messageId: string): Promise<void>
}
```

**Example Queries**:
```typescript
// Send text message
const { data: message, error } = await supabase
  .from('direct_messages')
  .insert({
    from_user_id: currentUserId,
    to_user_id: recipientId,
    content: 'Hello!',
    original_language: 'nl'
  })
  .select()
  .single();

// Get conversation (last 50 messages)
const { data: messages, error } = await supabase
  .from('direct_messages')
  .select('*')
  .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
  .order('created_at', { ascending: false })
  .limit(50);

// Mark as read
await supabase
  .from('direct_messages')
  .update({ is_read: true })
  .in('id', messageIds);

// Get unread count
const { count, error } = await supabase
  .from('direct_messages')
  .select('*', { count: 'exact', head: true })
  .eq('to_user_id', userId)
  .eq('is_read', false);
```

---

### Priority 3: Projects

**Table**: `public.projects`

**Required Fields**:
```typescript
interface Project {
  id: string; // UUID
  title: string;
  customer_id: string; // UUID, FK to customers
  date: string | null; // date
  value: number | null; // numeric
  status: 'te-plannen' | 'in-uitvoering' | 'afgerond' | 'geannuleerd';
  description: string | null;
  user_id: string | null; // UUID, creator
  quote_id: string | null; // UUID, FK to quotes
  assigned_user_id: string | null; // UUID, assigned installer
  completion_date: string | null; // date
  completion_id: string | null; // UUID, FK to project_completions
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/project_service.dart or project_service.ts

class ProjectService {
  // Get projects for current user (filtered by role)
  async getMyProjects(userId: string, filters?: { status?: string }): Promise<Project[]>
  
  // Get project by ID
  async getProject(projectId: string): Promise<Project>
  
  // Update project status
  async updateProjectStatus(projectId: string, status: string): Promise<Project>
  
  // Get project with customer and tasks
  async getProjectDetails(projectId: string): Promise<ProjectWithDetails>
  
  // Create project
  async createProject(project: Partial<Project>): Promise<Project>
}
```

**Example Queries**:
```typescript
// Get assigned projects for Installateur
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    customers (
      id,
      name,
      address,
      city,
      phone,
      email
    )
  `)
  .eq('assigned_user_id', userId)
  .in('status', ['te-plannen', 'in-uitvoering'])
  .order('date', { ascending: true });

// Update project status
await supabase
  .from('projects')
  .update({ 
    status: 'in-uitvoering',
    updated_at: new Date().toISOString()
  })
  .eq('id', projectId);
```

**RLS Note**: Installateurs can ONLY see projects where `assigned_user_id = auth.uid()`. This is enforced by RLS policies.

---

### Priority 4: Project Tasks

**Table**: `public.project_tasks`

**Required Fields**:
```typescript
interface ProjectTask {
  id: string; // UUID
  project_id: string; // UUID, FK to projects
  block_title: string;
  task_description: string | null;
  is_info_block: boolean; // default: false
  info_text: string | null;
  is_completed: boolean; // default: false
  order_index: number; // default: 0
  source_quote_item_id: string | null;
  source_quote_block_id: string | null;
  quote_item_type: string; // default: 'product'
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/task_service.dart or task_service.ts

class TaskService {
  // Get tasks for project
  async getProjectTasks(projectId: string): Promise<ProjectTask[]>
  
  // Toggle task completion
  async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<ProjectTask>
  
  // Calculate project progress
  async calculateProgress(projectId: string): Promise<{ total: number, completed: number, percentage: number }>
}
```

**Example Queries**:
```typescript
// Get project tasks
const { data: tasks, error } = await supabase
  .from('project_tasks')
  .select('*')
  .eq('project_id', projectId)
  .order('order_index', { ascending: true });

// Toggle task completion
await supabase
  .from('project_tasks')
  .update({ 
    is_completed: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', taskId);

// Calculate progress
const allTasks = tasks.filter(t => !t.is_info_block);
const completedTasks = allTasks.filter(t => t.is_completed);
const progress = {
  total: allTasks.length,
  completed: completedTasks.length,
  percentage: (completedTasks.length / allTasks.length) * 100
};
```

---

### Priority 5: Planning Items

**Table**: `public.planning_items`

**Required Fields**:
```typescript
interface PlanningItem {
  id: string; // UUID
  user_id: string; // UUID, creator
  assigned_user_id: string; // UUID, assigned user
  project_id: string | null; // UUID, FK to projects
  title: string;
  description: string | null;
  start_date: string; // date (YYYY-MM-DD)
  start_time: string; // time (HH:MM:SS)
  end_time: string; // time (HH:MM:SS)
  location: string | null;
  status: string; // default: 'Gepland'
  google_calendar_event_id: string | null;
  last_synced_at: string | null; // timestamptz
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/planning_service.dart or planning_service.ts

class PlanningService {
  // Get planning for user (week view)
  async getWeekPlanning(userId: string, startDate: string, endDate: string): Promise<PlanningItem[]>
  
  // Get planning for specific date
  async getDayPlanning(userId: string, date: string): Promise<PlanningItem[]>
  
  // Get planning item details
  async getPlanningItem(planningId: string): Promise<PlanningItemWithProject>
  
  // Update planning status
  async updatePlanningStatus(planningId: string, status: string): Promise<PlanningItem>
  
  // Check availability
  async checkAvailability(userId: string, date: string, startTime: string, endTime: string): Promise<boolean>
}
```

**Example Queries**:
```typescript
// Get week planning
const { data: planning, error } = await supabase
  .from('planning_items')
  .select(`
    *,
    projects (
      id,
      title,
      customers (
        name,
        address,
        city
      )
    )
  `)
  .eq('assigned_user_id', userId)
  .gte('start_date', startOfWeek)
  .lte('start_date', endOfWeek)
  .order('start_date', { ascending: true })
  .order('start_time', { ascending: true });

// Check availability
const { data: conflicts, error } = await supabase
  .from('planning_items')
  .select('*')
  .eq('assigned_user_id', userId)
  .eq('start_date', targetDate)
  .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

const isAvailable = conflicts.length === 0;
```

---

### Priority 6: Receipts (Bonnetjes)

**Table**: `public.receipts`

**Required Fields**:
```typescript
interface Receipt {
  id: string; // UUID
  user_id: string; // UUID, FK to auth.users
  email_from: string | null;
  subject: string | null;
  amount: number | null; // numeric
  description: string | null;
  category: string | null;
  receipt_file_url: string; // Storage URL
  receipt_file_name: string;
  receipt_file_type: string; // MIME type
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null; // UUID
  approved_at: string | null; // timestamptz
  rejection_reason: string | null;
  email_message_id: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/receipt_service.dart or receipt_service.ts

class ReceiptService {
  // Upload receipt (will be implemented in Task B)
  async uploadReceipt(
    userId: string,
    file: File,
    amount: number,
    description: string,
    category?: string
  ): Promise<Receipt>
  
  // Get user's receipts
  async getMyReceipts(userId: string, filters?: { status?: string }): Promise<Receipt[]>
  
  // Get all pending receipts (Admin/Administratie only)
  async getPendingReceipts(): Promise<Receipt[]>
  
  // Approve receipt
  async approveReceipt(receiptId: string, approvedBy: string): Promise<Receipt>
  
  // Reject receipt
  async rejectReceipt(receiptId: string, approvedBy: string, reason: string): Promise<Receipt>
}
```

**Example Queries**:
```typescript
// Get user's receipts
const { data: receipts, error } = await supabase
  .from('receipts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Get pending receipts (Admin/Administratie)
const { data: pendingReceipts, error } = await supabase
  .from('receipts')
  .select(`
    *,
    profiles!receipts_user_id_fkey (
      id,
      full_name,
      role
    )
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: true });

// Approve receipt
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
    rejection_reason: reason
  })
  .eq('id', receiptId);
```

---

### Priority 7: Project Completions

**Table**: `public.project_completions`

**Required Fields**:
```typescript
interface ProjectCompletion {
  id: string; // UUID
  project_id: string; // UUID, FK to projects
  installer_id: string; // UUID, FK to auth.users
  completion_date: string; // date
  work_performed: string; // Translated version
  materials_used: string | null; // Translated version
  recommendations: string | null; // Translated version
  notes: string | null; // Translated version
  customer_satisfaction: number; // 1-5
  customer_signature: string; // Base64 encoded PNG
  installer_signature: string; // Base64 encoded PNG
  pdf_url: string | null; // Generated PDF URL
  status: string; // default: 'draft'
  email_sent_at: string | null; // timestamptz
  original_work_performed: string | null; // Original language
  original_materials_used: string | null;
  original_recommendations: string | null;
  original_notes: string | null;
  installer_language: string; // default: 'nl'
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/completion_service.dart or completion_service.ts

class CompletionService {
  // Create completion report
  async createCompletion(completion: Partial<ProjectCompletion>): Promise<ProjectCompletion>
  
  // Update completion report
  async updateCompletion(completionId: string, updates: Partial<ProjectCompletion>): Promise<ProjectCompletion>
  
  // Get completion by project ID
  async getProjectCompletion(projectId: string): Promise<ProjectCompletion | null>
  
  // Save signatures
  async saveSignatures(
    completionId: string,
    customerSignature: string,
    installerSignature: string
  ): Promise<ProjectCompletion>
  
  // Finalize completion (mark project as completed)
  async finalizeCompletion(completionId: string): Promise<void>
}
```

**Example Queries**:
```typescript
// Create completion
const { data: completion, error } = await supabase
  .from('project_completions')
  .insert({
    project_id: projectId,
    installer_id: userId,
    completion_date: new Date().toISOString().split('T')[0],
    work_performed: 'Installed solar panels',
    materials_used: '10x Solar Panel 400W',
    customer_satisfaction: 5,
    status: 'draft'
  })
  .select()
  .single();

// Save signatures
await supabase
  .from('project_completions')
  .update({
    customer_signature: customerSignatureBase64,
    installer_signature: installerSignatureBase64,
    status: 'completed'
  })
  .eq('id', completionId);

// Finalize: Update project
await supabase
  .from('projects')
  .update({
    completion_id: completionId,
    completion_date: new Date().toISOString().split('T')[0],
    status: 'afgerond'
  })
  .eq('id', projectId);
```

**IMPORTANT**: Signatures are stored as **Base64 encoded PNG strings** directly in the database, NOT as files in Storage.

---

### Priority 8: Completion Photos

**Table**: `public.completion_photos`

**Required Fields**:
```typescript
interface CompletionPhoto {
  id: string; // UUID
  completion_id: string; // UUID, FK to project_completions
  photo_url: string; // Storage URL
  description: string | null;
  category: string; // default: 'after' ('before' | 'during' | 'after' | 'issue')
  file_name: string | null;
  file_size: number | null; // bigint (bytes)
  uploaded_at: string; // timestamptz
  created_at: string; // timestamptz
}
```

**Service Methods Needed**:
```typescript
// lib/services/photo_service.dart or photo_service.ts

class PhotoService {
  // Upload photo
  async uploadCompletionPhoto(
    completionId: string,
    file: File,
    category: 'before' | 'during' | 'after' | 'issue',
    description?: string
  ): Promise<CompletionPhoto>
  
  // Get completion photos
  async getCompletionPhotos(completionId: string): Promise<CompletionPhoto[]>
  
  // Delete photo
  async deletePhoto(photoId: string): Promise<void>
}
```

**Example Queries**:
```typescript
// Upload photo to Storage
const fileName = `${projectId}/${Date.now()}.jpg`;
const { data: uploadedFile, error: uploadError } = await supabase.storage
  .from('completion-reports')
  .upload(fileName, photoFile);

// Get public URL
const { data: publicURL } = supabase.storage
  .from('completion-reports')
  .getPublicUrl(fileName);

// Save photo metadata
const { data: photo, error } = await supabase
  .from('completion_photos')
  .insert({
    completion_id: completionId,
    photo_url: publicURL.publicUrl,
    category: 'after',
    file_name: photoFile.name,
    file_size: photoFile.size,
    description: 'Final installation'
  })
  .select()
  .single();

// Get photos
const { data: photos, error } = await supabase
  .from('completion_photos')
  .select('*')
  .eq('completion_id', completionId)
  .order('uploaded_at', { ascending: true });
```

**Storage Bucket**: `completion-reports`

---

## Question 2: New Tables

**ANSWER: NO new tables needed at this time**

**Reasoning**:
- The existing schema is comprehensive and well-designed
- All required functionality is covered by existing tables
- Adding new tables would create inconsistencies with the web app
- We should use the existing schema as-is for consistency

**IF you identify a genuine need for a new table:**
1. Propose the schema first
2. Explain why existing tables cannot be used
3. Wait for approval before creating
4. Ensure it doesn't conflict with web app functionality

---

## Question 3: Existing Behavior to Preserve

**CRITICAL FIELDS TO PRESERVE:**

### 1. **Signatures in `project_completions`**
- ✅ **MUST** store as Base64 encoded PNG strings in `customer_signature` and `installer_signature` fields
- ❌ **DO NOT** store signatures as files in Storage
- ❌ **DO NOT** change the signature storage mechanism

**Example**:
```typescript
// ✅ CORRECT
const signatureBase64 = canvas.toDataURL('image/png');
await supabase
  .from('project_completions')
  .update({ customer_signature: signatureBase64 })
  .eq('id', completionId);

// ❌ WRONG
const { data } = await supabase.storage
  .from('signatures')
  .upload('signature.png', signatureFile);
```

### 2. **User Roles ENUM**
- ✅ **MUST** use exact role names: `'Administrator' | 'Administratie' | 'Installateur' | 'Verkoper' | 'Bekijker'`
- ❌ **DO NOT** create custom role names
- ❌ **DO NOT** modify the role ENUM

### 3. **Project Status ENUM**
- ✅ **MUST** use exact status names: `'te-plannen' | 'in-uitvoering' | 'afgerond' | 'geannuleerd'`
- ❌ **DO NOT** create custom status names

### 4. **Receipt Status ENUM**
- ✅ **MUST** use exact status names: `'pending' | 'approved' | 'rejected'`
- ❌ **DO NOT** create custom status names

### 5. **RLS Policies**
- ✅ **MUST** respect existing Row Level Security policies
- ✅ Installateurs can ONLY see their assigned projects (`assigned_user_id = auth.uid()`)
- ✅ Users can ONLY see their own receipts (unless Admin/Administratie)
- ✅ Users can ONLY see messages where they are sender or recipient
- ❌ **DO NOT** bypass RLS with service role key in the mobile app

### 6. **Realtime Tables**
- ✅ **MUST** enable realtime for: `direct_messages`, `chat_messages`, `projects`, `planning_items`, `receipts`, `user_notifications`
- ✅ Use realtime subscriptions for instant updates
- ❌ **DO NOT** poll these tables with intervals

### 7. **Storage Buckets**
- ✅ **MUST** use existing buckets:
  - `chat-media` - Chat files
  - `voice-messages` - Voice recordings
  - `completion-reports` - Project photos
  - `receipts` - Receipt photos/PDFs
  - `quote-attachments` - Quote/invoice attachments
- ❌ **DO NOT** create new storage buckets without approval

### 8. **Date/Time Formats**
- ✅ **MUST** use ISO 8601 format for timestamps: `2025-10-07T12:34:56Z`
- ✅ **MUST** use `YYYY-MM-DD` format for dates: `2025-10-07`
- ✅ **MUST** use `HH:MM:SS` format for times: `14:30:00`

### 9. **Language Fields**
- ✅ **MUST** preserve `original_language` and `translated_content` fields in messages
- ✅ **MUST** preserve `original_work_performed`, `original_materials_used`, etc. in completions
- ✅ Default language is `'nl'` (Dutch)

### 10. **Foreign Key Relationships**
- ✅ **MUST** maintain all foreign key relationships
- ✅ Always include related data using `.select()` joins when needed
- ❌ **DO NOT** break referential integrity

---

## Implementation Checklist for Task A

### Step 1: Profile Service
- [ ] Create `ProfileService` class
- [ ] Implement `getCurrentProfile(userId)`
- [ ] Implement `updateProfile(userId, updates)`
- [ ] Implement `setOnlineStatus(userId, isOnline)`
- [ ] Implement `listUsers(filters?)`
- [ ] Test with different user roles

### Step 2: Chat Service (Direct Messages)
- [ ] Create `ChatService` class
- [ ] Implement `sendMessage(fromUserId, toUserId, content)`
- [ ] Implement `getConversation(userId1, userId2, limit?)`
- [ ] Implement `markAsRead(messageIds)`
- [ ] Implement `getUnreadCount(userId)`
- [ ] Test sending/receiving messages

### Step 3: Project Service
- [ ] Create `ProjectService` class
- [ ] Implement `getMyProjects(userId, filters?)`
- [ ] Implement `getProject(projectId)`
- [ ] Implement `getProjectDetails(projectId)` with joins
- [ ] Implement `updateProjectStatus(projectId, status)`
- [ ] Test RLS policies (Installateur should only see assigned projects)

### Step 4: Task Service
- [ ] Create `TaskService` class
- [ ] Implement `getProjectTasks(projectId)`
- [ ] Implement `toggleTaskCompletion(taskId, isCompleted)`
- [ ] Implement `calculateProgress(projectId)`
- [ ] Test task completion and progress calculation

### Step 5: Planning Service
- [ ] Create `PlanningService` class
- [ ] Implement `getWeekPlanning(userId, startDate, endDate)`
- [ ] Implement `getDayPlanning(userId, date)`
- [ ] Implement `getPlanningItem(planningId)` with project join
- [ ] Implement `checkAvailability(userId, date, startTime, endTime)`
- [ ] Test week/day views

### Step 6: Receipt Service (Basic CRUD)
- [ ] Create `ReceiptService` class
- [ ] Implement `getMyReceipts(userId, filters?)`
- [ ] Implement `getPendingReceipts()` (Admin/Administratie only)
- [ ] Implement `approveReceipt(receiptId, approvedBy)`
- [ ] Implement `rejectReceipt(receiptId, approvedBy, reason)`
- [ ] Test approval workflow
- [ ] Note: `uploadReceipt()` will be implemented in Task B

### Step 7: Completion Service
- [ ] Create `CompletionService` class
- [ ] Implement `createCompletion(completion)`
- [ ] Implement `updateCompletion(completionId, updates)`
- [ ] Implement `getProjectCompletion(projectId)`
- [ ] Implement `saveSignatures(completionId, customerSig, installerSig)`
- [ ] Implement `finalizeCompletion(completionId)`
- [ ] Test signature storage (Base64 strings)

### Step 8: Photo Service (Basic CRUD)
- [ ] Create `PhotoService` class
- [ ] Implement `getCompletionPhotos(completionId)`
- [ ] Implement `deletePhoto(photoId)`
- [ ] Note: `uploadCompletionPhoto()` will be implemented in Task B

### Step 9: Testing
- [ ] Test all services with different user roles
- [ ] Verify RLS policies work correctly
- [ ] Test error handling
- [ ] Test with missing/null fields
- [ ] Verify foreign key relationships
- [ ] Test date/time formatting

### Step 10: Documentation
- [ ] Document any issues encountered
- [ ] Document any deviations from schema
- [ ] Document any assumptions made

---

## After Task A is Complete

**Next Steps**:
1. Run compile check
2. Test in Preview panel
3. Fix any issues
4. Confirm all services work correctly
5. Move to Task C (Realtime Chat)

**What to Report**:
- ✅ Which services are implemented
- ✅ Which services are tested
- ❌ Any issues or blockers
- ❌ Any schema mismatches found
- ❌ Any RLS policy issues

---

## Code Style Guidelines

### TypeScript/Dart Naming Conventions
```typescript
// ✅ CORRECT
interface DirectMessage { ... }
class ChatService { ... }
async sendMessage(fromUserId: string, toUserId: string): Promise<DirectMessage>

// ❌ WRONG
interface direct_message { ... }
class chat_service { ... }
async send_message(from_user_id: string, to_user_id: string): Promise<direct_message>
```

### Error Handling
```typescript
// ✅ CORRECT
try {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data;
} catch (error) {
  console.error('Unexpected error:', error);
  throw error;
}

// ❌ WRONG
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();

return data; // No error handling!
```

### Null Safety
```typescript
// ✅ CORRECT
const project = await projectService.getProject(projectId);
const customerName = project.customers?.name ?? 'Unknown Customer';

// ❌ WRONG
const project = await projectService.getProject(projectId);
const customerName = project.customers.name; // Can crash if null!
```

---

## Summary

**START WITH**: Task A - Wire services to exact table mappings

**PRIORITY ORDER**:
1. ProfileService (authentication & user data)
2. ChatService (direct messages)
3. ProjectService (project management)
4. TaskService (project tasks)
5. PlanningService (agenda/calendar)
6. ReceiptService (bonnetjes - basic CRUD only)
7. CompletionService (project completion reports)
8. PhotoService (completion photos - basic CRUD only)

**PRESERVE EXACTLY**:
- ✅ Signatures as Base64 strings (NOT files)
- ✅ User roles ENUM values
- ✅ Status ENUM values
- ✅ RLS policies
- ✅ Realtime table subscriptions
- ✅ Storage bucket names
- ✅ Date/time formats
- ✅ Foreign key relationships

**DO NOT**:
- ❌ Create new tables without approval
- ❌ Modify ENUM values
- ❌ Bypass RLS policies
- ❌ Create new storage buckets
- ❌ Change signature storage mechanism
- ❌ Break foreign key relationships

**AFTER TASK A**:
- Run compile check
- Test in Preview panel
- Report results
- Move to Task C (Realtime Chat)

---

**Ready to proceed with Task A!** 🚀
