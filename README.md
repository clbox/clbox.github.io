# clbox.github.io

Personal academic website for Connor L. Box, built with Jekyll and deployed to GitHub Pages.

## Content

- `_pages/` contains the five main site sections.
- `_projects/` contains research-area pages.
- `_news/` contains short homepage updates.
- `_bibliography/papers.bib` is the publication source.
- `_data/resume.json` and `_data/socials.yml` contain CV and profile data.
- `assets/img/` contains profile, research, software, and publication images.

## Local development

Use Ruby 3.3 and ImageMagick:

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Deployment

Pushes to `main` are built and deployed by `.github/workflows/deploy.yml`.
