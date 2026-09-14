import React from "react";
import { Link } from "react-router-dom";
import { Icon, FAQ } from "./Shared";
import { resources } from "./Education";

export function RebateHighlight() {
  return <section className="rebate-highlight wrap" aria-label="2026 Mass Save heat-pump rebates">
    <div><span className="eyebrow">2026 MASS SAVE® REBATES</span><p>Up to <strong>$8,500</strong></p></div>
    <div><h2>Help with the cost of a qualifying heat pump.</h2><p>For eligible whole-home and partial-home projects. Amounts depend on system size and program rules; qualifying utilities, equipment and an eligible installer are required.</p><a className="text-link" href={resources.rebates} target="_blank" rel="noreferrer">Check current eligibility with Mass Save ↗</a></div>
  </section>;
}

export function QuoteBreakdown() {
  return <aside className="quote-breakdown" aria-label="What your written quote covers">
    <div className="quote-heading"><Icon name="list" size={27} /><span>YOUR WRITTEN QUOTE</span></div>
    <h3>Every part of the job.<br />In one clear proposal.</h3>
    <dl>
      <div><dt>Equipment</dt><dd>Models, sizing & room coverage</dd></div>
      <div><dt>Installation</dt><dd>Labor, materials & setup</dd></div>
      <div><dt>Supporting work</dt><dd>Electrical, permits & removal scope</dd></div>
      <div><dt>Potential incentives</dt><dd>Eligibility & assumptions, separately</dd></div>
    </dl>
    <div className="quote-total"><Icon name="check" /><span>A project total you approve<br /><strong>Before work begins.</strong></span></div>
    <p>Included work, exclusions and payment terms are written out for your review.</p>
  </aside>;
}
export default function Pricing() {
  return <>
    <section className="section wrap pricing-intro pricing-page-hero">
      <div>
        <span className="eyebrow">HEAT-PUMP PRICING</span>
        <h1>Clear scope.<br />Clear price.<br /><span>No hidden fees.</span></h1>
        <p>Get a quote for the work your home actually needs. We explain the equipment,
          installation and supporting work together, then agree on the price before starting.</p>
        <Link className="button" to="/start?intent=heat-pump">Get my estimate <Icon name="arrow" /></Link>
        <p className="pricing-note">Your request starts an estimate. A final quote follows a review of your home and project scope.</p>
      </div>
      <QuoteBreakdown />
    </section>
    <section className="guide-band">
      <div className="section wrap">
        <span className="eyebrow">WHAT AFFECTS THE COST?</span>
        <h2>Three things shape your price.</h2>
        <div className="price-factors">
          <article><span>01</span><h3>Your home & room coverage</h3><p>The rooms you want to heat and cool, the home’s heating demand and the existing distribution system affect equipment design.</p></article>
          <article><span>02</span><h3>Your equipment</h3><p>The selected models, capacity and number of indoor units affect cost. We explain the options and put the proposed models in writing.</p></article>
          <article><span>03</span><h3>The installation work</h3><p>Electrical capacity, access, piping, duct changes and removal of existing equipment can affect the scope. These details belong in the quote.</p></article>
        </div>
      </div>
    </section>
    <section className="section wrap pricing-intro">
      <div><span className="eyebrow">COMPARE THE COMPLETE JOB</span><h2>A useful quote answers<br />more than “how much?”</h2><p>Compare proposals using the same equipment and scope. A lower headline price may cover a different job.</p><Link className="text-link" to="/how-it-works">Understand the installation work <Icon name="arrow" /></Link></div>
      <ul className="quote-checklist">
        <li><Icon name="check" /> Which models and rooms are included?</li>
        <li><Icon name="check" /> Who handles electrical work, permits and inspections?</li>
        <li><Icon name="check" /> Is equipment removal or disposal included?</li>
        <li><Icon name="check" /> What is excluded, and how are changes approved?</li>
        <li><Icon name="check" /> What are the payment terms and warranty coverages?</li>
        <li><Icon name="check" /> Are rebates estimated, confirmed or paid later?</li>
      </ul>
    </section>
    <RebateHighlight />
    <section className="rebate-callout wrap" id="rebates">
      <Icon name="leaf" size={34} />
      <div><span className="eyebrow">MASS SAVE® & OTHER INCENTIVES</span><h2>Understand the full price.<br />Then review potential savings.</h2><p>Your utility, existing system and project details can affect incentive eligibility. Potential rebates are listed separately, with their assumptions and requirements. We don’t treat an unconfirmed rebate as money already received.</p><a className="text-link" href={resources.rebates} target="_blank" rel="noreferrer">Check current Mass Save heat-pump requirements ↗</a></div>
    </section>
    <section className="section wrap faq-section">
      <div><span className="eyebrow">PRICING QUESTIONS</span><h2>Know the details<br />before you decide.</h2></div>
      <FAQ items={[
        ["Can you give me a price from the online form?", "The form gives us the starting details for an estimate. Equipment design and installation conditions still need review before we confirm a final written scope and price."],
        ["What happens if the work changes?", "We explain the proposed change, its cost and its effect on the schedule. Additional work requires your approval before proceeding."],
        ["Are electrical work and permits included?", "Your proposal identifies the included electrical work, permit and inspection responsibilities, and any work outside the agreed scope. Review those items before approving the project."],
        ["Can you guarantee my rebate?", "No. Incentives depend on eligibility, documentation, qualifying equipment and current program rules. Your proposal separates potential incentives from the full project price."],
      ]} />
    </section>
    <section className="last-cta wrap specialist-last-cta"><span className="eyebrow">START WITH YOUR HOME</span><h2>Get a quote you can understand.</h2><p>Share your address and what you want to improve. No equipment expertise required.</p><Link className="button" to="/start?intent=heat-pump">Get my estimate <Icon name="arrow" /></Link></section>
  </>;
}
