import type { TranscriptSegment } from "./transcribe-stream";

/**
 * Speaker Diarization Formatter
 *
 * Collects speaker-diarized transcript segments from Amazon Transcribe
 * and formats them into a readable transcript with speaker tags.
 *
 * Output format matches the expected input for Flow AI Architect's Phase 1:
 * [Speaker 0]: Thanks for joining today. Let's walk through your current process.
 * [Speaker 1]: Sure. Right now, we manage everything through spreadsheets...
 */
export class DiarizationFormatter {
  private segments: TranscriptSegment[] = [];
  private startTime: number | null = null;
  private endTime: number | null = null;

  /**
   * Add a transcript segment from the streaming transcription.
   */
  addSegment(segment: TranscriptSegment) {
    this.segments.push(segment);

    if (this.startTime === null || segment.startTime < this.startTime) {
      this.startTime = segment.startTime;
    }
    if (this.endTime === null || segment.endTime > this.endTime) {
      this.endTime = segment.endTime;
    }
  }

  /**
   * Get all collected segments.
   */
  getSegments(): TranscriptSegment[] {
    return [...this.segments];
  }

  /**
   * Get the formatted transcript with speaker tags.
   *
   * Groups consecutive segments by speaker and formats as:
   * [Speaker 0]: text text text
   * [Speaker 1]: text text text
   */
  getFormattedTranscript(): string {
    if (this.segments.length === 0) return "";

    const lines: string[] = [];
    let currentSpeaker = "";

    for (const segment of this.segments) {
      if (segment.speaker !== currentSpeaker) {
        currentSpeaker = segment.speaker;
        lines.push(`\n[${currentSpeaker}]: ${segment.text}`);
      } else {
        // Append to the last line
        if (lines.length > 0) {
          lines[lines.length - 1] += ` ${segment.text}`;
        } else {
          lines.push(`[${currentSpeaker}]: ${segment.text}`);
        }
      }
    }

    return lines.join("\n").trim();
  }

  /**
   * Get the total duration of the recorded session in seconds.
   */
  getDurationSeconds(): number {
    if (this.startTime === null || this.endTime === null) return 0;
    return Math.round(this.endTime - this.startTime);
  }

  /**
   * Get unique speaker labels found in the transcript.
   */
  getSpeakers(): string[] {
    const speakers = new Set<string>();
    for (const segment of this.segments) {
      speakers.add(segment.speaker);
    }
    return Array.from(speakers).sort();
  }

  /**
   * Attempt to map generic speaker labels to meaningful names.
   *
   * Heuristic: The first speaker in a meeting is often the host/engineer,
   * and subsequent speakers are often clients. This can be refined later
   * with additional context (meeting host info, calendar data, etc.)
   */
  mapSpeakerLabels(labelMap?: Record<string, string>): string {
    const transcript = this.getFormattedTranscript();

    if (!labelMap) {
      // Default mapping: first speaker is Flow_Engineer, second is Client
      const speakers = this.getSpeakers();
      labelMap = {};
      if (speakers.length >= 1) labelMap[speakers[0]] = "Flow_Engineer";
      if (speakers.length >= 2) labelMap[speakers[1]] = "Client";
      // Additional speakers keep their numeric labels
    }

    let mapped = transcript;
    for (const [original, replacement] of Object.entries(labelMap)) {
      mapped = mapped.replace(
        new RegExp(`\\[${original}\\]`, "g"),
        `[${replacement}]`
      );
    }

    return mapped;
  }
}
