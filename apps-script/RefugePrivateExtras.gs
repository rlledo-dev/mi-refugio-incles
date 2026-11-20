/** eSIM privada: invocar solo con la fila resuelta por el token ya autorizado.
 * No lee datos ROAT, no modifica reservas y no interviene en la WiFi.
 */
function refugeAddPrivateExtras_(sheet, rowNumber, guest) {
  if (!sheet || !guest || !Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
    throw new Error('Reserva no validada');
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const read = name => {
    const index = headers.indexOf(name);
    if (index < 0 || headers.lastIndexOf(name) !== index) return '';
    return String(sheet.getRange(rowNumber, index + 1).getDisplayValues()[0][0] || '').trim();
  };
  const status = read('eSIM - Estado');
  // Las ofertas se resuelven exclusivamente desde la misma fila que ya ha
  // autorizado el token. Un JSON ausente o incorrecto nunca bloquea la reserva.
  guest.extras = refugeValidatedOffers_(read('Extras - Ofertas JSON'));
  // CODETEST puede mostrar la misma demostración que la vista pública.
  // Solo se devuelve una marca de demo; ningún secreto ni enlace activable.
  if (read('Código reserva') === 'CODETEST' && /demo|fictici|prueba|simulaci/i.test(status)) {
    guest.esim = {status:'DEMO'};
    return guest;
  }
  if (!/^(asignada|asignado|lista para entrega|entregada|activa)$/i.test(status)) return guest;
  const record = {
    status,
    provider: read('eSIM - Proveedor') || 'Airalo',
    dataAmount: read('eSIM - Datos'),
    duration: read('eSIM - Duración'),
    installationUrl: read('eSIM - Enlace instalación'),
    smdpAddress: read('eSIM - SM-DP+'),
    activationCode: read('eSIM - Código activación'),
    iccid: read('eSIM - ICCID')
  };
  const esim = refugeValidatedEsim_(record);
  if (esim) guest.esim = esim;
  return guest;
}

function refugeValidatedOffers_(raw) {
  if (!raw) return [];
  let source;
  try { source = JSON.parse(raw); } catch (_) { return []; }
  if (!Array.isArray(source) || source.length > 20) return [];
  const clean = [];
  const text = (value, max) => {
    if (typeof value !== 'string') return '';
    const result = value.trim();
    return result && result.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(result) ? result : '';
  };
  for (const item of source) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const status = text(item.status, 40).toLowerCase();
    if (!['ofertado','pendiente de confirmación','pendiente de confirmacion','confirmado','cancelado'].includes(status)) continue;
    const title = text(item.title, 120), dates = text(item.dates, 120), participants = text(item.participants || item.quantity, 160);
    if (!title || !dates || !participants) continue;
    const result = {title, dates, participants, status};
    const notes = text(item.notes, 600);
    if (notes) result.notes = notes;
    if (typeof item.price === 'number' && isFinite(item.price) && item.price >= 0 && item.price <= 100000) result.price = item.price;
    if (Array.isArray(item.items) && item.items.length <= 12) {
      const items = item.items.map(value => text(value, 240)).filter(Boolean);
      if (items.length) result.items = items;
    }
    clean.push(result);
  }
  return clean;
}

/** Valida formato y aprobación del propietario; no contacta ni activa Airalo. */
function refugeValidatedEsim_(data) {
  if (!/^(asignada|asignado|lista para entrega|entregada|activa)$/i.test(data.status || '')) return null;
  const limits = {status:40,provider:80,dataAmount:80,duration:80,installationUrl:2048,smdpAddress:255,activationCode:255,iccid:64};
  for (const key in limits) {
    if (typeof data[key] !== 'string' || data[key].length > limits[key] || /[\x00-\x1f\x7f]/.test(data[key])) return null;
  }
  if (!/^Airalo$/i.test(data.provider)) return null;
  // Una etiqueta ficticia en cualquier campo impide toda entrega.
  if (Object.keys(limits).some(key => /demo|fictici|prueba|simulaci|example|\.invalid\b/i.test(data[key]))) return null;
  const url = data.installationUrl;
  // Apps Script no dispone de URL: usar una lista estricta de hosts HTTPS.
  if (url && !/^https:\/\/(?:[a-z0-9-]+\.)*airalo\.(?:com|io)(?:[/?#][^\s\\]*)?$/i.test(url)) return null;
  const smdp = data.smdpAddress, activation = data.activationCode;
  const validHost = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(smdp) && !/\.(invalid|example|test|localhost)$/i.test(smdp);
  const manualReady = validHost && /^[A-Za-z0-9_-]{1,255}$/.test(activation);
  if ((smdp || activation) && !manualReady) return null;
  if (!url && !manualReady) return null;
  if (data.iccid && !/^\d{18,22}$/.test(data.iccid)) return null;
  return data;
}
