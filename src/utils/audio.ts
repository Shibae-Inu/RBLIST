// Web Audio API tactile audio click feedback

export type ClickTone = 'classic' | 'mechanical' | 'pop' | 'blip';

class SoundFX {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.7;
  private tone: ClickTone = 'classic';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('picked_sound_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
        const savedVol = localStorage.getItem('picked_sound_volume');
        if (savedVol !== null) {
          this.volume = parseFloat(savedVol);
        }
        const savedTone = localStorage.getItem('picked_sound_tone') as ClickTone | null;
        if (savedTone && ['classic', 'mechanical', 'pop', 'blip'].includes(savedTone)) {
          this.tone = savedTone;
        }
      } catch {
        // Fallback
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('picked_sound_enabled', String(val));
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('picked_sound_volume', String(this.volume));
  }

  public setTone(tone: ClickTone) {
    this.tone = tone;
    localStorage.setItem('picked_sound_tone', tone);
  }

  public getTone(): ClickTone {
    return this.tone;
  }

  public getVolume(): number {
    return this.volume;
  }

  public playClick(customTone?: ClickTone, freqOverride?: number) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const toneToPlay = customTone || this.tone;
      const baseGain = 0.12 * this.volume;
      const now = this.ctx.currentTime;

      if (toneToPlay === 'pop') {
        // Soft bubble pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqOverride || 320, now);
        osc.frequency.exponentialRampToValueAtTime((freqOverride || 320) * 1.8, now + 0.04);
        gain.gain.setValueAtTime(baseGain * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (toneToPlay === 'mechanical') {
        // Snappy tactile mechanical click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freqOverride || 1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
        gain.gain.setValueAtTime(baseGain * 1.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (toneToPlay === 'blip') {
        // High crisp tech blip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqOverride || 1400, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.03);
        gain.gain.setValueAtTime(baseGain * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      } else {
        // Classic tactile click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const freq = freqOverride || 650;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.03);
        gain.gain.setValueAtTime(baseGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Audio might be blocked by browser policy until gesture
    }
  }

  public playTallyUp() {
    if (!this.enabled) return;
    this.playClick(undefined, 820);
  }

  public playTallyDown() {
    if (!this.enabled) return;
    this.playClick(undefined, 460);
  }

  public playCheck() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.setValueAtTime(720, now + 0.05);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore audio errors
    }
  }

  public playSuccess() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.1 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const sound = new SoundFX();
