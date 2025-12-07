// Centralized audio manager - only one audio source plays at a time
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentScreenId: string | null = null;
  private isMuted: boolean = false;

  playScreenAudio(screenId: string, audioData: string): void {
    // Stop current audio if playing
    this.stopAll();

    if (this.isMuted) {
      return;
    }

    try {
      const audio = new Audio(audioData);
      audio.volume = 1.0;
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });

      this.currentAudio = audio;
      this.currentScreenId = screenId;
    } catch (error) {
      console.error('Error creating audio element:', error);
    }
  }

  stopAll(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentScreenId = null;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    }
  }

  getMuteState(): boolean {
    return this.isMuted;
  }

  getCurrentScreenId(): string | null {
    return this.currentScreenId;
  }
}

// Singleton instance
export const audioManager = new AudioManager();



