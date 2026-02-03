/**
 * Audio Service for Quran Recitation
 *
 * Handles audio playback for Quranic verses using expo-audio.
 * Default reciter: Mishary Rashid Alafasy
 */

import { createAudioPlayer, AudioPlayer as ExpoAudioPlayer, AudioStatus } from 'expo-audio';

// Popular reciters with their audio base URLs
export const RECITERS = {
  MISHARY_ALAFASY: {
    id: 7,
    name: 'Mishary Rashid Alafasy',
    baseUrl: 'https://everyayah.com/data/Alafasy_128kbps',
  },
  ABDUL_BASIT: {
    id: 1,
    name: 'Abdul Basit Abdul Samad',
    baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
  },
  SUDAIS: {
    id: 6,
    name: 'Abdurrahman as-Sudais',
    baseUrl: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps',
  },
};

// Default reciter
const DEFAULT_RECITER = RECITERS.MISHARY_ALAFASY;

/**
 * Build audio URL for a single verse
 */
function constructUrl(chapter: number, verse: number, reciter = DEFAULT_RECITER): string {
  const paddedChapter = chapter.toString().padStart(3, '0');
  const paddedVerse = verse.toString().padStart(3, '0');
  return `${reciter.baseUrl}/${paddedChapter}${paddedVerse}.mp3`;
}

/**
 * Build audio URL for a verse (legacy support)
 */
export function getAudioUrl(verseKey: string, reciter = DEFAULT_RECITER): string {
  const urls = getAudioUrls(verseKey, reciter);
  return urls[0];
}

/**
 * Build array of audio URLs for a verse or range
 * Format: "2:255" or "30:4-5"
 */
export function getAudioUrls(verseKey: string, reciter = DEFAULT_RECITER): string[] {
  try {
    const [chapterStr, versePart] = verseKey.split(':');
    const chapter = parseInt(chapterStr);

    if (versePart.includes('-')) {
      const [start, end] = versePart.split('-').map((v) => parseInt(v));
      const urls = [];
      for (let v = start; v <= end; v++) {
        urls.push(constructUrl(chapter, v, reciter));
      }
      return urls;
    }

    return [constructUrl(chapter, parseInt(versePart), reciter)];
  } catch (error) {
    console.error('Error parsing verseKey for audio:', verseKey, error);
    return [];
  }
}

export interface PlaybackStatus {
  isPlaying: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  durationMs: number;
  positionMs: number;
  didJustFinish: boolean;
}

/**
 * Audio player class for managing playback using expo-audio
 */
export class AudioPlayer {
  private player: ExpoAudioPlayer | null = null;
  private isPlaying: boolean = false;
  private currentUrl: string | null = null;

  async loadAndPlay(
    audioUrl: string,
    onStatusUpdate?: (status: PlaybackStatus) => void,
  ): Promise<void> {
    try {
      // Unload any existing audio
      await this.unload();

      // Create new player with the audio source
      this.player = createAudioPlayer(audioUrl);
      this.currentUrl = audioUrl;

      // Listen for status updates
      if (onStatusUpdate) {
        this.player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
          const playbackStatus: PlaybackStatus = {
            isPlaying: status.playing,
            isLoaded: true,
            isBuffering: status.isBuffering || false,
            durationMs: (status.duration || 0) * 1000,
            positionMs: (status.currentTime || 0) * 1000,
            didJustFinish: status.didJustFinish || false,
          };
          this.isPlaying = status.playing;
          onStatusUpdate(playbackStatus);
        });
      }

      // Start playback
      this.player.play();
      this.isPlaying = true;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.player) {
      this.player.play();
      this.isPlaying = true;
    }
  }

  async pause(): Promise<void> {
    if (this.player) {
      this.player.pause();
      this.isPlaying = false;
    }
  }

  async togglePlayPause(): Promise<boolean> {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
    return this.isPlaying;
  }

  async seek(positionMs: number): Promise<void> {
    if (this.player) {
      this.player.seekTo(positionMs / 1000); // expo-audio uses seconds
    }
  }

  async unload(): Promise<void> {
    if (this.player) {
      this.player.remove();
      this.player = null;
      this.isPlaying = false;
      this.currentUrl = null;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance for app-wide audio control
let audioPlayerInstance: AudioPlayer | null = null;

export function getAudioPlayer(): AudioPlayer {
  if (!audioPlayerInstance) {
    audioPlayerInstance = new AudioPlayer();
  }
  return audioPlayerInstance;
}

export default {
  getAudioUrl,
  getAudioUrls,
  getAudioPlayer,
  RECITERS,
};
