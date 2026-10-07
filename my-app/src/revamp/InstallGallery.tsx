import React from "react";

// Real job-site photos taken by Hanson crews (EXIF/location stripped at
// import time). Shown as proof of work — deliberately unpolished compared to
// the illustrated brand imagery elsewhere on the page.
const photos = [
  { src: "/images/installations/condenser-shingle-home.webp", wide: true,
    alt: "Outdoor heat pump condenser installed on a composite pad beside a shingled Massachusetts home",
    caption: "Outdoor condenser on a storm-rated pad" },
  { src: "/images/installations/wall-mount-dining-room.webp",
    alt: "Wall-mounted mini split installed above a dining room doorway",
    caption: "Wall unit tucked above a doorway" },
  { src: "/images/installations/ceiling-cassette-rough-in.webp",
    alt: "Ceiling cassette heat pump unit being installed between open joists during a renovation",
    caption: "Ceiling cassette going in during a remodel" },
  { src: "/images/installations/lineset-wood-siding.webp",
    alt: "Neatly routed refrigerant line set running down wood siding to an outdoor unit",
    caption: "Line set routed clean and tight" },
  { src: "/images/installations/wall-mount-living-room.webp",
    alt: "Mini split wall unit above a living room window",
    caption: "Quiet comfort for the living room" },
  { src: "/images/installations/condenser-gray-home.webp",
    alt: "Heat pump condenser mounted on stands beside a gray shingled home",
    caption: "Side-yard install, up off the snow line" },
  { src: "/images/installations/wall-mount-bedroom.webp",
    alt: "Bedroom mini split wall unit between two windows",
    caption: "Bedroom unit, old baseboard retired" },
  { src: "/images/installations/air-handler-closet.webp",
    alt: "Slim ducted air handler installed in a utility closet",
    caption: "Ducted air handler hidden in a closet" },
  { src: "/images/installations/cabin-mini-split.webp",
    alt: "Mini split wall unit in a knotty pine cabin room",
    caption: "Even the lake cabin runs on a heat pump" },
  { src: "/images/installations/wall-mount-above-door.webp",
    alt: "Wall-mounted mini split above a bedroom door",
    caption: "Placed for airflow, out of sight lines" },
];

export default function InstallGallery() {
  return (
    <section className="section wrap install-gallery" aria-labelledby="install-gallery-title">
      <div className="section-heading">
        <span className="eyebrow">OUR WORK</span>
        <h2 id="install-gallery-title">Real installs, real homes</h2>
        <p>
          Every photo here was taken by our crew on a Massachusetts job site —
          no stock images. This is what your install will actually look like.
        </p>
      </div>
      <div className="install-gallery-grid">
        {photos.map(p => (
          <figure key={p.src} className={p.wide ? "wide" : undefined}>
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
