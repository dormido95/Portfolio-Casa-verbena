/* ============================================
   Casa Verbena · Página de detalle de propiedad
   Lee ?id= de la URL, dibuja la ficha y el mapa.
   ============================================ */

const contenedor = document.getElementById("detalle");

/* 1. Buscamos la propiedad por el id de la URL */
const params = new URLSearchParams(window.location.search);
const propiedad = getPropiedad(params.get("id"));

/* 2. Si no existe, mostramos un aviso y cortamos */
if (!propiedad) {
  contenedor.innerHTML = `
    <section class="detail-empty">
      <p class="eyebrow">Error 404</p>
      <h1 class="section-title">Esta propiedad no <em>existe</em>.</h1>
      <p class="section-lede">Puede que el enlace esté roto o que ya se haya vendido.</p>
      <a href="index.html" class="btn-ghost">← Volver al catálogo</a>
    </section>`;
} else {
  renderDetalle(propiedad);
}

/* 3. Dibuja la ficha completa */
function renderDetalle(p) {
  document.title = `${p.nombre} — Casa Verbena`;

  const caracteristicas = p.caracteristicas
    .map((c) => `<li class="feature"><span class="feature-dot"></span>${c}</li>`)
    .join("");

  const requisitos = p.requisitos
    .map(
      (r, i) =>
        `<li class="requisito"><span class="requisito-num">${String(
          i + 1
        ).padStart(2, "0")}</span><span>${r}</span></li>`
    )
    .join("");

  contenedor.innerHTML = `
    <a href="index.html#propiedades" class="back-link">← Volver al catálogo</a>

    <!-- Encabezado -->
    <section class="detail-hero">
      <div class="detail-cover">
        <img src="${p.img}" alt="${p.nombre}" />
        <span class="card-tag">${p.tipo}</span>
        <span class="card-op">${p.operacion}</span>
      </div>
      <div class="detail-info">
        <p class="eyebrow">${p.barrio}</p>
        <h1 class="detail-name">${p.nombre}</h1>
        <p class="detail-address">${p.direccion}</p>
        <p class="detail-surface">${p.superficie}</p>
        <p class="detail-price">${p.precioTexto}</p>
        <a href="index.html#contacto" class="btn-primary">
          <span class="btn-dot"></span>
          <span class="btn-label">Agendar una visita</span>
        </a>
      </div>
    </section>

    <!-- Mapa -->
    <section class="detail-block">
      <p class="eyebrow">Ubicación</p>
      <h2 class="detail-subtitle">Dónde queda</h2>
      <p class="detail-note">
        El círculo marca la <em>zona estimada</em> de la propiedad. La dirección
        exacta se comparte al coordinar la visita.
      </p>
      <div id="map" class="detail-map"></div>
    </section>

    <!-- Características y requisitos -->
    <section class="detail-cols">
      <div class="detail-col">
        <p class="eyebrow">Qué incluye</p>
        <h2 class="detail-subtitle">Las cosas que tiene</h2>
        <ul class="feature-list">${caracteristicas}</ul>
      </div>
      <div class="detail-col">
        <p class="eyebrow">Antes de avanzar</p>
        <h2 class="detail-subtitle">Requisitos para ingresar</h2>
        <ul class="requisito-list">${requisitos}</ul>
      </div>
    </section>
  `;

  iniciarMapa(p);
}

/* 4. Inicializa el mapa de Leaflet con el círculo estimado */
function iniciarMapa(p) {
  const cont = document.getElementById("map");
  if (!cont || typeof L === "undefined") return;

  const acento = () =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#b3522e";

  /* El mapa arranca en las coordenadas guardadas (Buenos Aires).
     Así nunca se ve vacío, aunque la geocodificación tarde o falle. */
  const map = L.map(cont, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView([p.lat, p.lng], 15);

  /* Mapa base claro de CARTO — combina con la paleta blanca */
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: "© OpenStreetMap · © CARTO",
    }
  ).addTo(map);

  /* Círculo de zona estimada (radio 350 m) */
  const circulo = L.circle([p.lat, p.lng], {
    radius: 350,
    color: acento(),
    weight: 2,
    fillColor: acento(),
    fillOpacity: 0.15,
  }).addTo(map);

  /* Punto central en la dirección */
  const centro = L.circleMarker([p.lat, p.lng], {
    radius: 7,
    color: acento(),
    fillColor: acento(),
    fillOpacity: 1,
    weight: 2,
  }).addTo(map);

  centro.bindPopup(`<strong>${p.nombre}</strong><br>${p.barrio}`);
  map.fitBounds(circulo.getBounds(), { padding: [40, 40] });

  /* IMPORTANTE: recalcula el tamaño una vez acomodada la página.
     Esto evita el clásico mapa gris / vacío de Leaflet. */
  setTimeout(() => map.invalidateSize(), 250);
  window.addEventListener("load", () => map.invalidateSize());

  /* Geocodificación: busca la dirección real y reubica el mapa */
  ubicarPorDireccion(p.direccion, map, circulo, centro);

  /* Si cambia el ambiente, recoloreamos el círculo */
  window.addEventListener("themechange", () => {
    const c = acento();
    circulo.setStyle({ color: c, fillColor: c });
    centro.setStyle({ color: c, fillColor: c });
  });
}

/* 5. Geocodifica una dirección con el servicio gratuito Nominatim (OSM).
   Si encuentra un resultado dentro del área de Buenos Aires, mueve
   el mapa hacia ahí. Si falla, deja las coordenadas guardadas. */
async function ubicarPorDireccion(direccion, map, circulo, centro) {
  const consulta = encodeURIComponent(direccion + ", Argentina");
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    consulta;

  try {
    const resp = await fetch(url, { headers: { "Accept-Language": "es" } });
    const datos = await resp.json();
    if (!datos || !datos.length) return;

    const lat = parseFloat(datos[0].lat);
    const lng = parseFloat(datos[0].lon);

    /* Control de seguridad: aceptamos el resultado solo si cae
       dentro del Gran Buenos Aires (evita pines en lugares raros). */
    const enBsAs =
      lat > -35.05 && lat < -34.2 && lng > -58.85 && lng < -58.15;
    if (!enBsAs) return;

    circulo.setLatLng([lat, lng]);
    centro.setLatLng([lat, lng]);
    map.flyToBounds(circulo.getBounds(), { padding: [40, 40], duration: 1 });
  } catch (e) {
    console.warn("No se pudo geocodificar; uso las coordenadas guardadas.", e);
  }
}
