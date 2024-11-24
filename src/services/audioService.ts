import { API_BASE_URL } from "./api";
import { AudioFile, AudioType } from "../types/audio";

export type AudioMetadata = AudioFile;

class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;
  private playAttempts: number = 0;
  private maxPlayAttempts: number = 3;

  private constructor() {
    this.audioElement = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener("play", () => {
      this.notifyAudioStarted();
      this.playAttempts = 0; // Reset play attempts on successful play
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.notifyDurationChange();
    });

    this.audioElement.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.handlePlayError();
    });

    // Add canplay event listener
    this.audioElement.addEventListener("canplay", () => {
      if (this.audioElement && this.audioElement.paused) {
        this.tryAutoPlay();
      }
    });
  }

  private async tryAutoPlay() {
    try {
      if (this.audioElement) {
        // 尝试播放前确保音频已加载
        await this.audioElement.load();
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.playAttempts = 0; // Reset on successful play
        }
      }
    } catch (error) {
      console.error("Auto-play failed:", error);
      this.handlePlayError();
    }
  }

  private handlePlayError() {
    if (this.playAttempts < this.maxPlayAttempts) {
      this.playAttempts++;
      console.log(`Retrying playback, attempt ${this.playAttempts}`);
      setTimeout(() => this.tryAutoPlay(), 1000); // Wait 1 second before retry
    } else {
      console.error("Max play attempts reached");
      this.playAttempts = 0; // Reset for next time
    }
  }

  private durationChangeSubscribers: (() => void)[] = [];
  private subscribers: ((articleId: number, type: AudioType) => void)[] = [];
  private currentArticleId: number | null = null;
  private currentType: AudioType | null = null;

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public subscribeToDurationChange(callback: () => void) {
    this.durationChangeSubscribers.push(callback);
    return () => {
      this.durationChangeSubscribers = this.durationChangeSubscribers.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyDurationChange() {
    this.durationChangeSubscribers.forEach((callback) => callback());
  }

  public subscribe(callback: (articleId: number, type: AudioType) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifyAudioStarted() {
    this.subscribers.forEach((callback) => {
      if (this.currentArticleId && this.currentType) {
        callback(this.currentArticleId, this.currentType);
      }
    });
  }

  async generateAudio(
    articleId: number,
    type: AudioType = "full"
  ): Promise<AudioMetadata> {
    const endpoint =
      type === "description"
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

  async getAudioMetadata(
    articleId: number,
    type: AudioType = "full"
  ): Promise<AudioMetadata> {
    const endpoint =
      type === "description"
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

  async play(url: string, articleId?: number, type?: AudioType) {
    if (!this.audioElement) return;

    try {
      const isNewSource = this.audioElement.src !== url;
      if (isNewSource) {
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
        await this.audioElement.load();
      }

      if (articleId !== undefined && type !== undefined) {
        this.currentArticleId = articleId;
        this.currentType = type;
      }

      await this.tryAutoPlay();
    } catch (error) {
      console.error("Error in play method:", error);
      this.handlePlayError();
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.playAttempts = 0; // Reset play attempts on pause
    }
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
