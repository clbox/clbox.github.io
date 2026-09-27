'use strict';
// Unit mass. gamma is the integrated causal kernel; tau is its memory time.
const BathModel=(()=>{
 const mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,x,k)=>s+x*b[k][j],0)));
 function expm(a){
  const norm=Math.max(...a.map(r=>r.reduce((s,x)=>s+Math.abs(x),0)));
  const n=Math.max(0,Math.ceil(Math.log2(norm/.5))),scale=2**n;
  const b=a.map(r=>r.map(x=>x/scale));let term=a.map((r,i)=>r.map((_,j)=>+(i===j))),out=term.map(r=>r.slice());
  for(let k=1;k<=24;k++){term=mul(term,b).map(r=>r.map(x=>x/k));out=out.map((r,i)=>r.map((x,j)=>x+term[i][j]));}
  for(let i=0;i<n;i++)out=mul(out,out);return out;
 }
 function markov(t,w,g){const a=g/2,d=w*w-a*a,e=Math.exp(-a*t);if(Math.abs(d)<1e-12)return [e*(1+a*t),-w*w*t*e];if(d>0){const b=Math.sqrt(d);return [e*(Math.cos(b*t)+a*Math.sin(b*t)/b),-e*w*w*Math.sin(b*t)/b];}const b=Math.sqrt(-d);return [e*(Math.cosh(b*t)+a*Math.sinh(b*t)/b),-e*w*w*Math.sinh(b*t)/b];}
 function run(w,g,tau,end=30,n=900){
  const dt=end/n,P=expm([[0,1,0],[-w*w,0,-1],[0,g/tau,-1/tau]].map(r=>r.map(x=>x*dt)));
  let y=[1,0,0];const rows=[];
  for(let i=0;i<=n;i++){const t=i*dt,[xm,vm]=markov(t,w,g),[x,v,z]=y;rows.push({t,x,v,z,xm,energy:(v*v+w*w*x*x)/(w*w),em:(vm*vm+w*w*xm*xm)/(w*w)});y=P.map(r=>r.reduce((s,x,j)=>s+x*y[j],0));}return rows;
 }
 return {run,markov,expm,kernel:(t,g,tau)=>g/tau*Math.exp(-t/tau),spectrum:(w,g,tau)=>g/(1+(w*tau)**2)};
})();
if(typeof module!=='undefined')module.exports=BathModel;
