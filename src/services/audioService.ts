/**
 * Audio Service for Quran Recitation
 *
 * Handles audio playback for Quranic verses using expo-audio.
 * Default reciter: Mishary Rashid Alafasy
 */

import { BuildService } from './buildService';

// We use lazy loading for expo-audio to prevent crashes
// if the native module is missing from the development build.
let AudioModule: any = null;
const getAudioModule = () => {
  if (AudioModule) return AudioModule;
  if (!BuildService.getCapabilities().audio) return null;

  try {
    AudioModule = require('expo-audio');
    return AudioModule;
  } catch (_e) {
    return null;
  }
};

// Popular reciters with their audio base URLs
export const RECITERS = {
  YASSER_ALDOSARI: {
    id: 8,
    name: 'Yasser Al-Dosari',
    baseUrl: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps',
  },
  MAHER_MUAIQLY: {
    id: 9,
    name: 'Maher Al Muaiqly',
    baseUrl: 'https://everyayah.com/data/MaherAlMuaiqly128kbps',
  },
  FARES_ABBAD: {
    id: 10,
    name: 'Fares Abbad',
    baseUrl: 'https://everyayah.com/data/Fares_Abbad_64kbps',
  },
  SHAATREE: {
    id: 11,
    name: 'Abu Bakr Ash-Shaatree',
    baseUrl: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps',
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
  HUSARY: {
    id: 4,
    name: 'Mahmoud Khalil Al-Husary',
    baseUrl: 'https://everyayah.com/data/Husary_128kbps',
  },
  GHAMADI: {
    id: 3,
    name: 'Saad al-Ghamadi',
    baseUrl: 'https://everyayah.com/data/Ghamadi_40kbps',
  },
};

// Default reciter
export const DEFAULT_RECITER = RECITERS.YASSER_ALDOSARI;

// Fallback chain should the primary reciter's audio file not exist
export const RECITER_FALLBACKS = [
  RECITERS.YASSER_ALDOSARI,
  RECITERS.MAHER_MUAIQLY,
  RECITERS.FARES_ABBAD,
];

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
 * Format: "2:255", "30:4-5" or prefix with reciter ID "1:2:255"
 */
export function getAudioUrls(verseKey: string, reciter = DEFAULT_RECITER): string[] {
  try {
    const parts = verseKey.split(':');
    let chapterStr: string;
    let versePart: string;
    let selectedReciter = reciter;

    if (parts.length === 3) {
      // Format: [RECITER_ID]:CHAPTER:VERSE
      const reciterId = parseInt(parts[0]);
      const foundReciter = Object.values(RECITERS).find((r) => r.id === reciterId);
      if (foundReciter) {
        selectedReciter = foundReciter;
      }
      chapterStr = parts[1];
      versePart = parts[2];
    } else {
      // Format: CHAPTER:VERSE
      chapterStr = parts[0];
      versePart = parts[1];
    }

    const chapter = parseInt(chapterStr);

    if (versePart.includes('-')) {
      const [start, end] = versePart.split('-').map((v) => parseInt(v));
      const urls = [];
      for (let v = start; v <= end; v++) {
        urls.push(constructUrl(chapter, v, selectedReciter));
      }
      return urls;
    }

    return [constructUrl(chapter, parseInt(versePart), selectedReciter)];
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
  private player: any = null;
  private isPlaying: boolean = false;
  private currentUrl: string | null = null;
  private subscription: { remove: () => void } | null = null;

  async loadAndPlay(
    audioUrl: string,
    onStatusUpdate?: (status: PlaybackStatus) => void,
  ): Promise<void> {
    const module = getAudioModule();
    if (!module) {
      console.warn('Cannot load audio: expo-audio module missing');
      return;
    }

    try {
      // Unload any existing audio
      await this.unload();

      // Create new player with the audio source
      this.player = module.createAudioPlayer(audioUrl);
      this.currentUrl = audioUrl;

      // Listen for status updates
      if (onStatusUpdate && this.player) {
        this.subscription = this.player.addListener('playbackStatusUpdate', (status: any) => {
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
      if (this.player) {
        this.player.play();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.player) {
      try {
        this.player.play();
        this.isPlaying = true;
      } catch (e) {
        console.warn('AudioPlayer.play failed:', e);
      }
    }
  }

  async pause(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause();
        this.isPlaying = false;
      } catch (e) {
        console.warn('AudioPlayer.pause failed:', e);
      }
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
      try {
        this.player.seekTo(positionMs / 1000); // expo-audio uses seconds
      } catch (e) {
        console.warn('AudioPlayer.seek failed:', e);
      }
    }
  }

  async unload(): Promise<void> {
    this.removeListeners();
    if (this.player) {
      try {
        this.player.remove();
      } catch (e) {
        console.warn('AudioPlayer.remove failed:', e);
      }
      this.player = null;
      this.isPlaying = false;
      this.currentUrl = null;
    }
  }

  /**
   * Remove all status update listeners
   */
  removeListeners(): void {
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch (e) {
        console.warn('AudioPlayer.removeListeners failed:', e);
      }
      this.subscription = null;
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
