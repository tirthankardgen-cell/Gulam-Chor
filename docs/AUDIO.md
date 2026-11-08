# Music and sound

The courtyard, rules, lobby, and table share one audio player. The background is
a 95-second loop edit of **Jalandhar by Kevin MacLeod**, with sitar, bass, and
percussion at 81 BPM. Recorded card Foley comes from **Kenney Casino Audio**.
The small musical cues are original, generated offline for this game.

## Player controls

- Audio begins after a click, tap, or keypress, as required by browser autoplay rules.
- The speaker button enables or mutes all audio. The music-note button opens
  separate music/effects volume sliders. Either slider at 0 turns that channel off.
- Settings persist in this browser. A previous explicit `gulam-sound=off` preference
  is honored. New players start with music at 32% and effects at 70%.
- Music continues across client navigation and rematches. It becomes quieter at
  the table and briefly ducks for a safe hand or result.
- Switching tabs suspends playback and cancels queued effects. Returning resumes
  the music and only the remaining opening sounds, without a backlog of deals.
- Audio loading or playback failure does not delay joining, drawing, or results.

## Cue coverage

| Moment | Audio |
| --- | --- |
| Buttons, navigation, dialogs | Short warm pluck |
| Avatar or own-card selection | Soft card slide |
| Room joined / friend arrives | Ascending welcome cue |
| Friend leaves / room left | Soft descending cue |
| Invite copied / touch draw confirmed | Two-note confirmation |
| Opening shuffle | Recorded deck shuffle |
| Jack set aside | Recorded card movement |
| All 51 card flights | Three card-deal variations, gently panned toward the seat |
| Initial pairing / matching draw | Card placement and paired notes |
| Offered-card hover, keyboard focus, or touch | Short slide; rate limited |
| Another player touches your card | Quieter slide; identical for every rank |
| Committed draw without a pair | Recorded card slide |
| Your turn | Two-note prompt |
| Your hand becomes empty | Rising safe-hand cue |
| Round won | Bright plucked flourish |
| You hold the last Jack | Playful descending loss cue |
| Connection/action error | Gentle low notification |

Game cues use public outcomes; they never reveal the rank or identity of a hidden
card. The opening uses the same server-time constants as the animation, with
Web Audio scheduling at 80 ms intervals. A refresh establishes a new move baseline.

## Assets, licenses, and regeneration

All **18 audio files total about 2.38 MB** and are served from `public/audio/`.
They load after interaction, with no audio fetch during initial page rendering.
Decoded music uses about 24 MB at its native 32 kHz rate; browsers can resample
to their audio device's rate. Effects are short mono PCM WAVs for browser support;
music uses MP3 with gapless length metadata and a crossfaded loop boundary.

See [the complete credits](../public/audio/CREDITS.md) and the included
[Kenney license](../public/audio/KENNEY-LICENSE.txt). The music requires attribution
under CC BY 4.0, provided both here and in the in-game sound settings. Kenney's
recordings are CC0. Keep the credits with any redistribution of the assets.

To recreate the files, download the original MP3 and the free Casino Audio ZIP
from the source links in the credits. Unzip Casino Audio to `output/audio/kenney/`.

```sh
python -m pip install numpy scipy soundfile imageio-ffmpeg
python scripts/prepare-audio.py --music output/audio/Jalandhar-original.mp3 --cards output/audio/kenney/Audio
```

This is a development-only operation. The website needs no Python or audio
generation API. `manifest.json` records durations, peaks, sizes, and SHA-256 hashes
of the shipped files. `npm test` checks the manifest, timeline, result mapping,
resume behavior, and settings validation alongside the game and room tests.

Implementation: `src/lib/audio.ts` owns the audio graph and browser lifecycle;
`src/lib/audio-events.ts` maps public game events; the provider lives in the root
layout so navigation cannot create overlapping music players.
