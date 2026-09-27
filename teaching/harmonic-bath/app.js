'use strict';
const $=id=>document.getElementById(id),green='#187356',orange='#b34d14';let current=[];
function plot(id,rows,series,xlabel,ylabel,marker){
 const W=760,H=280,L=66,R=20,T=20,B=49,xmax=rows.at(-1).t;
 let ymin=Math.min(0,...rows.flatMap(r=>series.map(s=>r[s.key]))),ymax=Math.max(...rows.flatMap(r=>series.map(s=>r[s.key])));
 if(ymax-ymin<1e-10)ymax=ymin+1;const pad=(ymax-ymin)*.07;ymax+=pad;if(ymin<0)ymin-=pad;
 const X=x=>L+x/xmax*(W-L-R),Y=y=>H-B-(y-ymin)/(ymax-ymin)*(H-T-B);
 let out='';for(let i=0;i<=4;i++){const x=xmax*i/4,y=ymin+(ymax-ymin)*i/4;out+=`<path d="M${L},${Y(y)}H${W-R}" stroke="#e4e9e6"/><text x="${L-9}" y="${Y(y)+4}" text-anchor="end">${y.toFixed(2)}</text><text x="${X(x)}" y="${H-B+22}" text-anchor="middle">${x.toFixed(1)}</text>`;}
 if(marker!==undefined)out+=`<path d="M${X(marker)},${T}V${H-B}" stroke="#83928b" stroke-dasharray="3 4"/><text x="${X(marker)+5}" y="${T+12}">ω₀</text>`;
 for(const s of series)out+=`<path d="${rows.map((r,i)=>(i?'L':'M')+X(r.t).toFixed(2)+','+Y(r[s.key]).toFixed(2)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" ${s.dash?'stroke-dasharray="7 5"':''}/>`;
 out+=`<text x="${(L+W-R)/2}" y="${H-5}" text-anchor="middle">${xlabel}</text><text transform="translate(16 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle">${ylabel}</text>`;$(id).innerHTML=out;
}
function render(){
 const w=+$('omega').value,g=+$('gamma').value,tau=+$('tau').value,compare=$('compare').checked;
 for(const id of ['omega','gamma','tau'])$(id+'Out').textContent=(+$(id).value).toFixed(2);
 const sample=(end,f)=>Array.from({length:601},(_,i)=>{const t=i*end/600;return {t,...f(t)};});
 plot('kernel',sample(5*tau,t=>({k:BathModel.kernel(t,g,tau)})),[{key:'k',color:green}],'Time since earlier velocity','Memory K(t)');
 plot('spectrum',sample(6,t=>({eta:BathModel.spectrum(t,g,tau),constant:g})),[{key:'eta',color:green},...(compare?[{key:'constant',color:orange,dash:true}]:[])],'Angular frequency ω','Friction η(ω)',w);
 current=BathModel.run(w,g,tau);
 plot('motion',current,[{key:'x',color:green},...(compare?[{key:'xm',color:orange,dash:true}]:[])],'Time','Mean displacement');
 plot('energy',current,[{key:'energy',color:green},...(compare?[{key:'em',color:orange,dash:true}]:[])],'Time','Mean-motion energy / initial');
 $('status').textContent=`ω₀τ = ${(w*tau).toFixed(2)}. ${w*tau<.2?'The memory is short on the oscillator’s timescale.':'The bath responds over an appreciable part of the motion.'}`;
 $('spectrumNote').textContent=`At ω₀, η = ${BathModel.spectrum(w,g,tau).toFixed(3)}. The zero-frequency value is γ = ${g.toFixed(2)}. At weak damping, η(ω₀) estimates the energy decay rate. The motion below also includes the frequency shift caused by memory.`;
}
for(const id of ['omega','gamma','tau','compare'])$(id).addEventListener('input',render);
$('reset').addEventListener('click',()=>{$('omega').value=1;$('gamma').value=.5;$('tau').value=1;$('compare').checked=true;render();});
$('download').addEventListener('click',()=>{
 const g=+$('gamma').value,tau=+$('tau').value;
 const lines=[`# omega0=${$('omega').value}, gamma=${g}, tau=${tau}; unit mass; mean initial (x,v,z)=(1,0,0)`,'time,x_mean,v_mean,friction_z,x_instantaneous,mean_energy_fraction,instantaneous_energy_fraction',...current.map(r=>[r.t,r.x,r.v,r.z,r.xm,r.energy,r.em].join(',')),'','frequency,friction_spectrum',...Array.from({length:601},(_,i)=>[i/100,BathModel.spectrum(i/100,g,tau)].join(',')),'','lag,memory_kernel',...Array.from({length:601},(_,i)=>{const t=i*5*tau/600;return [t,BathModel.kernel(t,g,tau)].join(',');})];
 const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='harmonic-bath.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});render();
