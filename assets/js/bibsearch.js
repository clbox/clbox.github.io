document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("bibsearch");
  if (!input) return;

  const filterPublications = (query) => {
    const search = query.trim().toLowerCase();
    document.querySelectorAll(".bibliography > li").forEach((entry) => {
      entry.classList.toggle("unloaded", !entry.innerText.toLowerCase().includes(search));
    });

    document.querySelectorAll("h2.bibliography").forEach((heading) => {
      let section = heading.nextElementSibling;
      let hasVisibleEntry = false;
      while (section && section.tagName !== "H2") {
        if (section.tagName === "OL") {
          const entries = [...section.querySelectorAll(":scope > li")];
          const sectionVisible = entries.some((entry) => !entry.classList.contains("unloaded"));
          section.classList.toggle("unloaded", !sectionVisible);
          section.previousElementSibling?.classList.toggle("unloaded", !sectionVisible);
          hasVisibleEntry ||= sectionVisible;
        }
        section = section.nextElementSibling;
      }
      heading.classList.toggle("unloaded", !hasVisibleEntry);
    });
  };

  const applyHash = () => {
    input.value = decodeURIComponent(window.location.hash.slice(1));
    filterPublications(input.value);
  };

  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => filterPublications(input.value), 200);
  });
  window.addEventListener("hashchange", applyHash);
  applyHash();
});
