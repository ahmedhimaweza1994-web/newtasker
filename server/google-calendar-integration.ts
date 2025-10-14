import { google } from 'googleapis';

/**
 * VPS-Compatible Google Calendar Integration
 * 
 * Setup Instructions for VPS:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable Google Calendar API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add your domain to authorized redirect URIs
 * 6. Set environment variables:
 *    - GOOGLE_CLIENT_ID=your_client_id
 *    - GOOGLE_CLIENT_SECRET=your_client_secret
 *    - GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback
 * 
 * For development/testing without Google Calendar:
 * - The app will work without these credentials
 * - Meeting links will be generated as placeholder URLs
 */

let connectionSettings: any;
let oauth2Client: any;

// Initialize OAuth2 client with environment variables (VPS-compatible)
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-calendar/callback';

  if (!clientId || !clientSecret) {
    console.log('Google Calendar credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    return null;
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
  
  return oauth2Client;
}

// Get access token (supports both Replit and standard OAuth2)
async function getAccessToken() {
  // Try standard OAuth2 first (VPS-compatible)
  const client = getOAuth2Client();
  if (client && client.credentials?.access_token) {
    // Check if token is expired
    if (client.credentials.expiry_date && client.credentials.expiry_date > Date.now()) {
      return client.credentials.access_token;
    }
    // Try to refresh token if available
    if (client.credentials.refresh_token) {
      try {
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);
        return credentials.access_token;
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }
  }

  // Fallback to Replit connector (temporary, for current deployment)
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (xReplitToken && hostname) {
    try {
      connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
      if (accessToken) {
        return accessToken;
      }
    } catch (error) {
      console.error('Replit connector error:', error);
    }
  }

  throw new Error('Google Calendar not connected. Please configure OAuth2 credentials or connect via Replit.');
}

// Get authorization URL for OAuth2 flow
export function getGoogleAuthUrl(): string | null {
  const client = getOAuth2Client();
  if (!client) return null;

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

// Handle OAuth2 callback
export async function handleGoogleCallback(code: string) {
  const client = getOAuth2Client();
  if (!client) {
    throw new Error('OAuth2 client not configured');
  }

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  // You should save tokens.refresh_token to database for the user
  // For now, we're just setting it in memory
  return tokens;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const client = new google.auth.OAuth2();
  client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: client });
}

// Check if Google Calendar is connected
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}

// Create Google Meet event
export async function createGoogleMeetEvent(
  title: string,
  description: string,
  startTime: Date,
  endTime: Date
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Asia/Riyadh',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Riyadh',
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: event,
  });

  return {
    meetingLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
    eventId: response.data.id,
    eventLink: response.data.htmlLink,
  };
}
