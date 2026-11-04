import Link from "next/link";
import { art } from "@/lib/art";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`brand ${compact ? "brand-compact" : ""}`} aria-label="Gulam Chor — back to the courtyard">
      <img src={art("logo")} width="42" height="42" alt="" />
      <span><strong>GULAM CHOR</strong><small>A LITTLE LUCK. A LOT OF APNE.</small></span>
    </Link>
  );
}
