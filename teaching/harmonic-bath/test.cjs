const assert=require('assert'),M=require('./model.js');
for(const w of [.5,1,2])for(const g of [0,.5,2,3])for(const tau of [.05,1,3]){
 const r=M.run(w,g,tau);assert(r.every(a=>Object.values(a).every(Number.isFinite)));
 if(!g)assert(Math.max(...r.map(a=>Math.abs(a.x-Math.cos(w*a.t))))<1e-10);
 if(g){const energy=a=>(a.v*a.v+w*w*a.x*a.x+tau*a.z*a.z/g)/2;for(let i=1;i<r.length;i++)assert(energy(r[i])<=energy(r[i-1])+1e-11);}
 const fine=M.run(w,g,tau,30,1800);assert(Math.max(...r.map((a,i)=>Math.abs(a.x-fine[2*i].x)))<1e-10);
}
const short=M.run(1,.5,.0001);assert(Math.max(...short.map(r=>Math.abs(r.x-r.xm)))<.0001);
const vm=require('vm'),fs=require('fs');const html=fs.readFileSync(__dirname+'/index.html','utf8'),elements={};
for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]={value:'',checked:true,addEventListener(){}};
Object.assign(elements.omega,{value:'1'});elements.gamma.value='.5';elements.tau.value='1';
const ctx={BathModel:M,document:{getElementById:id=>elements[id]},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),ctx);
for(const id of ['kernel','spectrum','motion','energy'])assert(elements[id].innerHTML.includes('<path')&&!elements[id].innerHTML.includes('NaN'));
console.log('Passed: 36 parameter combinations, energy balance, zero-friction solution, short-memory limit, step consistency, and plot rendering.');
