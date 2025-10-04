# UI/UX Guidelines & Design System

## Platform-Specific Design Guidelines

### iOS Design Principles (Human Interface Guidelines)

#### Navigation Structure
```swift
// Primary Navigation - Tab Bar
struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }
            
            ProjectsView()
                .tabItem {
                    Image(systemName: "folder.fill")
                    Text("Projecten")
                }
            
            TimeView()
                .tabItem {
                    Image(systemName: "clock.fill")
                    Text("Tijd")
                }
            
            ChatView()
                .tabItem {
                    Image(systemName: "message.fill")
                    Text("Chat")
                }
        }
        .accentColor(.blue)
    }
}

// Secondary Navigation - Navigation Stack
struct ProjectDetailView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                // Content
            }
            .navigationTitle("Project Details")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Opslaan") {
                        // Save action
                    }
                }
            }
        }
    }
}
```

#### iOS Visual Design
```swift
// Color System
extension Color {
    static let smansBlue = Color(red: 0.0, green: 0.4, blue: 0.8)
    static let smansGreen = Color(red: 0.2, green: 0.7, blue: 0.3)
    static let smansGray = Color(red: 0.6, green: 0.6, blue: 0.6)
    
    // Semantic Colors
    static let primaryAction = Color.blue
    static let destructiveAction = Color.red
    static let warningAction = Color.orange
    static let successAction = Color.green
}

// Typography
extension Font {
    static let largeTitle = Font.largeTitle.weight(.bold)
    static let title1 = Font.title.weight(.semibold)
    static let title2 = Font.title2.weight(.medium)
    static let headline = Font.headline.weight(.semibold)
    static let body = Font.body
    static let caption = Font.caption
}

// Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.smansBlue)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
```

#### iOS Component Library
```swift
// Project Card Component
struct ProjectCardView: View {
    let project: Project
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text(project.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                StatusBadge(status: project.status)
            }
            
            // Customer Info
            HStack {
                Image(systemName: "person.circle")
                    .foregroundColor(.secondary)
                Text(project.customerName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Location
            if let location = project.location {
                HStack {
                    Image(systemName: "location")
                        .foregroundColor(.secondary)
                    Text(location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            // Progress
            if project.status == "in-uitvoering" {
                ProgressView(value: project.progressPercentage, total: 100)
                    .progressViewStyle(LinearProgressViewStyle())
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

// Status Badge Component
struct StatusBadge: View {
    let status: String
    
    var body: some View {
        Text(statusText)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .cornerRadius(6)
    }
    
    private var statusText: String {
        switch status {
        case "te-plannen": return "Te plannen"
        case "in-uitvoering": return "Bezig"
        case "afgerond": return "Afgerond"
        default: return status
        }
    }
    
    private var backgroundColor: Color {
        switch status {
        case "te-plannen": return .orange.opacity(0.2)
        case "in-uitvoering": return .blue.opacity(0.2)
        case "afgerond": return .green.opacity(0.2)
        default: return .gray.opacity(0.2)
        }
    }
    
    private var textColor: Color {
        switch status {
        case "te-plannen": return .orange
        case "in-uitvoering": return .blue
        case "afgerond": return .green
        default: return .gray
        }
    }
}
```

### Android Design Principles (Material Design 3)

#### Navigation Structure
```kotlin
// Primary Navigation - Bottom Navigation
@Composable
fun MainNavigationScreen() {
    val navController = rememberNavController()
    val currentDestination by navController.currentBackStackEntryAsState()
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Home, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") },
                    selected = currentDestination?.destination?.route == "dashboard",
                    onClick = { navController.navigate("dashboard") }
                )
                
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Work, contentDescription = "Projecten") },
                    label = { Text("Projecten") },
                    selected = currentDestination?.destination?.route == "projects",
                    onClick = { navController.navigate("projects") }
                )
                
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Schedule, contentDescription = "Tijd") },
                    label = { Text("Tijd") },
                    selected = currentDestination?.destination?.route == "time",
                    onClick = { navController.navigate("time") }
                )
                
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Chat, contentDescription = "Chat") },
                    label = { Text("Chat") },
                    selected = currentDestination?.destination?.route == "chat",
                    onClick = { navController.navigate("chat") }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "dashboard",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("dashboard") { DashboardScreen() }
            composable("projects") { ProjectsScreen() }
            composable("time") { TimeScreen() }
            composable("chat") { ChatScreen() }
        }
    }
}
```

#### Android Visual Design
```kotlin
// Material 3 Color Scheme
@Composable
fun SmansColorScheme() = lightColorScheme(
    primary = Color(0xFF1976D2),      // Smans Blue
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE3F2FD),
    onPrimaryContainer = Color(0xFF0D47A1),
    
    secondary = Color(0xFF4CAF50),    // Smans Green  
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE8F5E8),
    onSecondaryContainer = Color(0xFF1B5E20),
    
    tertiary = Color(0xFFFF9800),     // Warning Orange
    onTertiary = Color.White,
    
    error = Color(0xFFD32F2F),
    onError = Color.White,
    
    surface = Color(0xFFFAFAFA),
    onSurface = Color(0xFF212121),
    
    background = Color.White,
    onBackground = Color(0xFF212121)
)

// Typography System
val SmansTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp
    )
)
```

#### Android Component Library
```kotlin
// Project Card Component
@Composable
fun ProjectCard(
    project: Project,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = project.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                StatusChip(status = project.status)
            }
            
            // Customer Info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = project.customerName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Location
            project.location?.let { location ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = location,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Progress
            if (project.status == "in-uitvoering") {
                LinearProgressIndicator(
                    progress = project.progressPercentage / 100f,
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// Status Chip Component
@Composable
fun StatusChip(status: String) {
    val (text, containerColor, contentColor) = when (status) {
        "te-plannen" -> Triple("Te plannen", 
            MaterialTheme.colorScheme.tertiaryContainer,
            MaterialTheme.colorScheme.onTertiaryContainer)
        "in-uitvoering" -> Triple("Bezig",
            MaterialTheme.colorScheme.primaryContainer,
            MaterialTheme.colorScheme.onPrimaryContainer)
        "afgerond" -> Triple("Afgerond",
            MaterialTheme.colorScheme.secondaryContainer,
            MaterialTheme.colorScheme.onSecondaryContainer)
        else -> Triple(status,
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurfaceVariant)
    }
    
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = containerColor
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = contentColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
```

## Shared Design Principles

### Accessibility Guidelines

#### Font Scaling Support
```swift
// iOS Dynamic Type Support
struct AccessibleText: View {
    let text: String
    let style: Font.TextStyle
    
    var body: some View {
        Text(text)
            .font(.system(style))
            .minimumScaleFactor(0.7)
            .lineLimit(nil)
    }
}
```

```kotlin
// Android Text Size Support
@Composable
fun AccessibleText(
    text: String,
    style: TextStyle,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        style = style.copy(
            fontSize = style.fontSize * LocalDensity.current.fontScale
        ),
        modifier = modifier
    )
}
```

#### High Contrast Support
```swift
// iOS High Contrast Colors
extension Color {
    static var adaptiveBackground: Color {
        if UIAccessibility.isDarkerSystemColorsEnabled {
            return .black
        }
        return Color(.systemBackground)
    }
    
    static var adaptiveText: Color {
        if UIAccessibility.isDarkerSystemColorsEnabled {
            return .white
        }
        return Color(.label)
    }
}
```

### Touch Target Guidelines

#### Minimum Touch Targets
```swift
// iOS - Minimum 44pt touch targets
struct TouchableButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .frame(minWidth: 44, minHeight: 44)
        }
    }
}
```

```kotlin
// Android - Minimum 48dp touch targets
@Composable
fun TouchableButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
    ) {
        Text(text)
    }
}
```

### Loading States & Error Handling

#### Loading Indicators
```swift
// iOS Loading States
struct LoadingView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}
```

```kotlin
// Android Loading States
@Composable
fun LoadingView(
    message: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
                color = MaterialTheme.colorScheme.primary
            )
            
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

#### Error States
```swift
// iOS Error View
struct ErrorView: View {
    let title: String
    let message: String
    let retryAction: (() -> Void)?
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text(title)
                .font(.headline)
                .multilineTextAlignment(.center)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if let retryAction = retryAction {
                Button("Opnieuw proberen", action: retryAction)
                    .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding(32)
    }
}
```

### Forms & Input Guidelines

#### Form Validation
```swift
// iOS Form Validation
struct ValidatedTextField: View {
    @Binding var text: String
    let placeholder: String
    let validator: (String) -> String?
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            TextField(placeholder, text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .onChange(of: text) { _ in
                    errorMessage = validator(text)
                }
            
            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}
```

### Dark Mode Support

#### Adaptive Colors
```swift
// iOS Dark Mode Colors
extension Color {
    static let primaryBackground = Color("PrimaryBackground")
    static let secondaryBackground = Color("SecondaryBackground")
    static let primaryText = Color("PrimaryText")
    static let secondaryText = Color("SecondaryText")
}

// In Assets.xcassets:
// PrimaryBackground: Light=#FFFFFF, Dark=#000000
// SecondaryBackground: Light=#F2F2F7, Dark=#1C1C1E
// PrimaryText: Light=#000000, Dark=#FFFFFF
// SecondaryText: Light=#6D6D80, Dark=#8E8E93
```

```kotlin
// Android Dark Mode Theme
@Composable
fun SmansTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = Color(0xFF90CAF9),
            onPrimary = Color(0xFF003258),
            primaryContainer = Color(0xFF004881),
            onPrimaryContainer = Color(0xFFD1E4FF)
        )
    } else {
        lightColorScheme(
            primary = Color(0xFF1976D2),
            onPrimary = Color.White,
            primaryContainer = Color(0xFFE3F2FD),
            onPrimaryContainer = Color(0xFF0D47A1)
        )
    }
    
    MaterialTheme(
        colorScheme = colorScheme,
        typography = SmansTypography,
        content = content
    )
}
```

### Animation Guidelines

#### Micro-interactions
```swift
// iOS Button Press Animation
struct AnimatedButton: View {
    let title: String
    let action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
        }
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = pressing
            }
        }) {
            // Action
        }
    }
}
```

```kotlin
// Android Ripple Effect
@Composable
fun RippleButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary
        ),
        content = {
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge
            )
        }
    )
}
```