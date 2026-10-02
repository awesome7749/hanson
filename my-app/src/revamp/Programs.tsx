import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FAQ, Icon } from "./Shared";

export function HomePrograms() {
  return <div className="home-programs wrap" id="programs">
    <section className="program-feature program-trade" aria-labelledby="home-trade-title">
      <div className="program-symbol"><Icon name="leaf" size={32} /></div>
      <span className="eyebrow">A FRESH START FOR YOUR HOME</span>
      <h2 id="home-trade-title">Ready to replace<br />your old system?</h2>
      <p>Explore our trade-in program when planning a new heat-pump installation. Get $100–$500 in trade-in credit toward a qualifying new system.</p>
      <Link className="button" to="/trade-in">Explore trade-in <Icon name="arrow" size={18} /></Link>
      <span className="program-caption">Single-zone $100 · Multi-zone $300 · Ducted or cassette $500.</span>
    </section>
    <section className="program-feature program-community" aria-labelledby="home-discount-title">
      <div className="program-symbol"><Icon name="shield" size={32} /></div>
      <span className="eyebrow">THANK YOU FOR YOUR SERVICE</span>
      <h2 id="home-discount-title">15% off<br />for veterans.</h2>
      <p>Planning a heat-pump project? Veterans receive 15% off. Tell us about your project to request your discount.</p>
      <Link className="button light" to="/veterans-discount">Explore discounts <Icon name="arrow" size={18} /></Link>
      <span className="program-caption">Discount details confirmed before you commit.</span>
    </section>
  </div>;
}

export default function Programs({ program }: { program: "trade-in" | "community" }) {
  const trade = program === "trade-in";
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const nav = useNavigate();
  const name = trade ? "Trade-in program" : "Veterans discount — 15% off";
  return <div className="program-page">
    <section className="section wrap program-hero">
      <div>
        <Link className="text-link program-back" to="/#programs">Hanson Home programs <Icon name="arrow" size={16} /></Link>
        <span className="eyebrow">{trade ? "YOUR NEXT CHAPTER IN COMFORT" : "A LITTLE THANKS. A MORE COMFORTABLE HOME."}</span>
        <h1>{trade ? <>Old system.<br />New possibilities.</> : <>15% off<br />for veterans.</>}</h1>
        <p>{trade ? "Considering a heat pump to replace your current heating or cooling system? Start with a trade-in review and a clear installation proposal." : "As a thank-you for your service, veterans qualify for 15% off a heat-pump installation through Hanson Home."}</p>
        <a className="button" href="#program-review">{trade ? "Check my trade-in options" : "Ask about my discount"} <Icon name="arrow" /></a>
      </div>
      <aside className="program-overview">
        <Icon name={trade ? "leaf" : "shield"} size={42} />
        <h2>{trade ? "A review tailored to your home." : "Your project. Your eligibility."}</h2>
        <ul className="check-list">
          {(trade ? ["Tell us about the equipment you’re replacing", "Review any credit in your written proposal", "Plan replacement work with the installation team"] : ["Tell us you’re applying as a veteran", "Request your 15% veterans discount", "Review your discount in the written proposal"]).map(text => <li key={text}><Icon name="check" /><span>{text}</span></li>)}
        </ul>
        <p className="program-caption">No installation commitment to request a review.</p>
      </aside>
    </section>

    {trade && <section className="wrap program-credit-section" aria-labelledby="trade-credits-title">
      <span className="eyebrow">YOUR TRADE-IN CREDIT</span>
      <h2 id="trade-credits-title">A credit toward your next system.</h2>
      <div className="program-credit-grid">
        {[["Single-Zone Mini-Split AC", "$100"], ["Multi-Zone Mini-Split AC", "$300"], ["Ducted Mini-Split AC", "$500"], ["Ceiling Cassette Mini-Split AC", "$500"]].map(([system, credit]) => <article key={system}><span>{credit}</span><h3>{system}</h3><p>Trade-in credit</p></article>)}
      </div>
    </section>}

    <section className="section wrap program-process" aria-labelledby="program-process-title">
      <span className="eyebrow">WHAT TO EXPECT</span>
      <h2 id="program-process-title">Three simple steps.</h2>
      <ol className="program-step-grid">
        {[
          ["Tell us about your project", trade ? "Share the type of system you have, your home details and what you’d like to replace." : "Let us know you’re a veteran, then share your home and installation goals."],
          ["We review the details", trade ? "The team checks the equipment and planned installation, including any removal work and potential trade-in credit." : "The team explains the qualifying criteria and any verification needed for your discount."],
          ["You review the proposal", "Your written quote confirms any approved credit or discount, the included work and how other incentives apply before you decide."],
        ].map(([title, copy], i) => <li key={title}><span className="step-digit">0{i + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}
      </ol>
    </section>

    <section className="section wrap program-review" id="program-review" aria-labelledby="program-review-title">
      <div>
        <span className="eyebrow">LET’S CHECK YOUR OPTIONS</span>
        <h2 id="program-review-title">{trade ? "Choose your new system." : "Request your veterans discount."}</h2>
        <p>{trade ? "You don’t need a model number or a previous Hanson Home order to start the conversation." : "Veterans qualify for 15% off. Let us know you’re a veteran, and the team will explain any verification needed."}</p>
        <p>Continue to our estimate form to add your contact and home details. Your program request will be included for the team to review.</p>
      </div>
      <form className="program-form" onSubmit={e => {
        e.preventDefault();
        const programRequest = `${name}: ${category}${notes.trim() ? ` — ${notes.trim()}` : ""}`;
        nav("/start?intent=heat-pump", { state: { programRequest } });
      }}>
        {trade ? <>
          <label htmlFor="program-category">New system you’re looking for</label>
          <select id="program-category" value={category} onChange={e => setCategory(e.target.value)} required>
            <option value="">Choose an option</option>
            {["Single-Zone Mini-Split AC — $100 trade-in credit", "Multi-Zone Mini-Split AC — $300 trade-in credit", "Ducted Mini-Split AC — $500 trade-in credit", "Ceiling Cassette Mini-Split AC — $500 trade-in credit"].map(option => <option key={option}>{option}</option>)}
          </select>
        </> : <label className="program-veteran-check"><input type="checkbox" required checked={category === "Veteran"} onChange={e => setCategory(e.target.checked ? "Veteran" : "")} /> I am a veteran and would like the 15% discount.</label>}
        <label htmlFor="program-notes">{trade ? "Anything we should know about the system? (optional)" : "Anything we should know? (optional)"}</label>
        <textarea id="program-notes" rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} placeholder={trade ? "Approximate age, condition or what you’d like to improve" : "A question about your discount or installation"} aria-describedby="program-notes-help" />
        <p id="program-notes-help" className="program-caption">Please leave out identification numbers and documents. We’ll explain any verification needed when we contact you.</p>
        <button className="button" type="submit">Continue to my estimate <Icon name="arrow" size={18} /></button>
        <p className="program-caption">This step adds details to your estimate request. It does not submit an application yet.</p>
      </form>
    </section>

    <section className="section wrap faq-section">
      <div><span className="eyebrow">PROGRAM QUESTIONS</span><h2>Before you<br />get started.</h2></div>
      <FAQ items={[
        [trade ? "How much trade-in credit can I receive?" : "How much is the discount?", trade ? "Trade-in credits are $100 for a single-zone mini-split, $300 for a multi-zone mini-split, and $500 for a ducted mini-split or ceiling cassette mini-split. Your proposal will confirm the credit for your selected system." : "Veterans qualify for 15% off. Ask for the veterans discount when starting your estimate; your proposal will show the discount and the amount it applies to before you commit."],
        [trade ? "Do you buy equipment on its own?" : "Who can ask about the discount?", trade ? "This program is for homeowners planning a replacement heat-pump installation through Hanson Home. Ask the team about the equipment you want to replace as part of that project." : "Veterans qualify for this discount. Tell us you’re a veteran when requesting an estimate, and the team will explain any verification needed."],
        ["Can I combine this with rebates or other offers?", "Ask the team to review your options together. Any approved combination and potential utility rebates will be explained separately in your proposal."],
        [trade ? "Is removal of my old system included?" : "Do I need to upload proof here?", trade ? "Removal, disposal and any supporting work are reviewed with your installation scope. Check the written proposal for what is included and any separate costs." : "No. Please do not upload or enter military, school or government identification documents here. The team will explain any verification needed during the review."],
      ]} />
    </section>
    <div className="wrap program-other"><Link className="text-link" to={trade ? "/veterans-discount" : "/trade-in"}>{trade ? "Explore the 15% veterans discount" : "Explore our trade-in program"} <Icon name="arrow" /></Link></div>
  </div>;
}
