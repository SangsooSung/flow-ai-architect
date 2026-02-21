import type { TranscriptSegment } from "./transcribe-stream";

/**
 * Callback client for sending results back to the Supabase Edge Function
 * when the bot finishes recording a meeting.
 */

interface SuccessPayload {
  transcript: string;
  speakerSegments: TranscriptSegment[];
  wordCount: number;
  durationSeconds: number;
}

export class CallbackClient {
  private callbackUrl: string;
  private meetingId: string;
  private userId: string;
  private secret: string;

  constructor(callbackUrl: string, meetingId: string, userId: string) {
    this.callbackUrl = callbackUrl;
    this.meetingId = meetingId;
    this.userId = userId;
    this.secret = process.env.BOT_CALLBACK_SECRET || "";
  }

  /**
   * Send successful transcript data back to the server.
   */
  async sendSuccess(payload: SuccessPayload): Promise<void> {
    console.log(
      `Sending successful callback for meeting ${this.meetingId} ` +
        `(${payload.wordCount} words, ${payload.durationSeconds}s)`
    );

    await this.post({
      meeting_id: this.meetingId,
      user_id: this.userId,
      status: "completed",
      transcript: payload.transcript,
      speaker_segments: payload.speakerSegments,
      word_count: payload.wordCount,
      duration_seconds: payload.durationSeconds,
    });
  }

  /**
   * Send failure notification back to the server.
   */
  async sendFailure(errorMessage: string): Promise<void> {
    console.log(
      `Sending failure callback for meeting ${this.meetingId}: ${errorMessage}`
    );

    await this.post({
      meeting_id: this.meetingId,
      user_id: this.userId,
      status: "failed",
      error_message: errorMessage,
    });
  }

  private async post(body: Record<string, unknown>): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(this.callbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Callback-Secret": this.secret,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          console.log(`Callback sent successfully (attempt ${attempt + 1})`);
          return;
        }

        const errorText = await response.text();
        lastError = new Error(
          `Callback failed with status ${response.status}: ${errorText}`
        );
        console.error(`Callback attempt ${attempt + 1} failed:`, lastError.message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Callback attempt ${attempt + 1} error:`, lastError.message);
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error(
      `All ${maxRetries} callback attempts failed for meeting ${this.meetingId}`,
      lastError
    );
  }
}
