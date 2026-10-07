import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Shared";

// Real Hanson job-site photos. Keep finished installations first.
const photos = [
  { src: "/images/installations/condenser-shingle-home.webp",
    alt: "Outdoor heat pump condenser installed on a composite pad beside a shingled Massachusetts home",
    caption: "Outdoor installation" },
  { src: "/images/installations/wall-mount-dining-room.webp",
    alt: "Wall-mounted mini split installed above a dining room doorway",
    caption: "Dining room mini-split" },
  { src: "/images/installations/wall-mount-bedroom.webp",
    alt: "Bedroom mini split wall unit between two windows",
    caption: "Bedroom mini-split" },
  { src: "/images/installations/wall-mount-living-room.webp",
    alt: "Mini split wall unit above a living room window",
    caption: "Living room mini-split" },
  { src: "/images/installations/condenser-gray-home.webp",
    alt: "Heat pump condenser mounted on stands beside a gray shingled home",
    caption: "Outdoor condenser" },
  { src: "/images/installations/cabin-mini-split.webp",
    alt: "Mini split wall unit in a knotty pine cabin room",
    caption: "Cabin mini-split" },
  { src: "/images/installations/wall-mount-above-door.webp",
    alt: "Wall-mounted mini split above a bedroom door",
    caption: "Above-door installation" },
  { src: "/images/installations/air-handler-closet.webp",
    alt: "Slim ducted air handler installed in a utility closet",
    caption: "Ducted air handler" },
  { src: "/images/installations/ceiling-cassette-rough-in.webp",
    alt: "Ceiling cassette heat pump unit being installed between open joists during a renovation",
    caption: "Ceiling cassette rough-in" },
  { src: "/images/installations/lineset-wood-siding.webp",
    alt: "Refrigerant line set running down wood siding to an outdoor unit",
    caption: "Exterior line set" },
];

export default function InstallGallery() {
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [position, setPosition] = useState({ first: 0, atStart: true, atEnd: false });
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const [interacting, setInteracting] = useState(false);
  const interactionTimer = useRef<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const isOpen = selected !== null;

  const pauseForInteraction = useCallback(() => {
    setInteracting(true);
    window.clearTimeout(interactionTimer.current);
    interactionTimer.current = window.setTimeout(() => setInteracting(false), 3000);
  }, []);

  useEffect(() => () => window.clearTimeout(interactionTimer.current), []);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (preference?.matches) setPaused(true); };
    const onVisibilityChange = () => setPageHidden(document.hidden);
    const observer = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: 0.25 });
    if (track.current) observer?.observe(track.current);
    preference?.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer?.disconnect();
      preference?.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const sync = () => {
      const step = node.children[1] instanceof HTMLElement ? node.children[1].offsetLeft - (node.children[0] as HTMLElement).offsetLeft : 1;
      setPosition({ first: Math.round(node.scrollLeft / step), atStart: node.scrollLeft <= 2, atEnd: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 });
    };
    sync();
    node.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { node.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const node = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const move = useCallback((direction: number, loop = false) => {
    const node = track.current;
    if (!node || node.scrollWidth <= node.clientWidth) return;
    const step = (node.children[1] as HTMLElement).offsetLeft - (node.children[0] as HTMLElement).offsetLeft;
    const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 2;
    const index = direction > 0 ? Math.floor((node.scrollLeft + 2) / step) + 1 : Math.ceil((node.scrollLeft - 2) / step) - 1;
    const restart = loop && atEnd;
    node.scrollTo({ left: restart ? 0 : index * step, behavior: restart || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    if (paused || interacting || !visible || pageHidden || isOpen) return;
    const timer = window.setInterval(() => move(1, true), 4000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, visible, pageHidden, isOpen, move]);
  const changePhoto = (direction: number) => setSelected(current => current === null ? null : (current + direction + photos.length) % photos.length);

  return (
    <section className="section wrap install-gallery" aria-labelledby="install-gallery-title"
      onFocus={event => { const target = event.target as HTMLElement; if (event.currentTarget.contains(target) && target.matches(":focus-visible") && !target.closest(".install-gallery-play")) setPaused(true); }}>
      <div className="section-heading">
        <span className="eyebrow">OUR WORK</span>
        <h2 id="install-gallery-title">Real installs, real homes</h2>
        <p>A look at our crew’s work in Massachusetts homes. Select a photo for a closer look.</p>
      </div>
      <div className="install-gallery-carousel">
      <div className="install-gallery-track" id="installation-photos" ref={track} role="group" aria-label="Installation photos" tabIndex={0}
        onPointerDown={pauseForInteraction} onPointerUp={pauseForInteraction} onPointerCancel={pauseForInteraction}
        onPointerMove={event => { if (event.buttons !== 0) pauseForInteraction(); }}
        onWheel={event => { if (event.deltaX !== 0) pauseForInteraction(); }}>
        {photos.map((photo, index) => (
          <figure className="install-gallery-card" key={photo.src}>
            <button className="install-gallery-photo" onClick={() => setSelected(index)} aria-label={`Enlarge photo ${index + 1}: ${photo.caption}`}>
              <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" width="600" height="450" />
              <span className="install-gallery-enlarge" aria-hidden="true"><Icon name="camera" size={18} /> View photo</span>
            </button>
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
      <button className="install-gallery-side install-gallery-prev" aria-label="Previous installation photos" aria-controls="installation-photos" disabled={position.atStart} onClick={() => { pauseForInteraction(); move(-1); }}><span className="install-gallery-back"><Icon name="arrow" /></span></button>
      <button className="install-gallery-side install-gallery-next" aria-label="Next installation photos" aria-controls="installation-photos" disabled={position.atEnd} onClick={() => { pauseForInteraction(); move(1); }}><Icon name="arrow" /></button>
      </div>
      <div className="install-gallery-footer">
        <span>{Math.min(position.first + 1, photos.length)} / {photos.length} <span className="install-gallery-hint">Swipe to explore</span></span>
          <button className="install-gallery-play" aria-label={paused ? "Play installation carousel" : "Pause installation carousel"} aria-controls="installation-photos" onClick={() => setPaused(value => !value)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d={paused ? "M4 2.5 13 8 4 13.5Z" : "M4 3h3v10H4zM9 3h3v10H9z"} /></svg>
            {paused ? "Play" : "Pause"}
          </button>
      </div>
      {selected !== null && createPortal(
        <dialog className="install-lightbox" ref={dialog} aria-labelledby="installation-photo-caption" onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} onKeyDown={event => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); changePhoto(event.key === "ArrowLeft" ? -1 : 1); }
        }}>
          <div className="install-lightbox-content">
            <div className="install-lightbox-top"><span>OUR WORK · {selected + 1} / {photos.length}</span><button aria-label="Close photo viewer" onClick={() => setSelected(null)}><Icon name="close" /></button></div>
            <img src={photos[selected].src} alt={photos[selected].alt} />
            <div className="install-lightbox-bottom">
              <p id="installation-photo-caption" aria-live="polite">{photos[selected].caption}</p>
              <div className="install-gallery-controls">
                <button aria-label="Previous photo" onClick={() => changePhoto(-1)}><span className="install-gallery-back"><Icon name="arrow" /></span></button>
                <button aria-label="Next photo" onClick={() => changePhoto(1)}><Icon name="arrow" /></button>
              </div>
            </div>
          </div>
        </dialog>, document.body
      )}
    </section>
  );
}
