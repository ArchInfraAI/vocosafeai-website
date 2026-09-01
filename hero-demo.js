/* The hero demo: speech going in, text coming out.
 *
 * Sentence at a time, not letter at a time. Dictation does not type, it
 * listens to a whole phrase and then puts it down at once, so a
 * character-by-character typewriter shows the wrong product. The bars
 * move while the sentence is being spoken and fall flat the instant it
 * lands, which is the rhythm of the real thing.
 *
 * The waveform is not random noise either. Speech has syllables and
 * gaps: bursts of energy separated by near-silence. That shape is what
 * the eye reads as a voice, so it is modeled rather than left to
 * Math.random.
 */
(function () {
    "use strict";

    var SENTENCES = [
        "Finished the whole first draft this afternoon, just by talking it through.",
        "Turns out I think faster out loud than I ever did at the keyboard.",
        "Reading it back now and it barely needs editing."
    ];

    // Faster than real speech on purpose. At a true conversational 165ms a
    // word the panel takes six seconds to fill, which is longer than anyone
    // watches a hero before scrolling.
    var MS_PER_WORD = 95;
    var MIN_SPEAK = 520;
    var LAND_PAUSE = 320;    // beat between the voice stopping and the next one starting
    var HOLD_MS = 3600;      // how long the finished paragraph stays before looping
    var BARS = 28;

    function init() {
        var wave = document.querySelector("[data-wave]");
        var out = document.querySelector("[data-transcript]");
        if (!wave || !out) return;

        var bars = [];
        for (var i = 0; i < BARS; i++) {
            var b = document.createElement("span");
            wave.appendChild(b);
            bars.push(b);
        }

        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
            // Someone who asked for less motion still needs to see what the
            // panel is showing them, so show the end state and stop.
            out.textContent = SENTENCES.join(" ");
            bars.forEach(function (b, i) { b.style.height = (18 + ((i * 37) % 55)) + "%"; });
            return;
        }

        var index = 0;
        var speaking = true;
        var phaseStart = 0;
        var phaseEnd = 0;

        function speakMs(sentence) {
            return Math.max(MIN_SPEAK, sentence.split(" ").length * MS_PER_WORD);
        }

        function amplitude(i, t) {
            // A slow carrier gives the loudness its syllable rise and fall; a
            // faster one gives each bar its own jitter so neighbors are never
            // equal. The center weighting mimics a mic: quieter at the edges.
            var syllable = Math.sin(t / 175 + i * 0.2);
            var jitter = Math.sin(t / 45 + i * 1.7) * 0.5 + Math.sin(t / 21 + i * 0.9) * 0.25;
            var center = 1 - Math.abs((i / (BARS - 1)) - 0.5) * 0.85;
            var v = (syllable * 0.55 + jitter * 0.45 + 0.6) * center;
            return Math.max(0.06, Math.min(1, v));
        }

        function frame(now) {
            if (!phaseEnd) {
                phaseStart = now;
                phaseEnd = now + speakMs(SENTENCES[0]);
            }

            for (var i = 0; i < BARS; i++) {
                var h = speaking ? amplitude(i, now - phaseStart) : 0.04;
                bars[i].style.height = (h * 100).toFixed(1) + "%";
                // Faded while silent, so the resting state reads as a quiet
                // mic rather than a dotted rule across the panel.
                bars[i].style.opacity = speaking ? "0.85" : "0.28";
            }

            if (now >= phaseEnd) {
                if (speaking) {
                    // The sentence lands complete, the way a transcript arrives.
                    index++;
                    out.textContent = SENTENCES.slice(0, index).join(" ");
                    speaking = false;
                    phaseEnd = now + (index >= SENTENCES.length ? HOLD_MS : LAND_PAUSE);
                } else if (index >= SENTENCES.length) {
                    index = 0;
                    out.textContent = "";
                    speaking = true;
                    phaseStart = now;
                    phaseEnd = now + speakMs(SENTENCES[0]);
                } else {
                    speaking = true;
                    phaseStart = now;
                    phaseEnd = now + speakMs(SENTENCES[index]);
                }
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
