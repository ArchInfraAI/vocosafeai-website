/* Theme switching.
 *
 * Default is whatever the operating system asks for, which the
 * stylesheet handles on its own through prefers-color-scheme. This file
 * only exists for the override: once someone clicks the switch, their
 * choice is stored and wins over the system until they clear it.
 *
 * The read side of this runs inline in each page's <head>, not here.
 * Loading it as a file would apply the attribute after the first paint,
 * and a dark-mode visitor would get a white flash on every page load.
 */
(function () {
    "use strict";

    var KEY = "vs-theme";

    function systemPrefersDark() {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function currentTheme() {
        var set = document.documentElement.getAttribute("data-theme");
        if (set === "light" || set === "dark") return set;
        return systemPrefersDark() ? "dark" : "light";
    }

    // ?theme=dark forces a theme for one page load without storing it.
    // Used to show both themes side by side while reviewing a design.
    function forcedTheme() {
        var m = /[?&]theme=(light|dark)/.exec(window.location.search);
        return m ? m[1] : null;
    }

    function apply(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(KEY, theme);
        } catch (e) {
            // Private browsing refuses writes. The theme still applies for
            // this page; it just will not survive navigation. Report it
            // rather than swallowing it, so a broken switch is not silent.
            console.warn("VocoSafe: theme choice could not be saved: " + e.message);
        }
        var btn = document.getElementById("theme-toggle");
        if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }

    function toggle() {
        apply(currentTheme() === "dark" ? "light" : "dark");
    }

    document.addEventListener("DOMContentLoaded", function () {
        var forced = forcedTheme();
        if (forced) document.documentElement.setAttribute("data-theme", forced);
        var btn = document.getElementById("theme-toggle");
        if (!btn) return;
        btn.addEventListener("click", toggle);
        btn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });

    // Follow the system while no explicit choice has been made.
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
            var saved = null;
            try {
                saved = localStorage.getItem(KEY);
            } catch (e) {
                saved = null;
            }
            if (saved !== "light" && saved !== "dark") {
                document.documentElement.removeAttribute("data-theme");
            }
        });
    }
})();
