"""Regenerate the teaching examples with George Trenins' GLEfit.
Usage: python generate_examples.py /path/to/GLEfit
Requires GLEfit's dependencies plus PyYAML. No browser/server Python is needed.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('glefit_root', type=Path)
args = parser.parse_args()
sys.path.insert(0, str(args.glefit_root.resolve() / 'src'))
from glefit.config.config_handler import ConfigHandler
from glefit.optimize import Optimization
from glefit.spectral.expohmic import ExpOhmic
from glefit.utils.rp import nmfreq

# Fit in units where the bath cutoff is 1; convert every A entry back to fs^-1.
cutoff, eta, temperature, beads = 0.2, 0.05, 300, 8
kb, hbar = 8.617333262145e-5, 0.6582119569
bath = ExpOhmic(eta / cutoff, 1.0)
examples = []
for mode in (0, 1, 4):
    wn = float(nmfreq(1/(kb*temperature), beads, mode, hbar=hbar))
    r = wn / cutoff
    # Resolve the threshold while retaining the zero-frequency region.
    x = np.unique(np.r_[np.linspace(0, r+10, 1001), r + np.geomspace(1e-5, 1, 150)])
    target = bath.nmLambda(r, x)
    for pairs in (1, 3):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            data = folder / 'target.csv'
            np.savetxt(data, np.c_[x, target], delimiter=',')
            centers = np.sqrt(r*r + np.linspace(0.2, 2.5, pairs)**2)
            terms = [{'type':'pronycos', 'parameters':{'theta':float(np.sqrt(0.12/pairs)), 'gamma':0.35, 'omega':float(c)}} for c in centers]
            # Trapezoidal weights avoid over-weighting the extra threshold points.
            weight = np.r_[np.diff(x)[0]/2, (x[2:]-x[:-2])/2, np.diff(x)[-1]/2]
            weight /= weight.mean()
            config = {
                'data':{'spectrum':{'source':'external','path':str(data),'format':'csv','columns':[0,1],'delimiter':','}},
                'merit_function':{'type':'spectrum','parameters':{'data':'spectrum','metric':'squared','weight':weight.tolist()}},
                'embedder':{'type':'multi','parameters':{'embedders':terms}},
                'optimization':{'type':'EF','parameters':{'trajfile':str(folder/'trajectory.out'),'logfile':str(folder/'log.out')},'options':{'max_iter':600,'max_step':0.2,'gtol':1e-7}}
            }
            path = folder/'config.yaml'
            path.write_text(yaml.safe_dump(config))
            handler = ConfigHandler(path)
            handler.validate()
            opt = Optimization.from_config(handler)
            converged = bool(opt.run(steps=600, options={'max_step':0.2,'gtol':1e-7}))
            A = np.asarray(opt.emb.A) * cutoff
            components = []
            for j in range(pairs):
                i = 1+2*j
                components.append({'theta':float(A[0,i]),'gamma':float(A[i,i]),'omega':float(A[i,i+1])})
            fit = np.zeros_like(x)
            for c in components:
                th, ga, om = (c[k]/cutoff for k in ('theta','gamma','omega'))
                fit += th*th*ga/2*(1/(ga*ga+(x-om)**2)+1/(ga*ga+(x+om)**2))
            error = float(np.sqrt(np.sum(weight*(fit-target)**2)/np.sum(weight*target**2)))
            examples.append({'mode':mode,'pairs':pairs,'omega_n':wn,'converged':converged,'relative_l2_error':error,'A':A.tolist(),'components':components})
            print(f'mode={mode} pairs={pairs} converged={converged} relative_L2={error:.5f}', flush=True)
try:
    revision = subprocess.check_output(['git','-C',str(args.glefit_root),'rev-parse','HEAD'],text=True).strip()
except subprocess.CalledProcessError:
    revision = 'unavailable'
out = {'generator':'George Trenins GLEfit: Optimization.from_config + EigenvectorFollowing','glefit_revision':revision,'temperature_K':temperature,'beads':beads,'cutoff_fs_inverse':cutoff,'eta_fs_inverse':eta,'spectrum':'eta * exp(-omega / cutoff)','matrix_convention':'dX/dt = -A X + noise; X=(mass-scaled momentum, auxiliary variables); A in fs^-1','fit_domain':'0 <= omega/cutoff <= omega_n/cutoff + 10; trapezoidal squared-error weights','examples':examples}
Path(__file__).with_name('fit-examples.json').write_text(json.dumps(out,indent=2)+'\n')
