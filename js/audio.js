export class AudioPlayer {
  #audio;
  #muted = false;
  #fadeTimer = null;

  constructor({ src, title }) {
    this.#audio = new Audio();
    this.#audio.src = src;
    this.#audio.loop = true;
    this.#audio.preload = 'auto';
    this.#audio.volume = 0;
    this.#setupMediaSession(title);
  }

  async start() {
    if (!this.#audio.paused) {
      return;
    }
    try {
      await this.#audio.play();
      this.#fadeTo(0.85, 2500);
    } catch {
      // Autoplay blocked or source unavailable; fail silently.
    }
  }

  toggleMute() {
    this.#muted = !this.#muted;
    this.#audio.muted = this.#muted;
    return this.#muted;
  }

  get isMuted() {
    return this.#muted;
  }

  #fadeTo(target, duration) {
    clearInterval(this.#fadeTimer);
    const start = this.#audio.volume;
    const steps = Math.max(1, Math.round(duration / 50));
    let i = 0;
    this.#fadeTimer = setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      this.#audio.volume = start + (target - start) * t;
      if (t >= 1) {
        clearInterval(this.#fadeTimer);
      }
    }, 50);
  }

  #setupMediaSession(title) {
    if (!('mediaSession' in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'For You — untuk Lia'
      });
    } catch {
      // Media Session metadata is optional; ignore failures.
    }
  }
}
