import { WhatsApp, Phone } from "./Icon";
import { telLink, whatsappLink } from "@/lib/site";

/** Floating call + WhatsApp buttons (high-conversion on mobile). */
export function FloatingContact({ whatsappText }: { whatsappText?: string }) {
  return (
    <div className="fixed bottom-5 end-5 z-40 flex flex-col gap-3">
      <a
        href={whatsappLink(whatsappText)}
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition hover:scale-105 hover:bg-green-600"
      >
        <WhatsApp width={28} height={28} />
      </a>
      <a
        href={telLink()}
        aria-label="Call"
        className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:scale-105 hover:bg-brand-700 sm:hidden"
      >
        <Phone width={24} height={24} />
      </a>
    </div>
  );
}
