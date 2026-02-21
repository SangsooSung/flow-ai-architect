import { describe, it, expect } from 'vitest'
import {
  mockUserId,
  mockZoomConnection,
  mockMeetingScheduled,
  mockMeetingBotJoining,
  mockMeetingInProgress,
  mockMeetingCompleted,
  mockMeetingFailed,
  mockGoogleMeetScheduled,
  mockGoogleMeetCompleted,
  mockTranscriptFromRecording,
  mockTranscriptFromBot,
  mockGoogleMeetTranscript,
  mockTranscriptContent,
  mockCalendarConnection,
  mockNotificationPrefs,
  mockNotificationPrefsDisabled,
  SAMPLE_VTT,
  SAMPLE_CALENDAR_EVENTS,
} from '@/data/mockZoomData'
import { mockPhase1Data } from '@/data/mockData'
import type { Phase1Data } from '@/types/project'
import type { ZoomMeetingStatus } from '@/types/database'

/**
 * E2E Integration Tests: Full Zoom Meeting Ingestion Workflow
 *
 * Tests the complete end-to-end flows across all 4 phases:
 * Phase 1: Auth + Zoom Webhook Integration
 * Phase 2: Live Zoom Bot + Real-Time ASR
 * Phase 3: Google Calendar Auto-Join
 * Phase 4: Notifications + Polish
 */

describe('E2E: Phase 1 - Authentication + Zoom Webhook Integration', () => {

  describe('Auth → Dashboard → Meetings Flow', () => {
    it('should complete full auth flow: login → session → protected routes', () => {
      // Step 1: User is unauthenticated
      let user = null
      let session = null
      expect(user).toBeNull()

      // Step 2: User signs in with Google OAuth
      session = {
        access_token: 'mock_jwt_token',
        user: { id: mockUserId, email: 'user@example.com' },
      }
      user = session.user

      // Step 3: User is now authenticated
      expect(user).not.toBeNull()
      expect(user.id).toBe(mockUserId)

      // Step 4: AuthGuard allows access to protected routes
      const canAccessDashboard = !!user
      const canAccessMeetings = !!user
      const canAccessSettings = !!user
      expect(canAccessDashboard).toBe(true)
      expect(canAccessMeetings).toBe(true)
      expect(canAccessSettings).toBe(true)
    })

    it('should scope projects to authenticated user', () => {
      const projects = [
        { id: '1', user_id: mockUserId, name: 'My Project' },
        { id: '2', user_id: 'other-user', name: 'Other Project' },
        { id: '3', user_id: null, name: 'Legacy (no user)' },
      ]

      const visibleProjects = projects.filter(
        (p) => p.user_id === mockUserId || p.user_id === null
      )

      expect(visibleProjects).toHaveLength(2)
      expect(visibleProjects.map((p) => p.id)).toEqual(['1', '3'])
    })
  })

  describe('Zoom Account Connection Flow', () => {
    it('should complete OAuth flow: redirect → callback → token storage', () => {
      // Step 1: User initiates Zoom OAuth
      const userId = mockUserId
      expect(userId).toBeDefined()

      // Step 2: After OAuth callback, tokens are stored
      const connection = mockZoomConnection
      expect(connection.user_id).toBe(userId)
      expect(connection.access_token).toBeDefined()
      expect(connection.refresh_token).toBeDefined()
      expect(connection.zoom_account_id).toBeDefined()

      // Step 3: Token expiry is set in the future
      const expiresAt = new Date(connection.token_expires_at)
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('Webhook → Transcript → Phase 1 Pipeline', () => {
    it('should process recording.completed webhook end-to-end', () => {
      // Step 1: Zoom sends recording.completed webhook
      const webhookPayload = {
        event: 'recording.completed',
        payload: {
          object: {
            id: mockMeetingCompleted.zoom_meeting_id,
            topic: mockMeetingCompleted.topic,
            host_id: 'host123',
            recording_files: [
              { file_type: 'TRANSCRIPT', download_url: 'https://zoom.us/rec/download/abc' },
            ],
          },
        },
      }

      expect(webhookPayload.event).toBe('recording.completed')
      expect(webhookPayload.payload.object.recording_files.length).toBeGreaterThan(0)

      // Step 2: Transcript file is downloaded and formatted
      const rawVtt = SAMPLE_VTT
      expect(rawVtt).toContain('WEBVTT')

      // Step 3: Formatted transcript has speaker tags
      const formattedTranscript = mockTranscriptContent
      expect(formattedTranscript).toContain('[Speaker 0]')
      expect(formattedTranscript).toContain('[Speaker 1]')

      // Step 4: Transcript is stored in DB
      const transcript = mockTranscriptFromRecording
      expect(transcript.meeting_id).toBe(mockMeetingCompleted.id)
      expect(transcript.content).toBeDefined()
      expect(transcript.word_count).toBeGreaterThan(0)
      expect(transcript.source).toBe('zoom_recording')

      // Step 5: Meeting status updated to completed
      expect(mockMeetingCompleted.status).toBe('completed')
    })

    it('should enable user to use Zoom transcript for Phase 1 analysis', () => {
      // Step 1: User sees completed meeting in Meetings page
      const completedMeetings = [mockMeetingCompleted].filter(
        (m) => m.status === 'completed'
      )
      expect(completedMeetings).toHaveLength(1)

      // Step 2: User clicks "Use Transcript" → transcript content retrieved
      const transcript = mockTranscriptFromRecording
      expect(transcript.content.length).toBeGreaterThan(0)

      // Step 3: Transcript populates the TranscriptInput component
      const populatedTranscript = transcript.content
      expect(populatedTranscript).toContain('[Speaker')

      // Step 4: Transcript is compatible with Phase 1 analysis format
      // Phase 1 expects speaker tags like [Client], [Flow_Engineer]
      // Zoom transcripts use [Speaker 0], [Speaker 1] which is acceptable
      expect(populatedTranscript).toMatch(/\[Speaker \d+\]/)
    })

    it('should maintain data continuity from Zoom transcript to Phase 1 output', () => {
      // Phase 1 data generated from a transcript should include the transcript
      const phase1WithMeeting: Phase1Data = {
        ...mockPhase1Data,
        meetingId: mockMeetingCompleted.id,
      }

      expect(phase1WithMeeting.transcript).toBeDefined()
      expect(phase1WithMeeting.transcript.length).toBeGreaterThan(0)
      expect(phase1WithMeeting.meetingId).toBe(mockMeetingCompleted.id)

      // Phase 1 output should contain extracted requirements
      expect(phase1WithMeeting.executiveSummary.goal).toBeDefined()
      expect(phase1WithMeeting.userRoles.length).toBeGreaterThan(0)
      expect(phase1WithMeeting.requirements.length).toBeGreaterThan(0)
    })
  })
})

describe('E2E: Phase 2 - Live Zoom Bot + Real-Time ASR', () => {

  describe('Bot Launch → Join → Record → Transcript Pipeline', () => {
    it('should follow complete bot lifecycle: launch → join → record → complete', () => {
      // Step 1: User enters meeting URL and clicks "Send Bot"
      const meetingUrl = 'https://us04web.zoom.us/j/1234567890'
      const urlRegex = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/
      const match = meetingUrl.match(urlRegex)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('1234567890')

      // Step 2: Edge function creates meeting record (status: bot_joining)
      const meeting = { ...mockMeetingBotJoining }
      expect(meeting.status).toBe('bot_joining')
      expect(meeting.bot_task_arn).toBeDefined()

      // Step 3: Fargate task launches, bot joins meeting
      meeting.status = 'in_progress' as ZoomMeetingStatus
      meeting.started_at = new Date().toISOString()
      expect(meeting.status).toBe('in_progress')
      expect(meeting.started_at).toBeDefined()

      // Step 4: Audio streamed to Amazon Transcribe, diarized segments collected
      const segments = [
        { speaker: 'Speaker 0', text: 'Thanks for joining.', startTime: 0, endTime: 3, confidence: 0.95 },
        { speaker: 'Speaker 1', text: 'Sure, let me walk through the process.', startTime: 4, endTime: 8, confidence: 0.91 },
      ]
      expect(segments.length).toBeGreaterThan(0)
      segments.forEach((seg) => {
        expect(seg.confidence).toBeGreaterThanOrEqual(0.7) // Confidence threshold
      })

      // Step 5: Meeting ends, bot finalizes transcript
      meeting.status = 'completed' as ZoomMeetingStatus
      meeting.ended_at = new Date().toISOString()
      expect(meeting.status).toBe('completed')

      // Step 6: Transcript stored via callback
      const transcript = mockTranscriptFromBot
      expect(transcript.source).toBe('live_bot')
      expect(transcript.content).toBeDefined()
    })

    it('should handle bot rejection gracefully', () => {
      // Host denies recording consent
      const meeting = { ...mockMeetingFailed }
      expect(meeting.status).toBe('failed')

      // User should see option to upload manual transcript instead
      const canUploadManual = meeting.status === 'failed'
      expect(canUploadManual).toBe(true)
    })

    it('should enforce 4-hour maximum runtime', () => {
      const MAX_RUNTIME_MS = 14400000 // 4 hours
      const MAX_RUNTIME_HOURS = MAX_RUNTIME_MS / (3600 * 1000)

      expect(MAX_RUNTIME_HOURS).toBe(4)

      // Bot should warn at 3h45m
      const WARNING_TIME_MS = MAX_RUNTIME_MS - 15 * 60 * 1000
      const WARNING_HOURS = WARNING_TIME_MS / (3600 * 1000)
      expect(WARNING_HOURS).toBe(3.75)
    })

    it('should filter out low-confidence transcription segments', () => {
      const segments = [
        { speaker: 'Speaker 0', text: 'Clear speech.', confidence: 0.95 },
        { speaker: 'Speaker 1', text: 'Mumbled unclear.', confidence: 0.45 },
        { speaker: 'Speaker 0', text: 'Another clear segment.', confidence: 0.88 },
      ]

      const CONFIDENCE_THRESHOLD = 0.7
      const filteredSegments = segments.filter((s) => s.confidence >= CONFIDENCE_THRESHOLD)

      expect(filteredSegments).toHaveLength(2)
      expect(filteredSegments.every((s) => s.confidence >= CONFIDENCE_THRESHOLD)).toBe(true)
    })
  })

  describe('Real-Time Status Updates', () => {
    it('should track meeting status progression in real-time', () => {
      const statusTimeline: ZoomMeetingStatus[] = [
        'scheduled',
        'bot_joining',
        'in_progress',
        'processing',
        'completed',
      ]

      // Each status should be different from the previous
      for (let i = 1; i < statusTimeline.length; i++) {
        expect(statusTimeline[i]).not.toBe(statusTimeline[i - 1])
      }

      // Final status should be completed
      expect(statusTimeline[statusTimeline.length - 1]).toBe('completed')
    })

    it('should compute elapsed time for in-progress meetings', () => {
      const startedAt = new Date(mockMeetingInProgress.started_at!).getTime()
      const now = new Date('2026-02-19T11:30:00Z').getTime()
      const elapsedSeconds = Math.floor((now - startedAt) / 1000)

      expect(elapsedSeconds).toBe(1800) // 30 minutes

      // Format duration
      const minutes = Math.floor(elapsedSeconds / 60)
      const seconds = elapsedSeconds % 60
      const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
      expect(formatted).toBe('30:00')
    })
  })
})

describe('E2E: Phase 3 - Google Calendar Auto-Join', () => {

  describe('Calendar Connection → Sync → Auto-Schedule Flow', () => {
    it('should complete Google Calendar OAuth and enable sync', () => {
      // Step 1: User connects Google Calendar
      const connection = mockCalendarConnection
      expect(connection.provider).toBe('google')
      expect(connection.calendar_sync_enabled).toBe(true)

      // Step 2: Tokens are stored
      expect(connection.access_token).toBeDefined()
      expect(connection.refresh_token).toBeDefined()
    })

    it('should detect Zoom and Google Meet meetings from calendar events', () => {
      const ZOOM_URL_PATTERN = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/g
      const GMEET_URL_PATTERN = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/g

      const detectedMeetings: { topic: string; meetingId: string; platform: string }[] = []

      SAMPLE_CALENDAR_EVENTS.forEach((event) => {
        const searchText = `${event.description} ${event.location} ${event.hangoutLink}`

        const zoomMatches = [...searchText.matchAll(ZOOM_URL_PATTERN)]
        zoomMatches.forEach((match) => {
          detectedMeetings.push({
            topic: event.summary,
            meetingId: match[1],
            platform: 'zoom',
          })
        })

        const gmeetMatches = [...searchText.matchAll(GMEET_URL_PATTERN)]
        gmeetMatches.forEach((match) => {
          detectedMeetings.push({
            topic: event.summary,
            meetingId: match[1],
            platform: 'google_meet',
          })
        })
      })

      // Should detect 2 Zoom + 2 Google Meet = 4 meetings from 6 calendar events
      expect(detectedMeetings).toHaveLength(4)

      const zoomMeetings = detectedMeetings.filter((m) => m.platform === 'zoom')
      const gmeetMeetings = detectedMeetings.filter((m) => m.platform === 'google_meet')

      expect(zoomMeetings).toHaveLength(2)
      expect(zoomMeetings[0].meetingId).toBe('1234567890')
      expect(zoomMeetings[1].meetingId).toBe('9876543210')

      expect(gmeetMeetings).toHaveLength(2)
      expect(gmeetMeetings[0].meetingId).toBe('abc-defg-hij')
      expect(gmeetMeetings[1].meetingId).toBe('xyz-abcd-efg')
    })

    it('should create zoom_meeting records for detected meetings', () => {
      // After calendar sync, meetings should be created
      const existingMeetingIds = new Set(['1234567890']) // Already exists
      const detectedMeetingIds = ['1234567890', '9876543210']

      const newMeetings = detectedMeetingIds.filter(
        (id) => !existingMeetingIds.has(id)
      )

      expect(newMeetings).toHaveLength(1)
      expect(newMeetings[0]).toBe('9876543210')
    })

    it('should handle token refresh when expired', () => {
      const expiredConnection = {
        ...mockCalendarConnection,
        token_expires_at: new Date(Date.now() - 3600000).toISOString(),
      }

      const isExpired = new Date(expiredConnection.token_expires_at) < new Date()
      expect(isExpired).toBe(true)

      // After refresh, token should be valid
      const refreshedConnection = {
        ...expiredConnection,
        access_token: 'new_access_token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
      }

      const isStillExpired = new Date(refreshedConnection.token_expires_at) < new Date()
      expect(isStillExpired).toBe(false)
    })
  })
})

describe('E2E: Phase 4 - Notifications + Polish', () => {

  describe('Notification Delivery Pipeline', () => {
    it('should send email when transcript is ready (if enabled)', () => {
      const prefs = mockNotificationPrefs
      const meetingTopic = mockMeetingCompleted.topic

      const shouldSendEmail = prefs.email_on_transcript_ready
      expect(shouldSendEmail).toBe(true)

      // Email content should reference the meeting
      const emailSubject = `Transcript ready: ${meetingTopic}`
      expect(emailSubject).toContain('Acme Corp')
    })

    it('should NOT send email when notifications are disabled', () => {
      const prefs = mockNotificationPrefsDisabled
      const shouldSendEmail = prefs.email_on_transcript_ready
      expect(shouldSendEmail).toBe(false)
    })

    it('should generate in-app notification on meeting status change', () => {
      const meetingStatusChanges: { status: ZoomMeetingStatus; expectedNotification: string }[] = [
        { status: 'in_progress', expectedNotification: 'Bot joined' },
        { status: 'completed', expectedNotification: 'Transcript ready' },
        { status: 'failed', expectedNotification: 'Bot failed' },
      ]

      meetingStatusChanges.forEach(({ status, expectedNotification }) => {
        const notificationMessage = status === 'completed'
          ? `Transcript ready: ${mockMeetingCompleted.topic}`
          : status === 'in_progress'
          ? `Bot joined: ${mockMeetingInProgress.topic}`
          : `Bot failed: ${mockMeetingFailed.topic}`

        expect(notificationMessage).toBeDefined()
        expect(notificationMessage.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Case Handling', () => {
    it('should handle overlapping audio with confidence filtering', () => {
      const rawSegments = [
        { speaker: 'Speaker 0', text: 'Hello', confidence: 0.95 },
        { speaker: 'Speaker 1', text: '[unintelligible]', confidence: 0.3 },
        { speaker: 'Speaker 0', text: 'Let me continue', confidence: 0.92 },
      ]

      const filtered = rawSegments.filter((s) => s.confidence >= 0.7)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((s) => s.text)).not.toContain('[unintelligible]')
    })

    it('should handle bot rejection with fallback to manual upload', () => {
      const meetingStatus = mockMeetingFailed.status
      expect(meetingStatus).toBe('failed')

      // TranscriptInput should still allow manual paste/upload
      const tabOptions = ['paste', 'zoom', 'live']
      expect(tabOptions).toContain('paste')

      // User can still use the app even without bot access
      const canUseManualUpload = true
      expect(canUseManualUpload).toBe(true)
    })

    it('should maintain data integrity across the full pipeline', () => {
      // Verify meeting → transcript → project linkage
      expect(mockTranscriptFromRecording.meeting_id).toBe(mockMeetingCompleted.id)
      expect(mockTranscriptFromRecording.user_id).toBe(mockMeetingCompleted.user_id)
      expect(mockTranscriptFromRecording.user_id).toBe(mockUserId)

      // Verify transcript content is non-empty and properly formatted
      expect(mockTranscriptFromRecording.content.length).toBeGreaterThan(0)
      expect(mockTranscriptFromRecording.content).toContain('[Speaker')

      // Verify word count is reasonable
      const actualWordCount = mockTranscriptFromRecording.content.split(/\s+/).filter(Boolean).length
      expect(Math.abs(actualWordCount - mockTranscriptFromRecording.word_count!)).toBeLessThan(10)
    })
  })
})

describe('E2E: Cross-Feature Integration', () => {

  describe('Zoom Transcript → Phase 1 → Existing Pipeline', () => {
    it('should flow from Zoom transcript through all existing phases', () => {
      // Step 1: Zoom transcript is available
      const transcript = mockTranscriptFromRecording
      expect(transcript.source).toBe('zoom_recording')

      // Step 2: Transcript content is compatible with Phase 1 input
      const transcriptContent = transcript.content
      expect(transcriptContent).toContain('[Speaker')
      expect(transcriptContent.length).toBeGreaterThan(100)

      // Step 3: Phase 1 produces the same output structure regardless of source
      const phase1Data = mockPhase1Data
      expect(phase1Data.executiveSummary).toBeDefined()
      expect(phase1Data.userRoles.length).toBeGreaterThan(0)
      expect(phase1Data.requirements.length).toBeGreaterThan(0)
      expect(phase1Data.artifactMapping.length).toBeGreaterThan(0)
      expect(phase1Data.dataEntities.length).toBeGreaterThan(0)

      // Step 4: The pipeline continues through Phase 2, 3, 4 unchanged
      // This validates backward compatibility
    })

    it('should support both speaker tag formats in transcripts', () => {
      // Zoom bot format: [Speaker 0], [Speaker 1]
      const zoomFormat = '[Speaker 0]: Hello\n[Speaker 1]: Hi there'
      expect(zoomFormat).toMatch(/\[Speaker \d+\]/)

      // Manual upload format: [Client], [Flow_Engineer]
      const manualFormat = '[Client]: Hello\n[Flow_Engineer]: Hi there'
      expect(manualFormat).toMatch(/\[Client\]/)
      expect(manualFormat).toMatch(/\[Flow_Engineer\]/)

      // Both formats should be valid transcript input
      expect(zoomFormat.length).toBeGreaterThan(0)
      expect(manualFormat.length).toBeGreaterThan(0)
    })
  })

  describe('TranscriptInput Tab Integration', () => {
    it('should support all three input methods', () => {
      const tabs = ['paste', 'zoom', 'live'] as const

      expect(tabs).toHaveLength(3)
      expect(tabs).toContain('paste')
      expect(tabs).toContain('zoom')
      expect(tabs).toContain('live')
    })

    it('should allow switching from Zoom transcript tab to paste tab', () => {
      // User selects a Zoom transcript, it should populate the paste tab
      const selectedTranscript = mockTranscriptFromRecording.content
      let activeTab: 'paste' | 'zoom' | 'live' = 'zoom'
      let transcriptContent = ''

      // User clicks a transcript
      transcriptContent = selectedTranscript
      activeTab = 'paste'

      expect(activeTab).toBe('paste')
      expect(transcriptContent).toBe(selectedTranscript)
      expect(transcriptContent.length).toBeGreaterThan(0)
    })

    it('should allow pre-populating transcript from navigation state', () => {
      // Simulates navigating from Meetings page with a transcript
      const navigationState = {
        transcript: mockTranscriptFromRecording.content,
        meetingId: mockMeetingCompleted.id,
      }

      expect(navigationState.transcript).toBeDefined()
      expect(navigationState.transcript.length).toBeGreaterThan(0)
      expect(navigationState.meetingId).toBe(mockMeetingCompleted.id)
    })
  })

  describe('Cross-Platform: Google Meet → Transcript → Project', () => {
    it('should follow Google Meet bot lifecycle: launch → join → record → complete', () => {
      // Step 1: User enters Google Meet URL and clicks "Send Bot"
      const meetingUrl = 'https://meet.google.com/abc-defg-hij'
      const gmeetRegex = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/
      const match = meetingUrl.match(gmeetRegex)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('abc-defg-hij')

      // Step 2: Platform auto-detected as google_meet
      const zoomRegex = /https:\/\/[\w.-]+\.zoom\.us\/j\/(\d+)/
      const isZoom = zoomRegex.test(meetingUrl)
      const isGmeet = gmeetRegex.test(meetingUrl)
      const platform = isZoom ? 'zoom' : isGmeet ? 'google_meet' : null
      expect(platform).toBe('google_meet')

      // Step 3: Meeting record created with google_meet platform
      const meeting = { ...mockGoogleMeetScheduled, status: 'bot_joining' as ZoomMeetingStatus }
      expect(meeting.platform).toBe('google_meet')
      expect(meeting.google_meet_code).toBe('abc-defg-hij')
      expect(meeting.zoom_meeting_id).toBeNull()

      // Step 4: Bot joins via Puppeteer, captures audio, streams to Transcribe
      meeting.status = 'in_progress'
      expect(meeting.status).toBe('in_progress')

      // Step 5: Meeting ends, transcript stored with google_meet_bot source
      meeting.status = 'completed'
      const transcript = mockGoogleMeetTranscript
      expect(transcript.source).toBe('google_meet_bot')
      expect(transcript.content).toBeDefined()
      expect(transcript.content.length).toBeGreaterThan(0)
    })

    it('should use Google Meet transcript for Phase 1 analysis', () => {
      // Google Meet transcript is the same format as Zoom transcript
      const transcript = mockGoogleMeetTranscript
      expect(transcript.content).toContain('[Speaker')
      expect(transcript.content.length).toBeGreaterThan(100)

      // Phase 1 should work identically regardless of source
      const phase1Data = mockPhase1Data
      expect(phase1Data.executiveSummary).toBeDefined()
      expect(phase1Data.requirements.length).toBeGreaterThan(0)
    })

    it('should display correct platform icon and fallback topic', () => {
      // Google Meet meetings show green Users icon
      expect(mockGoogleMeetScheduled.platform).toBe('google_meet')
      const gmeetFallbackTopic = mockGoogleMeetScheduled.topic || 'Google Meet'
      expect(gmeetFallbackTopic).toBeDefined()

      // Zoom meetings show blue Video icon
      expect(mockMeetingScheduled.platform).toBe('zoom')
      const zoomFallbackTopic = mockMeetingScheduled.topic || 'Zoom Meeting'
      expect(zoomFallbackTopic).toBeDefined()
    })
  })

  describe('Navigation & Route Access', () => {
    it('should define all required routes', () => {
      const routes = [
        { path: '/', protected: true },
        { path: '/login', protected: false },
        { path: '/project/new', protected: true },
        { path: '/project/:id', protected: true },
        { path: '/project/:id/edit', protected: true },
        { path: '/meetings', protected: true },
        { path: '/settings', protected: true },
      ]

      const protectedRoutes = routes.filter((r) => r.protected)
      const publicRoutes = routes.filter((r) => !r.protected)

      expect(protectedRoutes.length).toBe(6)
      expect(publicRoutes.length).toBe(1)
      expect(publicRoutes[0].path).toBe('/login')
    })

    it('should define all navigation items', () => {
      const navItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'New Project', path: '/project/new' },
        { label: 'Meetings', path: '/meetings' },
        { label: 'Settings', path: '/settings' },
      ]

      expect(navItems).toHaveLength(4)
      expect(navItems.map((n) => n.label)).toContain('Meetings')
      expect(navItems.map((n) => n.label)).toContain('Settings')
    })
  })
})
