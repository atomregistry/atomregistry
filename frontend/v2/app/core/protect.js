(() => {
  const O = "atomregistry.com";
  const M =
    "© 2026 " +
    O +
    ". All code, layout and assets are protected. Unauthorized copying, reproduction, distribution or reuse is strictly prohibited.";

  const SECURITY_WARNING =
    "Unauthorized action blocked. This security event has been logged.";

  let v = false;
  let p = false;

  const E = e => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (_) {}
  };

  const w = t => {
    try {
      console.clear();
      console.log(
        "%c" + M,
        "background:#191237;color:#ff28a5;font-size:16px;font-weight:700;padding:10px;border-radius:8px"
      );

      if (t) {
        console.warn(t);
      }
    } catch (_) {}
  };

  const K = e => {
    const k = (e.key || "").toLowerCase();
    const c = e.ctrlKey || e.metaKey;
    const s = e.shiftKey;
    const a = e.altKey;

    if (
      k === "f12" ||
      (c && ["u", "s", "p", "c", "x", "a"].includes(k)) ||
      (c && s && ["i", "j", "c", "k"].includes(k)) ||
      (e.metaKey && a && ["i", "j", "c"].includes(k))
    ) {
      E(e);
      w(SECURITY_WARNING);
      return false;
    }
  };

  ["contextmenu", "copy", "cut", "selectstart", "dragstart"].forEach(n =>
    document.addEventListener(n, E, {
      capture: true,
      passive: false
    })
  );

  document.addEventListener("keydown", K, {
    capture: true,
    passive: false
  });

  document.addEventListener("keyup", K, {
    capture: true,
    passive: false
  });

  document.addEventListener(
    "mousedown",
    e => {
      if (e.button === 1) {
        E(e);
        w(SECURITY_WARNING);
      }
    },
    {
      capture: true,
      passive: false
    }
  );

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.setAttribute("data-owner", O);
    document.body.setAttribute("data-copyright", M);

    document.querySelectorAll("img,svg,a").forEach(el => {
      el.setAttribute("draggable", "false");
    });

    w();
  });

  const overlay = () => {
    let d = document.getElementById("x9z-protect");

    if (!d) {
      d = document.createElement("div");
      d.id = "x9z-protect";
      d.className = "x9z-protect-overlay";
      d.innerHTML =
        '<div class="x9z-protect-box">' +
        "Technical preview blocked" +
        "<small>" +
        SECURITY_WARNING +
        "<br>" +
        M +
        "</small>" +
        "</div>";

      document.body.appendChild(d);
    }
  };

  const clear = () => {
    const d = document.getElementById("x9z-protect");
    if (d) d.remove();
  };

  setInterval(() => {
    const dw = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
    const dh = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));

    p = dw > 180 || dh > 180;

    if (p && !v) {
      v = true;
      overlay();
      w("DevTools may be open. " + SECURITY_WARNING);
    } else if (!p && v) {
      v = false;
      clear();
    }
  }, 800);

  window.addEventListener("beforeprint", e => {
    E(e);
    alert(SECURITY_WARNING + "\n\n" + M);
  });
})();
