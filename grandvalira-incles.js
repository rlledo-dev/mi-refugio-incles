'use strict';

const reportLine = document.getElementById('report');
const mapElement = document.getElementById('map');
const locationOfRefuge = [42.58060437357728, 1.6607585617258758];
const source = 'https://www.grandvalira.com/es/estacion/estado-pistas';

function initializeMap() {
  const map = L.map(mapElement, { scrollWheelZoom: 'center' });
  const overview = () => map.fitBounds([[42.541, 1.631], [42.583, 1.687]], {padding: [12, 12]});
  overview();
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.openskidata.org/">OpenSkiData</a>'
  }).addTo(map);

  const accommodation = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = 'Mi Refugio en Incles';
  const photo = document.createElement('img');
  photo.src = './apartamento.jpg';
  photo.alt = 'Mi Refugio en Incles';
  photo.className = 'photo';
  accommodation.append(title, photo);
  const marker = L.marker(locationOfRefuge, {
    title: title.textContent,
    alt: title.textContent,
    zIndexOffset: 1000,
    icon: L.icon({iconUrl: './icon.svg', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17]})
  }).addTo(map).bindPopup(accommodation);

  document.getElementById('locate').onclick = () => {
    map.setView(locationOfRefuge, 16);
    marker.openPopup();
  };
  document.getElementById('overview').onclick = overview;
  document.getElementById('expand').onclick = async () => {
    try {
      if (!mapElement.requestFullscreen) throw new Error('Pantalla completa no disponible');
      await mapElement.requestFullscreen();
    } catch {
      // Safari en iPhone puede abrir la vista independiente a tamaño de página.
      if (window.self !== window.top) window.open(location.href, '_blank', 'noopener');
      else mapElement.scrollIntoView({block: 'start'});
    }
  };
  document.addEventListener('fullscreenchange', () => map.invalidateSize());

  const load = async path => {
    const response = await fetch(path, {cache: 'no-store'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  };
  return Promise.all([
    load('./datos/grandvalira-incles.geojson'),
    load('./datos/estado-pistas.json').catch(() => null)
  ]).then(([tracks, report]) => {
    const timestamp = Date.parse(report?.source_last_updated);
    const age = Date.now() - timestamp;
    const currentReport = report?.live && age >= 0 && age <= 36 * 3600000;
    const partDate = Number.isFinite(timestamp) ? new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Andorra'
    }).format(timestamp) : '';
    const key = ({kind, sector, name, category}) => JSON.stringify([kind, sector, name, category]);
    const items = new Map();
    for (const item of currentReport ? report.items ?? [] : []) {
      const id = key(item);
      items.set(id, items.has(id) ? null : item);
    }
    const getStatus = feature => feature.properties.official && items.get(key(feature.properties.official))?.status;
    const statusColor = status => {
      if (['Abierto', 'Abierta'].includes(status)) return '#087047';
      if (['Cerrado', 'Cerrada'].includes(status)) return '#ad2439';
      return status ? '#a66000' : '#536674';
    };
    L.geoJSON(tracks, {
      style(feature) {
        const lift = feature.properties.kind === 'lift';
        return {color: statusColor(getStatus(feature)), weight: lift ? 4 : 3, opacity: 0.9, dashArray: lift ? '7 5' : null};
      },
      onEachFeature(feature, layer) {
        const {name, kind, official} = feature.properties;
        const label = kind === 'run' ? 'Pista' : 'Remonte';
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = official?.name || name || label;
        const detail = document.createElement('p');
        const status = getStatus(feature);
        detail.textContent = status ? label + ' · ' + status + ' · ' + partDate : label + ' · Estado sin confirmar';
        popup.append(title, detail);
        layer.bindPopup(popup);
      }
    }).addTo(map);
    const link = document.createElement('a');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Consultar parte oficial';
    reportLine.replaceChildren(
      currentReport && items.size ? 'Parte oficial del ' + partDate + '. ' :
      'Estado individual sin confirmar' + (partDate ? ' · Último parte ' + partDate : '') + '. ',
      link
    );
  });
}

if (typeof L === 'undefined') reportLine.textContent = 'No se pudo cargar el visor.';
else initializeMap().catch(() => { reportLine.textContent = 'No se pudieron cargar los trazados.'; });
