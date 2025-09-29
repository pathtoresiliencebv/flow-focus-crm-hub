# Technical Specifications & Architecture

## Technology Stack

### iOS Development
```
Language: Swift 5.8+
UI Framework: SwiftUI
Minimum iOS: 15.0
Target iOS: 16.0+
Architecture: MVVM + Combine
Database: SQLite (FMDB/SQLite.swift)
Networking: URLSession + Async/Await
Authentication: Supabase Auth SDK
```

### Android Development
```
Language: Kotlin
UI Framework: Jetpack Compose
Minimum SDK: API 26 (Android 8.0)
Target SDK: API 34 (Android 14)
Architecture: MVVM + Kotlin Coroutines
Database: Room (SQLite abstraction)
Networking: Retrofit + OkHttp
Authentication: Supabase Auth SDK
```

## Architecture Overview

### MVVM Architecture Pattern
```
┌─────────────────┐
│      Views      │ ← SwiftUI / Jetpack Compose
├─────────────────┤
│   ViewModels    │ ← Business Logic & State Management
├─────────────────┤
│     Models      │ ← Data Models & Entities
├─────────────────┤
│   Repositories  │ ← Data Access Abstraction
├─────────────────┤
│ Local Database  │ ← SQLite / Room
│ Remote API      │ ← Supabase REST API
└─────────────────┘
```

### Data Flow Architecture
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   UI Layer   │◄──►│  ViewModel   │◄──►│ Repository   │
└──────────────┘    └──────────────┘    └──────────────┘
                                                │
                                                ▼
                                    ┌──────────────┐
                                    │ Data Sources │
                                    ├──────────────┤
                                    │ Local DB     │
                                    │ Remote API   │
                                    │ File Storage │
                                    └──────────────┘
```

## Core Modules

### 1. Authentication Module
```swift
// iOS Example
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    func signIn(email: String, password: String) async throws
    func signOut() async throws
    func biometricAuth() async throws
    func refreshSession() async throws
}
```

### 2. Project Management Module
```kotlin
// Android Example
class ProjectRepository(
    private val localDb: ProjectDao,
    private val remoteApi: SupabaseApi,
    private val syncManager: SyncManager
) {
    suspend fun getProjects(): Flow<List<Project>>
    suspend fun startProject(projectId: String)
    suspend fun completeTask(taskId: String)
    suspend fun uploadProjectData(project: Project)
}
```

### 3. Media Capture Module
```swift
// iOS Example
class MediaCaptureManager: ObservableObject {
    func capturePhoto() async throws -> CapturedMedia
    func captureDocument() async throws -> CapturedMedia
    func recordVideo() async throws -> CapturedMedia
    func compressMedia(_ media: CapturedMedia) async throws -> CapturedMedia
}
```

### 4. Sync Management Module
```kotlin
// Android Example
class SyncManager(
    private val database: AppDatabase,
    private val api: SupabaseApi
) {
    suspend fun syncProjects()
    suspend fun syncTasks()
    suspend fun syncMedia()
    suspend fun resolveConflicts()
    
    fun schedulePeriodicSync()
    fun handleConnectivityChanges()
}
```

## Database Schema (Local SQLite)

### Core Entities
```sql
-- Projects
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'te-plannen',
    start_date TEXT,
    assigned_user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    last_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Tasks
CREATE TABLE project_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    block_title TEXT NOT NULL,
    task_description TEXT,
    is_info_block BOOLEAN DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- Time Registrations
CREATE TABLE time_registrations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    break_duration INTEGER DEFAULT 0,
    description TEXT,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- Project Materials
CREATE TABLE project_materials (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    quantity REAL,
    unit_price REAL,
    supplier TEXT,
    receipt_photo_path TEXT,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- Media Files
CREATE TABLE media_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT,
    metadata TEXT, -- JSON
    upload_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages (Offline Queue)
CREATE TABLE chat_messages_queue (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_path TEXT,
    temp_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Integration

### Supabase Configuration
```typescript
// Shared configuration
const supabaseUrl = 'https://pvesgvkyiaqmsudmmtkc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// iOS Swift
import Supabase
let supabase = SupabaseClient(
    supabaseURL: URL(string: supabaseUrl)!,
    supabaseKey: supabaseAnonKey
)

// Android Kotlin
import io.github.jan.supabase.createSupabaseClient
val supabase = createSupabaseClient(
    supabaseUrl = supabaseUrl,
    supabaseKey = supabaseAnonKey
)
```

### Core API Operations
```swift
// iOS Example
class SupabaseManager {
    func fetchProjects() async throws -> [Project] {
        return try await supabase
            .from("projects")
            .select("*")
            .eq("assigned_user_id", value: currentUserId)
            .execute()
            .value
    }
    
    func updateProjectStatus(id: String, status: String) async throws {
        try await supabase
            .from("projects")
            .update(["status": status])
            .eq("id", value: id)
            .execute()
    }
    
    func uploadMedia(_ data: Data, path: String) async throws -> String {
        return try await supabase.storage
            .from("project-media")
            .upload(path: path, file: data)
    }
}
```

## Offline Sync Strategy

### Sync Queue System
```kotlin
data class SyncOperation(
    val id: String,
    val type: SyncType,
    val entityId: String,
    val operation: SyncOperation,
    val payload: String, // JSON
    val priority: Int,
    val retryCount: Int = 0,
    val createdAt: Long
)

enum class SyncType {
    PROJECT, TASK, TIME_REGISTRATION, MATERIAL, MEDIA, CHAT_MESSAGE
}

enum class SyncOperation {
    CREATE, UPDATE, DELETE
}
```

### Conflict Resolution
```swift
enum ConflictResolution {
    case serverWins    // Server data overwrites local
    case clientWins    // Local data overwrites server
    case merge         // Attempt to merge both versions
    case userChoice    // Let user decide
}

struct ConflictResolver {
    func resolve<T>(_ local: T, _ remote: T, strategy: ConflictResolution) -> T {
        // Implementation based on strategy
    }
}
```

## Security Implementation

### Authentication Flow
```swift
class BiometricAuthManager {
    func authenticateWithBiometrics() async throws -> Bool {
        let context = LAContext()
        let reason = "Access your work projects"
        
        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
    }
}
```

### Data Encryption
```kotlin
class EncryptionManager {
    private val keyAlias = "SmansSecretKey"
    
    fun encryptData(data: String): String {
        // AES encryption implementation
    }
    
    fun decryptData(encryptedData: String): String {
        // AES decryption implementation
    }
}
```

## Performance Optimizations

### Image Compression
```swift
extension UIImage {
    func compressed(to maxFileSize: Int) -> Data? {
        var compression: CGFloat = 1.0
        let step: CGFloat = 0.1
        
        var imageData = self.jpegData(compressionQuality: compression)
        
        while let data = imageData, data.count > maxFileSize && compression > 0 {
            compression -= step
            imageData = self.jpegData(compressionQuality: compression)
        }
        
        return imageData
    }
}
```

### Background Sync
```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncManager: SyncManager
) : CoroutineWorker(context, workerParams) {
    
    override suspend fun doWork(): Result {
        return try {
            syncManager.performFullSync()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

## Build Configuration

### iOS Build Settings
```
// Build Phases
1. Compile Sources
2. Link Binary with Libraries
3. Copy Bundle Resources
4. Run Script (Code Signing)

// Key Frameworks
- SwiftUI
- Combine
- CoreData
- AVFoundation (Camera)
- LocalAuthentication (Biometrics)
- CoreLocation (GPS)
- UserNotifications (Push)
```

### Android Build Configuration
```gradle
android {
    compileSdk 34
    defaultConfig {
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    
    buildFeatures {
        compose true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion compose_version
    }
}

dependencies {
    implementation "androidx.compose.ui:ui:$compose_version"
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version"
    implementation "androidx.room:room-runtime:$room_version"
    implementation "com.squareup.retrofit2:retrofit:$retrofit_version"
    implementation "io.github.jan.supabase:supabase-android:$supabase_version"
}
```