import type {
  ZoomMeetingRow,
  TranscriptRow,
  ZoomConnectionRow,
  CalendarConnectionRow,
  NotificationPreferencesRow,
  ZoomMeetingStatus,
  TranscriptSource,
} from '@/types/database';

// ─── Mock User ─────────────────────────────────────────
export const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
export const mockUserEmail = 'architect@flowai.app';

// ─── Zoom Connection ───────────────────────────────────
export const mockZoomConnection: ZoomConnectionRow = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  user_id: mockUserId,
  zoom_account_id: 'ZOOM_ACC_abc123',
  access_token: 'mock_access_token_xyz',
  refresh_token: 'mock_refresh_token_xyz',
  token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  created_at: '2026-02-18T10:00:00Z',
  updated_at: '2026-02-18T10:00:00Z',
};

// ─── Zoom Meetings ─────────────────────────────────────
export const mockMeetingScheduled: ZoomMeetingRow = {
  id: '770e8400-e29b-41d4-a716-446655440001',
  user_id: mockUserId,
  project_id: null,
  zoom_meeting_id: '1234567890',
  meeting_url: 'https://us04web.zoom.us/j/1234567890',
  topic: 'Acme Corp ERP Requirements Discovery',
  status: 'scheduled',
  bot_task_arn: null,
  started_at: null,
  ended_at: null,
  created_at: '2026-02-19T09:00:00Z',
  updated_at: '2026-02-19T09:00:00Z',
};

export const mockMeetingBotJoining: ZoomMeetingRow = {
  ...mockMeetingScheduled,
  id: '770e8400-e29b-41d4-a716-446655440002',
  zoom_meeting_id: '2345678901',
  meeting_url: 'https://us04web.zoom.us/j/2345678901',
  topic: 'Acme Corp Follow-up: Inventory Review',
  status: 'bot_joining',
  bot_task_arn: 'arn:aws:ecs:us-east-1:123456789:task/zoom-bot-cluster/abc123',
  created_at: '2026-02-19T10:00:00Z',
  updated_at: '2026-02-19T10:01:00Z',
};

export const mockMeetingInProgress: ZoomMeetingRow = {
  ...mockMeetingScheduled,
  id: '770e8400-e29b-41d4-a716-446655440003',
  zoom_meeting_id: '3456789012',
  meeting_url: 'https://us04web.zoom.us/j/3456789012',
  topic: 'Acme Corp Pricing Matrix Walkthrough',
  status: 'in_progress',
  bot_task_arn: 'arn:aws:ecs:us-east-1:123456789:task/zoom-bot-cluster/def456',
  started_at: '2026-02-19T11:00:00Z',
  created_at: '2026-02-19T10:55:00Z',
  updated_at: '2026-02-19T11:00:00Z',
};

export const mockMeetingCompleted: ZoomMeetingRow = {
  ...mockMeetingScheduled,
  id: '770e8400-e29b-41d4-a716-446655440004',
  zoom_meeting_id: '4567890123',
  meeting_url: 'https://us04web.zoom.us/j/4567890123',
  topic: 'Acme Corp Initial Discovery Call',
  status: 'completed',
  bot_task_arn: 'arn:aws:ecs:us-east-1:123456789:task/zoom-bot-cluster/ghi789',
  started_at: '2026-02-18T14:00:00Z',
  ended_at: '2026-02-18T15:30:00Z',
  created_at: '2026-02-18T13:55:00Z',
  updated_at: '2026-02-18T15:30:00Z',
};

export const mockMeetingFailed: ZoomMeetingRow = {
  ...mockMeetingScheduled,
  id: '770e8400-e29b-41d4-a716-446655440005',
  zoom_meeting_id: '5678901234',
  meeting_url: 'https://us04web.zoom.us/j/5678901234',
  topic: 'Failed Meeting - Bot Rejected',
  status: 'failed',
  bot_task_arn: 'arn:aws:ecs:us-east-1:123456789:task/zoom-bot-cluster/jkl012',
  started_at: null,
  ended_at: '2026-02-18T16:00:00Z',
  created_at: '2026-02-18T15:58:00Z',
  updated_at: '2026-02-18T16:00:00Z',
};

export const mockAllMeetings: ZoomMeetingRow[] = [
  mockMeetingScheduled,
  mockMeetingBotJoining,
  mockMeetingInProgress,
  mockMeetingCompleted,
  mockMeetingFailed,
];

// ─── Transcripts ───────────────────────────────────────
export const mockTranscriptContent = `[Speaker 0]: Thanks for joining today. Let's walk through your current inventory and order management process.

[Speaker 1]: Sure. Right now, we manage everything through a combination of spreadsheets and manual processes. Our warehouse team uses an Excel file to track stock levels across three warehouses.

[Speaker 0]: Got it. Who maintains that spreadsheet?

[Speaker 1]: Mostly our Warehouse Managers. They update it daily, but sometimes there's a lag. The Sales team also has their own Pricing Matrix spreadsheet that they use for quoting.

[Speaker 0]: How does the quoting process work currently?

[Speaker 1]: A Sales Rep gets a request from a customer. They look up the product in the Pricing Matrix, which has base prices, volume discounts, and margin multipliers. If the order is over $10,000, the Sales Manager has to approve it.

[Speaker 2]: I'd like to add that the approval process is completely manual right now. I get an email and have to go check the spreadsheet.

[Speaker 0]: What are the biggest pain points?

[Speaker 1]: The lag in inventory updates is killing us. We've oversold products three times this quarter because the spreadsheet wasn't updated.`;

export const mockTranscriptFromRecording: TranscriptRow = {
  id: '880e8400-e29b-41d4-a716-446655440001',
  meeting_id: mockMeetingCompleted.id,
  user_id: mockUserId,
  content: mockTranscriptContent,
  speaker_segments: [
    { speaker: 'Speaker 0', text: 'Thanks for joining today.', startTime: 0, endTime: 5 },
    { speaker: 'Speaker 1', text: 'Sure. Right now, we manage everything through spreadsheets.', startTime: 6, endTime: 14 },
    { speaker: 'Speaker 0', text: 'Got it. Who maintains that spreadsheet?', startTime: 15, endTime: 18 },
    { speaker: 'Speaker 1', text: 'Mostly our Warehouse Managers.', startTime: 19, endTime: 23 },
    { speaker: 'Speaker 2', text: 'The approval process is completely manual right now.', startTime: 120, endTime: 127 },
  ],
  word_count: 191,
  duration_seconds: 5400, // 90 minutes
  source: 'zoom_recording',
  created_at: '2026-02-18T15:35:00Z',
};

export const mockTranscriptFromBot: TranscriptRow = {
  id: '880e8400-e29b-41d4-a716-446655440002',
  meeting_id: mockMeetingInProgress.id,
  user_id: mockUserId,
  content: mockTranscriptContent,
  speaker_segments: [
    { speaker: 'Speaker 0', text: 'Thanks for joining today.', startTime: 0, endTime: 5, confidence: 0.95 },
    { speaker: 'Speaker 1', text: 'Sure. Right now, we manage everything through spreadsheets.', startTime: 6, endTime: 14, confidence: 0.92 },
  ],
  word_count: 191,
  duration_seconds: 3600,
  source: 'live_bot',
  created_at: '2026-02-19T12:00:00Z',
};

// ─── Calendar Connection ───────────────────────────────
export const mockCalendarConnection: CalendarConnectionRow = {
  id: '990e8400-e29b-41d4-a716-446655440001',
  user_id: mockUserId,
  provider: 'google',
  access_token: 'mock_google_access_token',
  refresh_token: 'mock_google_refresh_token',
  token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  calendar_sync_enabled: true,
  last_synced_at: '2026-02-19T12:00:00Z',
  created_at: '2026-02-18T10:00:00Z',
};

// ─── Notification Preferences ──────────────────────────
export const mockNotificationPrefs: NotificationPreferencesRow = {
  id: 'aa0e8400-e29b-41d4-a716-446655440001',
  user_id: mockUserId,
  email_on_transcript_ready: true,
  email_on_phase1_complete: true,
  in_app_notifications: true,
  created_at: '2026-02-18T10:00:00Z',
};

export const mockNotificationPrefsDisabled: NotificationPreferencesRow = {
  ...mockNotificationPrefs,
  id: 'aa0e8400-e29b-41d4-a716-446655440002',
  email_on_transcript_ready: false,
  email_on_phase1_complete: false,
  in_app_notifications: false,
};

// ─── Valid Meeting Statuses ────────────────────────────
export const VALID_MEETING_STATUSES: ZoomMeetingStatus[] = [
  'scheduled',
  'bot_joining',
  'in_progress',
  'processing',
  'completed',
  'failed',
];

// ─── Valid Transcript Sources ──────────────────────────
export const VALID_TRANSCRIPT_SOURCES: TranscriptSource[] = [
  'zoom_recording',
  'live_bot',
  'manual_upload',
];

// ─── Sample VTT Content ────────────────────────────────
export const SAMPLE_VTT = `WEBVTT

1
00:00:01.000 --> 00:00:05.000
Speaker 0: Thanks for joining today. Let's walk through your current process.

2
00:00:06.000 --> 00:00:14.000
Speaker 1: Sure. Right now, we manage everything through spreadsheets.

3
00:00:15.000 --> 00:00:18.000
Speaker 0: Got it. Who maintains that spreadsheet?

4
00:00:19.000 --> 00:00:28.000
Speaker 1: Mostly our Warehouse Managers. They update it daily, but sometimes there's a lag.

5
00:01:00.000 --> 00:01:07.000
Speaker 2: I'd like to add that the approval process is completely manual right now.`;

// ─── Sample Zoom URLs for Calendar Detection ───────────
export const SAMPLE_CALENDAR_EVENTS = [
  {
    summary: 'ERP Discovery Call with Acme Corp',
    description: 'Join Zoom Meeting: https://us04web.zoom.us/j/1234567890',
    location: '',
    expectedMeetingId: '1234567890',
  },
  {
    summary: 'Follow-up: Inventory Walkthrough',
    description: '',
    location: 'https://us02web.zoom.us/j/9876543210',
    expectedMeetingId: '9876543210',
  },
  {
    summary: 'Internal Standup (no Zoom)',
    description: 'Meet in conference room B',
    location: 'Office - Room B',
    expectedMeetingId: null,
  },
  {
    summary: 'Client Sprint Review',
    description: 'Link: https://teams.microsoft.com/l/meetup-join/xxx',
    location: '',
    expectedMeetingId: null,
  },
];
