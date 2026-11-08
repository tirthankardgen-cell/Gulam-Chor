"""Prepare the bundled soundtrack, card Foley, and original musical cues.

Development only: pip install numpy scipy soundfile imageio-ffmpeg
python scripts/prepare-audio.py --music output/audio/Jalandhar-original.mp3 \
    --cards output/audio/kenney/Audio
See docs/AUDIO.md for the source downloads and licenses.
"""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "public" / "audio"
RATE = 32000
RNG = np.random.default_rng(81)


def envelope(samples, attack=0.004, release=0.018):
    result = samples.copy()
    first = min(len(result), int(attack * RATE))
    last = min(len(result), int(release * RATE))
    result[:first] *= np.linspace(0, 1, first)
    result[-last:] *= np.linspace(1, 0, last)
    return result


def read_card(directory, filename, peak=0.62, duration=None):
    samples, rate = sf.read(directory / filename, always_2d=True)
    samples = samples.mean(axis=1)
    samples = resample_poly(samples, RATE, rate)
    audible = np.flatnonzero(np.abs(samples) > 0.008)
    if len(audible):
        samples = samples[max(0, audible[0] - 128):audible[-1] + 400]
    if duration:
        samples = samples[:int(duration * RATE)]
    samples = envelope(samples)
    samples *= peak / max(float(np.max(np.abs(samples))), 0.01)
    return samples


def pluck(midi, duration=0.6, level=0.3):
    """An original damped string/bell timbre, not a sampled instrument."""
    t = np.arange(int(duration * RATE)) / RATE
    frequency = 440 * 2 ** ((midi - 69) / 12)
    voice = sum(
        weight * np.sin(2 * np.pi * frequency * harmonic * t)
        * np.exp(-t * damping)
        for harmonic, weight, damping in [(1, 1, 6), (2, .32, 10), (3, .12, 17), (4, .04, 23)]
    )
    voice += RNG.normal(0, .025, len(t)) * np.exp(-t * 130)
    return envelope(voice * level, release=.04)


def phrase(notes, spacing=.16, level=.28, tail=.65):
    result = np.zeros(int(((len(notes) - 1) * spacing + tail + .13) * RATE))
    for index, note in enumerate(notes):
        voice = pluck(note, tail, level)
        start = int(index * spacing * RATE)
        result[start:start + len(voice)] += voice
        # A tiny room reflection softens the musical cues.
        echo = start + int(.095 * RATE)
        result[echo:echo + len(voice)] += voice * .12
    return envelope(result, release=.07)


def mix(*layers):
    result = np.zeros(max(int(start * RATE) + len(sound) for start, sound in layers))
    for start, sound in layers:
        index = int(start * RATE)
        result[index:index + len(sound)] += sound
    return result


def save_effect(name, samples):
    peak = float(np.max(np.abs(samples)))
    if peak > .8:
        samples = samples * (.8 / peak)
    sf.write(DESTINATION / f"{name}.wav", samples, RATE, subtype="PCM_16")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music", type=Path, required=True)
    parser.add_argument("--cards", type=Path, required=True)
    args = parser.parse_args()
    DESTINATION.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    decoded = subprocess.run([
        ffmpeg, "-v", "error", "-i", str(args.music), "-f", "f32le",
        "-ar", str(RATE), "-ac", "2", "pipe:1",
    ], check=True, capture_output=True).stdout
    music = np.frombuffer(decoded, dtype="<f4").reshape(-1, 2).copy()
    bar = 4 * 60 / 81
    start, length, crossfade = (round(seconds * RATE) for seconds in (bar * 4, bar * 32, bar))
    section = music[start:start + length + crossfade]
    assert len(section) == length + crossfade
    fade = np.linspace(0, 1, crossfade)[:, None]
    # Rotate the crossfade into the tail: the end and beginning are consecutive
    # samples of the same phrase, without a fade-to-silence between repeats.
    loop = np.concatenate((section[crossfade:length], section[length:] * (1 - fade) + section[:crossfade] * fade))
    gain = min(.105 / np.sqrt(np.mean(loop ** 2)), .72 / np.max(np.abs(loop)))
    loop = (loop * gain).astype("<f4")
    subprocess.run([
        ffmpeg, "-v", "error", "-y", "-f", "f32le", "-ar", str(RATE), "-ac", "2",
        "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "128k", "-write_xing", "1",
        "-metadata", "title=Jalandhar (Gulam Chor loop edit)",
        "-metadata", "artist=Kevin MacLeod",
        "-metadata", "copyright=CC BY 4.0 - https://creativecommons.org/licenses/by/4.0/",
        str(DESTINATION / "courtyard-jalandhar.mp3"),
    ], input=loop.tobytes(), check=True)

    card = lambda filename, **kwargs: read_card(args.cards, filename, **kwargs)
    save_effect("shuffle", card("card-shuffle.ogg"))
    save_effect("aside", card("card-shove-1.ogg", duration=.42))
    save_effect("deal-1", card("card-place-1.ogg", duration=.16, peak=.48))
    save_effect("deal-2", card("card-place-2.ogg", duration=.16, peak=.48))
    save_effect("deal-3", card("card-place-4.ogg", duration=.16, peak=.48))
    save_effect("choose", card("card-slide-4.ogg", duration=.105, peak=.32))
    save_effect("draw", card("card-slide-1.ogg", duration=.35, peak=.58))
    save_effect("tap", pluck(62, .16, .16))
    save_effect("confirm", phrase([69, 74], .075, .19, .35))
    save_effect("pair", mix((0, card("card-place-3.ogg", duration=.23, peak=.42)), (.09, phrase([74, 81], .12, .23, .5))))
    save_effect("turn", phrase([74, 76], .18, .21, .55))
    save_effect("safe", phrase([74, 78, 81], .13, .26, .75))
    save_effect("win", phrase([74, 78, 81, 86, 81, 86], .16, .3, 1.05))
    save_effect("lose", phrase([76, 72, 69, 62], .22, .28, .85))
    save_effect("join", phrase([62, 69, 74], .1, .2, .45))
    save_effect("leave", phrase([69, 62], .14, .17, .4))
    save_effect("error", phrase([65, 62], .14, .19, .4))

    manifest = []
    for path in sorted(DESTINATION.glob("*")):
        if path.suffix not in {".wav", ".mp3"}:
            continue
        data, rate = sf.read(path, always_2d=True)
        manifest.append({
            "file": path.name, "bytes": path.stat().st_size,
            "seconds": round(len(data) / rate, 3), "sampleRate": rate,
            "channels": data.shape[1], "peak": round(float(np.max(np.abs(data))), 4),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    (DESTINATION / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(manifest), "bytes": sum(p["bytes"] for p in manifest), "loopSeconds": len(loop) / RATE}))


if __name__ == "__main__":
    main()
