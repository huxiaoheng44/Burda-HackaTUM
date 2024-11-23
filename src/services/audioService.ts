import { API_BASE_URL } from "./api";

export interface AudioMetadata {
  id: number;
  filename: string;
  text_content: string;
  duration: number;
  article_id: number;
  created_at: string;
}

class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;

  private constructor() {
    this.audioElement = new Audio();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async generateAudio(articleId: number): Promise<AudioMetadata> {
    const response = await fetch(`${API_BASE_URL}/news/${articleId}/audio`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to generate audio");
    }
    return response.json();
  }

  async getAudioMetadata(articleId: number): Promise<AudioMetadata> {
    const response = await fetch(`${API_BASE_URL}/news/${articleId}/audio`);
    if (!response.ok) {
      throw new Error("Failed to get audio metadata");
    }
    return response.json();
  }

  getAudioUrl(filename: string): string {
    return `${API_BASE_URL}/audio/${filename}`;
  }

  play(url: string) {
    if (this.audioElement) {
      if (this.audioElement.src !== url) {
        this.audioElement.src = url;
      }
      this.audioElement.play();
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
