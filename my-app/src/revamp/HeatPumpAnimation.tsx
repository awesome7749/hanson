import React, { useId, useState } from "react";
import "./HeatPumpAnimation.css";

const explanations = {
  heating: "The outdoor coil absorbs heat. The compressor raises the refrigerant’s pressure and temperature. The indoor coil releases heat into recirculating room air. The expansion valve lowers the pressure so the cycle can repeat.",
  cooling: "The reversing valve changes which coil receives hot refrigerant. The indoor coil now absorbs room heat; the outdoor coil releases it outside. Moisture can also condense at the cold indoor coil and drain away.",
  defrost: "For a short interval, the system directs heat to the outdoor coil to melt frost. Indoor heating pauses or is supported by auxiliary heat, depending on the system. Meltwater drains away, then normal heating resumes.",
};
type Mode = keyof typeof explanations;

export default function HeatPumpAnimation() {
  const [mode, setMode] = useState<Mode>("heating");
  const [playing, setPlaying] = useState(false);
  const id = useId().replace(/:/g, "");
  const heating = mode === "heating";
  const sink = heating ? 560 : 200;
  const source = heating ? 200 : 560;
  const hot = "#a34f2e";
  const cold = "#326c86";
  const sourceY = heating ? 175 : 505;
  const sinkY = heating ? 505 : 175;
  return <figure className={`heat-animation ${playing ? "heat-animation-playing" : ""}`}>
    <div className="heat-animation-top">
      <div><span className="eyebrow">FOLLOW THE HEAT</span><h3>One system. Two directions.</h3></div>
      <button type="button" className="heat-animation-play" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? "Pause animation" : "Play animation"}</button>
    </div>
    <div className="heat-animation-modes" role="group" aria-label="Heat pump operating mode">
      {(["heating", "cooling", "defrost"] as Mode[]).map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)}>{({ heating: "Winter heating", cooling: "Summer cooling", defrost: "Winter defrost" })[item]}</button>)}
    </div>
    <div role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <svg className="heat-animation-desktop" viewBox="0 0 760 460" aria-hidden="true">
      <title id={`${id}-title`}>{({ heating: "Winter: heat moves from outdoor air into your home", cooling: "Summer: heat moves from your home into outdoor air", defrost: "Defrost: heat is directed to the outdoor coil to melt frost" })[mode]}</title>
      <desc id={`${id}-desc`}>Outdoor and indoor air circulate separately. A sealed refrigerant circuit connects the two coils through a compressor and an expansion valve. This is a conceptual cycle, not an installation piping diagram.</desc>
      <defs>{[["hot", hot], ["cold", cold]].map(([name, color]) => <marker key={name} id={`${id}-${name}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>)}</defs>
      <rect x="14" y="20" width="318" height="400" rx="22" fill="#e8eff0" />
      <rect x="428" y="20" width="318" height="400" rx="22" fill="#f1e6d8" />
      <text x="173" y="53" textAnchor="middle" className="heat-svg-label">OUTDOORS</text><text x="587" y="53" textAnchor="middle" className="heat-svg-label">YOUR HOME</text>
      <path d={`M 380 104 H ${sink} V 155`} stroke={hot} markerEnd={`url(#${id}-hot)`} className="heat-refrigerant" />
      <path d={`M ${sink} 273 V 350 H 405`} stroke={hot} markerEnd={`url(#${id}-hot)`} className="heat-refrigerant" />
      <path d={`M 355 350 H ${source} V 278`} stroke={cold} markerEnd={`url(#${id}-cold)`} className="heat-refrigerant" />
      <path d={`M ${source} 155 V 104 H 350`} stroke={cold} markerEnd={`url(#${id}-cold)`} className="heat-refrigerant" />
      <circle cx="380" cy="104" r="32" fill="#302d29" /><text x="380" y="112" textAnchor="middle" fill="white" fontSize="23">↑P</text>
      <text x="380" y="62" textAnchor="middle" className="heat-svg-label">Compressor</text>
      <path d="M 350 334 L 410 366 L 410 334 L 350 366 Z" fill="#65594b" />
      <text x="380" y="399" textAnchor="middle" className="heat-svg-label">Expansion valve</text>
      {([200, 560]).map((x) => <g key={x}>
        <rect x={x - 57} y="155" width="114" height="118" rx="14" fill="white" stroke={x === sink ? hot : cold} strokeWidth="3" />
        <path d={`M ${x - 36} 177 h 72 v 17 h -72 v 17 h 72 v 17 h -72 v 17 h 72`} stroke={x === sink ? hot : cold} strokeWidth="6" fill="none" />
        <text x={x} y="80" textAnchor="middle" className="heat-svg-label">{x === 200 ? "Outdoor coil" : "Indoor coil"}</text>
      </g>)}
      <path d="M 50 189 H 131 M 132 244 H 51" stroke={heating ? cold : hot} markerEnd={`url(#${id}-${heating ? "cold" : "hot"})`} className="heat-air" />
      {mode !== "defrost" && <path d="M 708 189 H 629 M 629 244 H 708" stroke={heating ? hot : cold} markerEnd={`url(#${id}-${heating ? "hot" : "cold"})`} className="heat-air" />}
      <text x="91" y="282" textAnchor="middle" className="heat-svg-small">Outside air</text>
      <text x="673" y="282" textAnchor="middle" className="heat-svg-small">{mode === "defrost" ? "Heat pauses" : "Room air"}</text>
      <text x="380" y="207" textAnchor="middle" className="heat-svg-small">Sealed</text><text x="380" y="229" textAnchor="middle" className="heat-svg-small">refrigerant</text><text x="380" y="251" textAnchor="middle" className="heat-svg-small">circuit</text>
      <text x="380" y="449" textAnchor="middle" className="heat-svg-small">Air stays on its own side. Refrigerant carries heat between coils.</text>
    </svg>
    <svg className="heat-animation-mobile" viewBox="0 0 460 650" aria-hidden="true">
      <defs>{[["hot", hot], ["cold", cold]].map(([name, color]) => <marker key={name} id={`${id}-mobile-${name}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>)}</defs>
      <rect x="16" y="20" width="428" height="225" rx="20" fill="#e8eff0" />
      <rect x="16" y="355" width="428" height="225" rx="20" fill="#f1e6d8" />
      <text x="230" y="57" textAnchor="middle" className="heat-svg-label">OUTDOORS</text>
      <text x="230" y="392" textAnchor="middle" className="heat-svg-label">YOUR HOME</text>
      <path d={`M 365 ${heating ? 339 : 275} V ${sinkY} H 304`} stroke={hot} markerEnd={`url(#${id}-mobile-hot)`} className="heat-refrigerant" />
      <path d={`M 185 ${sinkY} H 143 V ${heating ? 330 : 282}`} stroke={hot} markerEnd={`url(#${id}-mobile-hot)`} className="heat-refrigerant" />
      <path d={`M 143 ${heating ? 282 : 330} V ${sourceY} H 180`} stroke={cold} markerEnd={`url(#${id}-mobile-cold)`} className="heat-refrigerant" />
      <path d={`M 300 ${sourceY} H 365 V ${heating ? 275 : 339}`} stroke={cold} markerEnd={`url(#${id}-mobile-cold)`} className="heat-refrigerant" />
      <circle cx="365" cy="307" r="30" fill="#302d29" /><text x="365" y="315" textAnchor="middle" fill="white" fontSize="23">↑P</text>
      <text x="365" y="263" textAnchor="middle" className="heat-svg-label">Compressor</text>
      <path d="M 121 292 L 165 322 L 165 292 L 121 322 Z" fill="#65594b" />
      <text x="125" y="346" textAnchor="middle" className="heat-svg-small">Expansion</text>
      <text x="230" y="279" textAnchor="middle" className="heat-svg-small">Sealed</text>
      <text x="230" y="309" textAnchor="middle" className="heat-svg-small">refrigerant</text>
      <text x="230" y="339" textAnchor="middle" className="heat-svg-small">circuit</text>
      {[175, 505].map((y) => <g key={y}>
        <rect x="185" y={y - 55} width="115" height="110" rx="12" fill="white" stroke={y === sinkY ? hot : cold} strokeWidth="3" />
        <path d={`M 202 ${y - 36} h 81 v 18 h -81 v 18 h 81 v 18 h -81 v 18 h 81`} stroke={y === sinkY ? hot : cold} strokeWidth="6" fill="none" />
        <text x="242" y={y - 69} textAnchor="middle" className="heat-svg-label">{y === 175 ? "Outdoor coil" : "Indoor coil"}</text>
      </g>)}
      <path d="M 35 148 H 128 M 128 210 H 35" stroke={heating ? cold : hot} markerEnd={`url(#${id}-mobile-${heating ? "cold" : "hot"})`} className="heat-air" />
      {mode !== "defrost" && <path d="M 35 477 H 128 M 128 540 H 35" stroke={heating ? hot : cold} markerEnd={`url(#${id}-mobile-${heating ? "hot" : "cold"})`} className="heat-air" />}
      <text x="80" y="181" textAnchor="middle" className="heat-svg-small">Outside air</text>
      <text x="80" y="510" textAnchor="middle" className="heat-svg-small">{mode === "defrost" ? "Heat pauses" : "Room air"}</text>
      <text x="230" y="613" textAnchor="middle" className="heat-svg-small">Air stays on its own side.</text>
      <text x="230" y="643" textAnchor="middle" className="heat-svg-small">Refrigerant transfers the heat.</text>
    </svg>
    </div>
    <div className="heat-animation-key"><span><i style={{ background: hot }} /> Heat released / hot side</span><span><i style={{ background: cold }} /> Heat absorbed / cold side</span></div>
    <figcaption aria-live="polite"><strong>{({ heating: "Heating your rooms", cooling: "Cooling your rooms", defrost: "Clearing the outdoor coil" })[mode]}</strong><p>{explanations[mode]}</p><small>Hanson Home educational illustration. Simplified cycle; reversing-valve piping and optional auxiliary heat are omitted. Animation starts paused and respects reduced-motion preferences.</small></figcaption>
  </figure>;
}
