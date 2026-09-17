import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FAQ, Icon } from "./Shared";
import { InstallationPhoto } from "./InstallationPhoto";

export const resources = {
  assessment: "https://www.masssave.com/get-started/homeowners",
  assessmentDetails:
    "https://www.masssave.com/blog/residential/decarbonization-consultations-vs-home-energy-assessments",
  assessmentFAQ: "https://www.masssave.com/frequently-asked-questions",
  heatPumps: "https://www.energystar.gov/products/air_source_heat_pumps",
  rebates:
    "https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps",
  installation:
    "https://bsesc.energy.gov/teaching-materials/guide-installing-air-source-heat-pumps-cold-climates",
  living:
    "https://www.masssave.com/en/-/media/3A485B840F1C472F8DF1378F73ED6FC0.ashx",
};
function Source({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <p className="source-note">
      Learn more:{" "}
      <a href={href} target="_blank" rel="noreferrer">
        {children} <span aria-hidden="true">↗</span>
      </a>
    </p>
  );
}
export function NextStep({
  assessment = false,
  title,
  children,
}: {
  assessment?: boolean;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="guide-next wrap">
      <div>
        <span className="eyebrow">START WITH A CONVERSATION</span>
        <h2>{title || "Get a heat-pump estimate for your home."}</h2>
        <p>
          {children ||
            "Tell us about your home and what you want to improve. We’ll use that context to help you understand your next step before you decide on an installation."}
        </p>
        <div className="next-reassurance">
          <span>
            <Icon name="check" size={17} /> No installation commitment
          </span>
          <span>
            <Icon name="check" size={17} /> “Not sure” is welcome
          </span>
        </div>
      </div>
      <div>
        <Link
          className="button"
          to={`/start?intent=${assessment ? "assessment" : "heat-pump"}`}
        >
          {assessment ? "Request an assessment" : "Get my estimate"}
          <Icon name="arrow" />
        </Link>
        <Link
          className="text-link"
          to={assessment ? "/heat-pumps" : "/assessment"}
        >
          {assessment
            ? "Explore heat pumps"
            : "Not sure? Start with an assessment"}
          <Icon name="arrow" size={17} />
        </Link>
      </div>
    </section>
  );
}
function GuideHeader({
  label,
  title,
  intro,
  facts,
  assessment = false,
}: {
  label: string;
  title: string;
  intro: string;
  facts: [string, string][];
  assessment?: boolean;
}) {
  return (
    <section className="guide-hero wrap">
      <div>
        <Link className="back-home" to="/">
          ← Hanson Home
        </Link>
        <span className="eyebrow">{label}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="guide-hero-action">
          <Link
            className="button"
            to={`/start?intent=${assessment ? "assessment" : "heat-pump"}`}
          >
            {assessment
              ? "Start my assessment request"
              : "Get my estimate"}
            <Icon name="arrow" size={18} />
          </Link>
          <span>Choose how you’d like to be contacted.</span>
        </div>
      </div>
      <aside className="guide-at-glance">
        <span className="eyebrow">AT A GLANCE</span>
        <dl>
          {facts.map(([term, detail]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
function JumpLinks({ links }: { links: [string, string][] }) {
  return (
    <nav className="guide-jumps wrap" aria-label="On this page">
      <span>ON THIS PAGE</span>
      {links.map(([id, label]) => (
        <a key={id} href={`#${id}`}>
          {label}
        </a>
      ))}
    </nav>
  );
}
function SectionTitle({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="guide-section-heading">
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function HeatPumpExplainer({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<"winter" | "summer">("winter");
  return (
    <div className={`heat-explainer ${compact ? "compact" : ""}`}>
      <div className="season-switch" aria-label="Explore heating and cooling">
        <button
          type="button"
          aria-pressed={mode === "winter"}
          onClick={() => setMode("winter")}
        >
          <Icon name="snow" size={19} /> In winter
        </button>
        <button
          type="button"
          aria-pressed={mode === "summer"}
          onClick={() => setMode("summer")}
        >
          <Icon name="sun" size={19} /> In summer
        </button>
      </div>
      <div aria-live="polite" className="heat-explanation">
        <span className="eyebrow">
          {mode === "winter" ? "BRING WARMTH INSIDE" : "MOVE HEAT OUTSIDE"}
        </span>
        <h3>
          {mode === "winter"
            ? "It finds heat in outdoor air."
            : "It works like an air conditioner."}
        </h3>
        <p>
          {mode === "winter"
            ? "Even cold outdoor air contains heat. A heat pump uses electricity and a refrigerant circuit to move that heat into your home."
            : "The process reverses: heat moves from inside your home to the outdoors, leaving your rooms cooler."}
        </p>
        <div
          className="heat-flow"
          aria-label={
            mode === "winter"
              ? "Heat moves from outdoor air into your home"
              : "Heat moves from your home to outdoor air"
          }
        >
          <span>{mode === "winter" ? "Outdoor air" : "Your home"}</span>
          <span className="heat-flow-middle">
            <Icon name="arrow" />
            <b>Heat moves</b>
            <Icon name="arrow" />
          </span>
          <span>{mode === "winter" ? "Your home" : "Outdoor air"}</span>
        </div>
      </div>
    </div>
  );
}
function HeatPumpGuide() {
  return (
    <>
      <GuideHeader
        label="HEAT PUMPS, EXPLAINED"
        title={"Heat pumps for\nheating and cooling."}
        intro="A heat pump is an electric heating and cooling system. Instead of making heat by burning fuel, it moves heat between your home and the outdoors—warming rooms in winter and cooling them in summer."
        facts={[
          ["Two jobs, one system", "Heating in winter. Cooling in summer."],
          [
            "Designed around your home",
            "Layout, insulation and heating demand all matter.",
          ],
          [
            "No technical decisions needed",
            "Start with what you have and how you want home to feel.",
          ],
        ]}
      />
      <JumpLinks
        links={[
          ["how-heat-pumps-work", "How it works"],
          ["your-home", "Your home"],
          ["equipment-options", "Equipment options"],
          ["cost-and-incentives", "Cost & incentives"],
          ["heat-pump-questions", "Common questions"],
        ]}
      />
      <section
        className="guide-section wrap guide-split"
        id="how-heat-pumps-work"
      >
        <div>
          <SectionTitle
            label="THE SIMPLE VERSION"
            title="Moving heat, season after season."
          >
            Think of the cooling your refrigerator already does, applied to the
            comfort of your home. A heat pump can move heat in either direction.
          </SectionTitle>
          <p>
            That is why the same equipment can handle both seasons. Its
            efficiency and cold-weather performance depend on the selected model
            and the way the system is designed and installed.
          </p>
          <Source href={resources.heatPumps}>
            ENERGY STAR’s heat-pump guide
          </Source>
        </div>
        <HeatPumpExplainer />
      </section>
      <section className="guide-band" id="your-home">
        <div className="wrap">
          <SectionTitle
            label="START WITH HOW YOU LIVE"
            title="Does this sound like your home?"
          >
            You don’t have to wait for a complete system failure to explore your
            options.
          </SectionTitle>
          <div className="guide-three">
            <article>
              <Icon name="snow" size={29} />
              <h3>Some rooms never feel right.</h3>
              <p>
                Cold bedrooms or an uncomfortable upstairs are reasons to look
                at heat distribution, insulation and the system together.
              </p>
            </article>
            <article>
              <Icon name="sun" size={29} />
              <h3>You want better summer cooling.</h3>
              <p>
                If you rely on window units, an upgrade is a chance to plan
                heating and cooling around the spaces you use most.
              </p>
            </article>
            <article>
              <Icon name="clock" size={29} />
              <h3>Your equipment is getting older.</h3>
              <p>
                Planning ahead gives you time to compare a repair, replacement
                and a heat-pump upgrade before making a decision.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="guide-section wrap guide-split">
        <div>
          <SectionTitle
            label="A MASSACHUSETTS WINTER"
            title="Yes, cold-climate heat pumps exist."
          />
          <p>
            Modern cold-climate models are designed to keep heating as outdoor
            temperatures fall. The important question is how much heat the
            chosen system can deliver on your home’s coldest design day.
          </p>
          <p>
            A good plan considers your home’s heating demand, the equipment’s
            low-temperature capacity, and whether backup heat has a role. A
            bigger system is not automatically a better fit.
          </p>
          <Source href={resources.heatPumps}>
            ENERGY STAR on cold-climate equipment
          </Source>
        </div>
        <aside className="guide-paper">
          <h3>What we need to understand</h3>
          <ul className="plain-checks">
            <li>Your home’s size, layout and insulation</li>
            <li>Existing heating, cooling and fuel</li>
            <li>Rooms that are too hot or too cold</li>
            <li>Equipment locations and available electrical capacity</li>
            <li>Your priorities, timing and budget</li>
          </ul>
          <p>
            You can start even if you don’t know the technical details. Photos
            and a closer review fill in the gaps.
          </p>
        </aside>
      </section>
      <section className="guide-band" id="equipment-options">
        <div className="wrap">
          <SectionTitle
            label="COLD-CLIMATE EQUIPMENT"
            title="Real equipment. Explained for your home."
          >
            We install cold-climate heat pumps selected for Massachusetts
            winters. These examples show the features we can discuss as part of
            your home review. You can begin with a comfort concern and leave
            model selection to the planning stage.
          </SectionTitle>
          <div className="equipment-stories">
            <article className="guide-paper">
              <span className="eyebrow">WINTER PERFORMANCE</span>
              <h3>Built for cold climates</h3>
              <p>
                Cold-climate models we install list heating operation down to
                −22°F and use an inverter compressor that adjusts its output.
                Compatible indoor-unit combinations offer flexibility for
                different room layouts.
              </p>
              <p className="equipment-question">
                <strong>What this means for your plan</strong>We look at heating
                capacity at low temperatures and your home’s demand together. An
                operating-temperature limit alone does not show how much heat
                your home will receive.
              </p>
            </article>
            <article className="guide-paper">
              <span className="eyebrow">EVERYDAY COMFORT</span>
              <h3>Efficiency and controls</h3>
              <p>
                High-efficiency models list cooling efficiency up to 25 SEER2,
                plus Wi-Fi and compatible voice controls. Ratings and sound
                levels vary by model and operating setting.
              </p>
              <p className="equipment-question">
                <strong>What this means for your plan</strong>Discuss the
                controls you prefer, where equipment will go and the sound level
                for the actual model. SEER2 describes seasonal cooling
                efficiency; heating performance needs its own review.
              </p>
            </article>
          </div>
          <div className="guide-inline-callout">
            <Icon name="list" size={27} />
            <div>
              <h3>The exact model belongs in your proposal.</h3>
              <p>
                Review the equipment combination, design, current availability,
                warranty and any incentive eligibility together before approving
                an installation.
              </p>
              <Link className="text-link" to="/start?intent=heat-pump">
                Find a fit for your home <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="guide-section wrap" id="cost-and-incentives">
        <SectionTitle
          label="THE COMPLETE COST PICTURE"
          title="A useful estimate is specific to your home."
        >
          Two homes with the same square footage can need different installation
          work. Your plan should explain the equipment, installation scope and
          any electrical or other changes.
        </SectionTitle>
        <div className="cost-breakdown">
          <div>
            <span>01</span>
            <h3>Equipment & design</h3>
            <p>
              The areas you want to condition, the system capacity and how air
              reaches each room.
            </p>
          </div>
          <div>
            <span>02</span>
            <h3>Installation work</h3>
            <p>
              Equipment placement, piping routes, electrical work, access and
              any changes to the existing system.
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>Applicable incentives</h3>
            <p>
              Current program rules, your utility, existing fuel, selected
              equipment and project eligibility.
            </p>
          </div>
        </div>
        <div className="guide-inline-callout">
          <Icon name="leaf" size={27} />
          <div>
            <h3>Mass Save incentives may help.</h3>
            <p>
              Eligible Massachusetts projects may qualify for heat-pump rebates.
              Program requirements include eligible equipment and a
              participating installer. Check the current rules before relying on
              an incentive in your budget.
            </p>
            <Source href={resources.rebates}>
              Current Mass Save residential heat-pump offers
            </Source>
          </div>
        </div>
        <p className="guide-small">
          Operating costs are a separate question. Electricity and fuel rates,
          weather, insulation and how you use the system all affect your bills;
          a heat pump does not guarantee a lower bill in every home.
        </p>
      </section>
      <section
        className="guide-section wrap faq-section"
        id="heat-pump-questions"
      >
        <SectionTitle
          label="GOOD QUESTIONS"
          title="Before you make the switch."
        />
        <FAQ
          items={[
            [
              "Can I start without knowing which type I need?",
              "Absolutely. Tell us about your home, existing equipment and comfort goals. System selection comes after we understand the space.",
            ],
            [
              "Will I need electrical work?",
              "Possibly. Available electrical capacity, equipment requirements and installation location need to be reviewed. Any necessary electrical work should be identified in your project scope.",
            ],
            [
              "Should I keep my existing heating?",
              "That depends on the design, your goals and any applicable program requirements. We can discuss the role of the existing system as part of the project review.",
            ],
            [
              "Is an assessment the same as a heat-pump design?",
              "No. An energy assessment looks broadly at how your home uses energy. Equipment sizing and an installation plan need a separate, more detailed review.",
            ],
            [
              "What will it feel like day to day?",
              "Heat pumps may run for longer periods with gentler airflow than a furnace. Steady settings and clear airflow paths help comfort. Your installer should explain the best settings for your equipment.",
            ],
          ]}
        />
      </section>
      <NextStep title="Find the right heat pump for your home." />
    </>
  );
}
function AssessmentGuide() {
  return (
    <>
      <GuideHeader
        label="MASSACHUSETTS HOME ENERGY ASSESSMENTS"
        assessment
        title={"What is a Mass Save\nhome energy assessment?"}
        intro="A Mass Save® Home Energy Assessment is a whole-home review of energy use and opportunities to improve efficiency and comfort. Eligible customers can receive an assessment at no cost through the program."
        facts={[
          [
            "A whole-home perspective",
            "Insulation, air leaks and key energy-using systems.",
          ],
          [
            "A practical outcome",
            "A personalized report with recommended next steps.",
          ],
          [
            "Your choice to move forward",
            "You are not required to complete the recommendations.",
          ],
        ]}
      />
      <JumpLinks
        links={[
          ["assessment-visit", "What happens"],
          ["assessment-eligibility", "Who it’s for"],
          ["assessment-preparation", "How to prepare"],
          ["assessment-questions", "Common questions"],
        ]}
      />
      <section className="guide-section wrap" id="assessment-visit">
        <SectionTitle
          label="MORE THAN AN EQUIPMENT CHECK"
          title="What happens during the assessment?"
        >
          An Energy Specialist looks at the home as a whole, so improvements can
          be considered together.
        </SectionTitle>
        <div className="assessment-stages">
          <article>
            <span>01</span>
            <h3>Walk through your home.</h3>
            <p>
              The specialist reviews areas such as insulation, air leaks,
              heating and cooling, and water heating to identify energy-saving
              opportunities.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Discuss what could improve.</h3>
            <p>
              You can point out drafts, uncomfortable rooms and concerns about
              energy use. Recommendations are tailored to the home.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Leave with a clearer plan.</h3>
            <p>
              The report outlines recommended improvements and relevant
              incentives, helping you decide what to investigate next.
            </p>
          </article>
        </div>
        <Source href={resources.assessmentDetails}>
          Mass Save explains Home Energy Assessments
        </Source>
      </section>
      <section className="guide-band" id="assessment-eligibility">
        <div className="wrap guide-split">
          <div>
            <SectionTitle
              label="CHECK THE RIGHT PROGRAM FOR YOUR HOME"
              title="No cost for eligible customers."
            />
            <p>
              Eligibility depends on the utility or program serving your home
              and the property itself. Renters, owners and multi-unit buildings
              may follow different routes.
            </p>
            <p>
              That is why we ask for your address, utility providers, home type
              and assessment history. A Massachusetts address alone does not
              confirm eligibility.
            </p>
            <Source href={resources.assessment}>
              Mass Save’s homeowner programs
            </Source>
          </div>
          <aside className="guide-paper">
            <span className="eyebrow">ALREADY HAD AN ASSESSMENT?</span>
            <h3>Let’s build on what you have.</h3>
            <p>
              Tell us when it happened and keep the report handy. Your existing
              recommendations can help identify the next step without starting
              the conversation from scratch.
            </p>
            <Link className="text-link" to="/start?intent=assessment">
              Share your assessment history <Icon name="arrow" size={18} />
            </Link>
          </aside>
        </div>
      </section>
      <section
        className="guide-section wrap guide-split"
        id="assessment-preparation"
      >
        <div>
          <SectionTitle
            label="A LITTLE PREPARATION HELPS"
            title="Make the most of the visit."
          />
          <p>
            Mass Save says an assessment can take up to about two and a half
            hours, depending on the home. Have someone present who knows the
            property and can discuss decisions.
          </p>
          <p>
            Some energy-saving products may be provided during the visit,
            depending on the home and current program. Larger upgrades are
            recommendations to consider separately.
          </p>
          <Source href={resources.assessmentFAQ}>
            Mass Save’s assessment FAQs
          </Source>
        </div>
        <div className="visit-checklist">
          <h3>Your simple preparation list</h3>
          <ul className="plain-checks">
            <li>Note the rooms that feel drafty, hot or cold.</li>
            <li>Have your utility provider information available.</li>
            <li>Keep any previous assessment report nearby.</li>
            <li>
              Arrange safe access to heating equipment and the areas the
              specialist needs to review.
            </li>
            <li>
              Bring questions about comfort, insulation and future upgrades.
            </li>
          </ul>
        </div>
      </section>
      <section className="guide-section wrap guide-comparison">
        <SectionTitle
          label="TWO DIFFERENT PIECES OF THE PLAN"
          title="Assessment first. System design next."
        />
        <div className="coverage-grid">
          <article className="guide-paper">
            <Icon name="home" size={30} />
            <h3>Home energy assessment</h3>
            <p>
              Looks at how the home uses energy and where improvements may help.
              Insulation and air-sealing recommendations can be especially
              useful context.
            </p>
          </article>
          <article className="guide-paper">
            <Icon name="list" size={30} />
            <h3>Heat-pump project review</h3>
            <p>
              Works through equipment sizing, room coverage, locations,
              electrical needs and the installation scope. An assessment does
              not replace this design work.
            </p>
            <Link className="text-link" to="/how-it-works">
              See the installation process <Icon name="arrow" size={17} />
            </Link>
          </article>
        </div>
      </section>
      <section
        className="guide-section wrap faq-section"
        id="assessment-questions"
      >
        <SectionTitle
          label="BEFORE YOU REQUEST A VISIT"
          title="A few helpful answers."
        />
        <FAQ
          items={[
            [
              "Do I have to buy a heat pump afterward?",
              "No. Mass Save does not require you to complete the assessment’s recommendations. An assessment is a chance to understand your options.",
            ],
            [
              "Is the date I choose a confirmed appointment?",
              "No. It is your preferred date. Availability and the appointment details need to be confirmed separately.",
            ],
            [
              "What if I have a municipal electric utility?",
              "Tell us the utility name. Municipal-utility customers can have different program routes; eligibility should be checked with the provider serving the home.",
            ],
            [
              "Can I request help if I rent?",
              "Yes, you can start by sharing your situation. Your landlord or property manager may need to participate in decisions or authorize improvements.",
            ],
            [
              "Does the assessment guarantee a rebate?",
              "No. The applicable program, project, equipment and documentation still need to satisfy current requirements. The assessment helps establish context for that review.",
            ],
          ]}
        />
      </section>
      <NextStep assessment title="Request a home energy assessment.">
        Tell us your address, utilities and assessment history. We can use that
        information to help identify the appropriate next step.
      </NextStep>
    </>
  );
}
const installationSteps = [
  [
    "Start with your priorities",
    "Tell us what is uncomfortable, what equipment you have, and when you are considering a change. You can explore an upgrade before knowing the exact system you want.",
    "Your part",
    "Share your home details and the rooms you want to improve.",
  ],
  [
    "Review the home and design the system",
    "Photos help us prepare. A detailed review considers heating demand, equipment locations, air distribution, electrical capacity and access. Any necessary visit or measurements are coordinated before the scope is finalized.",
    "What gets decided",
    "Room coverage, equipment selection and any additional work.",
  ],
  [
    "Agree on a written scope",
    "Review equipment, installation work, price, exclusions and any incentive assumptions. The scope should explain who handles permits, electrical work, removal of existing equipment and required inspections.",
    "Before you approve",
    "Understand the total scope, payment terms, warranty and schedule.",
  ],
  [
    "Prepare your home and install",
    "The installation plan covers work-area protection, equipment placement, piping and wiring, connections and changes to the existing system. Access and any expected heating, cooling or power interruptions should be discussed in advance.",
    "Your part",
    "Keep agreed access routes clear and arrange a safe place for pets.",
  ],
  [
    "Test the system and show you how it works",
    "Startup includes checks appropriate to the equipment and manufacturer’s instructions. The handover should cover controls, operating modes, filters, airflow and the documentation for your new system.",
    "Before handover",
    "Ask for a controls demonstration and a clear explanation of next steps.",
  ],
  [
    "Keep the details together",
    "Keep the equipment information, invoice, warranty terms and registration records together. Confirm the maintenance requirements and the right contact for questions or a service request.",
    "For later",
    "A clear record of what was installed and how to care for it.",
  ],
];
function InstallationGuide() {
  return (
    <>
      <GuideHeader
        label="THE HANSON HOME INSTALLATION PROCESS"
        title={"Heat-pump installation.\nFrom estimate to startup."}
        intro="We review your home, explain the equipment and price, coordinate the installation and show you how to use the finished system. Here is what happens at each step."
        facts={[
          [
            "Start without a system choice",
            "We begin with your home and goals.",
          ],
          [
            "Agree before work begins",
            "Review scope, cost and timing together.",
          ],
          [
            "Finish with an explanation",
            "Understand the controls, care and paperwork.",
          ],
        ]}
      />
      <JumpLinks
        links={[
          ["installation-steps", "The process"],
          ["installation-day", "Installation day"],
          ["installation-questions", "Common questions"],
        ]}
      />
      <section className="guide-section wrap" id="installation-steps">
        <SectionTitle
          label="YOUR INSTALLATION, STEP BY STEP"
          title="We plan the job before work begins."
        />
        <ol className="installation-timeline">
          {installationSteps.map(([title, body, label, detail], i) => (
            <li key={title}>
              <div className="installation-number">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <aside>
                <span>{label}</span>
                <p>{detail}</p>
              </aside>
            </li>
          ))}
        </ol>
        <Source href={resources.installation}>
          Cold-climate installation guidance from NEEP, hosted by the U.S.
          Department of Energy
        </Source>
      </section>
      <section className="guide-band" id="installation-day">
        <div className="wrap guide-split">
          <div>
            <SectionTitle
              label="LIFE DOESN’T STOP FOR AN UPGRADE"
              title={"Know what to expect\non installation day."}
            />
            <p>
              Timing depends on the system, access, electrical work and any
              other changes needed. Your project schedule should explain how
              long work is expected to take and when services may be
              interrupted.
            </p>
            <p>
              Tell us early about pets, working from home, parking constraints
              or access concerns. Those details belong in the plan.
            </p>
          </div>
          <div className="guide-paper">
            <h3>Before installation day</h3>
            <ul className="plain-checks">
              <li>Confirm arrival and access arrangements.</li>
              <li>Know which rooms and outdoor areas will be used.</li>
              <li>Discuss expected noise and service interruptions.</li>
              <li>Confirm removal and cleanup responsibilities.</li>
              <li>Set aside time for the system walkthrough.</li>
            </ul>
          </div>
        </div>
      </section>
      <section
        className="guide-section wrap faq-section"
        id="installation-questions"
      >
        <SectionTitle
          label="PRACTICAL QUESTIONS"
          title="What most homeowners want to know."
        />
        <FAQ
          items={[
            [
              "How long will my installation take?",
              "There isn’t one timeline for every home. Equipment, access, electrical work and changes to the existing system affect the schedule. Confirm the expected duration with your project scope.",
            ],
            [
              "Can I stay home while the work happens?",
              "Discuss this when scheduling. Work areas, interruptions and any access restrictions should be clear in advance so you can plan your day.",
            ],
            [
              "Are permits and electrical work included?",
              "Your written scope should state exactly what is included and who is responsible. Any additional work should be explained before you approve it.",
            ],
            [
              "Will you remove my old heating equipment?",
              "That depends on whether it is being replaced or retained as part of the design. Removal and disposal responsibilities should be written into the scope.",
            ],
            [
              "What should I receive at the end?",
              "Keep the model information, operating instructions, invoice, warranty documents and any registration records. Ask how to use the controls, care for filters and request support.",
            ],
          ]}
        />
      </section>
      <section className="wrap support-feature installation-guide-photo">
        <InstallationPhoto scene="installation" />
        <div>
          <span className="eyebrow">BEFORE WE HAND OVER YOUR SYSTEM</span>
          <h2>Installed, checked<br />and explained.</h2>
          <p>We complete startup checks and explain the controls, filter care and operating modes. Your equipment details and warranty information belong with the finished job.</p>
          <Link className="text-link" to="/warranty">Review warranty and care <Icon name="arrow" /></Link>
        </div>
      </section>
      <NextStep title="Start your heat-pump installation estimate." />
    </>
  );
}
function WarrantyGuide() {
  return (
    <>
      <GuideHeader
        label="WARRANTY & ONGOING CARE"
        title={"Your heat-pump warranty.\nCoverage explained."}
        intro="Understand what is covered, who provides that coverage and how to get help before you approve the installation. Equipment protection, installation labor and routine maintenance are different parts of the conversation."
        facts={[
          [
            "Equipment coverage",
            "Set by the selected manufacturer and product.",
          ],
          [
            "Installation labor",
            "Review it separately in the written agreement.",
          ],
          ["Ongoing care", "Understand maintenance and service arrangements."],
        ]}
      />
      <JumpLinks
        links={[
          ["manufacturer-warranty", "Manufacturer coverage"],
          ["warranty-coverage", "Coverage explained"],
          ["system-care", "Caring for your system"],
          ["warranty-questions", "Common questions"],
        ]}
      />
      <section
        className="guide-section wrap guide-split"
        id="manufacturer-warranty"
      >
        <div>
          <SectionTitle
            label="EQUIPMENT PROTECTION"
            title="A clearer picture of manufacturer coverage."
          />
          <p>
            Selected cold-climate systems we install offer extended limited
            coverage up to 12 years with qualifying registration. Base coverage
            typically includes several years for parts and a longer period for
            the compressor, with an extension available when registration
            requirements are met.
          </p>
          <p>
            Hanson’s installation labor is covered separately for up to 2
            years. Confirm the certificate, applicable deadline and
            registration responsibility for your exact equipment before
            installation; your proposal states both coverages in writing.
          </p>
        </div>
        <aside className="guide-paper warranty-example">
          <span className="eyebrow">ELIGIBLE EQUIPMENT</span>
          <h3>
            Up to <strong>12 years</strong>
          </h3>
          <p>
            Extended limited equipment coverage, subject to the model’s terms
            and required registration. Installation labor is covered for up to
            2 years.
          </p>
          <div className="equipment-question">
            <strong>Keep the confirmation.</strong>Retain your warranty
            certificate, model and serial numbers, invoice and installation
            date. The Hanson Home team confirms the registration steps for your
            equipment with your proposal.
          </div>
        </aside>
      </section>
      <section className="guide-section wrap" id="warranty-coverage">
        <SectionTitle
          label="KNOW WHAT YOU ARE COMPARING"
          title="Two kinds of coverage. Get both in writing."
        >
          Coverage periods and conditions depend on your selected equipment and
          agreement. Review the actual terms for your project before you commit.
        </SectionTitle>
        <div className="coverage-grid">
          <article className="coverage-card">
            <span className="round-icon">
              <Icon name="shield" size={28} />
            </span>
            <span className="eyebrow">MANUFACTURER</span>
            <h3>Equipment & parts</h3>
            <p>
              Product warranties describe which equipment or parts are covered
              and under what conditions. Registration, eligible installation and
              maintenance requirements may affect coverage.
            </p>
            <ul className="plain-checks">
              <li>Which parts and components are covered?</li>
              <li>When does coverage start and end?</li>
              <li>Is registration required, and who completes it?</li>
            </ul>
          </article>
          <article className="coverage-card">
            <span className="round-icon">
              <Icon name="home" size={28} />
            </span>
            <span className="eyebrow">INSTALLATION & SERVICE</span>
            <h3>Labor & workmanship</h3>
            <p>
              A parts warranty does not automatically mean every repair visit is
              free. Installation coverage and future service costs should be
              explained separately in your written agreement.
            </p>
            <ul className="plain-checks">
              <li>What installation work is covered?</li>
              <li>Are labor, travel or diagnostic charges included?</li>
              <li>Who should you contact if something is wrong?</li>
            </ul>
          </article>
        </div>
        <div className="guide-inline-callout">
          <Icon name="list" size={28} />
          <div>
            <h3>Bring the warranty into the estimate conversation.</h3>
            <p>
              Ask for the coverage periods, exclusions, registration
              requirements and support contact alongside the equipment and
              price. That makes different proposals easier to compare.
            </p>
            <Link className="text-link" to="/contact">
              Talk through your project <Icon name="arrow" size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="guide-band" id="system-care">
        <div className="wrap guide-split">
          <div>
            <SectionTitle
              label="LIVING WITH YOUR HEAT PUMP"
              title="A little care supports everyday comfort."
            />
            <p>
              Keep filters clean as directed by your equipment manual, keep
              airflow paths clear and learn the recommended thermostat settings.
              Heat pumps often work best with steadier settings rather than
              large temperature swings.
            </p>
            <p>
              Ask about the professional service schedule for your equipment and
              keep a record of maintenance. If comfort changes or error messages
              appear, note what you see and contact the appropriate service
              provider.
            </p>
            <Source href={resources.living}>
              Mass Save’s guide to living with a heat pump
            </Source>
          </div>
          <div className="guide-paper">
            <h3>Keep your home’s equipment file.</h3>
            <ul className="plain-checks">
              <li>Model and serial numbers</li>
              <li>Installation date and invoice</li>
              <li>Equipment and labor warranty documents</li>
              <li>Registration confirmation, if required</li>
              <li>Operating manuals and maintenance records</li>
              <li>The contact for service and warranty questions</li>
            </ul>
          </div>
        </div>
      </section>
      <section
        className="guide-section wrap faq-section"
        id="warranty-questions"
      >
        <SectionTitle
          label="CLARITY BEFORE COMMITMENT"
          title="Ask the questions that matter."
        />
        <FAQ
          items={[
            [
              "How many years of warranty will I receive?",
              "Eligible equipment can have extended limited coverage up to 12 years with qualifying registration, and Hanson's installation labor is covered for up to 2 years. The exact manufacturer terms and labor coverage must be stated in your proposal; the two are separate.",
            ],
            [
              "Is maintenance included in a warranty?",
              "Routine maintenance and warranty repairs are different. A maintenance plan is included only when your agreement says so, and you should check any care requirements that apply to the warranty.",
            ],
            [
              "Who registers the equipment?",
              "Confirm who is responsible, whether a deadline applies and what proof you should keep. Do this during the handover rather than assuming registration happens automatically.",
            ],
            [
              "What information helps when I request service?",
              "Have the model and serial number, installation date, a description of the issue and any displayed error code ready. Explain whether the issue affects heating, cooling or a particular room.",
            ],
          ]}
        />
      </section>
      <NextStep title="Discuss equipment, installation and coverage." />
    </>
  );
}
export default function Education() {
  const { pathname } = useLocation();
  if (pathname === "/assessment") return <AssessmentGuide />;
  if (pathname === "/how-it-works") return <InstallationGuide />;
  if (pathname === "/warranty") return <WarrantyGuide />;
  return <HeatPumpGuide />;
}
