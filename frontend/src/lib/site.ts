/**
 * Central site/contact config. Values come from env so the project stays
 * clone-friendly (different country = different env, no code edits).
 */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Tashtibat",
  country: process.env.NEXT_PUBLIC_SITE_COUNTRY ?? "Kuwait",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010",
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+96590000000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "96590000000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@tashtibatk.com",
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const telLink = () => `tel:${site.phone.replace(/\s+/g, "")}`;
