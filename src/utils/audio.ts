// Web Audio API procedural sound engine for water pouring, glass clinking, and UI feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Realistic water pour: resonant noise cavity sweep + bubbling modulation
  public playPourSound(durationSec: number = 2.4): { stop: () => void } {
    if (this.isMuted) return { stop: () => {} };
    try {
      this.initContext();
      if (!this.ctx) return { stop: () => {} };

      const ctx = this.ctx;
      const now = ctx.currentTime;

      // 1. Noise Generator for fluid turbulence
      const bufferSize = ctx.sampleRate * durationSec;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // 2. Resonant bandpass filter (simulates cup acoustic resonance rising with liquid level)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(9.0, now);
      bandpass.frequency.setValueAtTime(280, now);
      bandpass.frequency.exponentialRampToValueAtTime(1150, now + durationSec * 0.95);

      // 3. Second filter for high splash texture
      const splashFilter = ctx.createBiquadFilter();
      splashFilter.type = 'highpass';
      splashFilter.frequency.setValueAtTime(2200, now);

      // 4. Bubble modulation (FM sine oscillator)
      const bubbleOsc = ctx.createOscillator();
      bubbleOsc.type = 'sine';
      bubbleOsc.frequency.setValueAtTime(45, now);
      bubbleOsc.frequency.linearRampToValueAtTime(140, now + durationSec);

      const bubbleGain = ctx.createGain();
      bubbleGain.gain.setValueAtTime(120, now);
      bubbleOsc.connect(bandpass.frequency);

      // 5. Volume Envelope
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.15);
      masterGain.gain.setValueAtTime(0.35, now + durationSec * 0.85);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      // Connect graph
      whiteNoise.connect(bandpass);
      bandpass.connect(masterGain);
      masterGain.connect(ctx.destination);

      whiteNoise.start(now);
      bubbleOsc.start(now);
      whiteNoise.stop(now + durationSec);
      bubbleOsc.stop(now + durationSec);

      return {
        stop: () => {
          try {
            masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            setTimeout(() => {
              whiteNoise.stop();
              bubbleOsc.stop();
            }, 60);
          } catch {
            // ignore cleanup errors
          }
        }
      };
    } catch (e) {
      console.warn('Audio playPourSound error', e);
      return { stop: () => {} };
    }
  }

  // High-frequency crystal glass clink sound
  public playClinkSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const freqs = [2380, 3620, 5200];
      const gains = [0.2, 0.1, 0.05];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() * 20 - 10), now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45 + idx * 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch (e) {
      console.warn('Audio playClinkSound error', e);
    }
  }

  // Soft bottom settle thump
  public playSettleSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      console.warn('Audio playSettleSound error', e);
    }
  }

  // Goal achievement celebration chord
  public playCelebrationSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.3);
      });
    } catch (e) {
      console.warn('Audio playCelebrationSound error', e);
    }
  }

  public triggerHaptic(pattern: 'light' | 'medium' | 'success' = 'light') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (pattern === 'light') navigator.vibrate(15);
        else if (pattern === 'medium') navigator.vibrate(30);
        else if (pattern === 'success') navigator.vibrate([20, 50, 40, 50, 60]);
      } catch {
        // vibration not supported or permissions blocked
      }
    }
  }
}

export const soundEngine = new SoundEngine();
