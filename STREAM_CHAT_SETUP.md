# Stream.io Chat Integration Setup Guide

## Environment Variables

### Web App (flow-focus-crm-hub)

Add the following to your `.env` file:

```env
# Stream.io Configuration
VITE_STREAM_API_KEY=your_stream_api_key
VITE_STREAM_APP_ID=your_stream_app_id
```

### Mobile App (smans-crm-mobile-app)

Add the following to your `.env` file:

```env
# Stream.io Configuration
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
EXPO_PUBLIC_STREAM_APP_ID=your_stream_app_id
```

### Supabase Edge Function

Add the following secrets to Supabase:

```bash
# In Supabase Dashboard > Project Settings > Edge Functions > Secrets
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

Or via Supabase CLI:

```bash
supabase secrets set STREAM_API_KEY=your_stream_api_key
supabase secrets set STREAM_API_SECRET=your_stream_api_secret
```

## Getting Stream.io API Keys

1. **Create Stream.io Account**
   - Go to https://getstream.io/
   - Sign up for a free account
   - Create a new app

2. **Get API Credentials**
   - Navigate to your app dashboard
   - Go to "App Settings" or "API Keys"
   - Copy the following:
     - **API Key**: Use this for `VITE_STREAM_API_KEY` (web) and `EXPO_PUBLIC_STREAM_API_KEY` (mobile)
     - **API Secret**: Use this ONLY for the Supabase Edge Function (`STREAM_API_SECRET`)
     - **App ID**: Optional, for organization purposes

3. **Configure Channel Types**
   - In Stream Dashboard, go to "Chat" > "Channel Types"
   - Create or configure a `messaging` channel type
   - Set permissions as needed

## Deployment Checklist

### 1. Deploy Supabase Edge Function

```bash
# Navigate to the project root
cd flow-focus-crm-hub

# Deploy the generate-stream-token function
supabase functions deploy generate-stream-token

# Test the function
supabase functions invoke generate-stream-token --body '{"userId":"test-user-id"}'
```

### 2. Set Environment Variables

**Web (Vercel/Your Hosting)**:
- Add `VITE_STREAM_API_KEY` and `VITE_STREAM_APP_ID` to your hosting platform's environment variables

**Mobile (EAS Build)**:
- Add variables to `eas.json` or use EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_STREAM_API_KEY --value your_stream_api_key
eas secret:create --scope project --name EXPO_PUBLIC_STREAM_APP_ID --value your_stream_app_id
```

### 3. Test the Integration

**Web App**:
1. Run the development server: `npm run dev`
2. Navigate to `/chat`
3. Verify connection to Stream
4. Test sending messages

**Mobile App**:
1. Run the app: `npm start`
2. Navigate to the Chat tab
3. Verify connection to Stream
4. Test sending messages
5. Verify cross-platform sync (send from web, receive on mobile)

## Permission Rules

The chat system implements role-based access control:

### Installateur (Monteur)
- Can ONLY chat with Administrator & Administratie roles
- Cannot see other Installateurs
- Cannot create channels

### Administrator & Administratie
- Can chat with ALL Installateurs
- Can chat with each other
- Can create channels

These rules are enforced at two levels:
1. **Application Level**: User filtering in `getAvailableChatUsers()` function
2. **Stream Level**: Channel permissions (can be configured in Stream Dashboard)

## Troubleshooting

### "Stream client not initialized"
- Verify `VITE_STREAM_API_KEY` is set correctly
- Check browser console for initialization errors
- Ensure user is authenticated before accessing chat

### "Failed to generate Stream token"
- Verify Supabase Edge Function is deployed
- Check Supabase secrets are set correctly
- Review Edge Function logs: `supabase functions logs generate-stream-token`

### Messages not syncing between platforms
- Verify both apps use the same Stream API Key
- Check that both users are connected to Stream
- Review network requests in browser/app dev tools

### Permissions not working correctly
- Review `get_available_chat_users()` RPC function in Supabase
- Check user roles in `profiles` table
- Verify role-based filtering logic in code

## Legacy Chat Access

Users can still access their old Supabase-based chat messages:
- **Web**: Click "Oude Berichten" button in chat interface
- **Mobile**: Tap "Archief" button in chat screen

Old messages are read-only and will not be migrated to Stream.

## Support

For Stream.io specific issues:
- Documentation: https://getstream.io/chat/docs/
- Support: https://getstream.io/contact/

For implementation issues:
- Check the codebase documentation
- Review error logs in Supabase and application consoles

