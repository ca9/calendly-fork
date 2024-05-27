import { google, calendar_v3 } from 'googleapis';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email'
];

export const getClient = (): any => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback`
    );
};

export const getAuthUrl = (): string => {
    const client = getClient();
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
};

export const getCalendar = async (token: any): Promise<calendar_v3.Calendar> => {
    const client = getClient();
    client.setCredentials(token);
    return google.calendar({ version: 'v3', auth: client });
};
