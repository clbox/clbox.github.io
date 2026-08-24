---
layout: page
title: Research Areas
permalink: /projects/
description: Research on nonadiabatic dynamics, electron-phonon coupling, nuclear quantum effects, scientific software, surface chemistry, and superconducting materials.
nav: true
nav_order: 3
---

<div class="projects">
  {% assign sorted_projects = site.projects | sort: 'importance' %}
  <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
</div>
