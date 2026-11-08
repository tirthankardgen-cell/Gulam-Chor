"use client";

import { useId, useState } from "react";
import { useAudio } from "./audio-provider";
import { Dialog } from "./dialog";
import { Icon } from "./icon";

export function AudioControls() {
  const { settings, unlocked, configure, toggle, play } = useAudio();
  const [open, setOpen] = useState(false);
  const id = useId();
  const audible = unlocked && !settings.muted && (settings.music > 0 || settings.effects > 0);
  const label = !unlocked ? "Enable audio" : settings.muted ? "Unmute all audio" : "Mute all audio";
  return <div className="audio-controls" data-audio-controls>
    <button className="icon-button" data-audio-toggle type="button" onClick={toggle} aria-label={label} title={label} aria-pressed={audible}><Icon name={audible ? "sound" : "muted"} /></button>
    <button className="icon-button" type="button" onClick={() => setOpen(true)} aria-label="Music and sound settings" title="Music and sound settings" aria-haspopup="dialog"><Icon name="music" /></button>
    {open && <Dialog title="The sounds of the baithak." onClose={() => setOpen(false)}>
      <p className="dialog-lead">A little music. The familiar shuffle of cards.</p>
      <div className="audio-mixer">
        <label className="audio-mute"><span>Mute all audio</span><input type="checkbox" checked={settings.muted} onChange={(event) => configure({ muted: event.target.checked })} /></label>
        <div className="audio-channel">
          <label htmlFor={`${id}-music`}>Background music <output>{Math.round(settings.music * 100)}%</output></label>
          <input id={`${id}-music`} type="range" min="0" max="100" step="1" value={Math.round(settings.music * 100)} aria-valuetext={settings.music ? `${Math.round(settings.music * 100)} percent` : "Off"} onChange={(event) => configure({ music: Number(event.target.value) / 100 })} />
          <small>Sitar, gentle percussion, and one more round.</small>
        </div>
        <div className="audio-channel">
          <label htmlFor={`${id}-effects`}>Sound effects <output>{Math.round(settings.effects * 100)}%</output></label>
          <input id={`${id}-effects`} type="range" min="0" max="100" step="1" value={Math.round(settings.effects * 100)} aria-valuetext={settings.effects ? `${Math.round(settings.effects * 100)} percent` : "Off"} onChange={(event) => configure({ effects: Number(event.target.value) / 100 })} onPointerUp={() => play("pair")} onKeyUp={(event) => { if (event.key.startsWith("Arrow")) play("pair"); }} />
          <small>Cards, choices, turns, and little victories. Set either slider to 0 to switch it off.</small>
        </div>
      </div>
      <p className="audio-remember">Your sound settings stay with this browser.</p>
      <details className="audio-credits"><summary>Music &amp; sound credits</summary>
        <p>“<a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400018" target="_blank" rel="noreferrer">Jalandhar</a>” by Kevin MacLeod (incompetech.com), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Trimmed, crossfaded, and adjusted for looping.</p>
        <p>Card recordings: <a href="https://kenney.nl/assets/casino-audio" target="_blank" rel="noreferrer">Casino Audio by Kenney</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>. Musical cues created for Gulam Chor.</p>
      </details>
      <button type="button" className="ink-button" onClick={() => setOpen(false)}>Back to the baithak <Icon name="arrow" size={18} /></button>
    </Dialog>}
  </div>;
}
