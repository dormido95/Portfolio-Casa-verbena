/* ============================================
   Casa Verbena · Lógica de la página principal
   1) Buscador + grilla de propiedades
   2) Calendario de reservas
   (El switch de ambientes vive en theme.js)
   ============================================ */

/* ---------- 1. BUSCADOR Y GRILLA ---------- */

const searchBtn = document.getElementById("searchBtn");
const grid = document.getElementById("gridProperties");
const noResults = document.getElementById("noResults");
const resultCount = document.getElementById("resultCount");

/* Estado actual de los filtros */
const filtros = { lugar: "", tipo: "", operacion: "", precio: "" };

/* Rangos de precio según la operación elegida */
const RANGOS = {
  Comprar: [
    { label: "Cualquier precio", value: "" },
    { label: "Hasta USD 200.000", value: "0-200000" },
    { label: "USD 200.000 – 500.000", value: "200000-500000" },
    { label: "USD 500.000 – 1.000.000", value: "500000-1000000" },
    { label: "Más de USD 1.000.000", value: "1000000-999999999" },
  ],
  Alquilar: [
    { label: "Cualquier precio", value: "" },
    { label: "Hasta USD 800 / mes", value: "0-800" },
    { label: "USD 800 – 1.500 / mes", value: "800-1500" },
    { label: "USD 1.500 – 3.000 / mes", value: "1500-3000" },
    { label: "Más de USD 3.000 / mes", value: "3000-999999999" },
  ],
  "": [{ label: "Cualquier precio", value: "" }],
};

/* ===== Componente: dropdown personalizado =====
   Reemplaza al <select> nativo para tener control total
   sobre la apariencia del desplegable. */
const cerradores = [];

function cerrarTodos() {
  cerradores.forEach((cerrar) => cerrar());
}

function initDropdown(dd, onSelect) {
  const trigger = dd.querySelector(".dd-trigger");
  const valueEl = dd.querySelector(".dd-value");
  const panel = dd.querySelector(".dd-panel");

  function cerrar() {
    panel.hidden = true;
    dd.classList.remove("open");
  }
  function abrir() {
    cerrarTodos();
    panel.hidden = false;
    dd.classList.add("open");
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dd.classList.contains("open") ? cerrar() : abrir();
  });

  cerradores.push(cerrar);

  function elegir(opcion, silencioso) {
    valueEl.textContent = opcion.label;
    dd.dataset.value = opcion.value;
    [...panel.children].forEach((c) =>
      c.classList.toggle("selected", c.dataset.value === opcion.value)
    );
    cerrar();
    if (!silencioso && onSelect) onSelect(opcion.value);
  }

  /* Carga (o recarga) las opciones del dropdown */
  function setOpciones(opciones, silencioso) {
    panel.innerHTML = "";
    opciones.forEach((opcion) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dd-option";
      btn.textContent = opcion.label;
      btn.dataset.value = opcion.value;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        elegir(opcion, false);
      });
      panel.appendChild(btn);
    });
    if (opciones.length) elegir(opciones[0], silencioso);
  }

  return { setOpciones };
}

/* Cierra cualquier dropdown al hacer clic afuera o con Escape */
document.addEventListener("click", cerrarTodos);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarTodos();
});

/* Creamos los cuatro dropdowns del buscador */
const ddLugar = initDropdown(
  document.querySelector('.dd[data-name="lugar"]'),
  (v) => { filtros.lugar = v; aplicarFiltros(); }
);
const ddTipo = initDropdown(
  document.querySelector('.dd[data-name="tipo"]'),
  (v) => { filtros.tipo = v; aplicarFiltros(); }
);
const ddPrecio = initDropdown(
  document.querySelector('.dd[data-name="precio"]'),
  (v) => { filtros.precio = v; aplicarFiltros(); }
);
const ddOperacion = initDropdown(
  document.querySelector('.dd[data-name="operacion"]'),
  (v) => {
    filtros.operacion = v;
    filtros.precio = "";
    ddPrecio.setOpciones(RANGOS[v] || RANGOS[""], true);
    aplicarFiltros();
  }
);

/* Llenamos las opciones a partir de los datos */
const barriosUnicos = [...new Set(PROPIEDADES.map((p) => p.barrio))].sort();
const tiposUnicos = [...new Set(PROPIEDADES.map((p) => p.tipo))].sort();

ddLugar.setOpciones(
  [{ label: "Todos los barrios", value: "" },
   ...barriosUnicos.map((b) => ({ label: b, value: b }))],
  true
);
ddTipo.setOpciones(
  [{ label: "Todos los tipos", value: "" },
   ...tiposUnicos.map((t) => ({ label: t, value: t }))],
  true
);
ddOperacion.setOpciones(
  [{ label: "Comprar o alquilar", value: "" },
   { label: "Comprar", value: "Comprar" },
   { label: "Alquilar", value: "Alquilar" }],
  true
);
ddPrecio.setOpciones(RANGOS[""], true);

/* Crea la tarjeta de una propiedad (es un enlace a la página de detalle) */
function crearTarjeta(p) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = `propiedad.html?id=${p.id}`;
  a.innerHTML = `
    <div class="card-img">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy" />
      <span class="card-tag">${p.tipo}</span>
      <span class="card-op">${p.operacion}</span>
    </div>
    <div class="card-body">
      <span class="card-location">${p.barrio}</span>
      <h3 class="card-title">${p.nombre}</h3>
      <p class="card-desc">${p.resumen}</p>
      <p class="card-price">${p.precioTexto}</p>
    </div>`;
  return a;
}

/* Aplica los filtros y dibuja la grilla */
function aplicarFiltros() {
  const { lugar, tipo, operacion, precio } = filtros;

  let min = 0;
  let max = Infinity;
  if (precio) {
    const [a, b] = precio.split("-").map(Number);
    min = a;
    max = b;
  }

  const filtradas = PROPIEDADES.filter((p) => {
    if (lugar && p.barrio !== lugar) return false;
    if (tipo && p.tipo !== tipo) return false;
    if (operacion && p.operacion !== operacion) return false;
    if (p.precio < min || p.precio > max) return false;
    return true;
  });

  grid.innerHTML = "";
  filtradas.forEach((p) => grid.appendChild(crearTarjeta(p)));

  noResults.hidden = filtradas.length > 0;
  const n = filtradas.length;
  resultCount.textContent =
    n === PROPIEDADES.length
      ? `${n} propiedades disponibles`
      : `${n} ${n === 1 ? "propiedad encontrada" : "propiedades encontradas"}`;
}

searchBtn.addEventListener("click", () => {
  aplicarFiltros();
  document.getElementById("propiedades").scrollIntoView({ behavior: "smooth" });
});

/* Arranque: dibujamos la grilla completa */
aplicarFiltros();


/* ---------- 2. CALENDARIO DE RESERVAS ---------- */

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const estado = {
  vistaAnio: hoy.getFullYear(),
  vistaMes: hoy.getMonth(),
  fechaSel: null,
  horaSel: null,
};

const calLabel = document.getElementById("calLabel");
const calDays = document.getElementById("calDays");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const timeSlots = document.querySelectorAll(".slot");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const confirmBtn = document.getElementById("confirmBtn");
const confirmMsg = document.getElementById("confirmMsg");

function renderCalendario() {
  const { vistaAnio, vistaMes } = estado;
  calLabel.textContent = `${MESES[vistaMes]} ${vistaAnio}`;

  const primerDia = new Date(vistaAnio, vistaMes, 1);
  let offset = primerDia.getDay() - 1;
  if (offset < 0) offset = 6;

  const ultimoDia = new Date(vistaAnio, vistaMes + 1, 0).getDate();
  calDays.innerHTML = "";

  for (let i = 0; i < offset; i++) {
    const vacio = document.createElement("div");
    vacio.className = "cal-day empty";
    calDays.appendChild(vacio);
  }

  for (let d = 1; d <= ultimoDia; d++) {
    const fecha = new Date(vistaAnio, vistaMes, d);
    const btn = document.createElement("button");
    btn.className = "cal-day";
    btn.textContent = d;

    if (fecha < hoy) {
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    if (fecha.getTime() === hoy.getTime()) {
      btn.classList.add("today");
    }
    if (estado.fechaSel && fecha.getTime() === estado.fechaSel.getTime()) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => seleccionarFecha(fecha));
    calDays.appendChild(btn);
  }
}

function seleccionarFecha(fecha) {
  estado.fechaSel = fecha;
  estado.horaSel = null;

  const opciones = { weekday: "long", day: "numeric", month: "long" };
  selectedDateLabel.textContent = fecha.toLocaleDateString("es-AR", opciones);

  timeSlots.forEach((s) => {
    s.disabled = false;
    s.classList.remove("selected");
  });

  renderCalendario();
  actualizarConfirmar();
}

timeSlots.forEach((slot) => {
  slot.addEventListener("click", () => {
    if (slot.disabled) return;
    timeSlots.forEach((s) => s.classList.remove("selected"));
    slot.classList.add("selected");
    estado.horaSel = slot.dataset.time;
    actualizarConfirmar();
  });
});

prevBtn.addEventListener("click", () => {
  estado.vistaMes--;
  if (estado.vistaMes < 0) {
    estado.vistaMes = 11;
    estado.vistaAnio--;
  }
  renderCalendario();
});

nextBtn.addEventListener("click", () => {
  estado.vistaMes++;
  if (estado.vistaMes > 11) {
    estado.vistaMes = 0;
    estado.vistaAnio++;
  }
  renderCalendario();
});

function actualizarConfirmar() {
  const completo =
    estado.fechaSel &&
    estado.horaSel &&
    nameInput.value.trim() &&
    emailInput.value.trim().includes("@");
  confirmBtn.disabled = !completo;
}

nameInput.addEventListener("input", actualizarConfirmar);
emailInput.addEventListener("input", actualizarConfirmar);

confirmBtn.addEventListener("click", () => {
  const fechaTxt = estado.fechaSel.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const nombre = nameInput.value.trim().split(" ")[0];
  confirmMsg.textContent = `¡Listo, ${nombre}! Tu visita queda agendada para el ${fechaTxt} a las ${estado.horaSel} hs. Te escribimos al mail.`;
  confirmBtn.disabled = true;
});

renderCalendario();
