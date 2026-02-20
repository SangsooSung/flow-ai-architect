import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  AudioStream,
  LanguageCode,
  MediaEncoding,
} from "@aws-sdk/client-transcribe-streaming";

export interface TranscribeConfig {
  region: string;
  languageCode: string;
  mediaSampleRateHertz: number;
  mediaEncoding: string;
  showSpeakerLabel: boolean;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  isPartial: boolean;
  confidence: number;
}

type TranscriptCallback = (segment: TranscriptSegment) => void;

export class TranscribeStream {
  private client: TranscribeStreamingClient;
  private config: TranscribeConfig;
  private transcriptCallback: TranscriptCallback | null = null;
  private audioBuffer: Buffer[] = [];
  private isStreaming = false;
  private audioStream: AsyncGenerator<AudioStream, void, unknown> | null = null;
  private resolveAudioChunk: ((value: IteratorResult<AudioStream, void>) => void) | null = null;

  constructor(config: TranscribeConfig) {
    this.config = config;
    this.client = new TranscribeStreamingClient({
      region: config.region,
    });
  }

  /**
   * Register callback for transcription results.
   */
  onTranscript(callback: TranscriptCallback) {
    this.transcriptCallback = callback;
  }

  /**
   * Start the transcription stream.
   */
  async start(): Promise<void> {
    this.isStreaming = true;

    const audioStream = this.createAudioStream();

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: this.config.languageCode as LanguageCode,
      MediaEncoding: this.config.mediaEncoding as MediaEncoding,
      MediaSampleRateHertz: this.config.mediaSampleRateHertz,
      AudioStream: audioStream,
      ShowSpeakerLabel: this.config.showSpeakerLabel,
      EnablePartialResultsStabilization: true,
      PartialResultsStability: "high",
    });

    try {
      const response = await this.client.send(command);

      if (response.TranscriptResultStream) {
        for await (const event of response.TranscriptResultStream) {
          if (!this.isStreaming) break;

          if (event.TranscriptEvent?.Transcript?.Results) {
            for (const result of event.TranscriptEvent.Transcript.Results) {
              if (result.IsPartial) continue; // Skip partial results for cleaner output

              const alternatives = result.Alternatives || [];
              if (alternatives.length === 0) continue;

              const alternative = alternatives[0];
              const items = alternative.Items || [];

              // Extract speaker labels
              let currentSpeaker = "Speaker 0";
              const segments: TranscriptSegment[] = [];

              for (const item of items) {
                if (item.Speaker !== undefined) {
                  currentSpeaker = `Speaker ${item.Speaker}`;
                }

                if (item.Content && item.Type === "pronunciation") {
                  const confidence = item.Confidence ?? 1.0;

                  // Skip low-confidence segments
                  if (confidence < 0.7) continue;

                  segments.push({
                    speaker: currentSpeaker,
                    text: item.Content,
                    startTime: item.StartTime ?? 0,
                    endTime: item.EndTime ?? 0,
                    isPartial: result.IsPartial ?? false,
                    confidence,
                  });
                }
              }

              // Group consecutive segments by speaker
              if (segments.length > 0 && alternative.Transcript) {
                const segment: TranscriptSegment = {
                  speaker: segments[0].speaker,
                  text: alternative.Transcript,
                  startTime: segments[0].startTime,
                  endTime: segments[segments.length - 1].endTime,
                  isPartial: false,
                  confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length,
                };

                this.transcriptCallback?.(segment);
              }
            }
          }
        }
      }
    } catch (error) {
      if (this.isStreaming) {
        console.error("Transcribe stream error:", error);
        throw error;
      }
      // Expected error when stream is stopped
    }
  }

  /**
   * Send raw audio data to the transcription stream.
   * Audio should be PCM 16-bit, 16kHz, mono.
   */
  sendAudio(chunk: Buffer) {
    if (!this.isStreaming) return;

    if (this.resolveAudioChunk) {
      this.resolveAudioChunk({
        value: { AudioEvent: { AudioChunk: chunk } },
        done: false,
      });
      this.resolveAudioChunk = null;
    } else {
      this.audioBuffer.push(chunk);
    }
  }

  /**
   * Stop the transcription stream.
   */
  async stop(): Promise<void> {
    this.isStreaming = false;

    // Signal end of audio stream
    if (this.resolveAudioChunk) {
      this.resolveAudioChunk({ value: undefined as unknown as AudioStream, done: true });
      this.resolveAudioChunk = null;
    }
  }

  /**
   * Create an async generator that yields audio chunks for the Transcribe API.
   */
  private async *createAudioStream(): AsyncGenerator<AudioStream, void, unknown> {
    while (this.isStreaming) {
      if (this.audioBuffer.length > 0) {
        const chunk = this.audioBuffer.shift()!;
        yield { AudioEvent: { AudioChunk: chunk } };
      } else {
        // Wait for the next audio chunk
        await new Promise<IteratorResult<AudioStream, void>>((resolve) => {
          this.resolveAudioChunk = resolve;
        });
      }
    }
  }
}
