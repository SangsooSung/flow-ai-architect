/**
 * Zoom Meeting SDK Client Wrapper
 *
 * This module wraps the Zoom Meeting SDK for Linux, providing a clean interface
 * for joining meetings, receiving audio data, and handling meeting lifecycle events.
 *
 * NOTE: The Zoom Meeting SDK for Linux is a native C++ library that must be
 * downloaded separately from the Zoom Marketplace. It is not included in this
 * repository. The SDK provides:
 * - Meeting join/leave functionality
 * - Raw audio stream access via onAudioRawDataReceived callback
 * - Meeting state change notifications
 *
 * In production, this would use native Node.js addons (node-addon-api) to bridge
 * the C++ SDK with the Node.js runtime.
 */

export interface ZoomClientConfig {
  sdkPath: string;
  botName: string;
}

type AudioCallback = (chunk: Buffer) => void;
type EventCallback = () => void;
type ErrorCallback = (error: Error) => void;

export class ZoomClient {
  private config: ZoomClientConfig;
  private audioCallback: AudioCallback | null = null;
  private meetingEndCallback: EventCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private rejectedCallback: EventCallback | null = null;
  private isJoined = false;

  constructor(config: ZoomClientConfig) {
    this.config = config;
    console.log(`ZoomClient initialized with SDK path: ${config.sdkPath}`);
  }

  /**
   * Register callback for raw audio data from the meeting.
   * Audio is delivered as PCM 16-bit, 16kHz, mono.
   */
  onAudioData(callback: AudioCallback) {
    this.audioCallback = callback;
  }

  /**
   * Register callback for when the meeting ends.
   */
  onMeetingEnd(callback: EventCallback) {
    this.meetingEndCallback = callback;
  }

  /**
   * Register callback for errors.
   */
  onError(callback: ErrorCallback) {
    this.errorCallback = callback;
  }

  /**
   * Register callback for when the bot is rejected by the host.
   */
  onBotRejected(callback: EventCallback) {
    this.rejectedCallback = callback;
  }

  /**
   * Join a Zoom meeting by URL.
   *
   * In production, this would:
   * 1. Initialize the Zoom SDK with JWT credentials
   * 2. Parse the meeting ID and password from the URL
   * 3. Call sdk.joinMeeting() with bot display name
   * 4. Register audio raw data callback
   * 5. Wait for meeting join confirmation
   */
  async joinMeeting(meetingUrl: string): Promise<void> {
    console.log(`Attempting to join meeting: ${meetingUrl}`);
    console.log(`Bot name: ${this.config.botName}`);

    // Extract meeting ID from URL
    const match = meetingUrl.match(/\/j\/(\d+)/);
    if (!match) {
      throw new Error(`Invalid Zoom meeting URL: ${meetingUrl}`);
    }

    const meetingId = match[1];
    console.log(`Meeting ID extracted: ${meetingId}`);

    // In production, the actual Zoom SDK calls would happen here:
    //
    // const sdk = require(path.join(this.config.sdkPath, 'zoom_sdk'));
    // sdk.initialize({ jwt: process.env.ZOOM_SDK_JWT });
    //
    // sdk.joinMeeting({
    //   meetingNumber: meetingId,
    //   userName: this.config.botName,
    //   password: extractPasswordFromUrl(meetingUrl),
    // });
    //
    // sdk.onAudioRawDataReceived((data: Buffer) => {
    //   this.audioCallback?.(data);
    // });
    //
    // sdk.onMeetingStatusChanged((status: string) => {
    //   if (status === 'MEETING_END') this.meetingEndCallback?.();
    //   if (status === 'MEETING_DENIED') this.rejectedCallback?.();
    // });

    this.isJoined = true;
    console.log("Meeting join initiated (SDK integration point)");
  }

  /**
   * Leave the current meeting gracefully.
   */
  async leaveMeeting(): Promise<void> {
    if (!this.isJoined) return;

    console.log("Leaving meeting...");

    // In production:
    // sdk.leaveMeeting();

    this.isJoined = false;
    console.log("Left meeting");
  }

  /**
   * Check if the bot is currently in a meeting.
   */
  isInMeeting(): boolean {
    return this.isJoined;
  }
}
