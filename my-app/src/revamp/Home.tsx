import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, FAQ } from "./Shared";
import { HeatPumpExplainer, resources } from "./Education";
import GoogleReviews from "./Reviews";
import { LifestylePhoto } from "./LifestylePhoto";
import { HeroSlideshow } from "./HeroSlideshow";
import { QuoteBreakdown, RebateHighlight } from "./Pricing";
import { InstallationPhoto } from "./InstallationPhoto";

export default function Home() {
  const [address, setAddress] = useState("");
  const nav = useNavigate();
  return (
    <div className="specialist-home">
      <section className="hero wrap specialist-hero">
        <div className="hero-copy">
          <span className="eyebrow">Your Heat Pump Specialist</span>
          <h1>Heat pump installation.<span>Made simple.</span></h1>
          <p>Clear pricing. No hidden fees.</p>
          <ul className="hero-service-checks">
            <li><Icon name="check" size={18} /> An itemized quote</li>
            <li><Icon name="check" size={18} /> Professional installation</li>
            <li><Icon name="check" size={18} /> Help at every step</li>
          </ul>
          <form className="address-cta" onSubmit={(e) => {
            e.preventDefault();
            nav("/start?intent=heat-pump", { state: { address } });
          }}>
            <label className="address-entry">
              <Icon name="pin" />
              <input aria-label="Your street address" placeholder="Your street address"
                value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <button className="button" type="submit">Get my estimate <Icon name="arrow" size={19} /></button>
          </form>
          <div className="hero-reassurance"><span>No installation commitment</span><span>A few simple questions</span></div>
          <Link className="text-link hero-secondary" to="/pricing">See pricing details <Icon name="arrow" size={17} /></Link>
          <Link className="text-link hero-secondary" to="/heat-pump-cost-calculator">Calculate my switching cost <Icon name="arrow" size={17} /></Link>
        </div>
        <HeroSlideshow />
      </section>

      <div className="promise-band specialist-promises">
        <div className="wrap">
          <span><Icon name="list" /> No hidden fees</span>
          <span><Icon name="home" /> Heat-pump specialists</span>
          <span><Icon name="calendar" /> Installation, handled</span>
          <span><Icon name="shield" /> Support after installation</span>
        </div>
      </div>

      <RebateHighlight />

      <section className="section wrap pricing-intro" id="pricing">
        <div>
          <span className="eyebrow">CLEAR PRICING. FROM THE START.</span>
          <h2>Know your price<br />before work begins.</h2>
          <p>A written quote. An agreed scope. Your approval before any extra work or cost.</p>
          <div className="price-principles">
            <div><Icon name="list" /><span><strong>One project price</strong>Equipment, labor and included work.</span></div>
            <div><Icon name="check" /><span><strong>Changes need your approval</strong>We explain any added work and cost first.</span></div>
            <div><Icon name="leaf" /><span><strong>Rebates shown separately</strong>Know the full cost and potential savings.</span></div>
          </div>
          <Link className="text-link" to="/pricing">What your quote includes <Icon name="arrow" /></Link>
        </div>
        <QuoteBreakdown />
      </section>

      <section className="installation-feature">
        <div className="wrap installation-feature-grid">
          <InstallationPhoto scene="installation" />
          <div>
            <span className="eyebrow">WE HANDLE THE INSTALLATION</span>
            <h2>Your home.<br />Handled with care.</h2>
            <p>Careful installation. Clear updates. A clean work area.</p>
            <ul className="installation-promises">
              <li><Icon name="check" /><span><strong>Plan the work</strong>Confirm the schedule, access and equipment locations.</span></li>
              <li><Icon name="check" /><span><strong>Protect your home</strong>Cover nearby surfaces and clean up afterward.</span></li>
              <li><Icon name="check" /><span><strong>Test and explain</strong>Check the system and show you the controls.</span></li>
            </ul>
            <Link className="button light" to="/how-it-works">How installation works <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <section className="section wrap straightforward-process" id="how-it-works">
        <div className="section-heading">
          <div><span className="eyebrow">FOUR SIMPLE STEPS</span><h2>From estimate<br />to installation.</h2></div>
        </div>
        <ol className="four-step-grid">
          {[
            ["Tell us about your home", "Share your address, current system and what you need."],
            ["Review your proposal", "Choose your equipment and approve the written scope and price."],
            ["Schedule your installation", "Choose a date. We coordinate the work."],
            ["Learn your new system", "We test it, explain the controls and show you how to get help."],
          ].map(([title, copy], index) => <li key={title}><span className="step-digit">0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
        <Link className="button" to="/start?intent=heat-pump">Start my estimate <Icon name="arrow" /></Link>
      </section>

      <section className="support-feature wrap">
        <div>
          <span className="eyebrow">WE’RE HERE TO HELP</span>
          <h2>Support after<br />installation.</h2>
          <p>Get help with controls, care and warranty questions.</p>
          <div className="support-links">
            <Link to="/warranty"><Icon name="shield" /><span>Understand your warranty</span><Icon name="arrow" size={18} /></Link>
            <Link to="/warranty#system-care"><Icon name="home" /><span>Learn everyday system care</span><Icon name="arrow" size={18} /></Link>
            <Link to="/contact"><Icon name="mail" /><span>Contact Hanson Home</span><Icon name="arrow" size={18} /></Link>
          </div>
        </div>
        <InstallationPhoto scene="handover" />
      </section>

      <section className="guide-band">
        <div className="section wrap home-learning">
          <div>
            <span className="eyebrow">NEW TO HEAT PUMPS?</span>
            <h2>One system for<br />heating and cooling.</h2>
            <p>A heat pump moves heat into your home in winter and out in summer.
              It runs on electricity and can serve individual rooms or a whole home.</p>
            <Link className="text-link" to="/heat-pumps">Explore heat-pump options <Icon name="arrow" /></Link>
          </div>
          <HeatPumpExplainer compact />
        </div>
      </section>

      <section className="section wrap assessment-promo">
        <LifestylePhoto scene="conversation" className="assessment-photo" />
        <div>
          <span className="eyebrow">MASS SAVE® HOME ENERGY ASSESSMENTS</span>
          <h2>Find out where your<br />home loses energy.</h2>
          <p>Check insulation, air leaks and energy use. Eligible customers can receive
            a no-cost Mass Save assessment with recommended improvements.</p>
          <ul className="check-list">
            <li><Icon name="check" /> Identify drafts and insulation opportunities</li>
            <li><Icon name="check" /> Get recommended improvements in a report</li>
            <li><Icon name="check" /> Understand your home before choosing equipment</li>
          </ul>
          <Link className="button dark" to="/start?intent=assessment">Request an assessment <Icon name="arrow" /></Link>
          <p className="assessment-learn-link"><Link className="text-link" to="/assessment">How the assessment works <Icon name="arrow" size={17} /></Link></p>
          <p className="source-note">Eligibility and offers vary. <a href={resources.assessment} target="_blank" rel="noreferrer">Explore the Mass Save program ↗</a></p>
        </div>
      </section>

      <GoogleReviews />

      <section className="section wrap faq-section home-purchase-faq">
        <div>
          <span className="eyebrow">BEFORE YOU GET STARTED</span>
          <h2>Questions about<br />price and installation?</h2>
          <Link className="text-link" to="/contact">Ask us about your project <Icon name="arrow" /></Link>
        </div>
        <FAQ items={[
          ["How much will my heat-pump installation cost?", "The price depends on the rooms you want to cover, equipment, electrical capacity and installation work. Share your home details to start an estimate. We review the home and confirm a written scope and price before you commit."],
          ["What does no hidden fees mean?", "Your written proposal identifies the included work, exclusions and price. If the scope needs to change, we explain the work and cost and get your approval before proceeding. Potential rebates are shown separately from the project price."],
          ["Will you help me choose the right heat pump?", "Yes. We start with your home, current heating and cooling, and the rooms you want to improve. You do not need to select a model or know whether you need ducts or mini-splits before contacting us."],
          ["Can I get Mass Save rebates?", "Eligibility depends on your utilities, existing system, home and project details. We review that information with you. Incentives are subject to current program requirements and are not guaranteed by an estimate request."],
          ["How long does installation take?", "Your schedule depends on the system, access, electrical work and any changes to your existing setup. We confirm the expected duration and explain disruptions before installation day."],
          ["What warranty comes with my installation?", "Equipment and installation labor have separate coverage. Review the terms for your proposed system, including coverage periods, exclusions, registration and the service contact, before approving the work."],
          ["Does requesting an estimate commit me to anything?", "No. It starts a conversation about your home. You review the scope, price and schedule before deciding whether to proceed."],
        ]} />
      </section>
      <section className="last-cta wrap specialist-last-cta">
        <span className="eyebrow">HANSON HOME · MASSACHUSETTS</span>
        <h2>Get a heat-pump estimate<br />for your home.</h2>
        <p>Share your home details to get started.</p>
        <Link className="button" to="/start?intent=heat-pump">Get my estimate <Icon name="arrow" /></Link>
        <span className="cta-note">No installation commitment.</span>
      </section>
    </div>
  );
}
