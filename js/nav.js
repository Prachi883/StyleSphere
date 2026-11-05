// ============================================
// StyleSphere · mobile menu (hamburger)
// Include on every page that has the shared navbar.
// ============================================

(function () {
    const navbar = document.querySelector(".navbar");
    const menuBtn = document.getElementById("menuBtn");
    if (!navbar || !menuBtn) return;

    function setOpen(open) {
        navbar.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    menuBtn.addEventListener("click", function () {
        setOpen(!navbar.classList.contains("open"));
    });

    // close after choosing a page
    navbar.querySelectorAll(".nav-links a").forEach(function (link) {
        link.addEventListener("click", function () { setOpen(false); });
    });

    // close if the window grows back to desktop size
    window.addEventListener("resize", function () {
        if (window.innerWidth > 760) setOpen(false);
    });
})();