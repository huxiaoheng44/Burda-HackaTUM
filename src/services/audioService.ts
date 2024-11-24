import { API_BASE_URL } from "./api";
import { AudioFile, AudioType } from "../types/audio";
import { Howl } from 'howler';

export type AudioMetadata = AudioFile;

class AudioService {
  private static instance: AudioService;
  private howl: Howl | null = null;
  private timeUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  private durationChangeSubscribers: (() => void)[] = [];
  private timeUpdateSubscribers: (() => void)[] = [];
  private endedSubscribers: (() => void)[] = [];

  public subscribeToDurationChange(callback: () => void) {
    this.durationChangeSubscribers.push(callback);
    return () => {
      this.durationChangeSubscribers = this.durationChangeSubscribers.filter(cb => cb !== callback);
    };
  }

  private notifyDurationChange() {
    this.durationChangeSubscribers.forEach(callback => callback());
  }

  private subscribers: ((articleId: number, type: AudioType) => void)[] = [];

  public subscribe(callback: (articleId: number, type: AudioType) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifyAudioStarted() {
    this.subscribers.forEach(callback => {
      if (this.currentArticleId && this.currentType) {
        callback(this.currentArticleId, this.currentType);
      }
    });
  }

  private currentArticleId: number | null = null;
  private currentType: AudioType | null = null;

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async generateAudio(articleId: number, type: AudioType = 'full'): Promise<AudioMetadata> {
    const endpoint = type === 'description' 
      ? `${API_BASE_URL}/api/news/description/${articleId}/audio`
      : `${API_BASE_URL}/api/news/${articleId}/audio`;

    const response = await fetch(endpoint, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to generate ${type} audio`);
    }
    return response.json();
  }

  async getAudioMetadata(articleId: number, type: AudioType = 'full'): Promise<AudioMetadata> {
    const endpoint = type === 'description'
      ? `${API_BASE_URL}/api/news/description/${articleId}/audio`
      : `${API_BASE_URL}/api/news/${articleId}/audio`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to get ${type} audio metadata`);
    }
    return response.json();
  }

  getAudioUrl(filename: string): string {
    return `${API_BASE_URL}/api/audio/${filename}`;
  }

  play(url: string, articleId?: number, type?: AudioType) {
    if (this.howl) {
      this.howl.unload();
    }

    if (articleId !== undefined && type !== undefined) {
      this.currentArticleId = articleId;
      this.currentType = type;
    }

    this.howl = new Howl({
      src: [url],
      html5: true,
      onload: () => {
        this.notifyDurationChange();
      },
      onplay: () => {
        this.notifyAudioStarted();
        // Start time update interval
        if (this.timeUpdateInterval) {
          clearInterval(this.timeUpdateInterval);
        }
        this.timeUpdateInterval = setInterval(() => {
          this.timeUpdateSubscribers.forEach(callback => callback());
        }, 100);
      },
      onend: () => {
        this.endedSubscribers.forEach(callback => callback());
        if (this.timeUpdateInterval) {
          clearInterval(this.timeUpdateInterval);
        }
      },
      onstop: () => {
        if (this.timeUpdateInterval) {
          clearInterval(this.timeUpdateInterval);
        }
      },
      onpause: () => {
        if (this.timeUpdateInterval) {
          clearInterval(this.timeUpdateInterval);
        }
      }
    });

    this.howl.play();
  }

  pause() {
    this.howl?.pause();
  }

  setPlaybackRate(rate: number) {
    if (this.howl) {
      this.howl.rate(rate);
    }
  }

  getCurrentTime(): number {
    return this.howl ? this.howl.seek() as number : 0;
  }

  getDuration(): number {
    return this.howl ? this.howl.duration() : 0;
  }

  setCurrentTime(time: number) {
    if (this.howl) {
      this.howl.seek(time);
    }
  }

  onTimeUpdate(callback: () => void) {
    this.timeUpdateSubscribers.push(callback);
  }

  onEnded(callback: () => void) {
    this.endedSubscribers.push(callback);
  }

  removeTimeUpdateListener(callback: () => void) {
    this.timeUpdateSubscribers = this.timeUpdateSubscribers.filter(cb => cb !== callback);
  }

  removeEndedListener(callback: () => void) {
    this.endedSubscribers = this.endedSubscribers.filter(cb => cb !== callback);
  }
}

export default AudioService.getInstance();
