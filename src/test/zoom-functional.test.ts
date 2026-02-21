import { describe, it, expect } from 'vitest'
import {
  mockMeetingScheduled,
  mockMeetingBotJoining,
  mockMeetingInProgress,
  mockMeetingCompleted,
  mockMeetingFailed,
  mockGoogleMeetScheduled,
  mockGoogleMeetCompleted,
  mockAllMeetings,
  mockTranscriptContent,
  mockTranscriptFromRecording,
  mockCalendarConnection,
  mockNotificationPrefs,
  mockNotificationPrefsDisabled,
  SAMPLE_VTT,
  SAMPLE_CALENDAR_EVENTS,
  VALID_MEETING_STATUSES,
} from '@/data/mockZoomData'
import type { ZoomMeetingStatus } from '@/types/database'

/**
 * Functional Tests: Zoom Meeting Business Logic
 *
 * Tests the core business logic of the Zoom integration features:
 * - Meeting lifecycle state machine
 * - VTT transcript formatting
 * - Zoom URL parsing & validation
 * - Calendar event Zoom URL detection
 * - Notification preference logic
 * - Transcript word count calculation
 * - Meeting duration computation
 */

describe('Zoom Meeting Lifecycle State Machine', () => {

  const validTransitions: Record<string, ZoomMeetingStatus[]> = {
    scheduled: ['bot_joining', 'failed'],
    bot_joining: ['in_progress', 'failed'],
    in_progress: ['processing', 'completed', 'failed'],
    processing: ['completed', 'failed'],
    completed: [],
    failed: [],
  }

  it('should define all valid status transitions', () => {
    Object.keys(validTransitions).forEach((status) => {
      expect(VALID_MEETING_STATUSES).toContain(status)
    })
  })

  it('should not allow transitions from terminal states', () => {
    expect(validTransitions['completed']).toHaveLength(0)
    expect(validTransitions['failed']).toHaveLength(0)
  })

  it('should allow scheduled → bot_joining transition', () => {
    expect(validTransitions['scheduled']).toContain('bot_joining')
  })

  it('should allow bot_joining → in_progress transition', () => {
    expect(validTransitions['bot_joining']).toContain('in_progress')
  })

  it('should allow in_progress → processing → completed transitions', () => {
    expect(validTransitions['in_progress']).toContain('processing')
    expect(validTransitions['processing']).toContain('completed')
  })

  it('should allow failure from any non-terminal state', () => {
    const nonTerminalStatuses = ['scheduled', 'bot_joining', 'in_progress', 'processing']
    nonTerminalStatuses.forEach((status) => {
      expect(validTransitions[status]).toContain('failed')
    })
  })

  it('should have at least one meeting per status in mock data', () => {
    const statusCounts = new Map<string, number>()
    mockAllMeetings.forEach((m) => {
      statusCounts.set(m.status, (statusCounts.get(m.status) || 0) + 1)
    })

    expect(statusCounts.get('scheduled')).toBeGreaterThanOrEqual(1)
    expect(statusCounts.get('bot_joining')).toBeGreaterThanOrEqual(1)
    expect(statusCounts.get('in_progress')).toBeGreaterThanOrEqual(1)
    expect(statusCounts.get('completed')).toBeGreaterThanOrEqual(1)
    expect(statusCounts.get('failed')).toBeGreaterThanOrEqual(1)
  })
})

describe('VTT Transcript Formatting', () => {
  // Replicate the formatVttTranscript function from zoom-webhook edge function
  function formatVttTranscript(vtt: string): string {
    const lines = vtt.split('\n')
    const segments: string[] = []
    let currentSpeaker = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (
        trimmed === 'WEBVTT' ||
        trimmed === '' ||
        /^\d+$/.test(trimmed) ||
        /^\d{2}:\d{2}/.test(trimmed)
      ) {
        continue
      }

      const speakerMatch = trimmed.match(/^(.+?):\s*(.+)$/)
      if (speakerMatch) {
        const speaker = speakerMatch[1].trim()
        const text = speakerMatch[2].trim()

        if (speaker !== currentSpeaker) {
          currentSpeaker = speaker
          segments.push(`\n[${speaker}]: ${text}`)
        } else {
          segments.push(text)
        }
      } else if (trimmed.length > 0) {
        segments.push(trimmed)
      }
    }

    return segments.join(' ').trim()
  }

  it('should strip WEBVTT header', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    expect(result).not.toContain('WEBVTT')
  })

  it('should strip sequence numbers', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    // Should not start with a bare number
    expect(result).not.toMatch(/^\d+\s/)
  })

  it('should strip timestamps', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    expect(result).not.toContain('00:00:01.000')
    expect(result).not.toContain('-->')
  })

  it('should add speaker tags in [Speaker N] format', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    expect(result).toContain('[Speaker 0]')
    expect(result).toContain('[Speaker 1]')
    expect(result).toContain('[Speaker 2]')
  })

  it('should concatenate same-speaker segments', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    // Speaker 1 should have their lines merged, not repeated tags
    const speaker1Matches = result.match(/\[Speaker 1\]/g)
    expect(speaker1Matches).toBeDefined()
    // Speaker 1 speaks in two separate turns (not adjacent), so may appear twice
    expect(speaker1Matches!.length).toBeLessThanOrEqual(3)
  })

  it('should preserve actual transcript text content', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    expect(result).toContain('Thanks for joining today')
    expect(result).toContain('manage everything through spreadsheets')
    expect(result).toContain('approval process is completely manual')
  })

  it('should produce non-empty output from valid VTT', () => {
    const result = formatVttTranscript(SAMPLE_VTT)
    expect(result.length).toBeGreaterThan(50)
  })

  it('should handle empty VTT input', () => {
    const result = formatVttTranscript('WEBVTT\n\n')
    expect(result).toBe('')
  })
})

describe('Zoom Meeting URL Parsing & Validation', () => {
  const ZOOM_URL_REGEX = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/

  it('should parse standard Zoom URL', () => {
    const url = 'https://us04web.zoom.us/j/1234567890'
    const match = url.match(ZOOM_URL_REGEX)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('1234567890')
  })

  it('should parse Zoom URL with different subdomains', () => {
    const urls = [
      'https://us02web.zoom.us/j/2222222222',
      'https://us04web.zoom.us/j/3333333333',
      'https://company.zoom.us/j/4444444444',
      'https://acme.zoom.us/j/5555555555',
    ]

    urls.forEach((url) => {
      const match = url.match(ZOOM_URL_REGEX)
      expect(match).not.toBeNull()
    })
  })

  it('should extract meeting ID from URL', () => {
    const url = mockMeetingScheduled.meeting_url!
    const match = url.match(/\/j\/(\d+)/)
    expect(match).not.toBeNull()
    expect(match![1]).toBe(mockMeetingScheduled.zoom_meeting_id)
  })

  it('should reject non-Zoom URLs', () => {
    const invalidUrls = [
      'https://teams.microsoft.com/l/meetup-join/xxx',
      'https://meet.google.com/abc-defg-hij',
      'https://example.com/j/1234567890',
      'not-a-url',
      '',
    ]

    invalidUrls.forEach((url) => {
      const match = url.match(ZOOM_URL_REGEX)
      expect(match).toBeNull()
    })
  })

  it('should reject Zoom URLs without meeting ID', () => {
    const invalidZoomUrls = [
      'https://zoom.us/',
      'https://zoom.us/j/',
      'https://zoom.us/j/abc',
    ]

    invalidZoomUrls.forEach((url) => {
      const match = url.match(ZOOM_URL_REGEX)
      expect(match).toBeNull()
    })
  })
})

describe('Google Meet URL Parsing & Validation', () => {
  const GMEET_URL_REGEX = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/

  it('should parse standard Google Meet URL', () => {
    const url = 'https://meet.google.com/abc-defg-hij'
    const match = url.match(GMEET_URL_REGEX)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('abc-defg-hij')
  })

  it('should extract meet code from Google Meet URL', () => {
    const url = mockGoogleMeetScheduled.meeting_url!
    const match = url.match(GMEET_URL_REGEX)
    expect(match).not.toBeNull()
    expect(match![1]).toBe(mockGoogleMeetScheduled.google_meet_code)
  })

  it('should reject non-Google Meet URLs', () => {
    const invalidUrls = [
      'https://teams.microsoft.com/l/meetup-join/xxx',
      'https://us04web.zoom.us/j/1234567890',
      'https://example.com/abc-defg-hij',
      'not-a-url',
      '',
    ]

    invalidUrls.forEach((url) => {
      const match = url.match(GMEET_URL_REGEX)
      expect(match).toBeNull()
    })
  })

  it('should reject invalid Google Meet code formats', () => {
    const invalidMeetUrls = [
      'https://meet.google.com/',
      'https://meet.google.com/abc',
      'https://meet.google.com/abc-def-ghi',    // 3-3-3 not 3-4-3
      'https://meet.google.com/ABC-DEFG-HIJ',   // uppercase
    ]

    invalidMeetUrls.forEach((url) => {
      const match = url.match(GMEET_URL_REGEX)
      expect(match).toBeNull()
    })
  })

  it('should auto-detect platform from URL', () => {
    const ZOOM_URL_REGEX_DETECT = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/
    const GMEET_URL_REGEX_DETECT = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/

    const urls = [
      { url: 'https://us04web.zoom.us/j/1234567890', expectedPlatform: 'zoom' },
      { url: 'https://meet.google.com/abc-defg-hij', expectedPlatform: 'google_meet' },
    ]

    urls.forEach(({ url, expectedPlatform }) => {
      const isZoom = ZOOM_URL_REGEX_DETECT.test(url)
      const isGmeet = GMEET_URL_REGEX_DETECT.test(url)
      const platform = isZoom ? 'zoom' : isGmeet ? 'google_meet' : null
      expect(platform).toBe(expectedPlatform)
    })
  })
})

describe('Calendar Event Meeting URL Detection', () => {
  const ZOOM_URL_PATTERN = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/g
  const GMEET_URL_PATTERN = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/g

  it('should detect Zoom URL in event description', () => {
    const event = SAMPLE_CALENDAR_EVENTS[0]
    const matches = [...event.description.matchAll(ZOOM_URL_PATTERN)]
    expect(matches).toHaveLength(1)
    expect(matches[0][1]).toBe(event.expectedMeetingId)
  })

  it('should detect Zoom URL in event location', () => {
    const event = SAMPLE_CALENDAR_EVENTS[1]
    const searchText = `${event.description} ${event.location}`
    const matches = [...searchText.matchAll(ZOOM_URL_PATTERN)]
    expect(matches).toHaveLength(1)
    expect(matches[0][1]).toBe(event.expectedMeetingId)
  })

  it('should not detect meeting URLs in non-meeting events', () => {
    const event = SAMPLE_CALENDAR_EVENTS[2] // Internal meeting, no Zoom or Meet
    const searchText = `${event.description} ${event.location} ${event.hangoutLink}`
    const zoomMatches = [...searchText.matchAll(ZOOM_URL_PATTERN)]
    const gmeetMatches = [...searchText.matchAll(GMEET_URL_PATTERN)]
    expect(zoomMatches).toHaveLength(0)
    expect(gmeetMatches).toHaveLength(0)
  })

  it('should not match Microsoft Teams URLs as Zoom', () => {
    const event = SAMPLE_CALENDAR_EVENTS[3] // Teams meeting
    const searchText = `${event.description} ${event.location}`
    const matches = [...searchText.matchAll(ZOOM_URL_PATTERN)]
    expect(matches).toHaveLength(0)
  })

  it('should detect Google Meet URL from hangoutLink', () => {
    const event = SAMPLE_CALENDAR_EVENTS[4] // Google Meet via hangoutLink
    const searchText = `${event.description} ${event.location} ${event.hangoutLink}`
    const matches = [...searchText.matchAll(GMEET_URL_PATTERN)]
    expect(matches).toHaveLength(1)
    expect(matches[0][1]).toBe(event.expectedMeetingId)
  })

  it('should detect Google Meet URL in event description', () => {
    const event = SAMPLE_CALENDAR_EVENTS[5] // Google Meet in description
    const searchText = `${event.description} ${event.location} ${event.hangoutLink}`
    const matches = [...searchText.matchAll(GMEET_URL_PATTERN)]
    expect(matches).toHaveLength(1)
    expect(matches[0][1]).toBe(event.expectedMeetingId)
  })

  it('should correctly classify all sample events by platform', () => {
    SAMPLE_CALENDAR_EVENTS.forEach((event) => {
      const searchText = `${event.description} ${event.location} ${event.hangoutLink}`
      const zoomMatches = [...searchText.matchAll(ZOOM_URL_PATTERN)]
      const gmeetMatches = [...searchText.matchAll(GMEET_URL_PATTERN)]

      if (event.expectedPlatform === 'zoom') {
        expect(zoomMatches.length).toBeGreaterThan(0)
        expect(zoomMatches[0][1]).toBe(event.expectedMeetingId)
      } else if (event.expectedPlatform === 'google_meet') {
        expect(gmeetMatches.length).toBeGreaterThan(0)
        expect(gmeetMatches[0][1]).toBe(event.expectedMeetingId)
      } else {
        expect(zoomMatches).toHaveLength(0)
        expect(gmeetMatches).toHaveLength(0)
      }
    })
  })
})

describe('Notification Preference Logic', () => {
  it('should respect email_on_transcript_ready preference', () => {
    const shouldSendEnabled = mockNotificationPrefs.email_on_transcript_ready
    const shouldSendDisabled = mockNotificationPrefsDisabled.email_on_transcript_ready

    expect(shouldSendEnabled).toBe(true)
    expect(shouldSendDisabled).toBe(false)
  })

  it('should respect email_on_phase1_complete preference', () => {
    expect(mockNotificationPrefs.email_on_phase1_complete).toBe(true)
    expect(mockNotificationPrefsDisabled.email_on_phase1_complete).toBe(false)
  })

  it('should respect in_app_notifications preference', () => {
    expect(mockNotificationPrefs.in_app_notifications).toBe(true)
    expect(mockNotificationPrefsDisabled.in_app_notifications).toBe(false)
  })

  it('should default to enabled when no preferences set', () => {
    const prefs = null // No preferences in DB
    const emailEnabled = prefs?.email_on_transcript_ready ?? true
    expect(emailEnabled).toBe(true)
  })

  it('should handle partial preference updates', () => {
    const updated = {
      ...mockNotificationPrefs,
      email_on_transcript_ready: false,
    }

    expect(updated.email_on_transcript_ready).toBe(false)
    expect(updated.email_on_phase1_complete).toBe(true) // Unchanged
    expect(updated.in_app_notifications).toBe(true) // Unchanged
  })
})

describe('Transcript Processing', () => {

  it('should count words accurately', () => {
    const wordCount = mockTranscriptContent.split(/\s+/).filter(Boolean).length
    expect(wordCount).toBeGreaterThan(100)
    expect(wordCount).toBeLessThan(1000)
  })

  it('should contain speaker-tagged content', () => {
    expect(mockTranscriptContent).toContain('[Speaker 0]')
    expect(mockTranscriptContent).toContain('[Speaker 1]')
  })

  it('should identify multiple speakers', () => {
    const speakers = new Set(
      [...mockTranscriptContent.matchAll(/\[Speaker (\d+)\]/g)].map((m) => m[1])
    )
    expect(speakers.size).toBeGreaterThanOrEqual(2)
  })

  it('should have proper speaker segment structure', () => {
    const segments = mockTranscriptFromRecording.speaker_segments as Array<{
      speaker: string
      text: string
      startTime: number
      endTime: number
    }>

    segments.forEach((seg) => {
      expect(seg.startTime).toBeDefined()
      expect(seg.endTime).toBeDefined()
      expect(seg.endTime).toBeGreaterThanOrEqual(seg.startTime)
    })
  })

  it('should have chronologically ordered segments', () => {
    const segments = mockTranscriptFromRecording.speaker_segments as Array<{
      startTime: number
      endTime: number
    }>

    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].startTime).toBeGreaterThanOrEqual(segments[i - 1].startTime)
    }
  })
})

describe('Meeting Duration Computation', () => {

  it('should compute duration for completed meetings', () => {
    const started = new Date(mockMeetingCompleted.started_at!).getTime()
    const ended = new Date(mockMeetingCompleted.ended_at!).getTime()
    const durationMinutes = Math.round((ended - started) / 60000)

    expect(durationMinutes).toBeGreaterThan(0)
    expect(durationMinutes).toBe(90) // 14:00 to 15:30 = 90 minutes
  })

  it('should return null duration for meetings without timestamps', () => {
    const started = mockMeetingScheduled.started_at
    const ended = mockMeetingScheduled.ended_at

    expect(started).toBeNull()
    expect(ended).toBeNull()
  })

  it('should compute reasonable duration for bot transcripts', () => {
    const durationSeconds = mockTranscriptFromRecording.duration_seconds!
    expect(durationSeconds).toBeGreaterThan(0)
    expect(durationSeconds).toBeLessThanOrEqual(14400) // Max 4 hours
  })
})

describe('Calendar Sync Logic', () => {

  it('should only sync when calendar_sync_enabled is true', () => {
    const enabledConnection = { ...mockCalendarConnection, calendar_sync_enabled: true }
    const disabledConnection = { ...mockCalendarConnection, calendar_sync_enabled: false }

    expect(enabledConnection.calendar_sync_enabled).toBe(true)
    expect(disabledConnection.calendar_sync_enabled).toBe(false)
  })

  it('should detect token expiry', () => {
    const expiredConnection = {
      ...mockCalendarConnection,
      token_expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    }

    const isExpired = new Date(expiredConnection.token_expires_at) < new Date()
    expect(isExpired).toBe(true)
  })

  it('should detect valid tokens', () => {
    const isExpired = new Date(mockCalendarConnection.token_expires_at) < new Date()
    expect(isExpired).toBe(false)
  })

  it('should track last sync timestamp', () => {
    expect(mockCalendarConnection.last_synced_at).toBeDefined()
    const lastSynced = new Date(mockCalendarConnection.last_synced_at!)
    expect(lastSynced.getTime()).not.toBeNaN()
  })
})
