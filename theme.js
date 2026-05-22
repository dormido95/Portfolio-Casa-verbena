/* ============================================
   Casa Verbena · Switch de ambientes (paletas)
   Compartido por index.html y propiedad.html
   ============================================ */

const ambientes = [
  {
    nombre: "Papel",
    vars: {
      "--bg": "#ffffff",
      "--bg-soft": "#f4f2ec",
      "--ink": "#1c1f1d",
      "--ink-soft": "#6e726f",
      "--accent": "#b3522e",
      "--accent-deep": "#8a3d20",
      "--line": "rgba(28, 31, 29, 0.10)",
    },
  },
  {
    nombre: "Bosque",
    vars: {
      "--bg": "#1f2a24",
      "--bg-soft": "#2a3830",
      "--ink": "#ede5d8",
      "--ink-soft": "#b5b0a3",
      "--accent": "#d68a5b",
      "--accent-deep": "#a8643d",
      "--line": "rgba(237, 229, 216, 0.16)",
    },
  },
  {
    nombre: "Adobe",
    vars: {
      "--bg": "#e8c9a8",
      "--bg-soft": "#dab48b",
      "--ink": "#3a2418",
      "--ink-soft": "#6b4c3a",
      "--accent": "#8b2e1f",
      "--accent-deep": "#5e1f14",
      "--line": "rgba(58, 36, 24, 0.18)",
    },
  },
  {
    nombre: "Niebla",
    vars: {
      "--bg": "#dde2e0",
      "--bg-soft": "#cdd3d1",
      "--ink": "#2c3a3e",
      "--ink-soft": "#5a6669",
      "--accent": "#3f6b66",
      "--accent-deep": "#274a46",
      "--line": "rgba(44, 58, 62, 0.16)",
    },
  },
  {
    nombre: "Medianoche",
    vars: {
      "--bg": "#161821",
      "--bg-soft": "#1f2230",
      "--ink": "#e8e6dd",
      "--ink-soft": "#9d9b95",
      "--accent": "#c9a557",
      "--accent-deep": "#9a7b3a",
      "--line": "rgba(232, 230, 221, 0.14)",
    },
  },
];

(function initTema() {
  const boton = document.getElementById("themeBtn");
  const moodLabel = document.getElementById("moodLabel");
  const root = document.documentElement;
  if (!boton) return;

  let indice = 0;

  function aplicarAmbiente(ambiente) {
    Object.entries(ambiente.vars).forEach(([clave, valor]) => {
      root.style.setProperty(clave, valor);
    });
    if (moodLabel) moodLabel.textContent = ambiente.nombre;
    // Avisamos a otras partes (ej. el mapa) que el tema cambió
    window.dispatchEvent(new CustomEvent("themechange"));
  }

  boton.addEventListener("click", () => {
    indice = (indice + 1) % ambientes.length;
    aplicarAmbiente(ambientes[indice]);
    boton.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.96)" },
        { transform: "scale(1)" },
      ],
      { duration: 300, easing: "ease-out" }
    );
  });

  // Atajo: barra espaciadora cambia el ambiente
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const escribiendo = t.tagName === "INPUT" || t.tagName === "TEXTAREA";
    if (e.code === "Space" && !escribiendo && document.activeElement !== boton) {
      e.preventDefault();
      boton.click();
    }
  });
})();
