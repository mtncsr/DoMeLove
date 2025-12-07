// Centralized audio manager - only one audio source plays at a time
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentScreenId: string | null = null;
  private isMuted: boolean = false;

  playScreenAudio(screenId: string, audioData: string, loop: boolean = false): void {
    // Stop current audio if playing
    this.stopAll();

    if (this.isMuted) {
      return;
    }

    try {
      const audio = new Audio(audioData);
      audio.volume = 1.0;
      audio.preload = 'auto';
      audio.loop = loop;
      
      // Add error handlers
      audio.onerror = (e) => {
        console.error('Audio element error:', e);
        console.error('Audio data length:', audioData.length);
        console.error('Audio data preview:', audioData.substring(0, 100));
      };

      audio.oncanplaythrough = () => {
        console.log('Audio can play through');
      };

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playing successfully');
            this.currentAudio = audio;
            this.currentScreenId = screenId;
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            console.error('Audio play promise rejected:', error.name, error.message);
            // Try to provide helpful error message
            if (error.name === 'NotAllowedError') {
              console.error('Autoplay was blocked. User interaction required.');
            } else if (error.name === 'NotSupportedError') {
              console.error('Audio format not supported.');
            }
            throw error;
          });
      } else {
        // Fallback for older browsers
        this.currentAudio = audio;
        this.currentScreenId = screenId;
      }
    } catch (error) {
      console.error('Error creating audio element:', error);
      throw error;
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



