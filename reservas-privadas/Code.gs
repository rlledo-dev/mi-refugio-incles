/**
 * Mi Refugio en Incles - prototipo de acceso privado (Google Apps Script).
 * Crear un proyecto Apps Script vinculado a la hoja privada y pegar este archivo.
 * No publicar datos de reservas ni credenciales en GitHub.
 * Requiere implementación de consentimiento y recogida ROAT antes de producción.
 */
const CONFIG = Object.freeze({
  SHEET: 'Reservas',
  CODE: 0, STATUS: 1, ARRIVAL: 2, DEPARTURE: 4, TOKEN: 8,
  GUEST_NAME: 14, GUEST_LASTNAME: 15, GUEST_LASTNAME2: 16
});
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mi Refugio')
    .addItem('Crear enlace de prueba (fila seleccionada)', 'crearEnlacePrueba')
    .addToUi();
}
function sha256_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return bytes.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function crearEnlacePrueba() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET);
  const row = sheet.getActiveCell().getRow();
  if (row < 2) throw new Error('Selecciona una celda de la fila de la reserva.');
  const code = String(sheet.getRange(row, CONFIG.CODE + 1).getValue()).trim();
  if (!code) throw new Error('La fila no tiene código de reserva.');
  const existing = String(sheet.getRange(row, CONFIG.TOKEN + 1).getValue()).trim();
  if (existing) throw new Error('Ya hay un token: revócalo manualmente antes de crear otro.');
  const raw = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  sheet.getRange(row, CONFIG.TOKEN + 1).setValue(sha256_(raw));
  const base = ScriptApp.getService().getUrl();
  if (!base) throw new Error('Publica primero el despliegue de la aplicación web.');
  const link = base + '?t=' + encodeURIComponent(raw);
  const html = HtmlService.createHtmlOutput(
    '<p>Enlace privado de prueba (cópialo ahora, no se almacena en claro):</p>' +
    '<textarea style="width:100%;height:110px" readonly>' + escapeHtml_(link) + '</textarea>' +
    '<p>Este enlace da acceso a los datos limitados de esa reserva. No lo reenvíes a terceros.</p>'
  ).setWidth(520).setHeight(240);
  SpreadsheetApp.getUi().showModalDialog(html, 'Enlace privado');
}
function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[ch]);
}
function doGet(e) {
  const token = e && e.parameter && e.parameter.t;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return page_('Enlace no válido', 'Comprueba el enlace recibido.');
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET);
  const rows = sheet.getDataRange().getValues();
  const digest = sha256_(token);
  let match = null;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][CONFIG.TOKEN]).trim() === digest) { match = rows[i]; break; }
  }
  if (!match) return page_('Enlace no válido', 'El enlace ha caducado o ha sido revocado.');
  if (String(match[CONFIG.STATUS]).toLowerCase().includes('cancel')) {
    return page_('Reserva cancelada', 'Contacta con el alojamiento.');
  }
  const guest = [match[CONFIG.GUEST_NAME], match[CONFIG.GUEST_LASTNAME],
    match[CONFIG.GUEST_LASTNAME2]].filter(Boolean).join(' ');
  const tz = 'Europe/Andorra';
  const fmt = v => v instanceof Date ? Utilities.formatDate(v, tz, 'dd/MM/yyyy') : String(v || '');
  return page_('Tu estancia en Mi Refugio en Incles',
    '<p>Hola, ' + escapeHtml_(guest || 'huésped') + '.</p>' +
    '<p><strong>Entrada:</strong> ' + escapeHtml_(fmt(match[CONFIG.ARRIVAL])) + '</p>' +
    '<p><strong>Salida:</strong> ' + escapeHtml_(fmt(match[CONFIG.DEPARTURE])) + '</p>' +
    '<p>Próximamente podrás completar los datos del registro turístico de forma segura.</p>');
}
function page_(title, content) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="referrer" content="no-referrer"><title>' + escapeHtml_(title) + '</title>' +
    '<style>body{font:16px system-ui;background:#eef3f4;color:#173342;margin:0;padding:30px}' +
    'main{max-width:520px;background:white;padding:26px;border-radius:18px;margin:auto}</style></head>' +
    '<body><main><h1>' + escapeHtml_(title) + '</h1>' + content + '</main></body></html>'
  ).setTitle(title).addMetaTag('viewport', 'width=device-width,initial-scale=1');
}
