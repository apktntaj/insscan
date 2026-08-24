import { HeartHandshakeIcon } from "lucide-react";
import { DONATION_LINK } from "@/app/features/feedback/config/feedback-config";

const donationMessage = "Pesisir gratis untuk digunakan. Jika karya ini membantu pekerjaan Anda, dukung pengembangannya melalui Saweria.";

export default function DonationBanner() {
  return (
    <aside className="donation-banner fixed inset-x-0 top-0 z-50 border-b border-primary/15 bg-primary text-primary-foreground" aria-label="Dukungan pengembangan Pesisir">
      <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer" className="donation-banner-track">
        <span className="donation-banner-message">
          <HeartHandshakeIcon aria-hidden="true" />
          {donationMessage}
          <span aria-hidden="true">• Dukung di Saweria</span>
        </span>
        <span className="donation-banner-message" aria-hidden="true">
          <HeartHandshakeIcon />
          {donationMessage}
          <span>• Dukung di Saweria</span>
        </span>
      </a>
    </aside>
  );
}
