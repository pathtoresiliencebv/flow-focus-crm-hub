# Offline Capabilities & Data Synchronization

## Offline-First Architecture

### Data Flow Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │───►│  Local Database │───►│   Sync Queue    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │   UI Updates    │    │ Background Sync │
                        └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Supabase Remote │
                                               └─────────────────┘
```

## Local Database Implementation

### iOS Core Data Schema
```swift
import CoreData

// Core Data Model Entities

@objc(Project)
public class Project: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var title: String
    @NSManaged public var customerName: String
    @NSManaged public var status: String
    @NSManaged public var assignedUserId: String?
    @NSManaged public var startDate: Date?
    @NSManaged public var location: String?
    @NSManaged public var syncStatus: String
    @NSManaged public var lastSyncDate: Date?
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    
    // Relationships
    @NSManaged public var tasks: NSSet?
    @NSManaged public var materials: NSSet?
    @NSManaged public var timeRegistrations: NSSet?
    @NSManaged public var mediaFiles: NSSet?
}

@objc(ProjectTask)
public class ProjectTask: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var blockTitle: String
    @NSManaged public var taskDescription: String?
    @NSManaged public var infoText: String?
    @NSManaged public var isInfoBlock: Bool
    @NSManaged public var isCompleted: Bool
    @NSManaged public var orderIndex: Int32
    @NSManaged public var syncStatus: String
    @NSManaged public var project: Project
}

@objc(ProjectMaterial)
public class ProjectMaterial: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var materialName: String
    @NSManaged public var quantity: Double
    @NSManaged public var unitPrice: Double
    @NSManaged public var supplier: String?
    @NSManaged public var receiptPhotoPath: String?
    @NSManaged public var syncStatus: String
    @NSManaged public var project: Project
}

@objc(TimeRegistration)
public class TimeRegistration: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var userId: String
    @NSManaged public var startTime: Date
    @NSManaged public var endTime: Date?
    @NSManaged public var breakDuration: Int32
    @NSManaged public var description: String?
    @NSManaged public var syncStatus: String
    @NSManaged public var project: Project
}

@objc(MediaFile)
public class MediaFile: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var fileName: String
    @NSManaged public var filePath: String
    @NSManaged public var fileType: String
    @NSManaged public var category: String
    @NSManaged public var metadata: String? // JSON
    @NSManaged public var uploadStatus: String
    @NSManaged public var project: Project
}

// Core Data Manager
class LocalDataManager: ObservableObject {
    static let shared = LocalDataManager()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "SmansDataModel")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data error: \(error)")
            }
        }
        return container
    }()
    
    var context: NSManagedObjectContext {
        persistentContainer.viewContext
    }
    
    func save() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Save error: \(error)")
            }
        }
    }
    
    func clearAllData() async {
        let entities = ["Project", "ProjectTask", "ProjectMaterial", "TimeRegistration", "MediaFile"]
        
        for entity in entities {
            let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entity)
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            
            do {
                try context.execute(deleteRequest)
            } catch {
                print("Error clearing \(entity): \(error)")
            }
        }
        
        save()
    }
}
```

### Android Room Database
```kotlin
// Room Entity Definitions

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val title: String,
    val customerName: String,
    val status: String,
    val assignedUserId: String?,
    val startDate: String?,
    val location: String?,
    val syncStatus: String = SyncStatus.PENDING,
    val lastSyncDate: Long?,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(
    tableName = "project_tasks",
    foreignKeys = [ForeignKey(
        entity = ProjectEntity::class,
        parentColumns = ["id"],
        childColumns = ["projectId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class ProjectTaskEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val blockTitle: String,
    val taskDescription: String?,
    val infoText: String?,
    val isInfoBlock: Boolean = false,
    val isCompleted: Boolean = false,
    val orderIndex: Int = 0,
    val syncStatus: String = SyncStatus.PENDING
)

@Entity(
    tableName = "project_materials",
    foreignKeys = [ForeignKey(
        entity = ProjectEntity::class,
        parentColumns = ["id"],
        childColumns = ["projectId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class ProjectMaterialEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val materialName: String,
    val quantity: Double,
    val unitPrice: Double,
    val supplier: String?,
    val receiptPhotoPath: String?,
    val syncStatus: String = SyncStatus.PENDING
)

@Entity(
    tableName = "time_registrations",
    foreignKeys = [ForeignKey(
        entity = ProjectEntity::class,
        parentColumns = ["id"],
        childColumns = ["projectId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class TimeRegistrationEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val userId: String,
    val startTime: Long,
    val endTime: Long?,
    val breakDuration: Int = 0,
    val description: String?,
    val syncStatus: String = SyncStatus.PENDING
)

@Entity(
    tableName = "media_files",
    foreignKeys = [ForeignKey(
        entity = ProjectEntity::class,
        parentColumns = ["id"],
        childColumns = ["projectId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class MediaFileEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val fileName: String,
    val filePath: String,
    val fileType: String,
    val category: String,
    val metadata: String?, // JSON
    val uploadStatus: String = UploadStatus.PENDING
)

object SyncStatus {
    const val PENDING = "pending"
    const val SYNCING = "syncing"
    const val SYNCED = "synced"
    const val FAILED = "failed"
    const val CONFLICT = "conflict"
}

object UploadStatus {
    const val PENDING = "pending"
    const val UPLOADING = "uploading"
    const val UPLOADED = "uploaded"
    const val FAILED = "failed"
}

// Room DAOs
@Dao
interface ProjectDao {
    @Query("SELECT * FROM projects ORDER BY updatedAt DESC")
    fun getAllProjects(): Flow<List<ProjectEntity>>
    
    @Query("SELECT * FROM projects WHERE assignedUserId = :userId ORDER BY updatedAt DESC")
    fun getAssignedProjects(userId: String): Flow<List<ProjectEntity>>
    
    @Query("SELECT * FROM projects WHERE syncStatus = :status")
    suspend fun getProjectsBySyncStatus(status: String): List<ProjectEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProject(project: ProjectEntity)
    
    @Update
    suspend fun updateProject(project: ProjectEntity)
    
    @Delete
    suspend fun deleteProject(project: ProjectEntity)
}

@Dao
interface ProjectTaskDao {
    @Query("SELECT * FROM project_tasks WHERE projectId = :projectId ORDER BY orderIndex")
    fun getTasksForProject(projectId: String): Flow<List<ProjectTaskEntity>>
    
    @Query("SELECT * FROM project_tasks WHERE syncStatus = :status")
    suspend fun getTasksBySyncStatus(status: String): List<ProjectTaskEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: ProjectTaskEntity)
    
    @Update
    suspend fun updateTask(task: ProjectTaskEntity)
    
    @Query("UPDATE project_tasks SET isCompleted = :completed, syncStatus = :syncStatus WHERE id = :taskId")
    suspend fun updateTaskCompletion(taskId: String, completed: Boolean, syncStatus: String = SyncStatus.PENDING)
}

// Room Database
@Database(
    entities = [ProjectEntity::class, ProjectTaskEntity::class, ProjectMaterialEntity::class, 
                TimeRegistrationEntity::class, MediaFileEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SmansDatabase : RoomDatabase() {
    abstract fun projectDao(): ProjectDao
    abstract fun taskDao(): ProjectTaskDao
    abstract fun materialDao(): ProjectMaterialDao
    abstract fun timeDao(): TimeRegistrationDao
    abstract fun mediaDao(): MediaFileDao
    
    companion object {
        @Volatile
        private var INSTANCE: SmansDatabase? = null
        
        fun getDatabase(context: Context): SmansDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SmansDatabase::class.java,
                    "smans_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

## Sync Queue Management

### iOS Sync Manager
```swift
class SyncManager: ObservableObject {
    static let shared = SyncManager()
    
    @Published var isSyncing = false
    @Published var syncProgress: Double = 0.0
    @Published var lastSyncDate: Date?
    
    private let localDataManager = LocalDataManager.shared
    private let supabase: SupabaseClient
    private let networkMonitor = NetworkMonitor()
    
    private var syncQueue: [SyncOperation] = []
    private var isProcessingSyncQueue = false
    
    init() {
        self.supabase = SupabaseClient(
            supabaseURL: URL(string: "https://pvesgvkyiaqmsudmmtkc.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"
        )
        
        setupNetworkMonitoring()
        loadPendingSyncOperations()
    }
    
    private func setupNetworkMonitoring() {
        networkMonitor.onConnectionChange = { [weak self] isConnected in
            if isConnected && !self?.isProcessingSyncQueue == true {
                Task {
                    await self?.processSyncQueue()
                }
            }
        }
    }
    
    // MARK: - Sync Operations
    
    func addToSyncQueue(_ operation: SyncOperation) {
        syncQueue.append(operation)
        saveSyncQueue()
        
        if networkMonitor.isConnected && !isProcessingSyncQueue {
            Task {
                await processSyncQueue()
            }
        }
    }
    
    func processSyncQueue() async {
        guard !isProcessingSyncQueue && networkMonitor.isConnected else { return }
        
        await MainActor.run {
            isProcessingSyncQueue = true
            isSyncing = true
            syncProgress = 0.0
        }
        
        let totalOperations = syncQueue.count
        var completedOperations = 0
        
        for operation in syncQueue {
            do {
                try await processOperation(operation)
                syncQueue.removeFirst()
                completedOperations += 1
                
                await MainActor.run {
                    syncProgress = Double(completedOperations) / Double(totalOperations)
                }
            } catch {
                print("Sync operation failed: \(error)")
                operation.retryCount += 1
                
                if operation.retryCount >= 3 {
                    syncQueue.removeFirst() // Remove failed operation
                }
                break
            }
        }
        
        saveSyncQueue()
        
        await MainActor.run {
            isProcessingSyncQueue = false
            isSyncing = false
            lastSyncDate = Date()
        }
    }
    
    private func processOperation(_ operation: SyncOperation) async throws {
        switch operation.type {
        case .project:
            try await syncProject(operation)
        case .task:
            try await syncTask(operation)
        case .material:
            try await syncMaterial(operation)
        case .timeRegistration:
            try await syncTimeRegistration(operation)
        case .mediaFile:
            try await syncMediaFile(operation)
        }
    }
    
    // MARK: - Specific Sync Methods
    
    private func syncProject(_ operation: SyncOperation) async throws {
        let context = localDataManager.context
        
        guard let project = try? context.existingObject(with: operation.objectID) as? Project else {
            throw SyncError.objectNotFound
        }
        
        switch operation.operation {
        case .create, .update:
            let projectData = [
                "id": project.id,
                "title": project.title,
                "status": project.status,
                "assigned_user_id": project.assignedUserId,
                "updated_at": ISO8601DateFormatter().string(from: project.updatedAt)
            ]
            
            try await supabase
                .from("projects")
                .upsert(projectData)
                .execute()
            
        case .delete:
            try await supabase
                .from("projects")
                .delete()
                .eq("id", value: project.id)
                .execute()
        }
        
        await MainActor.run {
            project.syncStatus = "synced"
            project.lastSyncDate = Date()
            localDataManager.save()
        }
    }
    
    private func syncTask(_ operation: SyncOperation) async throws {
        let context = localDataManager.context
        
        guard let task = try? context.existingObject(with: operation.objectID) as? ProjectTask else {
            throw SyncError.objectNotFound
        }
        
        let taskData = [
            "id": task.id,
            "project_id": task.project.id,
            "block_title": task.blockTitle,
            "task_description": task.taskDescription,
            "is_completed": task.isCompleted,
            "order_index": task.orderIndex
        ] as [String : Any]
        
        try await supabase
            .from("project_tasks")
            .upsert(taskData)
            .execute()
        
        await MainActor.run {
            task.syncStatus = "synced"
            localDataManager.save()
        }
    }
    
    private func syncMediaFile(_ operation: SyncOperation) async throws {
        let context = localDataManager.context
        
        guard let mediaFile = try? context.existingObject(with: operation.objectID) as? MediaFile else {
            throw SyncError.objectNotFound
        }
        
        // Upload file if not uploaded
        if mediaFile.uploadStatus != "uploaded" {
            let fileData = try Data(contentsOf: URL(fileURLWithPath: mediaFile.filePath))
            let uploadPath = "\(mediaFile.project.id)/\(mediaFile.fileName)"
            
            let uploadResult = try await supabase.storage
                .from("project-media")
                .upload(path: uploadPath, file: fileData)
            
            await MainActor.run {
                mediaFile.uploadStatus = "uploaded"
                localDataManager.save()
            }
        }
    }
    
    // MARK: - Data Download
    
    func downloadProjectsForUser(_ userId: String) async throws {
        let projects: [ProjectResponse] = try await supabase
            .from("projects")
            .select("*")
            .eq("assigned_user_id", value: userId)
            .execute()
            .value
        
        let context = localDataManager.context
        
        for projectData in projects {
            let fetchRequest: NSFetchRequest<Project> = Project.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", projectData.id)
            
            let existingProjects = try context.fetch(fetchRequest)
            let project = existingProjects.first ?? Project(context: context)
            
            project.id = projectData.id
            project.title = projectData.title
            project.customerName = projectData.customer_name ?? ""
            project.status = projectData.status
            project.syncStatus = "synced"
            project.lastSyncDate = Date()
            
            // Download tasks for this project
            try await downloadTasksForProject(projectData.id)
        }
        
        localDataManager.save()
    }
    
    private func downloadTasksForProject(_ projectId: String) async throws {
        let tasks: [TaskResponse] = try await supabase
            .from("project_tasks")
            .select("*")
            .eq("project_id", value: projectId)
            .order("order_index")
            .execute()
            .value
        
        let context = localDataManager.context
        
        for taskData in tasks {
            let fetchRequest: NSFetchRequest<ProjectTask> = ProjectTask.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", taskData.id)
            
            let existingTasks = try context.fetch(fetchRequest)
            let task = existingTasks.first ?? ProjectTask(context: context)
            
            task.id = taskData.id
            task.blockTitle = taskData.block_title
            task.taskDescription = taskData.task_description
            task.isCompleted = taskData.is_completed
            task.orderIndex = Int32(taskData.order_index)
            task.syncStatus = "synced"
            
            // Link to project
            let projectFetch: NSFetchRequest<Project> = Project.fetchRequest()
            projectFetch.predicate = NSPredicate(format: "id == %@", projectId)
            if let project = try context.fetch(projectFetch).first {
                task.project = project
            }
        }
    }
}

struct SyncOperation {
    let id: String
    let type: SyncOperationType
    let operation: OperationType
    let objectID: NSManagedObjectID
    var retryCount: Int = 0
    let createdAt: Date
}

enum SyncOperationType {
    case project, task, material, timeRegistration, mediaFile
}

enum OperationType {
    case create, update, delete
}

enum SyncError: Error {
    case objectNotFound
    case networkUnavailable
    case serverError
}
```

### Android Sync Repository
```kotlin
@Singleton
class SyncRepository @Inject constructor(
    private val database: SmansDatabase,
    private val supabaseApi: SupabaseApi,
    private val networkManager: NetworkManager
) {
    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing
    
    private val _syncProgress = MutableStateFlow(0f)
    val syncProgress: StateFlow<Float> = _syncProgress
    
    private val syncQueue = mutableListOf<SyncOperation>()
    private var isProcessingSyncQueue = false
    
    suspend fun addToSyncQueue(operation: SyncOperation) {
        syncQueue.add(operation)
        saveSyncQueue()
        
        if (networkManager.isConnected() && !isProcessingSyncQueue) {
            processSyncQueue()
        }
    }
    
    suspend fun processSyncQueue() {
        if (isProcessingSyncQueue || !networkManager.isConnected()) return
        
        isProcessingSyncQueue = true
        _isSyncing.value = true
        
        val totalOperations = syncQueue.size
        var completedOperations = 0
        
        val iterator = syncQueue.iterator()
        while (iterator.hasNext()) {
            val operation = iterator.next()
            
            try {
                processOperation(operation)
                iterator.remove()
                completedOperations++
                
                _syncProgress.value = completedOperations.toFloat() / totalOperations.toFloat()
            } catch (e: Exception) {
                Log.e("SyncRepository", "Sync operation failed", e)
                operation.retryCount++
                
                if (operation.retryCount >= 3) {
                    iterator.remove() // Remove failed operation
                }
                break
            }
        }
        
        saveSyncQueue()
        isProcessingSyncQueue = false
        _isSyncing.value = false
    }
    
    private suspend fun processOperation(operation: SyncOperation) {
        when (operation.type) {
            SyncOperationType.PROJECT -> syncProject(operation)
            SyncOperationType.TASK -> syncTask(operation)
            SyncOperationType.MATERIAL -> syncMaterial(operation)
            SyncOperationType.TIME_REGISTRATION -> syncTimeRegistration(operation)
            SyncOperationType.MEDIA_FILE -> syncMediaFile(operation)
        }
    }
    
    private suspend fun syncProject(operation: SyncOperation) {
        val project = database.projectDao().getProjectById(operation.entityId)
            ?: throw SyncException("Project not found")
        
        when (operation.operation) {
            OperationType.CREATE, OperationType.UPDATE -> {
                val response = supabaseApi.upsertProject(project.toRemoteProject())
                database.projectDao().updateProject(
                    project.copy(
                        syncStatus = SyncStatus.SYNCED,
                        lastSyncDate = System.currentTimeMillis()
                    )
                )
            }
            OperationType.DELETE -> {
                supabaseApi.deleteProject(project.id)
                database.projectDao().deleteProject(project)
            }
        }
    }
    
    private suspend fun syncTask(operation: SyncOperation) {
        val task = database.taskDao().getTaskById(operation.entityId)
            ?: throw SyncException("Task not found")
        
        val response = supabaseApi.upsertTask(task.toRemoteTask())
        database.taskDao().updateTask(
            task.copy(syncStatus = SyncStatus.SYNCED)
        )
    }
    
    private suspend fun syncMediaFile(operation: SyncOperation) {
        val mediaFile = database.mediaDao().getMediaFileById(operation.entityId)
            ?: throw SyncException("Media file not found")
        
        if (mediaFile.uploadStatus != UploadStatus.UPLOADED) {
            val file = File(mediaFile.filePath)
            if (file.exists()) {
                val uploadPath = "${mediaFile.projectId}/${mediaFile.fileName}"
                val uploadResponse = supabaseApi.uploadFile(uploadPath, file.readBytes())
                
                database.mediaDao().updateMediaFile(
                    mediaFile.copy(uploadStatus = UploadStatus.UPLOADED)
                )
            }
        }
    }
    
    suspend fun downloadProjectsForUser(userId: String) {
        try {
            val projects = supabaseApi.getAssignedProjects(userId)
            
            for (project in projects) {
                database.projectDao().insertProject(project.toLocalProject())
                
                // Download tasks for this project
                val tasks = supabaseApi.getTasksForProject(project.id)
                for (task in tasks) {
                    database.taskDao().insertTask(task.toLocalTask())
                }
            }
        } catch (e: Exception) {
            Log.e("SyncRepository", "Failed to download projects", e)
            throw e
        }
    }
    
    suspend fun forceFullSync(userId: String) {
        // Download all remote data
        downloadProjectsForUser(userId)
        
        // Upload all pending local changes
        processSyncQueue()
    }
}

data class SyncOperation(
    val id: String,
    val type: SyncOperationType,
    val operation: OperationType,
    val entityId: String,
    var retryCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

enum class SyncOperationType {
    PROJECT, TASK, MATERIAL, TIME_REGISTRATION, MEDIA_FILE
}

enum class OperationType {
    CREATE, UPDATE, DELETE
}

class SyncException(message: String) : Exception(message)
```

## Conflict Resolution

### Conflict Detection and Resolution
```swift
// iOS Conflict Resolution
struct ConflictResolution {
    enum Strategy {
        case serverWins      // Server data overwrites local
        case clientWins      // Local data overwrites server
        case mergeChanges    // Attempt to merge both versions
        case userChoice      // Present options to user
    }
    
    static func resolveProjectConflict(
        local: Project,
        remote: ProjectResponse,
        strategy: Strategy = .serverWins
    ) -> Project {
        switch strategy {
        case .serverWins:
            local.title = remote.title
            local.status = remote.status
            local.syncStatus = "synced"
            return local
            
        case .clientWins:
            // Keep local changes, mark for sync
            local.syncStatus = "pending"
            return local
            
        case .mergeChanges:
            // Intelligent merge based on timestamps
            if remote.updated_at > local.updatedAt {
                local.title = remote.title
                local.status = remote.status
            }
            local.syncStatus = "synced"
            return local
            
        case .userChoice:
            // Present conflict to user for resolution
            local.syncStatus = "conflict"
            return local
        }
    }
}
```

```kotlin
// Android Conflict Resolution
object ConflictResolver {
    sealed class ResolutionStrategy {
        object ServerWins : ResolutionStrategy()
        object ClientWins : ResolutionStrategy()
        object MergeChanges : ResolutionStrategy()
        object UserChoice : ResolutionStrategy()
    }
    
    fun resolveProjectConflict(
        local: ProjectEntity,
        remote: RemoteProject,
        strategy: ResolutionStrategy = ResolutionStrategy.ServerWins
    ): ProjectEntity {
        return when (strategy) {
            is ResolutionStrategy.ServerWins -> {
                local.copy(
                    title = remote.title,
                    status = remote.status,
                    syncStatus = SyncStatus.SYNCED,
                    updatedAt = System.currentTimeMillis()
                )
            }
            
            is ResolutionStrategy.ClientWins -> {
                local.copy(syncStatus = SyncStatus.PENDING)
            }
            
            is ResolutionStrategy.MergeChanges -> {
                if (remote.updated_at > local.updatedAt) {
                    local.copy(
                        title = remote.title,
                        status = remote.status,
                        syncStatus = SyncStatus.SYNCED
                    )
                } else {
                    local.copy(syncStatus = SyncStatus.SYNCED)
                }
            }
            
            is ResolutionStrategy.UserChoice -> {
                local.copy(syncStatus = SyncStatus.CONFLICT)
            }
        }
    }
}
```

## Background Sync Strategies

### iOS Background App Refresh
```swift
import BackgroundTasks

class BackgroundSyncManager {
    static let backgroundSyncIdentifier = "com.smanscrm.background-sync"
    
    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.backgroundSyncIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: Self.backgroundSyncIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule background sync: \(error)")
        }
    }
    
    private func handleBackgroundSync(task: BGAppRefreshTask) {
        scheduleBackgroundSync() // Schedule next sync
        
        let syncOperation = Task {
            await SyncManager.shared.processSyncQueue()
        }
        
        task.expirationHandler = {
            syncOperation.cancel()
            task.setTaskCompleted(success: false)
        }
        
        Task {
            await syncOperation.value
            task.setTaskCompleted(success: true)
        }
    }
}
```

### Android Work Manager Sync
```kotlin
@HiltWorker
class BackgroundSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncRepository: SyncRepository,
    private val networkManager: NetworkManager
) : CoroutineWorker(context, workerParams) {
    
    override suspend fun doWork(): Result {
        return try {
            if (networkManager.isConnected()) {
                syncRepository.processSyncQueue()
                Result.success()
            } else {
                Result.retry()
            }
        } catch (exception: Exception) {
            Log.e("BackgroundSyncWorker", "Sync failed", exception)
            
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    @AssistedFactory
    interface Factory {
        fun create(context: Context, params: WorkerParameters): BackgroundSyncWorker
    }
    
    companion object {
        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val syncRequest = PeriodicWorkRequestBuilder<BackgroundSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "background_sync",
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }
    }
}
```

## Offline UI Indicators

### Connection Status UI
```swift
// iOS Connection Status View
struct ConnectionStatusView: View {
    @StateObject private var networkMonitor = NetworkMonitor()
    @StateObject private var syncManager = SyncManager.shared
    
    var body: some View {
        HStack {
            Image(systemName: networkMonitor.isConnected ? "wifi" : "wifi.slash")
                .foregroundColor(networkMonitor.isConnected ? .green : .red)
            
            Text(statusText)
                .font(.caption)
                .foregroundColor(.secondary)
            
            if syncManager.isSyncing {
                ProgressView()
                    .scaleEffect(0.7)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private var statusText: String {
        if syncManager.isSyncing {
            return "Synchroniseren..."
        } else if networkMonitor.isConnected {
            return "Online"
        } else {
            return "Offline"
        }
    }
}
```

```kotlin
// Android Connection Status Composable
@Composable
fun ConnectionStatusIndicator(
    networkManager: NetworkManager,
    syncRepository: SyncRepository
) {
    val isConnected by networkManager.isConnected.collectAsState()
    val isSyncing by syncRepository.isSyncing.collectAsState()
    val syncProgress by syncRepository.syncProgress.collectAsState()
    
    Row(
        modifier = Modifier
            .background(
                MaterialTheme.colorScheme.surfaceVariant,
                RoundedCornerShape(8.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (isConnected) Icons.Default.Wifi else Icons.Default.WifiOff,
            contentDescription = null,
            tint = if (isConnected) Color.Green else Color.Red,
            modifier = Modifier.size(16.dp)
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Text(
            text = when {
                isSyncing -> "Synchroniseren..."
                isConnected -> "Online"
                else -> "Offline"
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        if (isSyncing) {
            Spacer(modifier = Modifier.width(8.dp))
            
            if (syncProgress > 0) {
                LinearProgressIndicator(
                    progress = syncProgress,
                    modifier = Modifier.width(40.dp)
                )
            } else {
                CircularProgressIndicator(
                    modifier = Modifier.size(12.dp),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}
```

This offline capability system provides:
- Complete offline functionality
- Robust sync queue management
- Conflict resolution strategies
- Background synchronization
- Visual feedback to users
- Data integrity and consistency
