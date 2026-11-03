/**
 * Home page. Order of sections = order of SECTIONS below.
 * Each section component returns null when its data is empty, and is skipped.
 */
import { mount } from "../core/dom.js";
import { loadAll, visible, currentRole } from "../core/data.js";
import { buildLibrary } from "../core/library.js";
import { mountLayout, renderFatal } from "../core/layout.js";
import { Section } from "../components/section.js";
import { Hero, initHeroPhoto } from "../components/hero.js";
import { About } from "../components/about.js";
import { Experience } from "../components/experience.js";
import { Projects } from "../components/projects.js";
import { Skills } from "../components/skills.js";
import { Testimonials } from "../components/testimonials.js";
import { Writing } from "../components/posts.js";
import { Contact, initContact } from "../components/contact.js";

const SECTIONS = [About, Experience, Projects, Skills, Testimonials, Writing, Contact];

async function main() {
  const data = await loadAll(
    "profile",
    "experience",
    "projects",
    "skills",
    "education",
    "achievements",
    "testimonials",
    "posts",
  );
  const projects = visible(data.projects);
  const library = buildLibrary({ ...data, projects });
  const ctx = { ...data, projects, library, current: currentRole(data.experience) };

  mountLayout({ page: "home", profile: data.profile });

  // One continuous canvas (see "Home canvas" in pages.css) — no alternating bands.
  const sections = SECTIONS.map((build) => build(ctx))
    .filter(Boolean)
    .map(Section);

  const main = mount("#main", [Hero(ctx), ...sections]);

  initHeroPhoto(main);
  initContact(main);

  // Content renders after load, so re-apply any #hash the visitor arrived with.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

main().catch(renderFatal);
