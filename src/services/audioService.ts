import { API_BASE_URL } from "./api";
import { AudioFile, AudioType } from "../types/audio";

export type AudioMetadata = AudioFile;

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

  async generateAudio(articleId: number, type: AudioType = 'full'): Promise<AudioMetadata> {
    const endpoint = type === 'description' 
      ? `${API_BASE_URL}/news/description/${articleId}/audio`
      : `${API_BASE_URL}/news/${articleId}/audio`;

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
      ? `${API_BASE_URL}/news/description/${articleId}/audio`
      : `${API_BASE_URL}/news/${articleId}/audio`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to get ${type} audio metadata`);
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
