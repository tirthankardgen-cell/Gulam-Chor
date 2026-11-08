export const SOUND_FILES = {
  tap: "tap.wav", confirm: "confirm.wav", choose: "choose.wav",
  shuffle: "shuffle.wav", aside: "aside.wav",
  deal1: "deal-1.wav", deal2: "deal-2.wav", deal3: "deal-3.wav",
  draw: "draw.wav", pair: "pair.wav", turn: "turn.wav", safe: "safe.wav",
  win: "win.wav", lose: "lose.wav", join: "join.wav", leave: "leave.wav", error: "error.wav",
} as const;
export type SoundCue = keyof typeof SOUND_FILES;
export type SoundOptions = { delay?: number; offset?: number; volume?: number; rate?: number; pan?: number };
export type AudioSettings = { muted: boolean; music: number; effects: number };
export const AUDIO_STORAGE_KEY = "gulam-audio-v1";
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = { muted: false, music: .32, effects: .7 };
const MUSIC_FILE = "courtyard-jalandhar.mp3";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const noop = () => {};

export function parseAudioSettings(value: string | null, legacy: string | null = null): AudioSettings {
  const defaults = { ...DEFAULT_AUDIO_SETTINGS, muted: legacy === "off" };
  try {
    const saved: unknown = JSON.parse(value || "null");
    if (!saved || typeof saved !== "object") return defaults;
    const settings = saved as Partial<AudioSettings>;
    return {
      muted: typeof settings.muted === "boolean" ? settings.muted : defaults.muted,
      music: typeof settings.music === "number" && Number.isFinite(settings.music) ? clamp(settings.music) : defaults.music,
      effects: typeof settings.effects === "number" && Number.isFinite(settings.effects) ? clamp(settings.effects) : defaults.effects,
    };
  } catch { return defaults; }
}

const INITIAL_SNAPSHOT = { settings: DEFAULT_AUDIO_SETTINGS, unlocked: false, effectsReady: false, hidden: false, epoch: 0 };

/** One browser audio graph for the whole app. No browser APIs run during SSR. */
export class GameAudio {
  private snapshot = INITIAL_SNAPSHOT;
  private listeners = new Set<() => void>();
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private music: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private voices = new Set<() => void>();
  private lastPlayed = new Map<SoundCue, number>();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicOffset = 0;
  private musicStartedAt = 0;
  private tableActive = false;
  private mounted = false;
  private generation = 0;
  private lifetime: AbortController | null = null;
  private effectsLoading = false;
  private retryEffectsAt = 0;
  private retryMusicAt = 0;

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => INITIAL_SNAPSHOT;

  private publish(patch: Partial<typeof INITIAL_SNAPSHOT>, newEpoch = false) {
    this.snapshot = { ...this.snapshot, ...patch, epoch: this.snapshot.epoch + Number(newEpoch) };
    this.listeners.forEach((listener) => listener());
  }

  mount = () => {
    this.mounted = true;
    this.generation++;
    this.lifetime = new AbortController();
    const { signal } = this.lifetime;
    try {
      this.publish({ settings: parseAudioSettings(localStorage.getItem(AUDIO_STORAGE_KEY), localStorage.getItem("gulam-sound")), hidden: document.hidden });
    } catch { this.publish({ hidden: document.hidden }); }

    const gesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-audio-toggle]")) return;
      if (event instanceof KeyboardEvent && (event.repeat || ["Shift", "Control", "Alt", "Meta"].includes(event.key))) return;
      void this.unlock();
    };
    document.addEventListener("pointerdown", gesture, { capture: true, passive: true, signal });
    document.addEventListener("keydown", gesture, { capture: true, signal });
    // Click also unlocks audio on touch browsers that do not activate on pointerdown.
    document.addEventListener("click", (event) => {
      gesture(event);
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-audio-controls]")) return;
      const control = target?.closest("button, a[href], input[type=radio]");
      if (!control || control.matches(":disabled, [aria-disabled=true]")) return;
      const cue = control.getAttribute("data-sound") || (control.matches("input") ? "choose" : "tap");
      if (cue in SOUND_FILES) this.play(cue as SoundCue);
    }, { capture: true, signal });
    document.addEventListener("visibilitychange", () => {
      this.publish({ hidden: document.hidden }, true);
      if (document.hidden) {
        this.stopEffects();
        this.stopMusic();
        void this.context?.suspend().catch(noop);
      } else if (this.snapshot.unlocked) void this.unlock();
    }, { signal });
    window.addEventListener("pagehide", this.silence, { signal });
    window.addEventListener("pageshow", () => { if (this.snapshot.unlocked) void this.unlock(); }, { signal });
    window.addEventListener("storage", (event) => {
      if (event.key === AUDIO_STORAGE_KEY || event.key === null) this.configure(parseAudioSettings(event.newValue), false);
    }, { signal });
    return this.dispose;
  };

  private createContext() {
    if (this.context) return this.context;
    const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;
    const context = new Constructor({ latencyHint: "interactive" });
    this.context = context;
    this.master = context.createGain();
    this.effects = context.createGain();
    this.music = context.createGain();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = .003;
    limiter.release.value = .2;
    this.effects.connect(this.master);
    this.music.connect(this.master);
    this.master.connect(limiter);
    limiter.connect(context.destination);
    this.master.gain.value = this.snapshot.settings.muted ? 0 : 1;
    this.effects.gain.value = this.snapshot.settings.effects;
    this.music.gain.value = 0;
    return context;
  }

  unlock = async () => {
    if (!this.mounted || this.snapshot.hidden || this.snapshot.settings.muted) return;
    try {
      const context = this.createContext();
      if (!context) return;
      const wasSuspended = context.state !== "running";
      if (wasSuspended) await context.resume();
      if (!this.mounted || context !== this.context || context.state !== "running" || this.snapshot.hidden) return;
      if (!this.snapshot.unlocked || wasSuspended) this.publish({ unlocked: true }, true);
      this.prepareEffects();
      this.prepareMusic();
    } catch { /* Unsupported or blocked audio must never interrupt a move. */ }
  };

  configure = (patch: Partial<AudioSettings>, persist = true) => {
    const before = this.snapshot.settings;
    const settings = parseAudioSettings(JSON.stringify({ ...before, ...patch }));
    const availabilityChanged = before.muted !== settings.muted || (before.effects === 0) !== (settings.effects === 0);
    this.publish({ settings }, availabilityChanged);
    if (persist) {
      try { localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings)); } catch { /* Storage is optional. */ }
    }
    const now = this.context?.currentTime ?? 0;
    this.master?.gain.setTargetAtTime(settings.muted ? 0 : 1, now, .025);
    this.effects?.gain.setTargetAtTime(settings.effects, now, .025);
    this.updateMusicGain();
    if (settings.muted || settings.effects === 0) this.stopEffects();
    if (settings.muted || settings.music === 0) this.stopMusic();
    if (!settings.muted) void this.unlock();
  };

  toggle = () => {
    if (!this.snapshot.unlocked) {
      this.configure({ muted: false });
      void this.unlock();
    } else {
      this.configure({ muted: !this.snapshot.settings.muted });
    }
  };

  private async load(file: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(file);
    if (cached) return cached;
    const existing = this.pending.get(file);
    if (existing) return existing;
    const context = this.context;
    const generation = this.generation;
    if (!context || !this.lifetime) return null;
    const promise = (async () => {
      try {
        const response = await fetch(`/audio/${file}`, { signal: this.lifetime!.signal });
        if (!response.ok) return null;
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (!this.mounted || generation !== this.generation) return null;
        this.buffers.set(file, buffer);
        return buffer;
      } catch { return null; }
      finally { if (generation === this.generation) this.pending.delete(file); }
    })();
    this.pending.set(file, promise);
    return promise;
  }

  private prepareEffects() {
    if (this.effectsLoading || this.snapshot.settings.effects === 0 || Date.now() < this.retryEffectsAt) return;
    const missing = Object.values(SOUND_FILES).filter((file) => !this.buffers.has(file));
    if (!missing.length) return;
    const generation = this.generation;
    this.effectsLoading = true;
    void Promise.all(missing.map((file) => this.load(file))).then(() => {
      if (!this.mounted || generation !== this.generation) return;
      this.effectsLoading = false;
      this.retryEffectsAt = Date.now() + 10_000;
      this.publish({ effectsReady: Object.values(SOUND_FILES).some((file) => this.buffers.has(file)) }, true);
    });
  }

  private prepareMusic() {
    if (this.snapshot.settings.music === 0 || Date.now() < this.retryMusicAt) return;
    const generation = this.generation;
    void this.load(MUSIC_FILE).then((buffer) => {
      if (!this.mounted || generation !== this.generation) return;
      if (buffer) this.startMusic();
      else this.retryMusicAt = Date.now() + 10_000;
    });
  }

  /** Missing clips are skipped, never replayed late after a download finishes. */
  play = (cue: SoundCue, options: SoundOptions = {}): (() => void) => {
    const { settings, hidden, unlocked } = this.snapshot;
    const context = this.context;
    const buffer = this.buffers.get(SOUND_FILES[cue]);
    if (!context || context.state !== "running" || !buffer || !this.effects || !unlocked || hidden || settings.muted || settings.effects === 0) return noop;
    const delay = Math.max(0, options.delay ?? 0);
    const start = context.currentTime + delay;
    const cooldown = cue === "choose" ? .085 : cue === "tap" ? .06 : 0;
    if (!delay && cooldown && start - (this.lastPlayed.get(cue) ?? -Infinity) < cooldown) return noop;
    if (this.voices.size >= 80) return noop;
    const offset = Math.max(0, options.offset ?? 0);
    if (offset >= buffer.duration) return noop;
    this.lastPlayed.set(cue, start);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    source.buffer = buffer;
    source.playbackRate.value = Math.max(.5, Math.min(2, options.rate ?? 1));
    gain.gain.value = clamp(options.volume ?? 1);
    source.connect(gain);
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, options.pan ?? 0));
      gain.connect(panner); panner.connect(this.effects);
    } else gain.connect(this.effects);
    const release = () => { source.disconnect(); gain.disconnect(); panner?.disconnect(); this.voices.delete(stop); };
    const stop = () => { try { source.stop(); } catch { /* Already ended. */ } release(); };
    source.onended = release;
    this.voices.add(stop);
    try { source.start(start, offset); } catch { stop(); return noop; }
    if (cue === "win" || cue === "lose" || cue === "safe") this.duckMusic(start, cue === "safe" ? 1.3 : 2.6);
    return stop;
  };

  setTableActive = (active: boolean) => { this.tableActive = active; this.updateMusicGain(); };
  private musicLevel() { return this.snapshot.settings.music * (this.tableActive ? .75 : 1); }
  private updateMusicGain() {
    if (!this.music || !this.context) return;
    this.music.gain.cancelScheduledValues(this.context.currentTime);
    this.music.gain.setTargetAtTime(this.musicLevel(), this.context.currentTime, .3);
  }
  private duckMusic(start: number, duration: number) {
    if (!this.music) return;
    this.music.gain.cancelScheduledValues(start);
    this.music.gain.setTargetAtTime(this.musicLevel() * .25, start, .04);
    this.music.gain.setTargetAtTime(this.musicLevel(), start + duration, .45);
  }
  private startMusic() {
    const context = this.context;
    const buffer = this.buffers.get(MUSIC_FILE);
    const { settings, hidden } = this.snapshot;
    if (this.musicSource || !context || context.state !== "running" || !buffer || !this.music || settings.muted || !settings.music || hidden) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.music);
    this.musicSource = source;
    this.musicStartedAt = context.currentTime;
    this.music.gain.cancelScheduledValues(context.currentTime);
    this.music.gain.setValueAtTime(0, context.currentTime);
    this.music.gain.setTargetAtTime(this.musicLevel(), context.currentTime, .5);
    source.start(0, this.musicOffset % buffer.duration);
  }
  private stopMusic() {
    if (!this.musicSource || !this.context) return;
    this.musicOffset += this.context.currentTime - this.musicStartedAt;
    try { this.musicSource.stop(); } catch { /* Already ended. */ }
    this.musicSource.disconnect();
    this.musicSource = null;
  }
  private stopEffects() { this.voices.forEach((stop) => stop()); this.lastPlayed.clear(); }
  private silence = () => { this.stopEffects(); this.stopMusic(); void this.context?.suspend().catch(noop); };
  private dispose = () => {
    this.mounted = false;
    this.generation++;
    this.lifetime?.abort();
    this.stopEffects();
    this.stopMusic();
    void this.context?.close().catch(noop);
    this.context = null; this.master = null; this.music = null; this.effects = null;
    this.buffers.clear(); this.pending.clear();
    this.effectsLoading = false; this.retryEffectsAt = 0; this.retryMusicAt = 0;
    this.publish({ unlocked: false, effectsReady: false }, true);
  };
}
