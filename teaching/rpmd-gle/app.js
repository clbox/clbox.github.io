'use strict';
// Units throughout: fs, fs^-1, fs^-2; mass-scaled momentum and linear coupling.
const $ = id => document.getElementById(id);
const KB = 8.617333262145e-5, HBAR = 0.6582119569;
const GREEN = '#187356', GREY = '#52646c', ORANGE = '#b34d14';
let currentData, fitData, selectedFit, fitCurves, animation = null, phase = 0;
const sequence = (n, fn) => Array.from({length:n}, (_,i) => fn(i));
const fmt = v => v === 0 ? '0' : Math.abs(v) < 0.001 ? v.toExponential(2) : Number(v.toPrecision(4)).toString();
function settings() {
  return {P:Math.max(1,Math.min(256,Math.round(Number($('beadCount').value)||1))), T:Number($('temperature').value), mode:Number($('mode').value), bath:$('bath').value, cutoff:Number($('cutoff').value), eta:Number($('eta').value)};
}
function frequency(P,T,n) { return 2*P*KB*T/HBAR*Math.sin(Math.PI*n/P); }
function baseSpectrum(w, eta, cutoff, bath='exp') { return eta*(bath === 'white' ? 1 : Math.exp(-w/cutoff)); }
function modeSpectrum(w, wn, eta, cutoff, bath='exp') {
  if (wn === 0) return baseSpectrum(w,eta,cutoff,bath);
  if (w <= wn) return 0;
  const original = Math.sqrt((w-wn)*(w+wn));
  return original/w*baseSpectrum(original,eta,cutoff,bath);
}
// Integrate in the ORIGINAL bath frequency. This avoids a square-root edge
// in the transformed spectrum. Composite Simpson rule, v=sqrt(omega/cutoff), resolving low frequencies.
function kernelAndAlpha(times, wn, eta, cutoff) {
  const steps = 2048, end = Math.sqrt(24), dv = end/steps;
  const frequencies = [], weights = [];
  let alpha = 0;
  for (let i=0;i<=steps;i++) {
    const v=i*dv, u=v*v, w=u*cutoff, w2=w*w, n2=wn*wn;
    const factor = (i===0 || i===steps ? 1 : i%2 ? 4 : 2)*dv/3*2*v*2/Math.PI*eta*cutoff*Math.exp(-u);
    const fraction = wn===0 ? 1 : w2/(w2+n2);
    frequencies.push(Math.sqrt(w2+n2)); weights.push(factor*fraction);
    alpha += factor*(1-fraction);
  }
  const values = times.map(t => wn===0 ? 2*eta*cutoff/Math.PI/(1+(cutoff*t)**2) : weights.reduce((sum,a,i) => sum+a*Math.cos(frequencies[i]*t),0));
  return {values,alpha};
}
function chart(id, rows, series, xlabel, ylabel, options={}) {
  const svg=$(id), W=Math.max(320,Math.min(520,svg.clientWidth||520)),H=300,L=78,R=18,T=22,B=53;
  const tick=v=>v===0?'0':Number(v.toPrecision(2)).toString();
  const xmin=options.xmin ?? 0, xmax=options.xmax ?? Math.max(...rows.map(r=>r.x),1e-6);
  let ymin=options.ymin ?? Math.min(0,...rows.flatMap(r=>series.map(s=>r[s.key])));
  let ymax=options.ymax ?? Math.max(1e-10,...rows.flatMap(r=>series.map(s=>r[s.key])));
  if (!('ymax' in options)) ymax*=1.12;
  if (ymin<0 && !('ymin' in options)) ymin*=1.12;
  const sx=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),sy=y=>H-B-(y-ymin)/(ymax-ymin)*(H-T-B);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  let html=`<title>${ylabel} versus ${xlabel}</title>`;
  for(let i=0;i<=4;i++) {
    const y=ymin+(ymax-ymin)*i/4;
    html+=`<line x1="${L}" x2="${W-R}" y1="${sy(y)}" y2="${sy(y)}" stroke="#e3e9e5"/><text x="${L-8}" y="${sy(y)+4}" text-anchor="end">${tick(y)}</text>`;
  }
  const xticks=options.stems?[...new Set(sequence(Math.min(5,rows.length),i=>Math.round(i*(rows.length-1)/Math.max(1,Math.min(4,rows.length-1)))))]:sequence(W<400?3:5,i=>xmin+(xmax-xmin)*i/(W<400?2:4));
  xticks.forEach(x=>{html+=`<text x="${sx(x)}" y="${H-30}" text-anchor="middle">${options.stems?fmt(x):tick(x)}</text>`;});
  if(options.threshold !== undefined && options.threshold <= xmax) {
    const x=sx(options.threshold);
    html+=`<line x1="${x}" x2="${x}" y1="${T}" y2="${H-B}" stroke="${ORANGE}" stroke-dasharray="3 4"/><text x="${Math.min(W-65,Math.max(L+6,x+5))}" y="15" style="fill:${ORANGE}">ωₙ</text>`;
  }
  for (const s of series) {
    if(options.stems) {
      rows.forEach(r=>{const selected=r.index===options.selected;html+=`<line x1="${sx(r.x)}" x2="${sx(r.x)}" y1="${sy(0)}" y2="${sy(r[s.key])}" stroke="${selected?ORANGE:'#a8beb2'}" stroke-width="${selected?3:1}"/><circle cx="${sx(r.x)}" cy="${sy(r[s.key])}" r="${selected?5:2.5}" fill="${selected?ORANGE:GREEN}"/>`;});
    } else {
      const path=rows.map((r,i)=>`${i?'L':'M'}${sx(r.x).toFixed(2)},${sy(r[s.key]).toFixed(2)}`).join(' ');
      html+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.6" ${s.dash?'stroke-dasharray="6 5"':''}/>`;
    }
  }
  html+=`<text x="${(L+W-R)/2}" y="${H-5}" text-anchor="middle">${xlabel}</text><text transform="translate(16 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">${ylabel}</text>`;
  svg.innerHTML=html;
}
function ringPattern(p, amplitude=1) {
  const svg=$('ring'),cx=260,cy=155, radius=p.P===1?0:100;
  const coords=sequence(p.P,j=>{
    const k=p.mode>p.P/2?p.P-p.mode:p.mode;
    const displacement=p.mode===0?1:p.mode>p.P/2?Math.sin(2*Math.PI*k*j/p.P):Math.cos(2*Math.PI*k*j/p.P);
    const angle=2*Math.PI*j/p.P-Math.PI/2;
    // Every bead moves along the same Cartesian axis: the centroid is a rigid translation.
    return {x:cx+radius*Math.cos(angle)+24*amplitude*displacement,y:cy+radius*Math.sin(angle),displacement:amplitude*displacement,j};
  });
  let html='<title>Bead connectivity with a schematic mode displacement</title>';
  if(p.P>1) html+=`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#d4dfd8" stroke-dasharray="4 5"/><path d="${coords.map((q,i)=>`${i?'L':'M'}${q.x},${q.y}`).join(' ')} Z" fill="none" stroke="#b7c9bf" stroke-width="2"/>`;
  const centroidX=cx+(p.mode===0?24*amplitude:0);
  html+=`<g aria-label="Centroid"><line x1="${centroidX-6}" x2="${centroidX+6}" y1="155" y2="155" stroke="#9caea4"/><line x1="${centroidX}" x2="${centroidX}" y1="149" y2="161" stroke="#9caea4"/></g>`;
  coords.forEach(q=>{html+=`<circle cx="${q.x}" cy="${q.y}" r="${p.P>64?2.2:p.P>24?4:7}" fill="${q.displacement>=-1e-10?GREEN:ORANGE}"><title>Bead ${q.j}: relative displacement ${q.displacement.toFixed(3)}</title></circle>`;if(p.P<=16)html+=`<text x="${cx+(q.x-cx)*1.17}" y="${cy+(q.y-cy)*1.17+4}" text-anchor="middle">${q.j}</text>`;});
  html+=`<text x="260" y="315" text-anchor="middle">Mode ${p.mode} · ${p.P} ${p.P===1?'bead':'beads'} · green + / orange − displacement</text>`;
  svg.innerHTML=html;
}
function renderModes(p) {
  const wn=frequency(p.P,p.T,p.mode),unique=Math.floor(p.P/2)+1;
  $('temperatureOut').textContent=`${p.T} K`; $('modeOut').textContent=`${p.mode} / ${p.P-1}`;
  $('modeHelp').textContent=p.mode===0?'Centroid: all beads move together.':p.mode===p.P/2?'Alternating mode: adjacent beads move oppositely.':`Equal-frequency partner: n = ${p.P-p.mode}.`;
  $('modeSummary').textContent=`Selected spring frequency: ${fmt(wn)} fs⁻¹. ${p.P} ${p.P===1?'bead gives 1 mode':'beads give '+p.P+' modes'}, with ${unique} distinct ${unique===1?'frequency':'frequencies'}. ${p.mode===0?'The centroid has no spring restoring force.':'A mode describes a pattern involving the whole ring, not a particular bead.'}`;
  ringPattern(p,Math.cos(phase));
  chart('frequencies',sequence(p.P,n=>({x:n,index:n,y:frequency(p.P,p.T,n)})),[{key:'y',color:GREEN}],'Mode index n','Spring frequency ωₙ (fs⁻¹)',{stems:true,selected:p.mode,xmax:Math.max(1,p.P-1)});
}
function makeCurves(p) {
  const wn=frequency(p.P,p.T,p.mode),maxW=wn+6*p.cutoff;
  // Extra samples at the edge preserve the threshold even for narrow spectra.
  const xs=[...new Set([...sequence(501,i=>maxW*i/500),wn,...sequence(101,i=>Math.sqrt(wn*wn+(3*p.cutoff*i/100)**2))])].sort((a,b)=>a-b);
  const spectra=xs.map(x=>({x,base:baseSpectrum(x,p.eta,p.cutoff,p.bath),mode:modeSpectrum(x,wn,p.eta,p.cutoff,p.bath)}));
  if(p.bath==='white')return {spectra,kernels:null,alpha:p.eta*wn,wn};
  const tmax=Math.min(8/p.cutoff,wn===0?Infinity:24/wn),times=sequence(321,i=>tmax*i/320);
  const transformed=kernelAndAlpha(times,wn,p.eta,p.cutoff);
  const kernels=times.map((x,i)=>({x,base:2*p.eta*p.cutoff/Math.PI/(1+(p.cutoff*x)**2),mode:transformed.values[i]}));
  return {spectra,kernels,alpha:transformed.alpha,wn};
}
function renderMemory(p) {
  const white=p.bath==='white',d=makeCurves(p);currentData={settings:p,...d};
  $('cutoffOut').textContent=white?'not applicable':`${p.cutoff.toFixed(2)} fs⁻¹`;
  $('cutoff').disabled=white;$('cutoffHelp').textContent=white?'An ideal flat spectrum has no cutoff.':'Larger cutoff → a shorter memory timescale.';
  $('etaOut').textContent=`${p.eta.toFixed(3)} fs⁻¹`;
  chart('spectra',d.spectra,[{key:'base',color:GREY,dash:true},{key:'mode',color:GREEN}],'Angular frequency Ω (fs⁻¹)','Friction spectrum Λ (fs⁻¹)',{threshold:d.wn});
  $('spectrumCaption').textContent=`Orange marker: ωₙ = ${fmt(d.wn)} fs⁻¹. ${d.wn===0?'The selected centroid spectrum exactly overlaps the original bath.':'The internal-mode target is zero below this frequency.'}`;
  $('kernelPlot').hidden=white;$('whiteKernel').hidden=!white;
  if(!white) {
    chart('kernels',d.kernels,[{key:'base',color:GREY,dash:true},{key:'mode',color:GREEN}],'Elapsed time t (fs)','Memory kernel K (fs⁻²)');
    $('kernelCaption').textContent='Absolute kernel amplitudes, with an adaptive time window. The oscillatory kernel is evaluated by numerical quadrature; no K(0) normalization.';
  } else {
    $('whiteExplanation').textContent=p.mode===0?'For the centroid, K₀(t) = 2ηδ(t): friction acts instantaneously. There is no finite-time memory tail.':`For this internal mode, Kₙ(t) contains the same instantaneous impulse plus a nonzero memory tail. Its regular part starts at −ηωₙ = ${fmt(-p.eta*d.wn)} fs⁻². The frequency dependence in the left plot shows why the kernel cannot be only a delta function.`;
    $('kernelCaption').textContent='The ideal white-bath kernel is distribution-valued. Its impulse and, for internal modes, its regular tail are described above; this panel does not plot the tail.';
  }
  $('memorySummary').textContent=white?(p.mode===0?'Markovian bath + centroid: instantaneous friction. Select an internal mode to see what changes.':'Markovian physical bath ≠ Markovian friction for every ring-polymer mode. The internal-mode transformation introduces frequency dependence, hence memory.'):'A finite bath cutoff produces memory even for the centroid. Internal modes reshape that memory further. The selected spectrum is a target for its own auxiliary-variable fit.';
  $('mfValue').textContent=`For the current selection, αₙ = ${fmt(d.alpha)} fs⁻². ${d.wn===0?'The centroid correction vanishes.':'With linear coupling this adds stiffness to the selected internal mode.'} ${white?'For the ideal flat bath, αₙ = ηωₙ.':'It is evaluated from the original bath: αₙ = (2/π) ∫ Λ(ω)ωₙ²/(ω²+ωₙ²) dω.'}`;
}
function matrixHTML(A) {
  const labels=A.map((_,i)=>i===0?'p':`s${i}`);
  return `<table aria-label="Drift matrix A in inverse femtoseconds"><thead><tr><th scope="col">A (fs⁻¹)</th>${labels.map(l=>`<th scope="col">${l}</th>`).join('')}</tr></thead><tbody>${A.map((row,i)=>`<tr><th scope="row">${labels[i]}</th>${row.map((v,j)=>`<td class="${i!==j&&(i===0||j===0)?'coupled':i>0&&j>0?'auxiliary':''}">${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function sandbox() {
  const theta=Number($('theta').value),gamma=Number($('gamma').value),omega=$('auxModel').value==='cos'?Number($('osc').value):0;
  const cosine=$('auxModel').value==='cos';
  const A=cosine?[[0,theta,0],[-theta,gamma,omega],[0,-omega,gamma]]:[[0,theta],[-theta,gamma]];
  return {theta,gamma,omega,cosine,A};
}
function componentKernel(t,c) {return c.theta*c.theta*Math.exp(-c.gamma*t)*Math.cos(c.omega*t);}
function componentSpectrum(w,c) {return c.theta*c.theta*c.gamma/2*(1/(c.gamma*c.gamma+(w-c.omega)**2)+1/(c.gamma*c.gamma+(w+c.omega)**2));}
function renderSandbox() {
  const s=sandbox();
  ['theta','gamma','osc'].forEach(k=>$(k+'Out').textContent=`${fmt(Number($(k).value))} fs⁻¹`);
  $('oscControl').hidden=!s.cosine;
  $('matrixHeading').textContent=s.cosine?'One momentum, two auxiliaries':'One momentum, one auxiliary';
  $('matrixTable').innerHTML=matrixHTML(s.A);
  $('matrixExplanation').textContent=s.cosine?'θ couples p to s₁. γ damps both auxiliaries. The opposite ±Ωaux entries rotate information between s₁ and s₂, producing an oscillatory memory.':'θ controls exchange between p and s₁. γ relaxes s₁, setting the memory lifetime 1/γ. A larger γ shortens the memory.';
  $('auxFormula').textContent=s.cosine?'K(t) = θ² exp(−γt) cos(Ωaux t)':'K(t) = θ² exp(−γt)';
  const tmax=Math.min(6/s.gamma,s.omega===0?Infinity:30/s.omega);
  chart('auxSpectrum',sequence(501,i=>({x:(s.omega+6*s.gamma)*i/500,y:componentSpectrum((s.omega+6*s.gamma)*i/500,s)})),[{key:'y',color:GREEN}],'Angular frequency Ω (fs⁻¹)','Friction spectrum Λ (fs⁻¹)');
  chart('auxKernel',sequence(401,i=>({x:tmax*i/400,y:componentKernel(tmax*i/400,s)})),[{key:'y',color:GREEN}],'Elapsed time t (fs)','Memory kernel K (fs⁻²)');
}
function renderFit() {
  if(!fitData)return;
  const e=fitData.examples.find(e=>e.mode===Number($('fitMode').value)&&e.pairs===Number($('fitPairs').value));selectedFit=e;
  const p={P:fitData.beads,T:fitData.temperature_K,mode:e.mode,bath:'exp',eta:fitData.eta_fs_inverse,cutoff:fitData.cutoff_fs_inverse};
  const curves=makeCurves(p);fitCurves=curves;
  curves.spectra.forEach(r=>r.fit=e.components.reduce((a,c)=>a+componentSpectrum(r.x,c),0));
  curves.kernels.forEach(r=>r.fit=e.components.reduce((a,c)=>a+componentKernel(r.x,c),0));
  chart('fitSpectrum',curves.spectra,[{key:'mode',color:GREY,dash:true},{key:'fit',color:GREEN}],'Angular frequency Ω (fs⁻¹)','Friction spectrum Λ (fs⁻¹)',{threshold:e.omega_n});
  chart('fitKernel',curves.kernels,[{key:'mode',color:GREY,dash:true},{key:'fit',color:GREEN}],'Elapsed time t (fs)','Memory kernel K (fs⁻²)');
  $('fitStatus').textContent=`${e.pairs} cosine ${e.pairs===1?'term':'terms'} → ${2*e.pairs} auxiliaries → ${e.A.length} × ${e.A.length} A. Relative spectral L² error: ${(100*e.relative_l2_error).toFixed(1)}%. Optimizer ${e.converged?'met':'did not meet'} its convergence criterion. ${e.mode===0?'More terms improve this approximation.':'The finite fit leaks into the exact gap; convergence does not mean an exact or production-validated fit.'}`;
  $('fitMatrix').innerHTML=matrixHTML(e.A);$('downloadFit').disabled=false;
}
function download(filename,value) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderAll() {const p=settings();renderModes(p);renderMemory(p);}
let pending=false;
function scheduleRender() {if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;renderAll();});}
$('beadCount').addEventListener('input',()=>{
  const P=Number($('beadCount').value);
  if(!Number.isInteger(P)||P<1||P>256)return;
  $('mode').max=P-1;$('mode').value=Math.min(P-1,Number($('mode').value));scheduleRender();
});
$('beadCount').addEventListener('change',()=>{
  const raw=Number($('beadCount').value), P=Math.max(1,Math.min(256,Math.round(Number.isFinite(raw)?raw:8)));
  $('beadCount').value=P;$('mode').max=P-1;$('mode').value=Math.min(P-1,Number($('mode').value));scheduleRender();
});
['temperature','mode','bath','cutoff','eta'].forEach(id=>$(id).addEventListener('input',scheduleRender));
['theta','gamma','osc','auxModel'].forEach(id=>$(id).addEventListener('input',renderSandbox));
['fitMode','fitPairs'].forEach(id=>$(id).addEventListener('change',renderFit));
$('animate').addEventListener('click',()=>{
  if(animation!==null){cancelAnimationFrame(animation);animation=null;$('animate').textContent='Animate pattern';$('animate').setAttribute('aria-pressed','false');return;}
  $('animate').textContent='Pause pattern';$('animate').setAttribute('aria-pressed','true');
  let last;
  function frame(now){if(last!==undefined)phase+=(now-last)/1000*1.8;last=now;ringPattern(settings(),Math.cos(phase));animation=requestAnimationFrame(frame);}
  animation=requestAnimationFrame(frame);
});
$('downloadCurves').addEventListener('click',()=>download('rpmd-mode-curves.json',{...currentData,units:{frequency:'fs^-1',spectrum:'fs^-1',time:'fs',kernel:'fs^-2',alpha:'fs^-2'},note:'Spectral and temporal arrays have independent x axes. White-bath kernels contain delta functions and are not tabulated.',mode_frequencies:sequence(currentData.settings.P,n=>frequency(currentData.settings.P,currentData.settings.T,n))}));
$('downloadMatrix').addEventListener('click',()=>download('auxiliary-matrix.json',{...sandbox(),matrix_units:'fs^-1',convention:'dX/dt=-A X+noise; mass-scaled p; covariance kBT I',note:'Manually chosen teaching model, not an optimized fit.'}));
$('downloadFit').addEventListener('click',()=>download(`glefit-mode-${selectedFit.mode}-${selectedFit.pairs}-terms.json`,{provenance:{...fitData,examples:undefined},fit:selectedFit,curves:fitCurves,units:{frequency:'fs^-1',spectrum:'fs^-1',time:'fs',kernel:'fs^-2',A:'fs^-1'}}));
window.addEventListener('resize',()=>{scheduleRender();renderSandbox();renderFit();});
renderAll();renderSandbox();
fetch('fit-examples.json').then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(data=>{fitData=data;renderFit();}).catch(()=>{$('fitStatus').textContent='The saved examples could not be loaded. Reload the page through a web server, or download the JSON file using the link below.';});
