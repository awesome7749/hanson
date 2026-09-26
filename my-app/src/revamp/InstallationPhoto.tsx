import React from "react";

const installationImages = {
  installation: {
    src: "/images/heat-pump-installation.jpg",
    alt: "Illustration of two technicians working beside an outdoor heat pump at a New England home",
  },
  handover: {
    src: "/images/heat-pump-handover.jpg",
    alt: "Illustration of a technician explaining a mini-split controller to a homeowner",
  },
};

export function InstallationPhoto({ scene, caption }: {
  scene: keyof typeof installationImages;
  caption?: string;
}) {
  const photo = installationImages[scene];
  return <figure className={"installation-photo " + scene}>
    <img src={photo.src} alt={photo.alt} width={1536} height={1024} loading="lazy" decoding="async" />
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
