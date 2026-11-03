import { html, safeUrl, externalAttrs } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { visible } from "../core/data.js";

export function Contact({ profile }) {
  const email = profile.email;
  const others = visible(profile.socials)
    .filter((s) => s.icon !== "mail")
    .map((s) => ({ ...s, url: safeUrl(s.url) }))
    .filter((s) => s.url);
  if (email) others.unshift({ label: email, icon: "mail", url: `mailto:${email}` });
  if (profile.phone) others.push({ label: profile.phone, icon: "phone", url: `tel:${profile.phone.replace(/[^\d+]/g, "")}` });
  if (profile.whatsapp) others.push({ label: "WhatsApp", icon: "whatsapp", url: `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` });

  return {
    id: "contact",
    bare: true,
    body: html`
      <div class="contact">
        <h2 class="section__title" id="contact-title">Let's talk</h2>
        <p class="section__lead">
          ${profile.availability ?? ""} The quickest way to reach me is email — I usually reply within a day or two.
        </p>
        ${email
          ? html`<div class="contact__actions">
              <a class="btn btn--primary" href="mailto:${email}">${icon("mail")} Email me</a>
              <button class="btn btn--secondary" type="button" data-copy="${email}">
                ${icon("copy")}<span>Copy email</span>
              </button>
            </div>`
          : ""}
        ${others.length
          ? html`<ul class="contact__alt" role="list">
              ${others.map((s) => html`<li><a href="${s.url}"${externalAttrs(s.url)}>${icon(s.icon)} ${s.label}</a></li>`)}
            </ul>`
          : ""}
      </div>`,
  };
}

export function initContact(root = document) {
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const label = btn.querySelector("span");
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = "Copied!";
    } catch {
      label.textContent = btn.dataset.copy; // clipboard blocked: show it so it can be selected manually
      return;
    }
    setTimeout(() => (label.textContent = "Copy email"), 2000);
  });
}
