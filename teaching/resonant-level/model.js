'use strict';
const Model=(()=>{
 const kb=8.617333262e-5;
 const rho=(e,p)=>p.gamma/(2*Math.PI)/((e-p.level)**2+(p.gamma/2)**2);
 const f=x=>x>40?Math.exp(-x):x< -40?1:1/(1+Math.exp(x));
 function integral(fn,a,b,h){let n=Math.max(80,Math.ceil((b-a)/h));n+=n%2;const d=(b-a)/n;let v=fn(a)+fn(b);for(let i=1;i<n;i++)v+=(i%2?4:2)*fn(a+i*d);return v*d/3;}
 function zero(p){const t=kb*p.temp;if(!t)return Math.PI*p.g*p.g*rho(0,p)**2;return Math.PI*p.g*p.g*integral(y=>{const z=f(y);return rho(t*y,p)**2*z*(1-z);},-32,32,Math.min(.08,p.gamma/(40*t)));}
 function exact(e,p){if(e===0)return zero(p);const t=kb*p.temp;let v;if(!t)v=integral(x=>rho(x,p)*rho(x+e,p),-e,0,p.gamma/40)/e;else v=integral(x=>rho(x,p)*rho(x+e,p)*(f(x/t)-f((x+e)/t))/e,-e-32*t,32*t,Math.min(p.gamma/40,t/6));return Math.PI*p.g*p.g*v;}
 const gauss=(x,s)=>Math.exp(-.5*(x/s)**2)/(s*Math.sqrt(2*Math.PI));
 function erf(x){const t=1/(1+.3275911*Math.abs(x));return Math.sign(x)*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x));}
 function samples(p,max=.6){const h=Math.min(p.sigma/12,p.gamma/30,.002),n=Math.ceil((max+8*p.sigma)/h),d=(max+8*p.sigma)/n;return Array.from({length:n},(_,i)=>{const x=(i+.5)*d;return {x,v:exact(x,p),d};});}
 function broaden(e,p,s){let positive=0,normal=0,both=0,signed=0;for(const {x,v,d} of s){const gp=gauss(e-x,p.sigma),gm=gauss(e+x,p.sigma);positive+=v*gp*d;normal+=v*gp/(.5*(1+erf(x/(p.sigma*Math.SQRT2))))*d;both+=v*(gp+gm)*d;signed+=e===0?v*2*x*x/(p.sigma*p.sigma)*gm*d:v*x*gp*(-Math.expm1(-2*e*x/(p.sigma*p.sigma)))/e*d;}return {positive,normal,both,signed};}
 return {kb,rho,zero,exact,samples,broaden};
})();
if(typeof module!=='undefined')module.exports=Model;
