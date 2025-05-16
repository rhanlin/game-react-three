'use client';

class SoundEffectManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private muted = false;

  load(key: string, src: string, volume = 1) {
    const audio = new Audio(src);
    audio.volume = volume;
    this.sounds.set(key, audio);
  }

  play(key: string) {
    if (this.muted) return;
    const audio = this.sounds.get(key);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.play();
    }
  }

  setVolume(key: string, volume: number) {
    const audio = this.sounds.get(key);
    if (audio) audio.volume = volume;
  }

  muteAll() { this.muted = true; }
  unmuteAll() { this.muted = false; }
}

export const soundManager = new SoundEffectManager();

// 預載入所有遊戲音效
if (typeof window !== 'undefined') {
  soundManager.load('click', '/sounds/click.wav', 0.5);
  soundManager.load('click2', '/sounds/click2.wav', 0.7);
  soundManager.load('flag', '/sounds/flag.wav', 0.5);
  soundManager.load('mine', '/sounds/mine.wav', 0.5);
  soundManager.load('victory', '/sounds/victory.wav', 0.7);
}