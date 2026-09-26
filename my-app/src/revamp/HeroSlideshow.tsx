import React, { useEffect, useState } from "react";
import { Icon } from "./Shared";
import { lifestyleImages } from "./LifestylePhoto";

const slides = [
  {
    ...lifestyleImages.family,
    name: "Family at home",
    scene: "family",
    eyebrow: "HEAT PUMPS FOR MASSACHUSETTS HOMES",
    caption: "Heating and cooling, handled.",
  },
  {
    src: "/images/indoor-mini-split.jpg",
    alt: "A wall-mounted mini-split above a sofa in a warm, sunlit living room",
    name: "Indoor mini-split",
    scene: "indoor",
    eyebrow: "INDOOR MINI-SPLITS",
    caption: "Comfort, room by room.",
  },
  {
    src: "/images/outdoor-heat-pump.jpg",
    alt: "An outdoor heat-pump unit on a raised stand beside a New England home",
    name: "Outdoor heat pump",
    scene: "outdoor",
    eyebrow: "OUTDOOR HEAT PUMPS",
    caption: "One system. Heating and cooling.",
  },
];

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const [pageHidden, setPageHidden] = useState(document.hidden);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (preference?.matches) setPaused(true);
    };
    const onVisibilityChange = () => setPageHidden(document.hidden);
    preference?.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      preference?.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (paused || pageHidden) return;
    const timer = window.setInterval(
      () => setCurrent((index) => (index + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused, pageHidden]);

  return (
    <div
      className="hero-picture hero-slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Home comfort photos"
    >
      <div className="hero-slides" aria-live={paused ? "polite" : "off"}>
        {slides.map((slide, index) => (
          <div
            className={`hero-slide ${slide.scene}${current === index ? " is-active" : ""}`}
            key={slide.scene}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${slide.name}`}
            aria-hidden={current !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              width={1536}
              height={1024}
              fetchPriority={index === 0 ? "high" : "low"}
              decoding="async"
            />
            <div className="picture-caption">
              <span>
                {slide.eyebrow}
                <br />
                <b>{slide.caption}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="season-tag">
        <span><Icon name="sun" /> COOL SUMMERS</span>
        <i />
        <span><Icon name="snow" /> COZY WINTERS</span>
      </div>
      <div className="slideshow-controls">
        <button
          type="button"
          className="slideshow-play"
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          onClick={() => setPaused((value) => !value)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d={paused ? "M4 2.5 13 8 4 13.5Z" : "M4 3h3v10H4zM9 3h3v10H9z"} />
          </svg>
          {paused ? "Play" : "Pause"}
        </button>
        <div className="slideshow-dots" role="group" aria-label="Choose a photo">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.scene}
              aria-label={`Show photo ${index + 1}: ${slide.name}`}
              aria-pressed={current === index}
              onFocus={() => setPaused(true)}
              onClick={() => {
                setCurrent(index);
                setPaused(true);
              }}
            ><span /></button>
          ))}
        </div>
      </div>
    </div>
  );
}
