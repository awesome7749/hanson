import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Shared";

const guides = [
  {
    path: "/heat-pumps",
    title: "Heat pumps for heating and cooling",
    description: "Learn how an electric heat pump works and what matters when choosing a system for your home.",
  },
  {
    path: "/how-it-works",
    title: "From estimate to startup",
    description: "See the steps in a Hanson Home installation, from reviewing your home to learning your new system.",
  },
  {
    path: "/pricing",
    title: "Understand heat-pump pricing",
    description: "Know what belongs in a written quote and how potential rebates are shown separately from the project price.",
  },
  {
    path: "/assessment",
    title: "Home energy assessments",
    description: "Find out what a Mass Save Home Energy Assessment covers and when it may be a useful first step.",
  },
  {
    path: "/warranty",
    title: "Warranty and ongoing care",
    description: "Understand the difference between equipment coverage, installation labor and routine maintenance.",
  },
];

export default function Blog() {
  return (
    <>
      <section className="wrap blog-hero">
        <span className="eyebrow">HANSON HOME BLOG</span>
        <h1>Helpful reading for a more comfortable home.</h1>
        <p>Explore our guides to heat pumps, installation, pricing and home energy assessments in Massachusetts.</p>
      </section>
      <section className="wrap blog-grid" aria-label="Homeowner guides">
        {guides.map((guide) => (
          <Link className="panel blog-card" to={guide.path} key={guide.path}>
            <span className="eyebrow">HOMEOWNER GUIDE</span>
            <h2>{guide.title}</h2>
            <p>{guide.description}</p>
            <span className="text-link">Read guide <Icon name="arrow" size={17} /></span>
          </Link>
        ))}
      </section>
    </>
  );
}
