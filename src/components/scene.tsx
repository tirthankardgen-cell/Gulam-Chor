import { art } from "@/lib/art";

export function Scene({ game = false }: { game?: boolean }) {
  return (
    <div className={`scene ${game ? "scene-game" : "scene-hero"}`} aria-hidden="true">
      <picture>
        <source media="(max-width: 700px)" srcSet={art(game ? "game-mobile" : "hero-mobile")} />
        <img src={art(game ? "game-desktop" : "hero-desktop")} alt="" fetchPriority="high" loading="eager" decoding="async" />
      </picture>
      <div className="scene-shade" />
      <div className="scene-grain" />
    </div>
  );
}
