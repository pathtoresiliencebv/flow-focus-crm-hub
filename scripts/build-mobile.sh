#!/bin/bash

# Mobile Build Script for Smans CRM
# Usage: ./scripts/build-mobile.sh [android|ios|both] [debug|release] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM=${1:-both}
BUILD_TYPE=${2:-debug}
ENVIRONMENT=${3:-development}
VERSION_CODE=${VERSION_CODE:-$(date +%s)}
VERSION_NAME=${VERSION_NAME:-"1.0.0"}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE} Smans CRM Mobile Build Script${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo -e "Platform: ${GREEN}$PLATFORM${NC}"
    echo -e "Build Type: ${GREEN}$BUILD_TYPE${NC}"
    echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
    echo -e "Version: ${GREEN}$VERSION_NAME ($VERSION_CODE)${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_step() {
    echo -e "\n${YELLOW}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    print_step "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Capacitor CLI
    if ! command -v cap &> /dev/null; then
        print_error "Capacitor CLI is not installed. Run: npm install -g @capacitor/cli"
        exit 1
    fi
    
    # Platform-specific checks
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        if ! command -v java &> /dev/null; then
            print_error "Java is not installed"
            exit 1
        fi
        
        if [[ -z "$ANDROID_HOME" ]]; then
            print_error "ANDROID_HOME environment variable is not set"
            exit 1
        fi
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if [[ "$OSTYPE" != "darwin"* ]]; then
            print_error "iOS builds require macOS"
            exit 1
        fi
        
        if ! command -v xcodebuild &> /dev/null; then
            print_error "Xcode is not installed"
            exit 1
        fi
    fi
    
    print_success "All dependencies are available"
}

install_dependencies() {
    print_step "Installing dependencies..."
    
    if [[ ! -d "node_modules" ]]; then
        npm ci
    else
        npm ci --only=production
    fi
    
    print_success "Dependencies installed"
}

build_web() {
    print_step "Building web application..."
    
    # Set environment variables based on build environment
    export VITE_BUILD_ENVIRONMENT=$ENVIRONMENT
    export VITE_VERSION_NAME=$VERSION_NAME
    export VITE_VERSION_CODE=$VERSION_CODE
    
    case $ENVIRONMENT in
        "production")
            export VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-""}
            export VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-""}
            ;;
        "staging")
            export VITE_SUPABASE_URL=${VITE_SUPABASE_URL_STAGING:-$VITE_SUPABASE_URL}
            export VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY_STAGING:-$VITE_SUPABASE_ANON_KEY}
            ;;
        "development")
            export VITE_SUPABASE_URL=${VITE_SUPABASE_URL_DEV:-$VITE_SUPABASE_URL}
            export VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY_DEV:-$VITE_SUPABASE_ANON_KEY}
            ;;
    esac
    
    # Build the web app
    npm run build
    
    print_success "Web application built"
}

sync_capacitor() {
    print_step "Syncing Capacitor..."
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        npx cap sync android
        print_success "Android sync completed"
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        npx cap sync ios
        
        # Install iOS dependencies
        if [[ -d "ios/App" ]]; then
            cd ios/App
            if [[ -f "Podfile" ]]; then
                pod install
            fi
            cd ../..
        fi
        
        print_success "iOS sync completed"
    fi
}

build_android() {
    print_step "Building Android application..."
    
    cd android
    
    case $BUILD_TYPE in
        "debug")
            ./gradlew assembleDebug
            APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
            ;;
        "release")
            if [[ -z "$ANDROID_KEYSTORE_FILE" || -z "$ANDROID_KEYSTORE_PASSWORD" ]]; then
                print_error "Release build requires signing configuration"
                exit 1
            fi
            
            ./gradlew assembleRelease \
                -Pandroid.injected.signing.store.file="$ANDROID_KEYSTORE_FILE" \
                -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
                -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
                -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD" \
                -PVERSION_CODE="$VERSION_CODE" \
                -PVERSION_NAME="$VERSION_NAME"
            
            APK_PATH="app/build/outputs/apk/release/app-release.apk"
            ;;
    esac
    
    cd ..
    
    if [[ -f "android/$APK_PATH" ]]; then
        print_success "Android APK built: android/$APK_PATH"
        
        # Copy to releases directory
        mkdir -p releases/android/
        cp "android/$APK_PATH" "releases/android/smans-crm-$VERSION_NAME-$BUILD_TYPE.apk"
        
        print_success "APK copied to releases/android/"
    else
        print_error "Android build failed"
        exit 1
    fi
}

build_ios() {
    print_step "Building iOS application..."
    
    cd ios/App
    
    case $BUILD_TYPE in
        "debug")
            xcodebuild -workspace App.xcworkspace \
                -scheme App \
                -configuration Debug \
                -destination generic/platform=iOS \
                -archivePath App.xcarchive \
                archive
            ;;
        "release")
            if [[ -z "$IOS_CODE_SIGN_IDENTITY" || -z "$IOS_PROVISIONING_PROFILE" ]]; then
                print_error "Release build requires code signing configuration"
                exit 1
            fi
            
            xcodebuild -workspace App.xcworkspace \
                -scheme App \
                -configuration Release \
                -destination generic/platform=iOS \
                -archivePath App.xcarchive \
                archive \
                CODE_SIGN_IDENTITY="$IOS_CODE_SIGN_IDENTITY" \
                PROVISIONING_PROFILE="$IOS_PROVISIONING_PROFILE"
            
            # Export IPA
            xcodebuild -exportArchive \
                -archivePath App.xcarchive \
                -exportPath export \
                -exportOptionsPlist ExportOptions.plist
            ;;
    esac
    
    cd ../..
    
    if [[ -d "ios/App/App.xcarchive" ]]; then
        print_success "iOS archive created"
        
        if [[ "$BUILD_TYPE" == "release" && -d "ios/App/export" ]]; then
            # Copy IPA to releases directory
            mkdir -p releases/ios/
            cp ios/App/export/*.ipa "releases/ios/smans-crm-$VERSION_NAME-$BUILD_TYPE.ipa"
            
            print_success "IPA copied to releases/ios/"
        fi
    else
        print_error "iOS build failed"
        exit 1
    fi
}

run_tests() {
    print_step "Running tests..."
    
    # Run linting
    npm run lint
    
    # Run type checking
    npm run type-check
    
    # Run unit tests
    if command -v npm run test:ci &> /dev/null; then
        npm run test:ci
    fi
    
    print_success "Tests completed"
}

generate_build_info() {
    print_step "Generating build information..."
    
    mkdir -p releases/
    
    cat > releases/build-info.json << EOF
{
  "version": "$VERSION_NAME",
  "buildNumber": "$VERSION_CODE",
  "environment": "$ENVIRONMENT",
  "buildType": "$BUILD_TYPE",
  "platform": "$PLATFORM",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    print_success "Build information generated"
}

cleanup() {
    print_step "Cleaning up..."
    
    # Clean up temporary files
    if [[ -d "android/app/build/intermediates" ]]; then
        rm -rf android/app/build/intermediates
    fi
    
    if [[ -d "ios/App/build" ]]; then
        rm -rf ios/App/build
    fi
    
    print_success "Cleanup completed"
}

main() {
    print_header
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    check_dependencies
    install_dependencies
    run_tests
    build_web
    sync_capacitor
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        build_android
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        build_ios
    fi
    
    generate_build_info
    cleanup
    
    print_success "Build completed successfully!"
    echo -e "\n${GREEN}📱 Mobile app build finished${NC}"
    echo -e "Check the ${BLUE}releases/${NC} directory for output files"
}

# Handle interruption
trap 'print_error "Build interrupted"; exit 1' INT TERM

# Run main function
main "$@"