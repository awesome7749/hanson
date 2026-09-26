import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FAQ, Icon } from "./Shared";
import { Town as TownType, townBySlug, townMeta, townPhotoSrc, towns } from "./towns";
import { lifestyleImages } from "./LifestylePhoto";
import { ASSUMPTIONS, energyPrices, heatNeedFromOil, heatingCostRows, townElectricRates, townGasRates } from "./heatingCosts";
import installationPhotos from "./installationPhotos.json";

function setHead(name: string, attr: "name" | "rel", value: string | null) {
  const tag = attr === "rel" ? "link" : "meta";
  let el = document.head.querySelector(`${tag}[${attr}="${name}"]`);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr === "rel" ? "href" : "content", value);
}

// Client-side title/description/canonical so in-app navigation matches the
// pre-rendered HTML; restores the site defaults when leaving the page.
function useTownHead(town: TownType) {
  useEffect(() => {
    const meta = townMeta(town);
    const prev = {
      title: document.title,
      description:
        document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
      canonical:
        document.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    };
    document.title = meta.title;
    setHead("description", "name", meta.description);
    setHead("canonical", "rel", `https://hansonhome.us/${town.slug}`);
    return () => {
      document.title = prev.title;
      setHead("description", "name", prev.description);
      setHead("canonical", "rel", prev.canonical);
    };
  }, [town]);
}

export default function Town({ slug }: { slug: string }) {
  const town = townBySlug(slug)!;
  useTownHead(town);
  const photos = town.photos ?? [];
  const nearby = (town.nearby ?? [])
    .map((s) => townBySlug(s))
    .filter((t): t is TownType => !!t);
  const estimate = `/start?intent=heat-pump&town=${encodeURIComponent(town.name)}`;
  const hero = photos[0]
    ? { src: townPhotoSrc(town, photos[0]), alt: photos[0].caption || `Heat pump installed in ${town.name}, MA` }
    : lifestyleImages.family;
  return (
    <>
      <section className="info-hero wrap">
        <div>
          <span className="eyebrow">HEAT PUMPS IN {town.name.toUpperCase()}, MA</span>
          <h1>{`Heat-pump installation\nin ${town.name}.`}</h1>
          <p>
            {town.installs
              ? `Hanson Home has installed ${town.installs}+ heat pumps in ${town.name} homes. `
              : ""}
            We help {town.name} homeowners choose the right system, install it
            professionally and get comfortable with it, with clear project
            pricing from the start.
          </p>
          <div className="inline-actions">
            <Link className="button" to={estimate}>
              Get a {town.name} estimate <Icon name="arrow" size={18} />
            </Link>
            <Link className="text-link" to="/start?intent=assessment">
              Energy assessment <Icon name="arrow" size={17} />
            </Link>
          </div>
        </div>
        <div className="info-image">
          <img src={hero.src} alt={hero.alt} decoding="async" />
          <span>SERVING {town.name.toUpperCase()}</span>
        </div>
      </section>

      <section className="wrap info-cards">
        {town.installs ? (
          <article className="panel">
            <span className="round-icon"><Icon name="home" size={27} /></span>
            <h3>{town.installs}+ local installs</h3>
            <p>Your neighbors in {town.name} already heat and cool with a Hanson Home heat pump.</p>
          </article>
        ) : null}
        {town.utility ? (
          <article className="panel">
            <span className="round-icon"><Icon name="leaf" size={27} /></span>
            <h3>{town.utility} customers</h3>
            <p>
              {town.utilityType === "municipal"
                ? `${town.name} has its own municipal electric utility, so heat-pump incentives generally come through ${town.utility} rather than the Mass Save electric program.`
                : `${town.name} homes on ${town.utility} may qualify for Mass Save heat-pump incentives.`}{" "}
              Eligibility and amounts are confirmed for your project.
            </p>
          </article>
        ) : null}
        <article className="panel">
          <span className="round-icon"><Icon name="list" size={27} /></span>
          <h3>Clear scope and pricing</h3>
          <p>Review the equipment, included work and total before approving your installation.</p>
        </article>
        <article className="panel">
          <span className="round-icon"><Icon name="shield" size={27} /></span>
          <h3>Installation and support</h3>
          <p>Know your schedule, how to use your new system and who to call with a question.</p>
        </article>
      </section>

      <HeatingCosts town={town} />

      {town.notes && town.notes.length > 0 && (
        <section className="wrap narrow section prose">
          <h2>Heat pumps for {town.name} homes</h2>
          {town.notes.map((n) => <p key={n}>{n}</p>)}
        </section>
      )}

      {photos.length > 0 && (
        <section className="wrap section">
          <span className="eyebrow">RECENT WORK</span>
          <h2>Heat-pump installs in {town.name}.</h2>
          <div className="town-gallery">
            {photos.map((p) => (
              <figure key={p.file}>
                <img
                  src={townPhotoSrc(town, p)}
                  alt={p.caption || `Heat-pump installation in ${town.name}, MA`}
                  loading="lazy"
                  decoding="async"
                />
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="wrap section">
        <span className="eyebrow">REAL CUSTOMER WORK</span>
        <h2>Hanson Home installations.</h2>
        <p className="town-gallery-intro">
          Selected outdoor installations from customer homes in our Massachusetts
          service area. We leave out addresses and exact locations for privacy.
        </p>
        <div className="town-gallery town-gallery-shared">
          {installationPhotos.map((photo) => (
            <figure key={photo.file}>
              <img
                src={`/images/installations/${photo.file}`}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap section town-map">
        <div>
          <span className="eyebrow">OUR SERVICE AREA</span>
          <h2>Serving all of {town.name}.</h2>
          <p>
            We install heat pumps throughout {town.name}
            {town.county ? ` and across ${town.county} County` : ""}.
          </p>
          {nearby.length > 0 && (
            <p className="town-nearby">
              Nearby:{" "}
              {nearby.map((t, i) => (
                <React.Fragment key={t.slug}>
                  {i > 0 && " · "}
                  <Link to={`/${t.slug}`}>{t.name}</Link>
                </React.Fragment>
              ))}
            </p>
          )}
          <Link className="text-link" to="/service-area">
            All towns we serve <Icon name="arrow" size={17} />
          </Link>
          <p>
            <a
              className="text-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${town.name}, MA`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open {town.name} in Google Maps
            </a>
          </p>
        </div>
        <iframe
          title={`Map of ${town.name}, Massachusetts`}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(town.name + ", MA")}&z=12&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <section className="section wrap faq-section">
        <div>
          <span className="eyebrow">LET’S TALK IT THROUGH</span>
          <h2>A few helpful answers.</h2>
        </div>
        <FAQ />
      </section>
    </>
  );
}

// Rounded to $10 so estimates don't look more precise than they are.
const money = (n: number) => "$" + (Math.round(n / 10) * 10).toLocaleString("en-US");
const dollars = ([lo, hi]: [number, number]) =>
  money(lo) === money(hi) ? money(lo) : `${money(lo)}–${money(hi)}`;
const longDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// "What it costs to heat a home in <town>": winter heating cost by fuel for
// a home sized by its oil use, using current local rates.
function HeatingCosts({ town }: { town: TownType }) {
  const [gallons, setGallons] = useState(String(ASSUMPTIONS.defaultOilGallons));
  const g = Math.min(Math.max(Number(gallons) || 0, 0), 5000);
  const rows = heatingCostRows(town, heatNeedFromOil(g || ASSUMPTIONS.defaultOilGallons));
  if (!rows.some((r) => r.key === "heatPump")) return null;
  const max = Math.max(...rows.map((r) => r.cost[1]));
  const sources = [
    energyPrices.oil,
    ...townGasRates(town),
    ...townElectricRates(town),
  ].filter((s, i, all) => all.findIndex((o) => o.source === s.source) === i);
  return (
    <section className="wrap section heating-costs">
      <span className="eyebrow">HEATING COSTS IN {town.name.toUpperCase()}</span>
      <h2>What it costs to heat a {town.name} home this winter.</h2>
      <p>
        Estimated winter heating cost with each fuel at today’s prices, for a
        home that would burn{" "}
        <label className="inline-input">
          <input
            type="number"
            inputMode="numeric"
            min={100}
            max={5000}
            step={50}
            value={gallons}
            onChange={(e) => setGallons(e.target.value)}
            aria-label="Gallons of heating oil per winter"
          />
        </label>{" "}
        gallons of heating oil.
      </p>
      <div className="cost-bars">
        {rows.map((r) => (
          <div className={"cost-row " + r.key} key={r.key}>
            <span className="cost-label">
              <b>{r.label}</b>
              <small>{r.price}</small>
            </span>
            <span className="cost-track">
              <span className="cost-bar" style={{ width: `${(r.cost[1] / max) * 100}%` }} />
            </span>
            <span className="cost-value">{dollars(r.cost)}</span>
          </div>
        ))}
      </div>
      <p className="cost-notes">
        Estimates only; your costs depend on your home, equipment and supplier.
        Oil and propane are Massachusetts averages from the state’s weekly
        dealer survey ({longDate(energyPrices.oil.asOf)}). Gas and electric
        rates are {town.name}’s utility rates including delivery
        {rows.find((r) => r.key === "heatPump") && town.utilityType === "mass-save"
          ? ", with the heat pump on the utility’s discounted heat-pump rate"
          : ""}
        {townGasRates(town)[0] ? `; gas rates are ${townGasRates(town)[0].period} rates until this winter’s are published` : ""}. Assumes {Math.round(ASSUMPTIONS.oil.efficiency * 100)}% efficient oil,{" "}
        {Math.round(ASSUMPTIONS.propane.efficiency * 100)}% propane and{" "}
        {Math.round(ASSUMPTIONS.gas.efficiency * 100)}% gas equipment, and a
        cold-climate heat pump averaging {ASSUMPTIONS.heatPump.cop}× efficiency
        over the season. Sources:{" "}
        {sources.map((s, i) => (
          <React.Fragment key={s.source}>
            {i > 0 && "; "}
            {s.sourceUrl ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.source}</a> : s.source}
          </React.Fragment>
        ))}
        .
      </p>
    </section>
  );
}

// Link list of every town page, used on /service-area.
export function TownDirectory() {
  const sorted = [...towns].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section className="wrap section">
      <span className="eyebrow">TOWNS WE SERVE</span>
      <h2>Heat-pump installation near you.</h2>
      <ul className="town-directory">
        {sorted.map((t) => (
          <li key={t.slug}>
            <Link to={`/${t.slug}`}>{t.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
