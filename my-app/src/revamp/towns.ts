import townData from "./towns.json";

// One public landing page per Massachusetts town, served at /<slug>.
// Edit towns.json to add towns, install counts, local notes and photos.
// Photos live in public/images/towns/<slug>/<file>.
// scripts/prepare-live.cjs reads the same JSON to pre-render each page's
// <head> and content for search engines, and to list it in sitemap.xml.
export type TownPhoto = { file: string; caption?: string };
export type Town = {
  slug: string;
  name: string;
  county?: string | null;
  /** Completed Hanson Home installs in this town; shown only when set. */
  installs?: number | null;
  /** Electric utility, e.g. "National Grid"; shown only when set.
   *  Source: mass.gov "Find My Electric Company" (DPU electric.csv). */
  utility?: string | null;
  /** Eversource/National Grid towns are in Mass Save; towns with a
   *  municipal light plant run their own incentive programs instead. */
  utilityType?: "mass-save" | "municipal" | null;
  /** Keys into energyPrices.json "electric" / "gas" (several when the town
   *  is split between companies). Source: mass.gov DPU town lookup. */
  electricRates?: string[];
  gasRates?: string[];
  /** Town-specific paragraphs (housing stock, local projects, etc.). */
  notes?: string[];
  photos?: TownPhoto[];
  /** Slugs of neighboring towns to cross-link. */
  nearby?: string[];
};

export const towns: Town[] = townData as Town[];

export function townBySlug(slug: string) {
  return towns.find((t) => t.slug === slug);
}

export function townPhotoSrc(town: Town, photo: TownPhoto) {
  return `/images/towns/${town.slug}/${photo.file}`;
}

// Keep in sync with townMeta() in scripts/prepare-live.cjs (a test checks).
export function townMeta(town: Town) {
  return {
    title: `Heat Pump Installation in ${town.name}, MA | Hanson Home`,
    description:
      (town.installs
        ? `Hanson Home has installed ${town.installs}+ heat pumps in ${town.name}, MA. `
        : `Heat-pump installation for ${town.name}, MA homes. `) +
      "Clear project pricing and professional installation. Get a free estimate.",
  };
}
