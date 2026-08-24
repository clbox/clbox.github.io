$(document).ready(function () {
  if ($("#toc-sidebar").length) {
    $(".publications h2").attr("data-toc-skip", "");
    const navSelector = "#toc-sidebar";
    Toc.init($(navSelector));
    $("body").scrollspy({ target: navSelector });
  }
});
