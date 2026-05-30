---
layout: page
permalink: /software/
title: Software
description: Codes and workflows that support my research program.
nav: true
nav_order: 4
---

<div class="software-intro">
  <p>I see software as an essential part of how modern theoretical chemistry and materials modelling become genuinely predictive. New methods only become useful when they are implemented robustly, scaled efficiently, and connected across electronic structure, dynamics, and data analysis. For me, building software is therefore not separate from the science itself, but part of making first-principles ideas usable for real materials and real chemical problems.</p>
</div>

<div class="software-grid">
  <section class="software-card">
    <a class="software-logo-link" href="https://fhi-aims.org/">
      <img class="software-logo" src="{{ '/assets/img/publication_preview/FHI-aims-logo.png' | relative_url }}" alt="FHI-aims logo">
    </a>
    <h2><a href="https://fhi-aims.org/">FHI-aims</a></h2>
    <p>FHI-aims is the main electronic-structure platform in which I develop first-principles methods for electron-phonon coupling, density-functional perturbation theory, superconductivity, and electronic friction. Much of my methodological work is aimed at turning advanced theory into scalable, reusable implementations within this codebase.</p>
  </section>

  <section class="software-card">
    <a class="software-logo-link" href="https://ipi-code.org/">
      <img class="software-logo" src="{{ '/assets/img/ipi-logo-alpha.png' | relative_url }}" alt="i-PI logo">
    </a>
    <h2><a href="https://ipi-code.org/">i-PI</a></h2>
    <p>i-PI provides a flexible framework for molecular dynamics and advanced simulation workflows, including approaches based on nuclear quantum effects and the ring-polymer formalism. I use it as part of a broader strategy for coupling electronic-structure calculations to dissipative dynamics, quantum nuclei, and driven atomistic motion.</p>
  </section>

  <section class="software-card">
    <a class="software-logo-link" href="https://nqcd.github.io/NQCDynamics.jl/stable/">
      <img class="software-logo" src="{{ '/assets/img/nqcd_logo.svg' | relative_url }}" alt="NQCD logo">
    </a>
    <h2><a href="https://nqcd.github.io/NQCDynamics.jl/stable/">NQCD</a></h2>
    <p>NQCD is a valuable platform for nonadiabatic quantum-classical dynamics, with many methods implemented using efficient libraries and modern software design. It makes it possible to compare different nonadiabatic approaches on equal footing, which is essential for understanding when specific approximations succeed, fail, or capture distinct dynamical regimes.</p>
  </section>
</div>
