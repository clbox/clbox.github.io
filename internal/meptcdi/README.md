---
layout: null
sitemap: false
---
# Unlisted MePTCDI workspace

Entry point: /internal/meptcdi/; casual UI password: meptcdi.
This is publicly downloadable static content, NOT private hosting or authentication.
Do not add confidential files. No navigation entry is intended. Noindex metadata,
sitemap exclusion and robots disallow discourage discovery, not access.

viewer.html reuses the local Chemiscope standalone bundle and loads mace.json.gz
or dft.json.gz only on opening that view. Browser gzip decoding uses the native
DecompressionStream API; use a current desktop browser. All assets are local.

Dataset provenance and structure counts are recorded in provenance.json.
Regenerate in the MePTCDI research workspace using mace_dense_pass/export_website.py
after refreshing export_full_chemiscope.py and export_dft_chemiscope.py. Copy the
generated internal/meptcdi contents here. Do not replace this with the 126 MB
embedded full-pool HTML. Research scripts, local paths, raw logs and checkpoints
are not needed by this site. Tier-2 jobs are status-only until matching references
and convergence allow a separate, scientifically consistent dataset.
