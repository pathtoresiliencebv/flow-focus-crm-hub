# Authentication Flow & Security

## Authentication Architecture

### Supabase Auth Integration

#### iOS Authentication Manager
```swift
import Supabase
import LocalAuthentication

class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var userProfile: UserProfile?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase: SupabaseClient
    
    init() {
        self.supabase = SupabaseClient(
            supabaseURL: URL(string: "https://pvesgvkyiaqmsudmmtkc.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"
        )
        
        setupAuthStateListener()
        checkExistingSession()
    }
    
    private func setupAuthStateListener() {
        Task {
            for await state in supabase.auth.authStateChanges {
                await MainActor.run {
                    switch state.event {
                    case .signedIn:
                        self.currentUser = state.session?.user
                        self.isAuthenticated = true
                        Task { await self.fetchUserProfile() }
                    case .signedOut:
                        self.currentUser = nil
                        self.userProfile = nil
                        self.isAuthenticated = false
                    default:
                        break
                    }
                }
            }
        }
    }
    
    private func checkExistingSession() {
        Task {
            do {
                let session = try await supabase.auth.session
                await MainActor.run {
                    if let session = session {
                        self.currentUser = session.user
                        self.isAuthenticated = true
                        Task { await self.fetchUserProfile() }
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Failed to restore session: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func signIn(email: String, password: String) async {
        await MainActor.run { isLoading = true }
        
        do {
            try await supabase.auth.signIn(email: email, password: password)
            await MainActor.run {
                isLoading = false
                errorMessage = nil
            }
        } catch {
            await MainActor.run {
                isLoading = false
                errorMessage = "Login failed: \(error.localizedDescription)"
            }
        }
    }
    
    func signOut() async {
        do {
            try await supabase.auth.signOut()
            
            // Clear biometric authentication
            await BiometricManager.shared.clearStoredCredentials()
            
            // Clear local data
            await LocalDataManager.shared.clearAllData()
            
        } catch {
            await MainActor.run {
                errorMessage = "Sign out failed: \(error.localizedDescription)"
            }
        }
    }
    
    private func fetchUserProfile() async {
        guard let userId = currentUser?.id else { return }
        
        do {
            let profile: UserProfile = try await supabase
                .from("profiles")
                .select("*")
                .eq("id", value: userId)
                .single()
                .execute()
                .value
            
            await MainActor.run {
                self.userProfile = profile
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to fetch profile: \(error.localizedDescription)"
            }
        }
    }
}

struct UserProfile: Codable {
    let id: String
    let full_name: String?
    let role: String
    let status: String
    let language_preference: String
    let timezone: String
}
```

#### Android Authentication Manager
```kotlin
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class AuthenticationManager(private val context: Context) {
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser
    
    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage
    
    private val supabase = createSupabaseClient(
        supabaseUrl = "https://pvesgvkyiaqmsudmmtkc.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"
    ) {
        install(GoTrue)
        install(Postgrest)
    }
    
    init {
        setupAuthStateListener()
        checkExistingSession()
    }
    
    private fun setupAuthStateListener() {
        supabase.auth.onAuthStateChange { _, session ->
            _currentUser.value = session?.user
            _isAuthenticated.value = session != null
            
            if (session != null) {
                fetchUserProfile()
            } else {
                _userProfile.value = null
            }
        }
    }
    
    private suspend fun checkExistingSession() {
        try {
            val session = supabase.auth.currentSession.value
            _currentUser.value = session?.user
            _isAuthenticated.value = session != null
            
            if (session != null) {
                fetchUserProfile()
            }
        } catch (e: Exception) {
            _errorMessage.value = "Failed to restore session: ${e.message}"
        }
    }
    
    suspend fun signIn(email: String, password: String) {
        _isLoading.value = true
        _errorMessage.value = null
        
        try {
            supabase.auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
        } catch (e: Exception) {
            _errorMessage.value = "Login failed: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun signOut() {
        try {
            supabase.auth.signOut()
            
            // Clear biometric authentication
            BiometricManager.clearStoredCredentials(context)
            
            // Clear local data
            LocalDataManager.clearAllData(context)
            
        } catch (e: Exception) {
            _errorMessage.value = "Sign out failed: ${e.message}"
        }
    }
    
    private suspend fun fetchUserProfile() {
        val userId = _currentUser.value?.id ?: return
        
        try {
            val profile = supabase
                .from("profiles")
                .select()
                .eq("id", userId)
                .decodeSingle<UserProfile>()
            
            _userProfile.value = profile
        } catch (e: Exception) {
            _errorMessage.value = "Failed to fetch profile: ${e.message}"
        }
    }
}

@Serializable
data class UserProfile(
    val id: String,
    val full_name: String?,
    val role: String,
    val status: String,
    val language_preference: String,
    val timezone: String
)
```

## Biometric Authentication

### iOS Biometric Implementation
```swift
import LocalAuthentication

class BiometricManager: ObservableObject {
    static let shared = BiometricManager()
    
    @Published var isBiometricEnabled = false
    @Published var biometricType: LABiometryType = .none
    @Published var canUseBiometrics = false
    
    private let keychain = KeychainManager()
    
    init() {
        checkBiometricAvailability()
        checkBiometricEnabledStatus()
    }
    
    private func checkBiometricAvailability() {
        let context = LAContext()
        var error: NSError?
        
        canUseBiometrics = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        biometricType = context.biometryType
    }
    
    private func checkBiometricEnabledStatus() {
        isBiometricEnabled = UserDefaults.standard.bool(forKey: "biometric_enabled")
    }
    
    func enableBiometricAuth(email: String, password: String) async throws {
        // First verify the credentials
        let authManager = AuthenticationManager()
        try await authManager.signIn(email: email, password: password)
        
        // Store credentials securely
        try keychain.storeCredentials(email: email, password: password)
        
        await MainActor.run {
            isBiometricEnabled = true
            UserDefaults.standard.set(true, forKey: "biometric_enabled")
        }
    }
    
    func authenticateWithBiometrics() async throws -> (email: String, password: String) {
        guard canUseBiometrics else {
            throw BiometricError.notAvailable
        }
        
        let context = LAContext()
        let reason = "Access your work projects securely"
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                return try keychain.retrieveCredentials()
            } else {
                throw BiometricError.authenticationFailed
            }
        } catch {
            throw BiometricError.authenticationFailed
        }
    }
    
    func disableBiometricAuth() async {
        await clearStoredCredentials()
        
        await MainActor.run {
            isBiometricEnabled = false
            UserDefaults.standard.set(false, forKey: "biometric_enabled")
        }
    }
    
    func clearStoredCredentials() async {
        keychain.deleteCredentials()
    }
}

enum BiometricError: Error, LocalizedError {
    case notAvailable
    case authenticationFailed
    case credentialsNotFound
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available on this device"
        case .authenticationFailed:
            return "Biometric authentication failed"
        case .credentialsNotFound:
            return "Stored credentials not found"
        }
    }
}
```

### Android Biometric Implementation
```kotlin
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

class BiometricManager(private val activity: FragmentActivity) {
    private val biometricManager = BiometricManager.from(activity)
    private val keystore = KeystoreManager(activity)
    
    fun isBiometricAvailable(): Boolean {
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK)) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            else -> false
        }
    }
    
    fun isBiometricEnabled(): Boolean {
        return activity.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
            .getBoolean("biometric_enabled", false)
    }
    
    suspend fun enableBiometricAuth(email: String, password: String) {
        // First verify credentials
        val authManager = AuthenticationManager(activity)
        authManager.signIn(email, password)
        
        // Store credentials securely
        keystore.storeCredentials(email, password)
        
        // Enable biometric flag
        activity.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("biometric_enabled", true)
            .apply()
    }
    
    fun authenticateWithBiometrics(
        onSuccess: (email: String, password: String) -> Unit,
        onError: (String) -> Unit
    ) {
        if (!isBiometricAvailable()) {
            onError("Biometric authentication not available")
            return
        }
        
        val executor = ContextCompat.getMainExecutor(activity)
        val biometricPrompt = BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                try {
                    val credentials = keystore.retrieveCredentials()
                    onSuccess(credentials.first, credentials.second)
                } catch (e: Exception) {
                    onError("Failed to retrieve stored credentials")
                }
            }
            
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onError(errString.toString())
            }
        })
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle("Use your fingerprint or face to access your work projects")
            .setNegativeButtonText("Cancel")
            .build()
        
        biometricPrompt.authenticate(promptInfo)
    }
    
    fun disableBiometricAuth() {
        keystore.deleteCredentials()
        activity.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("biometric_enabled", false)
            .apply()
    }
    
    companion object {
        fun clearStoredCredentials(context: Context) {
            KeystoreManager(context).deleteCredentials()
            context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("biometric_enabled", false)
                .apply()
        }
    }
}
```

## Secure Credential Storage

### iOS Keychain Manager
```swift
import Security

class KeychainManager {
    private let service = "com.smanscrm.credentials"
    
    func storeCredentials(email: String, password: String) throws {
        let emailData = email.data(using: .utf8)!
        let passwordData = password.data(using: .utf8)!
        
        // Store email
        let emailQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "email",
            kSecValueData as String: emailData
        ]
        
        SecItemDelete(emailQuery as CFDictionary)
        let emailStatus = SecItemAdd(emailQuery as CFDictionary, nil)
        
        // Store password
        let passwordQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "password",
            kSecValueData as String: passwordData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(passwordQuery as CFDictionary)
        let passwordStatus = SecItemAdd(passwordQuery as CFDictionary, nil)
        
        guard emailStatus == errSecSuccess && passwordStatus == errSecSuccess else {
            throw KeychainError.storeFailed
        }
    }
    
    func retrieveCredentials() throws -> (email: String, password: String) {
        // Retrieve email
        let emailQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "email",
            kSecReturnData as String: true
        ]
        
        var emailItem: CFTypeRef?
        let emailStatus = SecItemCopyMatching(emailQuery as CFDictionary, &emailItem)
        
        guard emailStatus == errSecSuccess,
              let emailData = emailItem as? Data,
              let email = String(data: emailData, encoding: .utf8) else {
            throw KeychainError.retrieveFailed
        }
        
        // Retrieve password
        let passwordQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "password",
            kSecReturnData as String: true
        ]
        
        var passwordItem: CFTypeRef?
        let passwordStatus = SecItemCopyMatching(passwordQuery as CFDictionary, &passwordItem)
        
        guard passwordStatus == errSecSuccess,
              let passwordData = passwordItem as? Data,
              let password = String(data: passwordData, encoding: .utf8) else {
            throw KeychainError.retrieveFailed
        }
        
        return (email, password)
    }
    
    func deleteCredentials() {
        let emailQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "email"
        ]
        
        let passwordQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "password"
        ]
        
        SecItemDelete(emailQuery as CFDictionary)
        SecItemDelete(passwordQuery as CFDictionary)
    }
}

enum KeychainError: Error {
    case storeFailed
    case retrieveFailed
}
```

### Android Keystore Manager
```kotlin
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec

class KeystoreManager(private val context: Context) {
    private val keyAlias = "SmansCredentialsKey"
    private val keyStore = KeyStore.getInstance("AndroidKeyStore")
    private val prefs = context.getSharedPreferences("encrypted_prefs", Context.MODE_PRIVATE)
    
    init {
        keyStore.load(null)
        generateKey()
    }
    
    private fun generateKey() {
        if (!keyStore.containsAlias(keyAlias)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(false)
                .build()
            
            keyGenerator.init(keyGenParameterSpec)
            keyGenerator.generateKey()
        }
    }
    
    fun storeCredentials(email: String, password: String) {
        val secretKey = keyStore.getKey(keyAlias, null) as SecretKey
        val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        
        val emailEncrypted = cipher.doFinal(email.toByteArray())
        val emailIv = cipher.iv
        
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        val passwordEncrypted = cipher.doFinal(password.toByteArray())
        val passwordIv = cipher.iv
        
        prefs.edit()
            .putString("email_encrypted", Base64.encodeToString(emailEncrypted, Base64.DEFAULT))
            .putString("email_iv", Base64.encodeToString(emailIv, Base64.DEFAULT))
            .putString("password_encrypted", Base64.encodeToString(passwordEncrypted, Base64.DEFAULT))
            .putString("password_iv", Base64.encodeToString(passwordIv, Base64.DEFAULT))
            .apply()
    }
    
    fun retrieveCredentials(): Pair<String, String> {
        val emailEncrypted = Base64.decode(prefs.getString("email_encrypted", ""), Base64.DEFAULT)
        val emailIv = Base64.decode(prefs.getString("email_iv", ""), Base64.DEFAULT)
        val passwordEncrypted = Base64.decode(prefs.getString("password_encrypted", ""), Base64.DEFAULT)
        val passwordIv = Base64.decode(prefs.getString("password_iv", ""), Base64.DEFAULT)
        
        val secretKey = keyStore.getKey(keyAlias, null) as SecretKey
        val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
        
        cipher.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(emailIv))
        val emailDecrypted = String(cipher.doFinal(emailEncrypted))
        
        cipher.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(passwordIv))
        val passwordDecrypted = String(cipher.doFinal(passwordEncrypted))
        
        return Pair(emailDecrypted, passwordDecrypted)
    }
    
    fun deleteCredentials() {
        prefs.edit()
            .remove("email_encrypted")
            .remove("email_iv")
            .remove("password_encrypted")
            .remove("password_iv")
            .apply()
    }
}
```

## Login UI Implementations

### iOS Login Screen
```swift
struct LoginView: View {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var biometricManager = BiometricManager.shared
    
    @State private var email = ""
    @State private var password = ""
    @State private var showingBiometricSetup = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Logo
                Image("SmansLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 120)
                
                // Title
                Text("Welkom terug")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                // Email field
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                // Password field
                SecureField("Wachtwoord", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                // Login button
                Button("Inloggen") {
                    Task {
                        await authManager.signIn(email: email, password: password)
                        
                        if authManager.isAuthenticated && biometricManager.canUseBiometrics && !biometricManager.isBiometricEnabled {
                            showingBiometricSetup = true
                        }
                    }
                }
                .disabled(email.isEmpty || password.isEmpty || authManager.isLoading)
                .buttonStyle(PrimaryButtonStyle())
                
                // Biometric login button
                if biometricManager.isBiometricEnabled {
                    Button(action: {
                        Task {
                            do {
                                let credentials = try await biometricManager.authenticateWithBiometrics()
                                await authManager.signIn(email: credentials.email, password: credentials.password)
                            } catch {
                                // Handle error
                            }
                        }
                    }) {
                        HStack {
                            Image(systemName: biometricIcon)
                            Text("Inloggen met \(biometricText)")
                        }
                    }
                    .buttonStyle(SecondaryButtonStyle())
                }
                
                // Error message
                if let error = authManager.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Spacer()
            }
            .padding()
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingBiometricSetup) {
            BiometricSetupView(email: email, password: password)
        }
    }
    
    private var biometricIcon: String {
        switch biometricManager.biometricType {
        case .faceID: return "faceid"
        case .touchID: return "touchid"
        default: return "lock.shield"
        }
    }
    
    private var biometricText: String {
        switch biometricManager.biometricType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return "Biometrie"
        }
    }
}
```

### Android Login Screen
```kotlin
@Composable
fun LoginScreen(
    authManager: AuthenticationManager,
    biometricManager: BiometricManager,
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showBiometricSetup by remember { mutableStateOf(false) }
    
    val isAuthenticated by authManager.isAuthenticated.collectAsState()
    val isLoading by authManager.isLoading.collectAsState()
    val errorMessage by authManager.errorMessage.collectAsState()
    
    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            if (biometricManager.isBiometricAvailable() && !biometricManager.isBiometricEnabled()) {
                showBiometricSetup = true
            } else {
                onLoginSuccess()
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo
        Image(
            painter = painterResource(id = R.drawable.smans_logo),
            contentDescription = "Smans Logo",
            modifier = Modifier
                .size(120.dp)
                .padding(bottom = 32.dp)
        )
        
        // Title
        Text(
            text = "Welkom terug",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 32.dp)
        )
        
        // Email field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        )
        
        // Password field
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Wachtwoord") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        )
        
        // Login button
        Button(
            onClick = {
                CoroutineScope(Dispatchers.Main).launch {
                    authManager.signIn(email, password)
                }
            },
            enabled = email.isNotBlank() && password.isNotBlank() && !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("Inloggen")
            }
        }
        
        // Biometric login button
        if (biometricManager.isBiometricEnabled()) {
            OutlinedButton(
                onClick = {
                    biometricManager.authenticateWithBiometrics(
                        onSuccess = { email, password ->
                            CoroutineScope(Dispatchers.Main).launch {
                                authManager.signIn(email, password)
                            }
                        },
                        onError = { error ->
                            // Handle error
                        }
                    )
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.Fingerprint,
                    contentDescription = null,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Text("Inloggen met biometrie")
            }
        }
        
        // Error message
        errorMessage?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
    
    if (showBiometricSetup) {
        BiometricSetupDialog(
            onConfirm = {
                CoroutineScope(Dispatchers.Main).launch {
                    biometricManager.enableBiometricAuth(email, password)
                    showBiometricSetup = false
                    onLoginSuccess()
                }
            },
            onDismiss = {
                showBiometricSetup = false
                onLoginSuccess()
            }
        )
    }
}
```

## Session Management

### Automatic Session Refresh
```swift
// iOS Session Manager
class SessionManager: ObservableObject {
    private let supabase: SupabaseClient
    private var refreshTimer: Timer?
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
        startSessionRefreshTimer()
    }
    
    private func startSessionRefreshTimer() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 3300, repeats: true) { _ in
            Task {
                await self.refreshSessionIfNeeded()
            }
        }
    }
    
    private func refreshSessionIfNeeded() async {
        do {
            try await supabase.auth.refreshSession()
        } catch {
            print("Failed to refresh session: \(error)")
            // Handle session refresh failure
        }
    }
    
    deinit {
        refreshTimer?.invalidate()
    }
}
```

This authentication flow provides:
- Secure credential storage
- Biometric authentication support
- Automatic session management
- Platform-specific UI implementations
- Error handling and recovery
- Session persistence across app launches