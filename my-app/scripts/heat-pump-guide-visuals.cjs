// Reproducible Hanson Home illustrations. All numeric examples are hypothetical.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../public/images/blog/heat-pump-guide');
fs.mkdirSync(root, { recursive: true });
const c = { ink: '#302d29', muted: '#65594b', paper: '#faf8f5', line: '#d1c8b9', blue: '#326c86', paleBlue: '#e8eff0', orange: '#a34f2e', paleOrange: '#f4e8db', green: '#3e6c59' };
const esc = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const text = (x,y,value,size=23,color=c.ink,anchor='start',weight=400) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(value)}</text>`;
const lines = (x,y,values,size=23,color=c.muted,anchor='start') => values.map((v,i)=>text(x,y+i*(size+9),v,size,color,anchor)).join('');
const rect = (x,y,w,h,fill=c.paper) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${c.line}"/>`;
const line = (x1,y1,x2,y2,color=c.line,width=2,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const arrow=(x1,y1,x2,y2,color=c.orange)=>line(x1,y1,x2,y2,color,4)+`<path d="M -10 -6 L 0 0 L -10 6" transform="translate(${x2} ${y2}) rotate(${Math.atan2(y2-y1,x2-x1)*180/Math.PI})" fill="none" stroke="${color}" stroke-width="4"/>`;
function save(name,title,description,draw) {
 for (const mobile of [false,true]) {
  const w=mobile?460:760,h=mobile?650:560;
  let content=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><rect width="${w}" height="${h}" rx="22" fill="${c.paper}"/><g font-family="Arial, sans-serif">${text(28,37,'HANSON HOME  /  HEAT PUMPS, EXPLAINED',mobile?16:18,c.muted)}${draw(w,h,mobile)}${text(28,h-22,'Original educational illustration · Hanson Home',mobile?15:17,c.muted)}</g></svg>`;
  fs.writeFileSync(path.join(root,`${name}${mobile?'-mobile':''}.svg`),content);
 }
}
save('heat-cycle','Air stays separate. Heat moves.','Outside air and room air circulate on their own sides. A sealed refrigerant circuit absorbs heat outdoors, raises its temperature through compression, releases heat indoors and lowers pressure through expansion.',(w,h,m)=>{
 if(m)return text(28,81,'Air stays separate.',29,c.ink,'start',600)+text(28,116,'Heat moves.',29,c.ink,'start',600)+rect(28,146,404,138,c.paleBlue)+text(52,183,'OUTDOORS',21,c.blue,'start',600)+lines(52,219,['Outside air → outdoor coil','Refrigerant absorbs heat.'],21)+arrow(170,294,170,365)+text(195,322,'Compressor',21,c.ink)+text(195,349,'raises temperature',19,c.muted)+rect(28,386,404,138,c.paleOrange)+text(52,423,'YOUR HOME',21,c.orange,'start',600)+lines(52,459,['Indoor coil → room air','Refrigerant releases heat.'],21)+text(28,568,'Expansion lowers pressure;',20,c.muted)+text(28,596,'refrigerant returns to the outdoor coil.',20,c.muted);
 return text(28,88,'Air stays separate. Heat moves.',32,c.ink,'start',600)+rect(28,140,272,235,c.paleBlue)+rect(460,140,272,235,c.paleOrange)+text(164,183,'OUTDOORS',24,c.blue,'middle',600)+lines(164,230,['Outside air','↓','Outdoor coil','absorbs heat'],24,c.ink,'middle')+text(596,183,'YOUR HOME',24,c.orange,'middle',600)+lines(596,230,['Indoor coil','↓','Room air','receives heat'],24,c.ink,'middle')+arrow(315,205,445,205)+lines(380,245,['Compressor','raises','temperature'],20,c.muted,'middle')+arrow(445,348,315,348,c.blue)+lines(380,410,['Expansion lowers pressure.','Refrigerant returns to the outdoor coil.'],24,c.muted,'middle')+text(380,494,'Heating mode · sealed refrigerant circuit',21,c.ink,'middle');
});
save('energy-balance','One unit in. Three units delivered.','Hypothetical COP 3 energy balance: one unit of electricity plus two units of outdoor heat equals three units of delivered indoor heat. Not a prediction for any equipment.',(w,h,m)=>{
 const y=m?155:163,bw=m?404:218,xs=m?[28,28,28]:[28,271,514],ys=m?[y,y+132,y+264]:[y,y,y];
 let out=lines(28,85,m?['At COP 3:','moving heat adds up.']:['At COP 3, moving heat adds up.'],m?29:32,c.ink);
 [['1','electricity',c.ink,c.paper],['2','outdoor heat',c.blue,c.paleBlue],['3','delivered heat',c.orange,c.paleOrange]].forEach(([n,label,color,fill],i)=>{out+=rect(xs[i],ys[i],bw,m?110:210,fill)+text(xs[i]+(m?58:bw/2),ys[i]+(m?68:93),n,m?52:64,color,'middle',600)+text(xs[i]+(m?125:bw/2),ys[i]+(m?64:149),label,m?24:23,color,m?'start':'middle');});
 return out+(m?text(230,284,'+',26,c.ink,'middle')+text(230,416,'=',26,c.ink,'middle'):text(259,267,'+',28,c.ink,'middle')+text(502,267,'=',28,c.ink,'middle'))+lines(28,m?574:452,['Example only. Actual COP varies with conditions.'],m?19:23,c.muted);
});
save('capacity-load','Winter capacity has to meet the home load.','Hypothetical heat loss and equipment output versus temperature. At an example 5°F design point, home load is 30,000 BTU/h, system A is 34,000 and system B is 24,000. The curves are illustrative, not measurements.',(w,h,m)=>{
 const left=m?64:83,right=w-38,top=m?203:170,bottom=m?451:414;
 const x=t=>left+(t+5)/52*(right-left),y=v=>bottom-v/40000*(bottom-top);
 const points=(temps,values)=>temps.map((t,i)=>`${x(t)},${y(values[i])}`).join(' ');
 let out=lines(28,84,m?['Can the output','meet the load?']:['Can the output meet the load?'],m?29:32,c.ink)+text(left,top-18,'BTU/h (thousands)',18,c.muted);
 for(const val of [10000,20000,30000,40000])out+=line(left,y(val),right,y(val))+text(left-10,y(val)+6,val/1000,18,c.muted,'end');
 const temps=[-5,5,17,47];
 out+=line(left,bottom,right,bottom,c.ink)+line(x(5),top,x(5),bottom,c.muted,2,'5 6');
 out+=`<polyline points="${points(temps,[35000,30000,23000,9000])}" fill="none" stroke="${c.ink}" stroke-width="4"/><polyline points="${points(temps,[33000,34000,36000,38000])}" fill="none" stroke="${c.green}" stroke-width="4"/><polyline points="${points(temps,[19000,24000,29000,33000])}" fill="none" stroke="${c.orange}" stroke-width="4" stroke-dasharray="8 5"/>`;
 temps.forEach(t=>out+=text(x(t),bottom+30,`${t}°F`,18,c.ink,'middle'));
 [[34000,c.green],[30000,c.ink],[24000,c.orange]].forEach(([v,color])=>out+=`<circle cx="${x(5)}" cy="${y(v)}" r="6" fill="${color}"/>`);
 out+=text(left,bottom+60,'← colder outdoors',19,c.muted);
 const legendY=m?547:497;
 [['Home load: 30k',c.ink],['System A: 34k',c.green],['System B: 24k',c.orange]].forEach(([label,color],i)=>{const yy=m?legendY+i*24:legendY,xx=m?28:28+i*242;out+=line(xx,yy-6,xx+18,yy-6,color,4)+text(xx+26,yy,label,m?18:20,color);});
 out+=text(m?right:left,top-44,'Example design point: 5°F',m?17:20,c.muted,m?'end':'start');
 return out;
});
save('winter-checkpoints','Four winter checkpoints, four questions.','Freezing: assess frost and defrost. 17°F: compare low-temperature output. 5°F: check cold-climate qualification and capacity. Below zero: verify exact model operating limits and the extreme-weather strategy.',(w,h,m)=>{
 let out=lines(28,85,m?['Read the temperatures','as checkpoints.']:['Read the temperatures as checkpoints.'],m?28:31,c.ink);
 const labels=[['32°F','Freezing',['Frost and defrost','can matter.']],['17°F','Low-temperature data',['Compare output','and efficiency.']],['5°F','Cold-climate test point',['Check capacity','and COP separately.']],['< 0°F','Model-specific limits',['Verify output and','extreme-weather plan.']]];
 labels.forEach(([temp,label,detail],i)=>{const xx=m?28:28+(i%2)*366,yy=m?145+i*109:145+Math.floor(i/2)*170,bw=m?404:338,bh=m?98:148;out+=rect(xx,yy,bw,bh,i%2?c.paleOrange:c.paleBlue)+text(xx+20,yy+(m?55:50),temp,m?28:32,c.ink,'start',600)+text(xx+(m?119:20),yy+(m?31:82),label,m?18:20,c.ink,'start',600)+lines(xx+(m?119:20),yy+(m?59:112),detail,m?18:19,c.muted);});
 return out;
});
save('compressor-modulation','Match output to the heating job.','Conceptual comparison: a single-speed unit repeatedly cycles at full output; a variable-speed system can adjust output toward a changing load within its limits. This is not measured savings data.',(w,h,m)=>{
 let out=lines(28,85,m?['The compressor','can change pace.']:['The compressor can change pace.'],m?29:32,c.ink);
 const x1=55,x2=w-35,span=x2-x1;
 [0,1].forEach(i=>{let yy=m?172+i*208:142+i*162;out+=text(x1,yy,i?'Variable output':'Full output / off',24,c.ink,'start',600);let top=yy+24,bottom=yy+118;out+=line(x1,bottom,x2,bottom,c.ink)+line(x1,top,x1,bottom,c.ink)+line(x1,top+58,x2,top+45,c.blue,2,'7 6');if(!i){let pts=[];for(let z=0;z<5;z++){const xx=x1+z*span/5;pts.push(`${xx},${bottom}`,`${xx},${top}`,`${xx+span/10},${top}`,`${xx+span/10},${bottom}`,`${xx+span/5},${bottom}`);}out+=`<polyline points="${pts.join(' ')}" stroke="${c.orange}" fill="none" stroke-width="4"/>`;}else out+=`<path d="M ${x1} ${top+60} C ${x1+span/3} ${top+55} ${x1+2*span/3} ${top+51} ${x2} ${top+45}" fill="none" stroke="${c.green}" stroke-width="5"/>`;out+=text(x2,bottom+26,'time →',18,c.muted,'end');});
 return out+lines(28,m?588:501,['Dashed line: illustrative home heating need'],m?18:22,c.blue);
});
save('defrost-cycle','Frost clears. Heating resumes.','A four-stage conceptual sequence: normal heating, brief defrost sends heat to the outdoor coil, meltwater drains, and heating resumes. Persistent ice or faults require investigation.',(w,h,m)=>{
 let out=lines(28,85,m?['Defrost is part','of winter operation.']:['Defrost is part of winter operation.'],m?29:32,c.ink);
 [['1','Heat the rooms',['Outdoor coil','absorbs heat.']],['2','Clear the frost',['Heat briefly warms','the outdoor coil.']],['3','Drain meltwater',['Provide a safe','drainage path.']],['4','Resume heating',['The system returns','to room heating.']]].forEach(([n,title,detail],i)=>{const x=m?28:28+(i%2)*366,y=m?146+i*108:146+Math.floor(i/2)*171;out+=rect(x,y,m?404:338,m?96:148,i===1?c.paleOrange:c.paleBlue)+text(x+25,y+(m?55:45),n,32,c.ink,'start',600)+text(x+(m?77:25),y+(m?30:78),title,m?22:23,c.ink,'start',600)+lines(x+(m?77:25),y+(m?57:108),detail,m?18:20,c.muted);});return out;
});
save('room-coverage','A whole-home total is not a room delivery plan.','Conceptual three-zone floor plan: a living-room unit, a bedroom and a second bedroom separated by closed doors. Each room needs a documented heat delivery path. This is not a customer floor plan.',(w,h,m)=>{
 let out=lines(28,85,m?['The closed rooms','need heat, too.']:['The closed rooms need heat, too.'],m?29:32,c.ink);
 const x=28,y=m?155:138,bw=w-56,bh=m?360:295,split=x+bw*.53;
 out+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${c.paleOrange}" stroke="${c.ink}" stroke-width="5"/><rect x="${split}" y="${y}" width="${bw*.47}" height="${bh}" fill="${c.paleBlue}" stroke="none"/>`+line(split,y,split,y+bh,c.ink,5)+line(split,y+bh/2,x+bw,y+bh/2,c.ink,5);
 out+=rect(x+20,y+24,bw*.53-40,37,'white')+text(x+bw*.265,y+50,'Indoor unit',m?18:23,c.orange,'middle',600)+lines(x+bw*.265,y+bh*.58,['Living','space'],m?23:29,c.ink,'middle');
 [0,1].forEach(i=>{const cy=y+bh*(.25+.5*i);out+=text(split+bw*.235,cy,'Bedroom '+(i+1),m?20:25,c.ink,'middle')+text(split+bw*.235,cy+32,'Heat delivery?',m?18:23,c.blue,'middle')+line(split,cy-25,split,cy+25,c.orange,8);});
 out+=lines(28,m?560:478,m?['Closed doors are part of the design.','Do not assume hallway heat reaches','every room at the required rate.']:['Closed doors are part of the design.','Do not assume hallway heat serves every room.'],m?20:24,c.muted);return out;
});
save('winter-installation','Plan the outdoor location for winter.','Conceptual unit siting: required airflow stays open, roof runoff is controlled, the unit is supported above expected snow and meltwater has a safe drainage path. Dimensions are site- and manufacturer-specific.',(w,h,m)=>{
 let out=lines(28,85,m?['Give winter air','some room to move.']:['Give winter air some room to move.'],m?29:32,c.ink);
 const ux=m?128:257,uy=m?249:194,uw=m?202:245,uh=145;
 out+=rect(ux,uy,uw,uh,'white')+`<circle cx="${ux+uw*.45}" cy="${uy+uh/2}" r="47" fill="${c.paleBlue}" stroke="${c.blue}" stroke-width="3"/>`;
 for(let i=0;i<4;i++)out+=`<path d="M ${ux+uw*.45} ${uy+uh/2} q 40 -25 37 -42 q -30 -8 -37 42" fill="${c.blue}" transform="rotate(${i*90} ${ux+uw*.45} ${uy+uh/2})"/>`;
 out+=line(ux+15,uy+uh,ux+15,uy+uh+45,c.ink,5)+line(ux+uw-15,uy+uh,ux+uw-15,uy+uh+45,c.ink,5)+line(28,uy+uh+57,w-28,uy+uh+57,c.line,5)+arrow(ux+uw+15,uy+55,ux+uw+57,uy+55,c.blue)+arrow(ux-18,uy+90,ux-62,uy+90,c.blue);
 out+=text(28,m?187:156,'Keep roof runoff away',m?21:24,c.muted)+lines(28,m?471:419,m?['• Keep manufacturer airflow clearances.','• Mount for site snow accumulation.','• Give meltwater a safe drainage path.','• Leave access for service.']:['Keep airflow open. Mount for site snow accumulation.','Plan drainage and leave access for service.'],m?20:24,c.muted);return out;
});
console.log('Created 16 original responsive SVG illustrations.');
