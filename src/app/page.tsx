import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { Scene } from "@/components/scene";

export default function Home() {
  return (
    <div className="landing">
      <Scene />
      <header className="landing-header">
        <Brand />
        <span className="evening-note"><span className="sun-mark">✺</span> SOMEWHERE BETWEEN CHAI &amp; ONE MORE ROUND</span>
      </header>
      <main id="main" className="hero-content">
        <div className="hero-eyebrow"><span /> THE GREAT INDIAN FAMILY GAME <span /></div>
        <h1 className="hero-title" lang="hi"><span>गुलाम</span><span>चोर<span className="title-dot">.</span></span><span className="sr-only" lang="en">Gulam Chor</span></h1>
        <p className="hero-roman">G U L A M &nbsp; C H O R</p>
        <p className="hero-line" lang="hi">वही पुराने पत्ते। वही अपनों की बैठक।</p>
        <p className="hero-description">Make a pair. Pick a card. Keep a straight face.</p>
        <Link href="/play" className="play-button" aria-label="Play Gulam Chor">
          <span className="button-suit" aria-hidden="true">♠</span>
          <span>Come, play a round<small lang="hi">आओ, एक बाज़ी हो जाए</small></span>
          <Icon name="arrow" size={23} />
        </Link>
        <p className="preview-note">A playable preview · You &amp; the virtual family</p>
      </main>
      <footer className="landing-footer">
        <span className="footer-left"><Icon name="cup" size={17} /> Best served with chai.</span>
        <span className="footer-rule">2–6 SEATS <i>✦</i> 51 CARDS <i>✦</i> ONE UNLUCKY JACK</span>
        <span className="footer-right" lang="hi">बस, गुलाम तुम्हारे पास न रह जाए।</span>
      </footer>
    </div>
  );
}
