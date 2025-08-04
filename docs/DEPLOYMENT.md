# Flow Focus CRM Hub - Deployment Guide

This comprehensive guide covers deploying the Flow Focus CRM Hub application across web, Android, and iOS platforms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Web Deployment](#web-deployment)
4. [Android Deployment](#android-deployment)
5. [iOS Deployment](#ios-deployment)
6. [Database Migrations](#database-migrations)
7. [Edge Functions Deployment](#edge-functions-deployment)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Troubleshooting](#troubleshooting)

## 🚀 Prerequisites

### Required Software
- **Node.js** 18+ and npm
- **Git** for version control
- **Supabase CLI** (`npm install -g @supabase/cli`)
- **Capacitor CLI** (`npm install -g @capacitor/cli`)

### For Android Development
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 11 or 17
- **Gradle** (comes with Android Studio)

### For iOS Development (macOS only)
- **Xcode** 14+ 
- **iOS SDK** 16+
- **CocoaPods** (`sudo gem install cocoapods`)
- **Apple Developer Account** (for App Store distribution)

### Accounts Required
- **Supabase** account for backend services
- **Google Cloud** account (for translation services)
- **Resend** account (for email services) - optional
- **Apple Developer** account (for iOS deployment)
- **Google Play Console** account (for Android deployment)

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/flow-focus-crm-hub.git
cd flow-focus-crm-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create environment files for different stages:

**.env.development**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_TRANSLATE_API_KEY=your-google-api-key
VITE_APP_ENVIRONMENT=development
```

**.env.staging**
```env
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_GOOGLE_TRANSLATE_API_KEY=your-google-api-key
VITE_APP_ENVIRONMENT=staging
```

**.env.production**
```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GOOGLE_TRANSLATE_API_KEY=your-google-api-key
VITE_APP_ENVIRONMENT=production
```

### 4. Supabase Configuration
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push database schema
supabase db push
```

## 🌐 Web Deployment

### Development Build
```bash
npm run build:dev
npm run preview
```

### Production Build
```bash
npm run build:production
```

### Deploy to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Configure environment variables in Vercel dashboard

### Deploy to Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build:production`
3. Set publish directory: `dist`
4. Configure environment variables

### Deploy to AWS S3 + CloudFront
```bash
# Install AWS CLI
aws configure

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 📱 Android Deployment

### 1. Initial Setup
```bash
# Add Android platform
npx cap add android

# Sync web assets
npm run mobile:sync:android
```

### 2. Configure Android Studio
```bash
# Open in Android Studio
npm run mobile:open:android
```

In Android Studio:
1. Update `android/app/build.gradle`:
   ```gradle
   android {
       compileSdk 34
       defaultConfig {
           applicationId "com.flowfocus.crmhub"
           minSdk 24
           targetSdk 34
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. Update `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   ```

### 3. Build APK
```bash
# Debug build
npm run mobile:build:android debug

# Release build
npm run mobile:build:android release
```

### 4. Generate Signed APK
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add to `android/gradle.properties`:
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=your-store-password
   MYAPP_RELEASE_KEY_PASSWORD=your-key-password
   ```

3. Update `android/app/build.gradle`:
   ```gradle
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
   ```

### 5. Deploy to Google Play Store
1. Create app in Google Play Console
2. Upload signed APK/AAB
3. Fill out store listing details
4. Set up internal testing
5. Submit for review

## 🍎 iOS Deployment

### 1. Initial Setup
```bash
# Add iOS platform (macOS only)
npx cap add ios

# Sync web assets
npm run mobile:sync:ios

# Open in Xcode
npm run mobile:open:ios
```

### 2. Configure Xcode Project
1. **Bundle Identifier**: Set to `com.flowfocus.crmhub`
2. **Display Name**: Set to "Smans CRM"
3. **Version**: Set to "1.0.0"
4. **Build Number**: Set to "1"

### 3. App Icons and Splash Screens
Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- Required sizes: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024
- Use tools like [AppIcon.co](https://appicon.co/) for generation

### 4. Signing & Certificates
1. **Apple Developer Account**: Ensure you have access
2. **Certificates**: Create iOS Distribution certificate
3. **Provisioning Profiles**: Create App Store profile
4. **Automatic Signing**: Enable in Xcode project settings

### 5. Build & Archive
```bash
# Debug build for simulator
npm run mobile:build:ios debug

# Release build for device
npm run mobile:build:ios release
```

In Xcode:
1. Select "Any iOS Device" or connected device
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload to App Store Connect

### 6. App Store Submission
1. **App Store Connect**: Create new app
2. **Metadata**: Fill out app information
3. **Screenshots**: Prepare for all required device sizes
4. **App Review Information**: Provide test account details
5. **Submit for Review**: Wait for Apple approval (1-7 days)

## 🗄️ Database Migrations

### Development
```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Production
```bash
# Apply migrations to production
supabase db push --project-ref your-production-project-id

# Verify migration status
supabase migration list --project-ref your-production-project-id
```

### Migration Best Practices
1. **Always backup** production database before migrations
2. **Test migrations** in staging environment first
3. **Use transactions** for complex migrations
4. **Avoid breaking changes** in production
5. **Document** all schema changes

## ⚡ Edge Functions Deployment

### Development
```bash
# Serve functions locally
supabase functions serve

# Deploy specific function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy
```

### Production
```bash
# Deploy to production
supabase functions deploy --project-ref your-production-project-id

# Set environment variables
supabase secrets set GOOGLE_TRANSLATE_API_KEY=your-key --project-ref your-production-project-id
supabase secrets set RESEND_API_KEY=your-key --project-ref your-production-project-id
```

### Edge Function Configuration
Ensure all functions have proper CORS headers and error handling:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Always include in responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  status: 200,
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy CRM Hub

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:ci

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:production
      - uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: dist/

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      - run: npm ci
      - run: npm run mobile:build:android release
      - uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: android/app/build/outputs/apk/release/

  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run mobile:sync:ios
      - run: xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath App.xcarchive archive
```

### Deployment Automation
```bash
# Production deployment script
#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Build web app
npm run build:production

# Deploy to hosting
vercel --prod

# Deploy edge functions
supabase functions deploy --project-ref $SUPABASE_PRODUCTION_PROJECT_ID

# Run database migrations
supabase db push --project-ref $SUPABASE_PRODUCTION_PROJECT_ID

echo "✅ Deployment complete!"
```

## 🔧 Troubleshooting

### Common Web Issues

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

**Environment Variables Not Loading**
- Ensure `.env` files are in project root
- Restart development server after changes
- Check variable naming (must start with `VITE_`)

### Common Mobile Issues

**Capacitor Sync Issues**
```bash
# Reset Capacitor
npx cap clean
npx cap sync
```

**Android Build Errors**
```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..
npm run mobile:sync:android
```

**iOS Build Errors**
```bash
# Clean iOS build
rm -rf ios/App/build
npm run mobile:sync:ios
```

**Plugin Issues**
```bash
# Update Capacitor plugins
npm update @capacitor/core @capacitor/cli
npx cap sync
```

### Database Issues

**Migration Conflicts**
```bash
# Reset local database
supabase db reset

# Reapply migrations
supabase db push
```

**RLS Policy Errors**
- Check user authentication
- Verify policy conditions
- Test with service role key

### Performance Issues

**Large Bundle Size**
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

**Slow API Responses**
- Add database indexes
- Optimize RLS policies
- Use proper pagination
- Cache frequent queries

## 📊 Monitoring & Analytics

### Error Monitoring
Integrate with error tracking services:
- **Sentry**: For error tracking
- **LogRocket**: For session replay
- **Supabase Logs**: For backend monitoring

### Performance Monitoring
- **Web Vitals**: Core web vitals tracking
- **Lighthouse CI**: Automated performance testing
- **Supabase Analytics**: Database performance

### User Analytics
- **Google Analytics 4**: User behavior tracking
- **Supabase Analytics**: Feature usage
- **Custom Events**: Business metrics

## 🔐 Security Checklist

### Pre-Deployment Security
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] RLS policies tested
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Rate limiting configured
- [ ] Backup procedures tested

### Post-Deployment Security
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Database backups automated
- [ ] Access logs monitored
- [ ] Vulnerability scanning scheduled
- [ ] Incident response plan ready

## 📚 Additional Resources

### Documentation
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)

### Tools
- [App Icon Generator](https://appicon.co/)
- [Splash Screen Generator](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Bundle Analyzer](https://www.npmjs.com/package/vite-bundle-analyzer)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Support
- **GitHub Issues**: For bug reports and feature requests
- **Discord Community**: For real-time help
- **Documentation**: Comprehensive guides and examples

---

**Last Updated**: August 2024  
**Version**: 1.0.0  
**Maintained By**: Flow Focus Development Team