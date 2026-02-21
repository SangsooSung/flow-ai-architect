/**
 * Google Meet Client via Puppeteer
 *
 * This module uses headless Chrome (Puppeteer) to join Google Meet meetings,
 * authenticate with a service account, and capture audio for transcription.
 *
 * Unlike the Zoom bot which uses the native Zoom Meeting SDK, Google Meet
 * does not provide a Meeting SDK. Instead, we:
 * 1. Launch headless Chrome with auto-grant media permissions
 * 2. Navigate to the Google Meet URL
 * 3. Authenticate using pre-configured Google account credentials
 * 4. Click "Join now" to enter the meeting
 * 5. Capture system audio via PulseAudio virtual sink
 * 6. Stream the audio as PCM data to Amazon Transcribe
 */

import puppeteer, { Browser, Page } from "puppeteer-core";
import { ChildProcess, spawn } from "child_process";

export interface MeetClientConfig {
  botName: string;
  googleEmail?: string;
  googlePassword?: string;
}

type AudioCallback = (chunk: Buffer) => void;
type EventCallback = () => void;
type ErrorCallback = (error: Error) => void;

export class MeetClient {
  private config: MeetClientConfig;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private audioCallback: AudioCallback | null = null;
  private meetingEndCallback: EventCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private rejectedCallback: EventCallback | null = null;
  private isJoined = false;
  private pulseProcess: ChildProcess | null = null;
  private meetingCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: MeetClientConfig) {
    this.config = config;
    console.log(`MeetClient initialized for bot: ${config.botName}`);
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
   * Register callback for when the bot is rejected/removed.
   */
  onBotRejected(callback: EventCallback) {
    this.rejectedCallback = callback;
  }

  /**
   * Join a Google Meet meeting by URL.
   *
   * Flow:
   * 1. Start PulseAudio with virtual sink for audio capture
   * 2. Launch headless Chrome with media permissions auto-granted
   * 3. Navigate to the Meet URL
   * 4. Handle Google authentication if needed
   * 5. Click "Join now" button
   * 6. Start capturing audio from PulseAudio monitor
   */
  async joinMeeting(meetingUrl: string): Promise<void> {
    console.log(`Attempting to join Google Meet: ${meetingUrl}`);

    // Extract meet code from URL
    const match = meetingUrl.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
    if (!match) {
      throw new Error(`Invalid Google Meet URL: ${meetingUrl}`);
    }

    const meetCode = match[1];
    console.log(`Meet code extracted: ${meetCode}`);

    try {
      // Start PulseAudio for audio capture
      await this.startPulseAudio();

      // Launch headless Chrome
      this.browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--use-fake-ui-for-media-stream",
          "--use-fake-device-for-media-stream",
          "--auto-accept-camera-and-microphone-capture",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          `--window-size=1280,720`,
        ],
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });

      // Navigate to Google Meet
      console.log(`Navigating to ${meetingUrl}`);
      await this.page.goto(meetingUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Handle Google sign-in if required
      await this.handleAuthentication();

      // Disable camera and microphone before joining
      await this.disableMediaBeforeJoin();

      // Set display name for the bot
      await this.setBotName();

      // Click "Join now" or "Ask to join" button
      await this.clickJoinButton();

      this.isJoined = true;
      console.log("Successfully joined Google Meet");

      // Start audio capture from PulseAudio
      this.startAudioCapture();

      // Start polling for meeting end
      this.startMeetingEndDetection();
    } catch (error) {
      console.error("Failed to join Google Meet:", error);
      this.errorCallback?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Leave the current meeting gracefully.
   */
  async leaveMeeting(): Promise<void> {
    if (!this.isJoined) return;

    console.log("Leaving Google Meet...");

    // Stop meeting end detection
    if (this.meetingCheckInterval) {
      clearInterval(this.meetingCheckInterval);
      this.meetingCheckInterval = null;
    }

    // Stop audio capture
    if (this.pulseProcess) {
      this.pulseProcess.kill();
      this.pulseProcess = null;
    }

    // Click leave button in the meeting
    try {
      if (this.page) {
        // Click the "Leave call" button (hangup icon)
        await this.page.evaluate(() => {
          const leaveButton = document.querySelector('[aria-label="Leave call"]') as HTMLElement;
          if (leaveButton) leaveButton.click();
        });
      }
    } catch {
      // Best effort - page might already be closed
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    this.isJoined = false;
    console.log("Left Google Meet");
  }

  /**
   * Check if the bot is currently in a meeting.
   */
  isInMeeting(): boolean {
    return this.isJoined;
  }

  private async startPulseAudio(): Promise<void> {
    console.log("Starting PulseAudio...");

    // In production, this starts PulseAudio with a virtual sink
    // to capture system audio from Chrome:
    //
    // pulseaudio --start --exit-idle-time=-1
    // pactl load-module module-null-sink sink_name=virtual_speaker
    // pactl set-default-sink virtual_speaker
    //
    // The monitor source of virtual_speaker captures all audio
    // that Chrome plays (i.e., meeting audio from other participants)

    console.log("PulseAudio started (integration point)");
  }

  private startAudioCapture(): void {
    console.log("Starting audio capture from PulseAudio monitor...");

    // In production, this captures audio from the PulseAudio monitor source:
    //
    // parec --format=s16le --rate=16000 --channels=1 \
    //   -d virtual_speaker.monitor
    //
    // This outputs raw PCM 16-bit, 16kHz, mono audio to stdout,
    // which we pipe to the TranscribeStream.

    // Spawn parec process for audio capture
    this.pulseProcess = spawn("parec", [
      "--format=s16le",
      "--rate=16000",
      "--channels=1",
      "-d", "virtual_speaker.monitor",
    ]);

    this.pulseProcess.stdout?.on("data", (chunk: Buffer) => {
      this.audioCallback?.(chunk);
    });

    this.pulseProcess.stderr?.on("data", (data: Buffer) => {
      console.error("PulseAudio stderr:", data.toString());
    });

    this.pulseProcess.on("exit", (code) => {
      console.log(`PulseAudio capture exited with code ${code}`);
    });

    console.log("Audio capture started");
  }

  private async handleAuthentication(): Promise<void> {
    if (!this.page) return;

    // Check if we're on a sign-in page
    const isSignInPage = await this.page.evaluate(() => {
      return document.querySelector('input[type="email"]') !== null;
    });

    if (isSignInPage && this.config.googleEmail && this.config.googlePassword) {
      console.log("Authentication required, signing in...");

      // Enter email
      await this.page.type('input[type="email"]', this.config.googleEmail);
      await this.page.click("#identifierNext");
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});

      // Enter password
      await this.page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
      await this.page.type('input[type="password"]', this.config.googlePassword);
      await this.page.click("#passwordNext");
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});

      console.log("Authentication completed");
    }
  }

  private async disableMediaBeforeJoin(): Promise<void> {
    if (!this.page) return;

    // Turn off camera and microphone before joining
    // The bot only needs to listen, not transmit
    try {
      await this.page.evaluate(() => {
        // Click camera off button
        const cameraButton = document.querySelector('[aria-label="Turn off camera"]') as HTMLElement;
        if (cameraButton) cameraButton.click();

        // Click microphone off button
        const micButton = document.querySelector('[aria-label="Turn off microphone"]') as HTMLElement;
        if (micButton) micButton.click();
      });
    } catch {
      // Buttons may not be present; continue
    }
  }

  private async setBotName(): Promise<void> {
    if (!this.page) return;

    // Try to set the display name in the "What's your name?" field
    // that appears for guests joining without a Google account
    try {
      const nameInput = await this.page.$('input[aria-label="Your name"]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 }); // Select all existing text
        await nameInput.type(this.config.botName);
      }
    } catch {
      // Name field may not be present if authenticated
    }
  }

  private async clickJoinButton(): Promise<void> {
    if (!this.page) return;

    // Try multiple selectors for the join button
    // Google Meet UI varies based on context (guest, authenticated, etc.)
    const joinSelectors = [
      'button[jsname="Qx7uuf"]',               // "Join now" button
      '[aria-label="Join now"]',
      '[aria-label="Ask to join"]',
      'button:has-text("Join now")',
      'button:has-text("Ask to join")',
    ];

    for (const selector of joinSelectors) {
      try {
        const button = await this.page.waitForSelector(selector, { timeout: 5000 });
        if (button) {
          await button.click();
          console.log(`Clicked join button with selector: ${selector}`);

          // Wait for meeting to load
          await this.page.waitForTimeout(3000);
          return;
        }
      } catch {
        continue;
      }
    }

    // Fallback: try clicking any button that contains "Join" text
    const clicked = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const joinButton = buttons.find(
        (b) => b.textContent?.includes("Join") || b.textContent?.includes("Ask to join")
      );
      if (joinButton) {
        joinButton.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      throw new Error("Could not find join button");
    }
  }

  private startMeetingEndDetection(): void {
    // Poll for meeting end indicators
    this.meetingCheckInterval = setInterval(async () => {
      if (!this.page || !this.isJoined) return;

      try {
        const meetingEnded = await this.page.evaluate(() => {
          // Check for "You've been removed" or "The meeting has ended" dialogs
          const body = document.body.innerText;
          return (
            body.includes("You've been removed from the meeting") ||
            body.includes("The meeting has ended") ||
            body.includes("You left the meeting") ||
            body.includes("Return to home screen")
          );
        });

        if (meetingEnded) {
          console.log("Meeting end detected");
          if (this.meetingCheckInterval) {
            clearInterval(this.meetingCheckInterval);
            this.meetingCheckInterval = null;
          }
          this.meetingEndCallback?.();
        }

        // Check for removal/rejection
        const wasRejected = await this.page.evaluate(() => {
          const body = document.body.innerText;
          return (
            body.includes("You've been removed from the meeting") ||
            body.includes("You can't join this meeting")
          );
        });

        if (wasRejected) {
          console.log("Bot was rejected/removed from meeting");
          if (this.meetingCheckInterval) {
            clearInterval(this.meetingCheckInterval);
            this.meetingCheckInterval = null;
          }
          this.rejectedCallback?.();
        }
      } catch {
        // Page might be navigating; ignore
      }
    }, 5000);
  }
}
