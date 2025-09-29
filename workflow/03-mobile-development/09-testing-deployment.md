# Testing & Deployment Guide

## Testing Strategy

### Unit Testing Framework

#### iOS Unit Tests (XCTest)
```swift
import XCTest
@testable import SmansApp

class ProjectManagerTests: XCTestCase {
    var projectManager: ProjectManager!
    var mockDataManager: MockLocalDataManager!
    var mockSyncManager: MockSyncManager!
    
    override func setUpWithError() throws {
        mockDataManager = MockLocalDataManager()
        mockSyncManager = MockSyncManager()
        projectManager = ProjectManager(
            dataManager: mockDataManager,
            syncManager: mockSyncManager
        )
    }
    
    override func tearDownWithError() throws {
        projectManager = nil
        mockDataManager = nil
        mockSyncManager = nil
    }
    
    func testCreateProject() async throws {
        // Given
        let projectData = ProjectData(
            title: "Test Project",
            customerName: "Test Customer",
            location: "Test Location"
        )
        
        // When
        let project = try await projectManager.createProject(projectData)
        
        // Then
        XCTAssertEqual(project.title, "Test Project")
        XCTAssertEqual(project.status, "te-plannen")
        XCTAssertTrue(mockDataManager.saveCalled)
        XCTAssertTrue(mockSyncManager.addToSyncQueueCalled)
    }
    
    func testCompleteTask() async throws {
        // Given
        let project = await createTestProject()
        let task = await createTestTask(for: project)
        
        // When
        try await projectManager.completeTask(task.id)
        
        // Then
        let updatedTask = try await projectManager.getTask(task.id)
        XCTAssertTrue(updatedTask.isCompleted)
        XCTAssertEqual(updatedTask.syncStatus, "pending")
    }
    
    func testOfflineProjectCreation() async throws {
        // Given
        mockSyncManager.isOffline = true
        let projectData = ProjectData(
            title: "Offline Project",
            customerName: "Offline Customer"
        )
        
        // When
        let project = try await projectManager.createProject(projectData)
        
        // Then
        XCTAssertEqual(project.syncStatus, "pending")
        XCTAssertTrue(mockSyncManager.syncQueueContains(project.id))
    }
    
    private func createTestProject() async -> Project {
        let projectData = ProjectData(
            title: "Test Project",
            customerName: "Test Customer"
        )
        return try! await projectManager.createProject(projectData)
    }
    
    private func createTestTask(for project: Project) async -> ProjectTask {
        let taskData = TaskData(
            projectId: project.id,
            blockTitle: "Test Block",
            taskDescription: "Test Task"
        )
        return try! await projectManager.createTask(taskData)
    }
}

// Mock Classes
class MockLocalDataManager: LocalDataManagerProtocol {
    var saveCalled = false
    var projects: [Project] = []
    var tasks: [ProjectTask] = []
    
    func save() {
        saveCalled = true
    }
    
    func createProject(_ data: ProjectData) -> Project {
        let project = Project(
            id: UUID().uuidString,
            title: data.title,
            customerName: data.customerName,
            status: "te-plannen"
        )
        projects.append(project)
        return project
    }
    
    func getProject(_ id: String) -> Project? {
        return projects.first { $0.id == id }
    }
}

class MockSyncManager: SyncManagerProtocol {
    var addToSyncQueueCalled = false
    var isOffline = false
    private var syncQueue: [String] = []
    
    func addToSyncQueue(_ operation: SyncOperation) {
        addToSyncQueueCalled = true
        syncQueue.append(operation.entityId)
    }
    
    func syncQueueContains(_ entityId: String) -> Bool {
        return syncQueue.contains(entityId)
    }
}
```

#### Android Unit Tests (JUnit)
```kotlin
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import kotlinx.coroutines.test.runTest

class ProjectRepositoryTest {
    @Mock
    private lateinit var projectDao: ProjectDao
    
    @Mock
    private lateinit var syncRepository: SyncRepository
    
    @Mock
    private lateinit var networkManager: NetworkManager
    
    private lateinit var projectRepository: ProjectRepository
    
    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        projectRepository = ProjectRepository(
            projectDao = projectDao,
            syncRepository = syncRepository,
            networkManager = networkManager
        )
    }
    
    @Test
    fun `createProject should save locally and add to sync queue`() = runTest {
        // Given
        val projectData = CreateProjectRequest(
            title = "Test Project",
            customerName = "Test Customer",
            location = "Test Location"
        )
        val expectedProject = ProjectEntity(
            id = "test-id",
            title = "Test Project",
            customerName = "Test Customer",
            status = "te-plannen",
            syncStatus = SyncStatus.PENDING,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        
        // When
        val result = projectRepository.createProject(projectData)
        
        // Then
        verify(projectDao).insertProject(any())
        verify(syncRepository).addToSyncQueue(any())
        assertEquals("Test Project", result.title)
        assertEquals(SyncStatus.PENDING, result.syncStatus)
    }
    
    @Test
    fun `completeTask should update task and trigger sync`() = runTest {
        // Given
        val taskId = "task-123"
        val existingTask = ProjectTaskEntity(
            id = taskId,
            projectId = "project-123",
            blockTitle = "Test Block",
            taskDescription = "Test Task",
            isCompleted = false,
            syncStatus = SyncStatus.SYNCED
        )
        
        `when`(projectDao.getTaskById(taskId)).thenReturn(existingTask)
        
        // When
        projectRepository.completeTask(taskId)
        
        // Then
        verify(projectDao).updateTask(argThat { task ->
            task.isCompleted && task.syncStatus == SyncStatus.PENDING
        })
        verify(syncRepository).addToSyncQueue(any())
    }
    
    @Test
    fun `offline project creation should work without network`() = runTest {
        // Given
        `when`(networkManager.isConnected()).thenReturn(false)
        val projectData = CreateProjectRequest(
            title = "Offline Project",
            customerName = "Offline Customer"
        )
        
        // When
        val result = projectRepository.createProject(projectData)
        
        // Then
        verify(projectDao).insertProject(any())
        verify(syncRepository).addToSyncQueue(any())
        assertEquals(SyncStatus.PENDING, result.syncStatus)
    }
}

class SyncRepositoryTest {
    @Mock
    private lateinit var database: SmansDatabase
    
    @Mock
    private lateinit var supabaseApi: SupabaseApi
    
    @Mock
    private lateinit var networkManager: NetworkManager
    
    private lateinit var syncRepository: SyncRepository
    
    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        syncRepository = SyncRepository(database, supabaseApi, networkManager)
    }
    
    @Test
    fun `processSyncQueue should not run when offline`() = runTest {
        // Given
        `when`(networkManager.isConnected()).thenReturn(false)
        
        // When
        syncRepository.processSyncQueue()
        
        // Then
        verify(supabaseApi, never()).upsertProject(any())
    }
    
    @Test
    fun `processSyncQueue should sync pending projects when online`() = runTest {
        // Given
        `when`(networkManager.isConnected()).thenReturn(true)
        val pendingProject = ProjectEntity(
            id = "test-id",
            title = "Test Project",
            customerName = "Test Customer",
            status = "te-plannen",
            syncStatus = SyncStatus.PENDING,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        
        // When
        syncRepository.syncProject(SyncOperation(
            id = "sync-1",
            type = SyncOperationType.PROJECT,
            operation = OperationType.UPDATE,
            entityId = "test-id"
        ))
        
        // Then
        verify(supabaseApi).upsertProject(any())
    }
}
```

### Integration Testing

#### iOS Integration Tests
```swift
class IntegrationTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }
    
    func testCompleteProjectWorkflow() throws {
        // Test login
        testLogin()
        
        // Test project creation
        testProjectCreation()
        
        // Test task completion
        testTaskCompletion()
        
        // Test project delivery
        testProjectDelivery()
    }
    
    private func testLogin() {
        let emailField = app.textFields["email"]
        let passwordField = app.secureTextFields["password"]
        let loginButton = app.buttons["Inloggen"]
        
        emailField.tap()
        emailField.typeText("test@smanscrm.nl")
        
        passwordField.tap()
        passwordField.typeText("testpassword")
        
        loginButton.tap()
        
        // Wait for dashboard to appear
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 5))
    }
    
    private func testProjectCreation() {
        let projectsTab = app.tabBars.buttons["Projecten"]
        projectsTab.tap()
        
        let createButton = app.buttons["create_project"]
        createButton.tap()
        
        let titleField = app.textFields["project_title"]
        titleField.tap()
        titleField.typeText("Test Integration Project")
        
        let customerField = app.textFields["customer_name"]
        customerField.tap()
        customerField.typeText("Test Customer")
        
        let saveButton = app.buttons["Opslaan"]
        saveButton.tap()
        
        // Verify project appears in list
        XCTAssertTrue(app.staticTexts["Test Integration Project"].waitForExistence(timeout: 3))
    }
    
    private func testTaskCompletion() {
        let projectCell = app.cells["Test Integration Project"]
        projectCell.tap()
        
        let firstTask = app.buttons["task_0"]
        firstTask.tap()
        
        // Verify task is marked as completed
        XCTAssertTrue(app.images["checkmark.circle.fill"].exists)
    }
    
    private func testProjectDelivery() {
        let deliveryTab = app.buttons["Oplevering"]
        deliveryTab.tap()
        
        let photoButton = app.buttons["add_delivery_photo"]
        photoButton.tap()
        
        // Simulate camera capture
        let captureButton = app.buttons["Capture"]
        if captureButton.exists {
            captureButton.tap()
        }
        
        let signatureButton = app.buttons["client_signature"]
        signatureButton.tap()
        
        // Simulate signature drawing
        let signatureCanvas = app.otherElements["signature_canvas"]
        signatureCanvas.swipeRight()
        
        let saveSignatureButton = app.buttons["save_signature"]
        saveSignatureButton.tap()
        
        let completeDeliveryButton = app.buttons["complete_delivery"]
        completeDeliveryButton.tap()
        
        // Verify delivery completion
        XCTAssertTrue(app.staticTexts["Project afgerond"].waitForExistence(timeout: 5))
    }
}
```

#### Android Integration Tests (Espresso)
```kotlin
@RunWith(AndroidJUnit4::class)
@LargeTest
class IntegrationTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Before
    fun setup() {
        // Clear app data and prepare test environment
        clearAppData()
        setupTestData()
    }
    
    @Test
    fun completeProjectWorkflow() {
        // Test login
        performLogin()
        
        // Test project creation
        createTestProject()
        
        // Test task completion
        completeProjectTasks()
        
        // Test project delivery
        completeProjectDelivery()
    }
    
    private fun performLogin() {
        onView(withId(R.id.email_input))
            .perform(typeText("test@smanscrm.nl"))
        
        onView(withId(R.id.password_input))
            .perform(typeText("testpassword"))
        
        onView(withId(R.id.login_button))
            .perform(click())
        
        // Wait for dashboard
        onView(withText("Dashboard"))
            .check(matches(isDisplayed()))
    }
    
    private fun createTestProject() {
        // Navigate to projects
        onView(withId(R.id.projects_tab))
            .perform(click())
        
        // Create new project
        onView(withId(R.id.fab_create_project))
            .perform(click())
        
        onView(withId(R.id.project_title_input))
            .perform(typeText("Test Integration Project"))
        
        onView(withId(R.id.customer_name_input))
            .perform(typeText("Test Customer"))
        
        onView(withId(R.id.save_button))
            .perform(click())
        
        // Verify project is created
        onView(withText("Test Integration Project"))
            .check(matches(isDisplayed()))
    }
    
    private fun completeProjectTasks() {
        // Open project details
        onView(withText("Test Integration Project"))
            .perform(click())
        
        // Complete first task
        onView(withId(R.id.task_checkbox_0))
            .perform(click())
        
        // Verify task is completed
        onView(withId(R.id.task_checkbox_0))
            .check(matches(isChecked()))
    }
    
    private fun completeProjectDelivery() {
        // Navigate to delivery tab
        onView(withText("Oplevering"))
            .perform(click())
        
        // Add delivery photo
        onView(withId(R.id.add_delivery_photo_button))
            .perform(click())
        
        // Simulate camera capture (using test doubles)
        onView(withId(R.id.capture_button))
            .perform(click())
        
        // Add client signature
        onView(withId(R.id.client_signature_button))
            .perform(click())
        
        // Draw signature
        onView(withId(R.id.signature_canvas))
            .perform(drawSignature())
        
        onView(withId(R.id.save_signature_button))
            .perform(click())
        
        // Complete delivery
        onView(withId(R.id.complete_delivery_button))
            .perform(click())
        
        // Verify delivery completion
        onView(withText("Project afgerond"))
            .check(matches(isDisplayed()))
    }
    
    private fun drawSignature(): ViewAction {
        return object : ViewAction {
            override fun getConstraints(): Matcher<View> {
                return isAssignableFrom(View::class.java)
            }
            
            override fun getDescription(): String {
                return "Draw a signature on the canvas"
            }
            
            override fun perform(uiController: UiController, view: View) {
                val motionEvent1 = MotionEvent.obtain(
                    SystemClock.uptimeMillis(),
                    SystemClock.uptimeMillis(),
                    MotionEvent.ACTION_DOWN,
                    100f, 100f, 0
                )
                
                val motionEvent2 = MotionEvent.obtain(
                    SystemClock.uptimeMillis(),
                    SystemClock.uptimeMillis(),
                    MotionEvent.ACTION_MOVE,
                    200f, 200f, 0
                )
                
                val motionEvent3 = MotionEvent.obtain(
                    SystemClock.uptimeMillis(),
                    SystemClock.uptimeMillis(),
                    MotionEvent.ACTION_UP,
                    200f, 200f, 0
                )
                
                view.dispatchTouchEvent(motionEvent1)
                view.dispatchTouchEvent(motionEvent2)
                view.dispatchTouchEvent(motionEvent3)
            }
        }
    }
}
```

### Performance Testing

#### iOS Performance Tests
```swift
class PerformanceTests: XCTestCase {
    func testProjectListLoadingPerformance() {
        let projectManager = ProjectManager()
        
        measure {
            // This will measure the time to load 100 projects
            _ = projectManager.loadProjects(limit: 100)
        }
    }
    
    func testImageCompressionPerformance() {
        let imageManager = ImageManager()
        let testImage = UIImage(named: "test_image_large")!
        
        measure {
            _ = imageManager.compressImage(testImage, maxSizeKB: 500)
        }
    }
    
    func testDatabaseSyncPerformance() {
        let syncManager = SyncManager()
        
        measure {
            // Test syncing 50 projects with 10 tasks each
            syncManager.performTestSync(projectCount: 50, tasksPerProject: 10)
        }
    }
}
```

## App Store Deployment

### iOS App Store Guidelines

#### Info.plist Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Smans CRM</string>
    
    <key>CFBundleIdentifier</key>
    <string>nl.smanscrm.mobile</string>
    
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    
    <key>NSCameraUsageDescription</key>
    <string>De app heeft toegang tot de camera nodig om foto's te maken van projecten en bonnetjes.</string>
    
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>De app gebruikt uw locatie om de afstand tot projecten te berekenen en GPS-coördinaten toe te voegen aan foto's.</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>De app heeft toegang tot de microfoon nodig voor spraak-naar-tekst functionaliteit.</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>De app heeft toegang tot uw fotobibliotheek nodig om bestaande foto's te selecteren voor projectdocumentatie.</string>
    
    <key>NSFaceIDUsageDescription</key>
    <string>De app gebruikt Face ID voor veilige en snelle toegang tot uw werkprojecten.</string>
    
    <key>UIBackgroundModes</key>
    <array>
        <string>background-app-refresh</string>
        <string>background-processing</string>
    </array>
    
    <key>BGTaskSchedulerPermittedIdentifiers</key>
    <array>
        <string>com.smanscrm.background-sync</string>
    </array>
    
    <key>LSRequiresIPhoneOS</key>
    <true/>
    
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

#### Build Configuration
```swift
// Build Settings for Release
PRODUCT_NAME = Smans CRM
PRODUCT_BUNDLE_IDENTIFIER = nl.smanscrm.mobile
MARKETING_VERSION = 1.0
CURRENT_PROJECT_VERSION = 1
DEVELOPMENT_TEAM = [Your Team ID]
CODE_SIGN_STYLE = Automatic
CODE_SIGN_IDENTITY = iPhone Distribution

// Deployment Target
IPHONEOS_DEPLOYMENT_TARGET = 15.0

// Build Configuration
ENABLE_BITCODE = NO
SWIFT_VERSION = 5.0
GCC_OPTIMIZATION_LEVEL = s

// App Store Connect Configuration
SKIP_INSTALL = NO
INSTALL_PATH = $(LOCAL_APPS_DIR)
```

### Android Google Play Store

#### AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="nl.smanscrm.mobile">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    
    <!-- Hardware Features -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="true" />
    <uses-feature
        android:name="android.hardware.location"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.fingerprint"
        android:required="false" />

    <application
        android:name=".SmansApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.SmansApp"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- File Provider for sharing files -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
```

#### build.gradle (app)
```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "nl.smanscrm.mobile"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        vectorDrawables {
            useSupportLibrary true
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
    
    buildFeatures {
        compose true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion compose_version
    }
    
    packagingOptions {
        resources {
            excludes += '/META-INF/{AL2.0,LGPL2.1}'
        }
    }
}
```

### Release Process

#### iOS Release Checklist
```
Pre-Release:
□ Update version numbers (CFBundleVersion, CFBundleShortVersionString)
□ Test on multiple device sizes (iPhone SE, iPhone 14, iPad)
□ Test with iOS 15.0 minimum deployment target
□ Verify all permissions work correctly
□ Test offline functionality thoroughly
□ Run performance tests
□ Test biometric authentication on multiple devices
□ Verify push notifications work
□ Test background app refresh
□ Check memory usage and battery impact
□ Validate app icon and launch screens
□ Test accessibility features (VoiceOver)
□ Review and update privacy policy

Build & Upload:
□ Archive with Release configuration
□ Upload to App Store Connect
□ Fill out app metadata
□ Upload screenshots for all device sizes
□ Submit for review

Post-Submission:
□ Monitor review status
□ Prepare for potential rejections
□ Plan release day communications
```

#### Android Release Checklist
```
Pre-Release:
□ Update version code and version name
□ Test on multiple screen sizes and densities
□ Test on Android 8.0+ devices
□ Verify all permissions are justified
□ Test offline functionality
□ Run instrumentation tests
□ Test biometric authentication
□ Verify push notifications
□ Test background sync with Doze mode
□ Check APK size and optimize if needed
□ Test accessibility with TalkBack
□ Review and update privacy policy
□ Generate signed APK/AAB

Upload to Play Console:
□ Upload signed AAB (Android App Bundle)
□ Fill out store listing
□ Upload screenshots and graphics
□ Set up content rating
□ Configure target audience and content
□ Submit for review

Post-Submission:
□ Monitor review status
□ Set up staged rollout (start with 5-10%)
□ Monitor crash reports and user feedback
□ Gradually increase rollout percentage
```

### Continuous Integration/Deployment

#### iOS GitHub Actions
```yaml
name: iOS CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '14.3'
    
    - name: Install dependencies
      run: |
        pod install
    
    - name: Run tests
      run: |
        xcodebuild test \
          -workspace SmansApp.xcworkspace \
          -scheme SmansApp \
          -destination 'platform=iOS Simulator,name=iPhone 14'
    
    - name: Build for testing
      run: |
        xcodebuild build-for-testing \
          -workspace SmansApp.xcworkspace \
          -scheme SmansApp \
          -destination 'platform=iOS Simulator,name=iPhone 14'

  deploy:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '14.3'
    
    - name: Install dependencies
      run: pod install
    
    - name: Build and archive
      run: |
        xcodebuild archive \
          -workspace SmansApp.xcworkspace \
          -scheme SmansApp \
          -archivePath SmansApp.xcarchive \
          -configuration Release
    
    - name: Export IPA
      run: |
        xcodebuild -exportArchive \
          -archivePath SmansApp.xcarchive \
          -exportPath . \
          -exportOptionsPlist ExportOptions.plist
    
    - name: Upload to App Store Connect
      env:
        APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
      run: |
        xcrun altool --upload-app \
          --file SmansApp.ipa \
          --type ios \
          --apiKey $APP_STORE_CONNECT_API_KEY
```

#### Android GitHub Actions
```yaml
name: Android CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
    
    - name: Cache Gradle packages
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-
    
    - name: Run tests
      run: ./gradlew test
    
    - name: Run instrumented tests
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 29
        script: ./gradlew connectedAndroidTest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
    
    - name: Decode keystore
      env:
        ENCODED_STRING: ${{ secrets.SIGNING_KEY_STORE_BASE64 }}
      run: |
        echo $ENCODED_STRING | base64 -di > app/keystore.jks
    
    - name: Build release AAB
      env:
        SIGNING_KEY_ALIAS: ${{ secrets.SIGNING_KEY_ALIAS }}
        SIGNING_KEY_PASSWORD: ${{ secrets.SIGNING_KEY_PASSWORD }}
        SIGNING_STORE_PASSWORD: ${{ secrets.SIGNING_STORE_PASSWORD }}
      run: ./gradlew bundleRelease
    
    - name: Upload to Play Console
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
        packageName: nl.smanscrm.mobile
        releaseFiles: app/build/outputs/bundle/release/app-release.aab
        track: internal
        status: draft
```

This testing and deployment guide provides:
- Comprehensive testing strategies
- App store preparation checklists
- CI/CD pipeline configurations
- Performance testing approaches
- Quality assurance processes