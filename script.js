

const CONFIG = {
  wifi: {
    ssid: 'baja',
    password: 'MelaPelas#01',
    encryption: 'WPA',
    hidden: false,
  },
  location: {
    lat: 18.35,
    lon: -92.64,
  },
  rooms: {
    total: 16,
    paramNames: ['hab', 'room'],
  },
};

/**
 * Datos OFFLINE: aquí pondrás coordenadas reales.
 * Por ahora dejo ejemplos para que sustituyas.
 */
const PLACES = Array.isArray(window.GRANMAR_PLACES) && window.GRANMAR_PLACES.length > 0 ? window.GRANMAR_PLACES : [
  {
    id: 'tortas-1',
    name: 'Tortas (Ejemplo)',
    category: 'comida',
    note: 'Referencia: salida hacia la carretera',
    hours: '9:00 a 20:00',
    whatsapp: {
      phone: '529991429627',
      message: 'Hola, estoy en Gran Mar. ¿Me compartes tu menú/ubicación y tiempos de entrega? Gracias.',
    },
    lat: 18.000001,
    lon: -92.000001,
  },
  {
    id: 'tiendita-1',
    name: 'Tiendita (Ejemplo)',
    category: 'tienda',
    note: 'A 5-10 min',
    hours: '9:00 a 20:00',
    whatsapp: {
      phone: '529991429627',
      message: 'Hola, estoy en Gran Mar. ¿Me confirmas si estás abierto y tu ubicación? Gracias.',
    },
    lat: 18.000002,
    lon: -92.000002,
  },
  {
    id: 'deposito-1',
    name: 'Depósito de cerveza (Ejemplo)',
    category: 'tienda',
    note: 'Pregunta por “depósito”',
    hours: '9:00 a 20:00',
    whatsapp: {
      phone: '529991429627',
      message: 'Hola, estoy en Gran Mar. ¿Tienes servicio a domicilio? Gracias.',
    },
    lat: 18.000003,
    lon: -92.000003,
  },
  {
    id: 'doctor-1',
    name: 'Doctor / Clínica (Ejemplo)',
    category: 'salud',
    note: 'Horario variable',
    lat: 18.000004,
    lon: -92.000004,
  },
  {
    id: 'emergencia-1',
    name: 'Punto de auxilio (Ejemplo)',
    category: 'emergencia',
    note: 'Si no hay señal, intenta moverte a un punto alto',
    lat: 18.000005,
    lon: -92.000005,
  },
];

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function getRoomFromUrl() {
  const url = new URL(window.location.href);
  for (const key of CONFIG.rooms.paramNames) {
    const raw = url.searchParams.get(key);
    if (raw && raw.trim()) return raw.trim();
  }
  return null;
}

function renderRoomBadge() {
  const badge = $('roomBadge');
  if (!badge) return;

  const room = getRoomFromUrl();
  if (!room) return;

  badge.textContent = `Habitación ${room}`;
  badge.hidden = false;
}

function setWifiUi() {
  const ssidEl = $('wifiSsid');
  const passEl = $('wifiPass');
  if (ssidEl) ssidEl.textContent = CONFIG.wifi.ssid;
  if (passEl) passEl.textContent = CONFIG.wifi.password;
}

function initParallax() {
  const els = Array.from(document.querySelectorAll('.parallax-bg'));
  if (els.length === 0) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const visible = new Set();
  const strength = 28;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight || 0;
    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const denom = vh / 2 + rect.height / 2;
      const t = denom ? (center - vh / 2) / denom : 0;
      const clamped = Math.max(-1, Math.min(1, t));
      const offset = -clamped * strength;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      requestUpdate();
    },
    { root: null, threshold: 0 }
  );

  for (const el of els) io.observe(el);

  requestUpdate();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
}

async function copyWifiToClipboard() {
  const hint = $('wifiHint');
  const ssid = CONFIG.wifi.ssid;
  const pass = CONFIG.wifi.password;
  const text = `Red (SSID): ${ssid}\nContraseña: ${pass}`;
  try {
    await navigator.clipboard.writeText(text);
    if (hint) hint.textContent = 'Copiado. Ahora abre Wi‑Fi y pega la contraseña.';
  } catch {
    if (hint) hint.textContent = 'No se pudo copiar. Selecciona y copia manualmente SSID/contraseña.';
  }
}

function openWifiSettings() {
  const hint = $('wifiHint');

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Realidad:
  // - No hay un método web universal para abrir Ajustes Wi‑Fi.
  // - Android: algunos navegadores aceptan intent://
  // - iOS: Safari casi siempre bloquea deep links a Ajustes.

  if (isAndroid) {
    // Intent hacia ajustes Wi‑Fi
    try {
      window.location.href = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
      if (hint) hint.textContent = 'Si no abre automáticamente: Ajustes > Wi‑Fi.';
      return;
    } catch {
      if (hint) hint.textContent = 'Abre Ajustes > Wi‑Fi manualmente.';
      return;
    }
  }

  if (isIOS) {
    // iOS: no confiable desde web.
    if (hint) hint.textContent = 'En iPhone: abre Ajustes > Wi‑Fi manualmente (iOS no permite abrirlo desde el navegador).';
    return;
  }

  if (hint) hint.textContent = 'Abre Ajustes > Wi‑Fi manualmente.';
}

function openInMapsUrl(lat, lon, label) {
  const q = encodeURIComponent(label ? `${label}` : `${lat},${lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lon)}&query_place_id=&q=${q}`;
}

function formatCategory(cat) {
  const map = {
    comida: 'Comida',
    tienda: 'Tienda',
    salud: 'Salud',
    emergencia: 'Emergencia',
    alimentos: 'Alimentos',
    servicios: 'Servicios',
    compras: 'Compras',
    mantenimiento: 'Mantenimiento',
    bebidas: 'Bebidas',
    hogar: 'Hogar',
    mandados: 'Mandados',
    eventos: 'Eventos',
    otro: 'Otro',
  };
  return map[cat] ?? cat;
}

function buildWhatsappUrl(phone, message) {
  const base = 'https://wa.me/';
  const p = String(phone ?? '').replace(/\D/g, '');
  const portalUrl = window.location.href;
  const finalMessage = message ? `${message}\n\n${portalUrl}` : portalUrl;
  const text = finalMessage ? `?text=${encodeURIComponent(finalMessage)}` : '';
  return `${base}${p}${text}`;
}

function getLocation() {
  const injected = window.GRANMAR_LOCATION;
  const lat = Number(injected?.lat ?? CONFIG.location.lat);
  const lon = Number(injected?.lon ?? CONFIG.location.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  return { lat: CONFIG.location.lat, lon: CONFIG.location.lon };
}

function setWeatherMap() {
  const iframe = $('weatherMap');
  if (!iframe) return;

  const { lat, lon } = getLocation();
  const src = `https://embed.windy.com/embed2.html?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&detailLat=${encodeURIComponent(lat)}&detailLon=${encodeURIComponent(lon)}&width=650&height=450&zoom=9&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  iframe.src = src;
}

function weatherCodeLabel(code) {
  const map = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla',
    51: 'Llovizna',
    53: 'Llovizna',
    55: 'Llovizna',
    56: 'Llovizna',
    57: 'Llovizna',
    61: 'Lluvia',
    63: 'Lluvia',
    65: 'Lluvia fuerte',
    66: 'Lluvia',
    67: 'Lluvia',
    71: 'Nieve',
    73: 'Nieve',
    75: 'Nieve',
    77: 'Nieve',
    80: 'Chubascos',
    81: 'Chubascos',
    82: 'Chubascos fuertes',
    85: 'Chubascos',
    86: 'Chubascos',
    95: 'Tormenta',
    96: 'Tormenta',
    99: 'Tormenta',
  };
  return map[code] ?? 'Clima';
}

function formatShortDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
}

async function loadWeather() {
  const container = $('weatherForecast');
  const hint = $('weatherHint');
  if (!container) return;

  const { lat, lon } = getLocation();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&timezone=auto&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&forecast_days=3`;

  try {
    if (hint) hint.textContent = 'Cargando pronóstico…';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('weather_fetch_failed');
    const data = await res.json();
    const daily = data?.daily;
    const times = daily?.time ?? [];
    const codes = daily?.weathercode ?? [];
    const tmax = daily?.temperature_2m_max ?? [];
    const tmin = daily?.temperature_2m_min ?? [];
    const rain = daily?.precipitation_sum ?? [];
    const wind = daily?.windspeed_10m_max ?? [];

    container.innerHTML = times
      .map((t, i) => {
        const title = formatShortDate(t);
        const desc = weatherCodeLabel(codes[i]);
        const temp = `${Math.round(tmin[i])}° / ${Math.round(tmax[i])}°`;
        const extra = `${Math.round(rain[i] ?? 0)} mm · Viento ${Math.round(wind[i] ?? 0)} km/h`;
        return `
          <div class="card">
            <div class="card__title">${escapeHtml(title)}</div>
            <div class="card__text">${escapeHtml(desc)}</div>
            <div class="place__meta">
              <span class="tag">${escapeHtml(temp)}</span>
              <span class="tag">${escapeHtml(extra)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    if (hint) hint.textContent = '';
  } catch {
    if (hint) hint.textContent = 'No se pudo cargar el pronóstico. Revisa tu conexión a internet.';
  }
}

function iconSvg(name) {
  if (name === 'whatsapp') {
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.45 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.28-1.64a11.9 11.9 0 0 0 5.76 1.46h.01c6.59 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.18-3.47-8.4ZM12.04 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.73.97 1-3.64-.24-.37a9.84 9.84 0 0 1-1.52-5.23c0-5.48 4.46-9.94 9.95-9.94 2.66 0 5.16 1.04 7.03 2.91a9.87 9.87 0 0 1 2.91 7.03c0 5.48-4.46 9.94-9.95 9.94Zm5.77-7.88c-.31-.16-1.82-.9-2.1-1-.28-.1-.49-.16-.69.16-.2.31-.79 1-.97 1.21-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.13-.64.14-.14.31-.36.46-.54.16-.18.2-.31.31-.51.1-.2.05-.39-.03-.54-.08-.16-.69-1.66-.95-2.27-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.39-.28.31-1.08 1.05-1.08 2.56s1.11 2.97 1.26 3.18c.16.2 2.18 3.33 5.29 4.66.74.32 1.31.51 1.76.65.74.24 1.41.2 1.94.12.59-.09 1.82-.74 2.08-1.46.26-.72.26-1.34.18-1.46-.08-.13-.28-.2-.59-.36Z"/>
      </svg>
    `;
  }

  if (name === 'maps') {
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>
      </svg>
    `;
  }

  return '';
}

function getPlaceById(id) {
  if (!id) return null;
  return PLACES.find((p) => String(p.id) === String(id)) ?? null;
}

let GM_SELECTED_CATEGORY = '';

function closePlaceModal() {
  const modal = $('placeModal');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
}

function openPlaceModal(place) {
  const modal = $('placeModal');
  const content = $('placeModalContent');
  if (!modal || !content || !place) return;

  const maps = openInMapsUrl(place.lat, place.lon, place.name);
  const waUrl = place.whatsapp?.phone ? buildWhatsappUrl(place.whatsapp.phone, place.whatsapp.message) : '';
  const note = place.note ? `<p class="gm-muted">${escapeHtml(place.note)}</p>` : '';
  const hours = place.hours ? `<span class="gm-chip">Horario: ${escapeHtml(place.hours)}</span>` : '';

  content.innerHTML = `
    <h3 style="margin: 0 0 0.75rem 0;">${escapeHtml(place.name)}</h3>
    <div class="gm-chips">
      <span class="gm-chip">${escapeHtml(formatCategory(place.category))}</span>
      ${hours}
    </div>
    ${note}
    <div class="gm-actions" style="margin-top: 1rem;">
      <a class="button" href="${maps}" target="_blank" rel="noreferrer">Abrir en Maps</a>
      ${waUrl ? `<a class="button primary" href="${waUrl}" target="_blank" rel="noreferrer">Enviar WhatsApp</a>` : ''}
    </div>
  `;

  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
}

function wirePlaceModal() {
  const modal = $('placeModal');
  if (!modal) return;

  $('placeModalClose')?.addEventListener('click', closePlaceModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePlaceModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlaceModal();
  });
}

function renderCategoryOptions() {
  const select = $('categorySelect');
  if (!select) return;

  const categories = Array.from(new Set(PLACES.map((p) => p.category))).sort();
  for (const c of categories) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = formatCategory(c);
    select.appendChild(opt);
  }
}

function renderCategoryButtons() {
  const host = $('categoryButtons');
  if (!host) return;

  const counts = new Map();
  for (const p of PLACES) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  const categories = Array.from(new Set(PLACES.map((p) => p.category))).sort();
  host.innerHTML = categories
    .map((c) => {
      const pressed = GM_SELECTED_CATEGORY === c ? 'true' : 'false';
      const count = counts.get(c) ?? 0;
      return `
        <button type="button" class="gm-cat-btn" data-cat="${escapeHtml(c)}" aria-pressed="${pressed}">
          <strong>${escapeHtml(formatCategory(c))}</strong>
          <span>${count} opci${count === 1 ? 'ón' : 'ones'}</span>
        </button>
      `;
    })
    .join('');
}

function renderPlaces() {
  const list = $('placesList');
  if (!list) return;

  const q = normalizeText($('searchInput')?.value ?? '');
  const catFromSelect = $('categorySelect')?.value ?? '';
  const cat = catFromSelect || GM_SELECTED_CATEGORY;

  const hint = $('placesHint');
  if (hint) {
    if (!cat && !$('categorySelect')) hint.textContent = 'Elige una categoría para mostrar la lista.';
    else hint.textContent = '';
  }

  if (!cat && !$('categorySelect')) {
    list.hidden = true;
    list.innerHTML = '';
    return;
  }

  list.hidden = false;

  const filtered = PLACES.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    const hay = normalizeText(`${p.name} ${p.note ?? ''} ${p.category}`);
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="card"><div class="card__title">Sin resultados</div><div class="card__text">Prueba otra búsqueda o categoría.</div></div>`;
    return;
  }

  list.innerHTML = filtered
    .map((p) => {
      const maps = openInMapsUrl(p.lat, p.lon, p.name);
      const note = p.note ? `<div class="card__text">${escapeHtml(p.note)}</div>` : '';
      const hours = p.hours ? `<span class="tag">Horario: ${escapeHtml(p.hours)}</span>` : '';
      const waUrl = p.whatsapp?.phone ? buildWhatsappUrl(p.whatsapp.phone, p.whatsapp.message) : '';
      const wa = waUrl
        ? `<a class="icon-btn icon-btn--wa" href="${waUrl}" target="_blank" rel="noreferrer" aria-label="Enviar WhatsApp">${iconSvg('whatsapp')}</a>`
        : '';
      const mapsBtn = `<a class="icon-btn icon-btn--maps" href="${maps}" target="_blank" rel="noreferrer" aria-label="Abrir en Maps">${iconSvg('maps')}</a>`;
      return `
        <div class="card place-card" role="button" tabindex="0" data-place-id="${escapeHtml(p.id)}" aria-label="Ver detalles">
          <div class="card__title">${escapeHtml(p.name)}</div>
          ${note}
          <div class="place__meta">
            <span class="tag">${escapeHtml(formatCategory(p.category))}</span>
            ${hours}
          </div>
          <div class="place__actions">
            ${mapsBtn}
            ${wa}
          </div>
        </div>
      `;
    })
    .join('');
}

function wirePlaceCards() {
  const list = $('placesList');
  if (!list) return;

  const shouldIgnore = (el) => {
    if (!el) return false;
    return Boolean(el.closest('a'));
  };

  list.addEventListener('click', (e) => {
    if (shouldIgnore(e.target)) return;
    const card = e.target.closest('[data-place-id]');
    if (!card) return;
    const id = card.getAttribute('data-place-id');
    const p = getPlaceById(id);
    if (!p) return;
    openPlaceModal(p);
  });

  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-place-id]');
    if (!card) return;
    e.preventDefault();
    const id = card.getAttribute('data-place-id');
    const p = getPlaceById(id);
    if (!p) return;
    openPlaceModal(p);
  });
}

async function shareMyLocation() {
  const hint = $('shareLocationHint');
  try {
    if (!navigator.geolocation) {
      if (hint) hint.textContent = 'Tu dispositivo no soporta geolocalización.';
      return;
    }

    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      });
    });

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const url = `https://maps.google.com/?q=${encodeURIComponent(lat + ',' + lon)}`;
    const text = `Mi ubicación: ${lat.toFixed(6)}, ${lon.toFixed(6)}\n${url}`;

    if (navigator.share) {
      await navigator.share({
        title: 'Mi ubicación',
        text,
        url,
      });
      if (hint) hint.textContent = 'Ubicación compartida.';
      return;
    }

    await navigator.clipboard.writeText(text);
    if (hint) hint.textContent = 'Copiado al portapapeles. Pégalo en WhatsApp/SMS.';
  } catch (e) {
    if (hint) hint.textContent = 'No se pudo obtener o compartir la ubicación.';
  }
}

function wireEvents() {
  $('searchInput')?.addEventListener('input', renderPlaces);
  $('categorySelect')?.addEventListener('change', renderPlaces);
  $('shareLocationBtn')?.addEventListener('click', shareMyLocation);
  $('copyWifiBtn')?.addEventListener('click', copyWifiToClipboard);
  $('openWifiSettingsBtn')?.addEventListener('click', openWifiSettings);
  wirePlaceModal();
  wirePlaceCards();

  const cats = $('categoryButtons');
  if (cats) {
    cats.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      const next = btn.getAttribute('data-cat') ?? '';
      GM_SELECTED_CATEGORY = GM_SELECTED_CATEGORY === next ? '' : next;
      renderCategoryButtons();
      renderPlaces();
    });
  }
}

function init() {
  renderRoomBadge();
  setWifiUi();
  initParallax();
  setWeatherMap();
  loadWeather();
  renderCategoryOptions();
  renderCategoryButtons();
  renderPlaces();
  wireEvents();
}

document.addEventListener('DOMContentLoaded', init);
