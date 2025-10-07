# 📱 iOS App Store - Quick Reference Guide
## SMANS CRM - Snelle Opzoekgids

---

## 🚀 QUICK START (5 Minuten Overzicht)

### 1. Pre-Flight Check
```bash
# Verificaties
✅ Bundle ID: com.smanscrm.ios (overal consistent)
✅ App Name: Smans CRM
✅ Version: 4.0.0
✅ Build: 11+ (increment bij nieuwe upload!)
✅ Certificates & Profiles: Geldig
✅ App Icons: Compleet (alle sizes)
```

### 2. Build & Archive
```bash
cd flow-focus-crm-hub
npm run build:production
npx cap sync ios
npx cap open ios

# In Xcode:
# Select: "Any iOS Device"
# Product > Archive
# Wacht 5-10 min
```

### 3. Upload naar App Store
```
Organizer > Distribute App > App Store Connect > Upload
Wacht op email: "Processing Completed" (10-30 min)
```

### 4. App Store Connect
```
https://appstoreconnect.apple.com
- Complete metadata
- Upload screenshots (min 3 per size)
- Add demo account
- Submit for Review
```

### 5. Testing met Mobile-MCP
```bash
chmod +x scripts/ios-mobile-test.sh
./scripts/ios-mobile-test.sh

# Review results in test-results/ios/
```

---

## 📋 CHEAT SHEET

### Belangrijke URLs
```
App Store Connect: https://appstoreconnect.apple.com
Developer Portal: https://developer.apple.com
Xcode Downloads: https://developer.apple.com/download/
TestFlight: https://testflight.apple.com
```

### Belangrijke Files
```
capacitor.config.ts          → App ID configuratie
ios/App/App.xcodeproj/       → Xcode project
ios/App/App/Info.plist       → App permissions
ios/App/ExportOptions.plist  → Export settings
ios/App/Podfile              → Dependencies
```

### Commands
```bash
# Clean install
rm -rf node_modules ios/App/Pods
npm install
npx cap sync ios

# Open Xcode
npx cap open ios

# Update dependencies
cd ios/App && pod install && cd ../..

# List devices (mobile-mcp)
mobile_list_available_devices

# Run test suite
./scripts/ios-mobile-test.sh
```

---

## ⚠️ MOET JE WETEN

### Bundle ID Consistency
**KRITIEK:** Moet overal hetzelfde zijn!
- capacitor.config.ts: `com.smanscrm.ios`
- Xcode project: `com.smanscrm.ios`
- ExportOptions.plist: `com.smanscrm.ios`
- App Store Connect: `com.smanscrm.ios`

### Versie Nummering
```
Marketing Version: 4.0.0 (zichtbaar voor users)
Build Number: 11 (moet ALTIJD incrementen!)

Elke nieuwe upload = +1 build number!
```

### Certificates Expiry
```
Check: developer.apple.com > Certificates
Expires: Na 1 jaar
Actie: Renew 90 dagen voor expiry
```

### Review Timeline
```
Submitted → 1-2 dagen → In Review
In Review → 12-24 uur → Approved/Rejected
Approved → Immediate or Scheduled → Live
```

---

## 🛠️ TROUBLESHOOTING

### "Archive button grayed out"
```
✓ Select "Any iOS Device" (not simulator)
✓ Scheme: Release mode
✓ Product > Clean Build Folder
✓ Restart Xcode
```

### "Code signing failed"
```
✓ Check Keychain Access for certificates
✓ Download provisioning profiles
✓ Xcode > Preferences > Accounts > Download Profiles
✓ Set signing to Manual
```

### "No profiles found"
```
✓ developer.apple.com > Profiles
✓ Generate new profile
✓ Download & double-click to install
✓ Restart Xcode
```

### "Build stuck in Processing"
```
✓ Wait 24-48 hours
✓ Check email for "Invalid Binary" message
✓ Contact Apple Support if > 48h
```

### "App crashes on launch"
```
✓ Test on physical device first
✓ Check console logs in Xcode
✓ Verify all dependencies installed
✓ Check Info.plist for missing keys
```

---

## 📱 TEST CHECKLIST

### Must Test Before Submission

**Core Functions:**
- [ ] App launch < 3 seconds
- [ ] Login works
- [ ] All tabs navigate
- [ ] No crashes
- [ ] Pull-to-refresh works
- [ ] Scrolling smooth (60fps)

**Permissions:**
- [ ] Camera permission dialog
- [ ] Location permission dialog
- [ ] Photos permission dialog
- [ ] Notifications permission

**Network:**
- [ ] Works online
- [ ] Graceful offline mode
- [ ] Syncs when reconnected

**Device Sizes:**
- [ ] iPhone SE (smallest)
- [ ] iPhone 15 Pro Max (largest)
- [ ] iPad (if supporting)

---

## 📸 SCREENSHOT REQUIREMENTS

### Sizes Needed
```
iPhone 6.7" (15 Pro Max): 1290 x 2796 px
iPhone 6.5" (14 Plus):    1284 x 2778 px
iPhone 5.5" (8 Plus):     1242 x 2208 px (optional)
iPad Pro 12.9":           2048 x 2732 px (if iPad)
```

### Content Suggestions
```
1. Dashboard/Home (first impression)
2. Projects list (main feature)
3. Project detail (functionality)
4. Chat interface (communication)
5. Receipts upload (USP)
6. Calendar/Planning (productivity)
```

### Quick Capture
```bash
# Via mobile-mcp
mobile_save_screenshot --device="iPhone" \
  --saveTo="./screenshots/screenshot-1.png"

# Via Xcode Simulator
Cmd + S → Desktop
```

---

## 🎯 APP STORE CONNECT QUICK FILL

### Required Fields
```
Name: Smans CRM
Subtitle: Professional CRM & Project Management
Category: Business (Primary), Productivity (Secondary)
Price: Free (or set price)
Age Rating: 4+ (All Ages)

Privacy URL: https://smanscrm.nl/privacy
Support URL: https://smanscrm.nl/support
Marketing URL: https://smanscrm.nl

Keywords (100 chars):
crm,project,management,installateur,monteur,planning,chat,bonnetjes,agenda,business
```

### Demo Account (MUST PROVIDE!)
```
Username: demo@smanscrm.nl
Password: [Set secure demo password]

Notes for Reviewers:
"Business app for CRM & project management.
Use demo account to test all features.
Main flows: Projects, Chat, Planning, Receipts."
```

### Export Compliance
```
Q: Uses encryption?
A: NO (if only standard HTTPS)

If YES:
- Standard encryption: YES
- Qualifies for exemption: YES
```

---

## 🚨 REJECTION REASONS & FIXES

### Top 5 Rejection Reasons

**1. "Crashes on Launch"**
```
Fix:
- Test on clean device
- Provide working demo account
- Check console logs
- Test airplane mode scenario
```

**2. "Incomplete Functionality"**
```
Fix:
- Demo account must have data
- Pre-populate projects/chats
- All buttons must work
- No "Coming Soon" features
```

**3. "Missing Metadata"**
```
Fix:
- Screenshots match app exactly
- Description accurate
- Privacy policy complete
- Support URL working
```

**4. "Privacy Issues"**
```
Fix:
- Explain ALL permissions in Info.plist
- Privacy policy mentions all data collection
- User consent for tracking
```

**5. "Design Issues"**
```
Fix:
- No placeholders in UI
- Professional design
- Consistent branding
- Polish all screens
```

---

## 💡 PRO TIPS

### Speed Up Review
- ✅ Perfect demo account with data
- ✅ Detailed test instructions
- ✅ Respond within 24h to questions
- ✅ Submit during week (not Friday)

### Avoid Rejections
- ✅ Test EVERYTHING manually first
- ✅ Screenshots = exact UI
- ✅ Complete all metadata fields
- ✅ Working privacy + support URLs
- ✅ Professional design

### Post-Launch
- ✅ Monitor crashes first 24h
- ✅ Respond to reviews
- ✅ Have update ready for bugs
- ✅ Phased release for safety

### Update Strategy
```
Hotfix: Critical bugs (ASAP)
Minor: Bug fixes (2-4 weeks)
Major: New features (2-3 months)

Always increment build number!
```

---

## 📞 EMERGENCY CONTACTS

### Apple Support
```
Developer Support: developer.apple.com/contact/
App Review: Use "Contact Us" in App Store Connect
Phone Support: (for urgent issues)
Forums: developer.apple.com/forums/
```

### Internal Team
```
iOS Lead: [Naam + email]
QA: [Naam + email]
Product Manager: [Naam + email]
```

---

## 🎓 LEARNING RESOURCES

### Official Docs
```
App Store Guidelines:
developer.apple.com/app-store/review/guidelines/

Human Interface Guidelines:
developer.apple.com/design/human-interface-guidelines/

App Store Connect Help:
developer.apple.com/help/app-store-connect/
```

### Common Tasks
```
Update App: New version → Archive → Upload → New submission
Update Metadata: App Store Connect → Edit → Save (no review)
Add Screenshots: Version → Screenshots → Upload → Save
Price Change: Pricing → Set New Price → Save (takes effect in 24h)
Remove from Sale: Pricing → Remove from Sale → Confirm
```

---

## ✅ FINAL GO/NO-GO CHECKLIST

### Before Clicking "Submit for Review"

**Configuration:**
- [ ] Bundle ID consistent
- [ ] Version/Build correct
- [ ] Certificates valid
- [ ] All icons present

**Testing:**
- [ ] Manual testing passed
- [ ] Mobile-MCP tests passed
- [ ] No crashes
- [ ] All features work

**Assets:**
- [ ] 3+ screenshots per size
- [ ] App icon 1024x1024
- [ ] All required fields filled
- [ ] URLs working

**Demo Account:**
- [ ] Credentials provided
- [ ] Account has data
- [ ] Login works
- [ ] Full access enabled

**Team:**
- [ ] Stakeholders informed
- [ ] Support team ready
- [ ] Emergency contact available

---

## 🚀 DEPLOYMENT COMMANDS

### Complete Deployment Flow
```bash
# 1. Clean & Build
cd flow-focus-crm-hub
rm -rf node_modules dist ios/App/Pods
npm install
npm run build:production

# 2. Sync to iOS
npx cap sync ios

# 3. Test with Mobile-MCP
./scripts/ios-mobile-test.sh

# 4. Open Xcode
npx cap open ios

# 5. In Xcode:
# - Product > Clean Build Folder
# - Select "Any iOS Device"
# - Product > Archive
# - Distribute > App Store Connect > Upload

# 6. After email confirmation:
# - Login to appstoreconnect.apple.com
# - Complete metadata
# - Submit for review

# 7. Monitor:
# - Check status daily
# - Respond to questions within 24h
# - Prepare for launch
```

---

## 📊 SUCCESS METRICS

### Target KPIs
```
Downloads: [Your target] in first month
Crash Rate: < 1%
App Store Rating: > 4.0 stars
Review Response: < 48 hours
Update Adoption: > 50% in 2 weeks
```

### Monitor Via
```
App Store Connect > Analytics
Xcode > Organizer > Crashes
App Store reviews (all regions)
```

---

## 🔗 QUICK LINKS

```
Full Plan: IOS_APP_STORE_PUBLISHING_PLAN.md
Test Script: scripts/ios-mobile-test.sh
iOS Setup: workflow/08-deployment/README_IOS_SETUP.md
Mobile Specs: MOBIELE_APP_SPECIFICATIES.md
```

---

**Remember:** Increment build number for EVERY upload!

**Last Updated:** 7 Oktober 2025  
**Next Review:** Before each major release

---

✨ **SUCCESS = Preparation + Testing + Patience** ✨
