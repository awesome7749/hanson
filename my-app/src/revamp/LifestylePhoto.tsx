import React from "react";

export const lifestyleImages = {
  family: {
    src: "/images/family-at-home.jpg",
    alt: "A family sharing a picture book on their living room sofa",
  },
  conversation: {
    src: "/images/home-conversation.jpg",
    alt: "A homeowner and home comfort advisor talking around a kitchen table",
  },
  everyday: {
    src: "/images/everyday-comfort.jpg",
    alt: "A woman reading in an armchair with her dog resting nearby",
  },
};

export function LifestylePhoto({
  scene,
  caption,
  className = "",
}: {
  scene: keyof typeof lifestyleImages;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={`lifestyle-photo ${className}`}>
      <img
        src={lifestyleImages[scene].src}
        alt={lifestyleImages[scene].alt}
        loading="lazy"
        decoding="async"
        width={1536}
        height={1024}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
