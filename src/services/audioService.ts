import { API_BASE_URL } from "./api";
import { AudioFile, AudioType } from "../types/audio";

export type AudioMetadata = AudioFile;

class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.notifyDurationChange();
    });
    this.audioElement.addEventListener('play', () => {
      this.notifyAudioStarted();
    });
  }

  private durationChangeSubscribers: (() => void)[] = [];

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
    if (this.audioElement) {
      const isNewSource = this.audioElement.src !== url;
      
      if (isNewSource) {
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
      }

      if (articleId !== undefined && type !== undefined) {
        this.currentArticleId = articleId;
        this.currentType = type;
      }

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    }
  }

  pause() {
    this.audioElement?.pause();
  }

  setPlaybackRate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  setCurrentTime(time: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  onTimeUpdate(callback: () => void) {
    this.audioElement?.addEventListener("timeupdate", callback);
  }

  onEnded(callback: () => void) {
    this.audioElement?.addEventListener("ended", callback);
  }

  removeTimeUpdateListener(callback: () => void) {
    this.audioElement?.removeEventListener("timeupdate", callback);
  }

  removeEndedListener(callback: () => void) {
    this.audioElement?.removeEventListener("ended", callback);
  }
}

export default AudioService.getInstance();