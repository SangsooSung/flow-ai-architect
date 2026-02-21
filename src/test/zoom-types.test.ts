import { describe, it, expect } from 'vitest'
import {
  mockZoomConnection,
  mockMeetingScheduled,
  mockMeetingBotJoining,
  mockMeetingInProgress,
  mockMeetingCompleted,
  mockMeetingFailed,
  mockGoogleMeetScheduled,
  mockGoogleMeetCompleted,
  mockAllMeetings,
  mockTranscriptFromRecording,
  mockTranscriptFromBot,
  mockGoogleMeetTranscript,
  mockCalendarConnection,
  mockNotificationPrefs,
  mockNotificationPrefsDisabled,
  mockUserId,
  VALID_MEETING_STATUSES,
  VALID_TRANSCRIPT_SOURCES,
  VALID_MEETING_PLATFORMS,
} from '@/data/mockZoomData'
import type { ZoomMeetingStatus, TranscriptSource, MeetingPlatform } from '@/types/database'

/**
 * Modular Tests: Database Types & Zoom Data Structures
 *
 * Validates all new database table types, enum values,
 * and data integrity constraints for the Zoom integration.
 */

describe('Database Types: Zoom Integration', () => {

  describe('ZoomMeetingStatus Enum', () => {
    it('should define exactly 6 valid meeting statuses', () => {
      expect(VALID_MEETING_STATUSES).toHaveLength(6)
    })

    it('should contain all required lifecycle statuses', () => {
      expect(VALID_MEETING_STATUSES).toContain('scheduled')
      expect(VALID_MEETING_STATUSES).toContain('bot_joining')
      expect(VALID_MEETING_STATUSES).toContain('in_progress')
      expect(VALID_MEETING_STATUSES).toContain('processing')
      expect(VALID_MEETING_STATUSES).toContain('completed')
      expect(VALID_MEETING_STATUSES).toContain('failed')
    })

    it('should not contain invalid statuses', () => {
      expect(VALID_MEETING_STATUSES).not.toContain('cancelled')
      expect(VALID_MEETING_STATUSES).not.toContain('paused')
      expect(VALID_MEETING_STATUSES).not.toContain('unknown')
    })
  })

  describe('TranscriptSource Enum', () => {
    it('should define exactly 4 transcript sources', () => {
      expect(VALID_TRANSCRIPT_SOURCES).toHaveLength(4)
    })

    it('should contain all valid sources', () => {
      expect(VALID_TRANSCRIPT_SOURCES).toContain('zoom_recording')
      expect(VALID_TRANSCRIPT_SOURCES).toContain('live_bot')
      expect(VALID_TRANSCRIPT_SOURCES).toContain('manual_upload')
      expect(VALID_TRANSCRIPT_SOURCES).toContain('google_meet_bot')
    })
  })

  describe('MeetingPlatform Enum', () => {
    it('should define exactly 2 meeting platforms', () => {
      expect(VALID_MEETING_PLATFORMS).toHaveLength(2)
    })

    it('should contain zoom and google_meet', () => {
      expect(VALID_MEETING_PLATFORMS).toContain('zoom')
      expect(VALID_MEETING_PLATFORMS).toContain('google_meet')
    })
  })

  describe('Zoom Connection Schema', () => {
    it('should have all required fields', () => {
      expect(mockZoomConnection.id).toBeDefined()
      expect(mockZoomConnection.user_id).toBeDefined()
      expect(mockZoomConnection.zoom_account_id).toBeDefined()
      expect(mockZoomConnection.access_token).toBeDefined()
      expect(mockZoomConnection.refresh_token).toBeDefined()
      expect(mockZoomConnection.token_expires_at).toBeDefined()
      expect(mockZoomConnection.created_at).toBeDefined()
      expect(mockZoomConnection.updated_at).toBeDefined()
    })

    it('should use UUID format for id and user_id', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(mockZoomConnection.id).toMatch(uuidRegex)
      expect(mockZoomConnection.user_id).toMatch(uuidRegex)
    })

    it('should have ISO timestamp for token expiry', () => {
      const date = new Date(mockZoomConnection.token_expires_at)
      expect(date.getTime()).not.toBeNaN()
      expect(date.getTime()).toBeGreaterThan(Date.now() - 3600000) // Not more than 1 hour in the past
    })

    it('should reference the correct user', () => {
      expect(mockZoomConnection.user_id).toBe(mockUserId)
    })
  })

  describe('Zoom Meeting Schema', () => {
    it('should have all required fields', () => {
      expect(mockMeetingScheduled.id).toBeDefined()
      expect(mockMeetingScheduled.user_id).toBeDefined()
      expect(mockMeetingScheduled.zoom_meeting_id).toBeDefined()
      expect(mockMeetingScheduled.status).toBeDefined()
      expect(mockMeetingScheduled.created_at).toBeDefined()
    })

    it('should have valid zoom_meeting_id as numeric string for Zoom meetings', () => {
      mockAllMeetings
        .filter((m) => m.platform === 'zoom')
        .forEach((meeting) => {
          expect(meeting.zoom_meeting_id).toMatch(/^\d+$/)
        })
    })

    it('should have null zoom_meeting_id for Google Meet meetings', () => {
      mockAllMeetings
        .filter((m) => m.platform === 'google_meet')
        .forEach((meeting) => {
          expect(meeting.zoom_meeting_id).toBeNull()
        })
    })

    it('should have valid google_meet_code for Google Meet meetings', () => {
      const gmeetCodeRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/
      mockAllMeetings
        .filter((m) => m.platform === 'google_meet')
        .forEach((meeting) => {
          expect(meeting.google_meet_code).toMatch(gmeetCodeRegex)
        })
    })

    it('should have valid meeting_url format', () => {
      const zoomUrlRegex = /^https:\/\/[\w.-]+\.zoom\.us\/j\/\d+$/
      const gmeetUrlRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/
      mockAllMeetings
        .filter((m) => m.meeting_url)
        .forEach((meeting) => {
          if (meeting.platform === 'google_meet') {
            expect(meeting.meeting_url).toMatch(gmeetUrlRegex)
          } else {
            expect(meeting.meeting_url).toMatch(zoomUrlRegex)
          }
        })
    })

    it('should have a valid platform for each meeting', () => {
      mockAllMeetings.forEach((meeting) => {
        expect(VALID_MEETING_PLATFORMS).toContain(meeting.platform as MeetingPlatform)
      })
    })

    it('should have valid status for each meeting', () => {
      mockAllMeetings.forEach((meeting) => {
        expect(VALID_MEETING_STATUSES).toContain(meeting.status as ZoomMeetingStatus)
      })
    })

    it('should have started_at for in-progress meetings', () => {
      expect(mockMeetingInProgress.started_at).toBeDefined()
      expect(mockMeetingInProgress.started_at).not.toBeNull()
    })

    it('should have ended_at for completed meetings', () => {
      expect(mockMeetingCompleted.ended_at).toBeDefined()
      expect(mockMeetingCompleted.ended_at).not.toBeNull()
    })

    it('should have bot_task_arn when bot was launched', () => {
      expect(mockMeetingBotJoining.bot_task_arn).toBeDefined()
      expect(mockMeetingBotJoining.bot_task_arn).toMatch(/^arn:aws:ecs:/)
      expect(mockMeetingInProgress.bot_task_arn).toMatch(/^arn:aws:ecs:/)
      expect(mockMeetingCompleted.bot_task_arn).toMatch(/^arn:aws:ecs:/)
    })

    it('should not have started_at for scheduled meetings', () => {
      expect(mockMeetingScheduled.started_at).toBeNull()
    })

    it('should allow null project_id for unlinked meetings', () => {
      expect(mockMeetingScheduled.project_id).toBeNull()
    })
  })

  describe('Transcript Schema', () => {
    it('should have all required fields for recording transcript', () => {
      expect(mockTranscriptFromRecording.id).toBeDefined()
      expect(mockTranscriptFromRecording.meeting_id).toBeDefined()
      expect(mockTranscriptFromRecording.user_id).toBeDefined()
      expect(mockTranscriptFromRecording.content).toBeDefined()
      expect(mockTranscriptFromRecording.source).toBeDefined()
      expect(mockTranscriptFromRecording.created_at).toBeDefined()
    })

    it('should have non-empty transcript content', () => {
      expect(mockTranscriptFromRecording.content.length).toBeGreaterThan(0)
      expect(mockTranscriptFromRecording.content).toContain('[Speaker')
    })

    it('should have valid word count', () => {
      expect(mockTranscriptFromRecording.word_count).toBeDefined()
      expect(mockTranscriptFromRecording.word_count).toBeGreaterThan(0)
    })

    it('should have valid duration in seconds', () => {
      expect(mockTranscriptFromRecording.duration_seconds).toBeDefined()
      expect(mockTranscriptFromRecording.duration_seconds).toBeGreaterThan(0)
    })

    it('should have valid transcript source', () => {
      expect(VALID_TRANSCRIPT_SOURCES).toContain(mockTranscriptFromRecording.source as TranscriptSource)
      expect(VALID_TRANSCRIPT_SOURCES).toContain(mockTranscriptFromBot.source as TranscriptSource)
    })

    it('should distinguish between recording, bot, and Google Meet transcripts', () => {
      expect(mockTranscriptFromRecording.source).toBe('zoom_recording')
      expect(mockTranscriptFromBot.source).toBe('live_bot')
      expect(mockGoogleMeetTranscript.source).toBe('google_meet_bot')
    })

    it('should have speaker_segments as JSONB array', () => {
      expect(mockTranscriptFromRecording.speaker_segments).toBeDefined()
      expect(Array.isArray(mockTranscriptFromRecording.speaker_segments)).toBe(true)
    })

    it('should have speaker labels in segments', () => {
      const segments = mockTranscriptFromRecording.speaker_segments as Array<{ speaker: string; text: string }>
      expect(segments.length).toBeGreaterThan(0)
      segments.forEach((seg) => {
        expect(seg.speaker).toBeDefined()
        expect(seg.speaker).toMatch(/^Speaker \d+$/)
        expect(seg.text).toBeDefined()
        expect(seg.text.length).toBeGreaterThan(0)
      })
    })

    it('should reference a valid meeting_id', () => {
      expect(mockTranscriptFromRecording.meeting_id).toBe(mockMeetingCompleted.id)
    })
  })

  describe('Calendar Connection Schema', () => {
    it('should have all required fields', () => {
      expect(mockCalendarConnection.id).toBeDefined()
      expect(mockCalendarConnection.user_id).toBeDefined()
      expect(mockCalendarConnection.provider).toBeDefined()
      expect(mockCalendarConnection.access_token).toBeDefined()
      expect(mockCalendarConnection.refresh_token).toBeDefined()
      expect(mockCalendarConnection.token_expires_at).toBeDefined()
    })

    it('should use valid provider value', () => {
      expect(['google', 'microsoft']).toContain(mockCalendarConnection.provider)
    })

    it('should have boolean sync enabled flag', () => {
      expect(typeof mockCalendarConnection.calendar_sync_enabled).toBe('boolean')
    })

    it('should have optional last_synced_at timestamp', () => {
      if (mockCalendarConnection.last_synced_at) {
        const date = new Date(mockCalendarConnection.last_synced_at)
        expect(date.getTime()).not.toBeNaN()
      }
    })
  })

  describe('Notification Preferences Schema', () => {
    it('should have all required fields', () => {
      expect(mockNotificationPrefs.id).toBeDefined()
      expect(mockNotificationPrefs.user_id).toBeDefined()
      expect(typeof mockNotificationPrefs.email_on_transcript_ready).toBe('boolean')
      expect(typeof mockNotificationPrefs.email_on_phase1_complete).toBe('boolean')
      expect(typeof mockNotificationPrefs.in_app_notifications).toBe('boolean')
    })

    it('should default to all notifications enabled', () => {
      expect(mockNotificationPrefs.email_on_transcript_ready).toBe(true)
      expect(mockNotificationPrefs.email_on_phase1_complete).toBe(true)
      expect(mockNotificationPrefs.in_app_notifications).toBe(true)
    })

    it('should support all-disabled configuration', () => {
      expect(mockNotificationPrefsDisabled.email_on_transcript_ready).toBe(false)
      expect(mockNotificationPrefsDisabled.email_on_phase1_complete).toBe(false)
      expect(mockNotificationPrefsDisabled.in_app_notifications).toBe(false)
    })
  })
})
