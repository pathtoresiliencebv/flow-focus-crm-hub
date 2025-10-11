# 🏠 Flow Focus CRM Hub

A comprehensive CRM system built specifically for window installation companies (kozijnenbedrijven), featuring multi-language support, mobile apps, project completion workflows, and automated customer communication.

## ✨ Features

### 🌍 Multi-Language Support
- **Automatic Translation**: Real-time chat translation using Google Translate API
- **Language Detection**: Smart detection of message languages
- **UI Localization**: Support for Dutch, English, and Polish interfaces
- **User Preferences**: Per-user language settings and translation preferences

### 📱 Mobile-First Design
- **iOS & Android Apps**: Native-feeling mobile applications built with Capacitor
- **Offline Support**: Full offline functionality with background synchronization
- **Push Notifications**: Real-time notifications for project updates and messages
- **Biometric Authentication**: Face ID, Touch ID, and fingerprint login support

### 🔧 Project Management
- **Complete Workflow**: From planning to project completion
- **Photo Documentation**: Camera integration for progress photos
- **Digital Signatures**: Customer and installer signature capture
- **PDF Generation**: Automated work completion reports
- **Email Integration**: Professional customer communication

### 💬 Advanced Chat System
- **Real-time Messaging**: Instant communication between team members
- **Role-based Access**: Admins chat with all, installers chat with admins only
- **Translation Features**: Automatic message translation
- **File Sharing**: Photo and document sharing capabilities

### 🔐 Enterprise Security
- **Row-Level Security**: Supabase RLS for data protection
- **Role-based Permissions**: Administrator, Administrative, and Installer roles
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: End-to-end encryption for sensitive data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Cloud account (for translation services)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/flow-focus-crm-hub.git
cd flow-focus-crm-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Edit .env.development with your Supabase credentials

# Start development server
npm run dev
```

### Mobile Development
```bash
# Android
npm run mobile:sync:android
npm run mobile:open:android

# iOS (macOS only)
npm run mobile:sync:ios  
npm run mobile:open:ios
```

## 📊 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Capacitor** for mobile apps

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Edge Functions** for serverless logic
- **Real-time subscriptions** for live updates

### Integrations
- **Google Translate API** for translations
- **Resend** for email services
- **Firebase Cloud Messaging** for push notifications
- **Google Calendar** for scheduling integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web    │    │   iOS App       │    │   Android App   │
│   Application  │    │   (Capacitor)   │    │   (Capacitor)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Supabase      │
                    │   Backend       │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ PostgreSQL  │ │
                    │ │ Database    │ │
                    │ └─────────────┘ │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ Edge        │ │
                    │ │ Functions   │ │
                    │ └─────────────┘ │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ Storage     │ │
                    │ │ Buckets     │ │
                    │ └─────────────┘ │
                    └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Google    │ │   Resend    │ │ Firebase    │
    │ Translate   │ │   Email     │ │    FCM      │
    │     API     │ │  Service    │ │ Push Notif  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## 📁 Project Structure

```
flow-focus-crm-hub/
├── src/
│   ├── components/           # React components
│   │   ├── mobile/          # Mobile-specific components
│   │   │   ├── ios/         # iOS-style components
│   │   │   └── android/     # Android-style components
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Application pages
│   ├── styles/              # CSS and styling
│   ├── utils/               # Utility functions
│   └── integrations/        # Third-party integrations
├── supabase/
│   ├── functions/           # Edge Functions
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase configuration
├── ios/                     # iOS native configuration
├── android/                 # Android native configuration
├── docs/                    # Documentation
│   ├── PRD_SMANS_CRM.md     # Product requirements
│   ├── PRD_SMANS_CRM_PART2.md # Extended requirements
│   └── workflow/            # Workflow documentation
└── capacitor.config.ts      # Capacitor configuration
```

## 🎯 User Roles

### Administrator
- Full system access
- User management
- System configuration
- All reports and analytics
- Global chat access

### Administrative (Administratie)
- Project management
- Customer communication
- Invoice and quote creation
- Chat with all users
- Reporting access

### Installer (Monteur)
- Mobile app access
- Assigned project view
- Project completion workflow
- Photo documentation
- Chat with administrators only

## 🔄 Key Workflows

### Project Completion Workflow
1. **Project Details**: Complete work information and satisfaction rating
2. **Photo Documentation**: Upload before/during/after photos with categorization
3. **Digital Signatures**: Capture customer and installer signatures
4. **PDF Generation**: Automated professional work completion report
5. **Email Delivery**: Automatic email to customer with PDF attachment

### Multi-Language Chat
1. **Message Detection**: Automatic language detection for incoming messages
2. **Translation**: Real-time translation to user's preferred language
3. **Display**: Show both original and translated text
4. **Caching**: Smart caching for improved performance

### Mobile Synchronization
1. **Offline Queue**: Actions queued when offline
2. **Background Sync**: Automatic synchronization when online
3. **Conflict Resolution**: Smart conflict resolution for data integrity
4. **Real-time Updates**: Live updates across all devices

## 🛠️ Development Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build:dev             # Development build
npm run build:staging         # Staging build  
npm run build:production      # Production build

# Translation Management
npm run translate:extract      # Extract hardcoded texts
npm run translate:deepl        # Translate using DeepL
npm run translate:seed         # Seed translations to database
npm run translate:all          # Run full translation pipeline

# Mobile Development
npm run mobile:sync            # Sync web assets to mobile
npm run mobile:sync:android    # Sync to Android only
npm run mobile:sync:ios        # Sync to iOS only
npm run mobile:build           # Build mobile apps
npm run mobile:run:ios         # Run on iOS simulator
npm run mobile:run:android     # Run on Android emulator

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues
npm run type-check             # TypeScript type checking
npm run test                   # Run tests
npm run test:ci                # Run tests with coverage

# Database
supabase db push               # Push migrations
supabase db reset              # Reset database (dev only)
supabase functions deploy      # Deploy Edge Functions
```

## 📚 Documentation

### Project Documentation
- **[PRD Part 1](docs/PRD_SMANS_CRM.md)**: Core product requirements and specifications
- **[PRD Part 2](docs/PRD_SMANS_CRM_PART2.md)**: Extended features and requirements
- **[Workflow Documentation](workflow/)**: Detailed workflow guides and diagrams

### Implementation Guides
- **[Translation System](TRANSLATION_SYSTEM_GUIDE.md)**: Multi-language implementation guide
- **[Mobile Development](MOBIELE_APP_SPECIFICATIES.md)**: Mobile app specifications
- **[Notification System](NOTIFICATION_SYSTEM_DEPLOYMENT.md)**: Push notification setup
- **[SMTP Setup](SMANS_SMTP_DEPLOYMENT_GUIDE.md)**: Email service configuration
- **[iOS Publishing](IOS_APP_STORE_PUBLISHING_PLAN.md)**: App Store deployment guide

### Feature Guides
- **[Werkbon System](WERKBON_QUICK_START.md)**: Work order completion quick start
- **[Planning System](PLANNING_WORKFLOW_GUIDE.md)**: Project planning and scheduling
- **[Monteur Availability](MONTEUR_BESCHIKBAARHEID_GUIDE.md)**: Installer availability management
- **[User Roles](GEBRUIKERSROLLEN_TOEGANGSRECHTEN.md)**: Roles and permissions guide

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:ci

# Type checking
npm run type-check

# Lint checking
npm run lint
```

## 🚢 Deployment

### Web Application
```bash
# Build for production
npm run build:production

# Preview build
npm run preview
```

### Mobile Applications
```bash
# Build both platforms
npm run mobile:build

# Build specific platform
npm run mobile:build:android
npm run mobile:build:ios

# Release build
npm run mobile:build:release
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for commit messages
- Component-driven development

### Development Guidelines
- Maximum 1600 lines per file
- Comprehensive comments and docstrings
- Modular, testable, and clean code
- Follow existing patterns and structure

## 🔧 Environment Variables

Create a `.env.development` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_RESEND_API_KEY=your_resend_api_key
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Comprehensive guides in the repository
- **Issues**: Report bugs and request features via GitHub Issues
- **Email**: Contact the development team

## 🎉 Acknowledgments

- **Supabase** for the amazing backend-as-a-service platform
- **Capacitor** for seamless mobile app development
- **Google Translate** for translation services
- **Shadcn/ui** for beautiful UI components
- **Tailwind CSS** for utility-first styling
- **React** and **TypeScript** for the powerful development experience

---

**Built with ❤️ for the window installation industry**

*Last updated: October 2025*
