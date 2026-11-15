/**
 * Mi Refugio en Incles — API privada de reservas.
 * Crear un proyecto de Apps Script desde la hoja PRIVADA de reservas y pegar este código.
 * Desplegar como aplicación web: ejecutar como propietario; acceso "Cualquier usuario".
 * Solo expone nombre de pila, fechas, personas, nombre de local y número de taquilla
 * cuando el token secreto está vigente. Nunca expone datos ROAT.
 */
const CONFIG = Object.freeze({
  sheetName: 'Reservas',
  timezone: 'Europe/Andorra',
  skiLockerName: 'Sport Calbó Panini'
});
function doGet(e) {
  const token = String((e && e.parameter && e.parameter.token) || '');
  const output = lookupGuest_(token);
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
function lookupGuest_(token) {
  if (!/^[a-f0-9]{64}$/.test(token)) return {ok:false,reason:'invalid'};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if (!sheet) return {ok:false,reason:'unavailable'};
  const rows = sheet.getDataRange().getDisplayValues();
  const today = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd');
  for (let i=1; i<rows.length; i++) {
    const r=rows[i];
    if (String(r[8]).trim()!==token) continue;
    const status=String(r[1]).trim().toLowerCase();
    const checkin=normaliseDate_(r[2]);
    const checkout=normaliseDate_(r[4]);
    if (!['confirmada','confirmado'].includes(status) || !checkin || !checkout || today<checkin || today>checkout)
      return {ok:false,reason:'expired'};
    // Fecha del día de entrada: visible desde 00:01 hora local de Andorra.
    const minute=Utilities.formatDate(new Date(),CONFIG.timezone,'HH:mm');
    if(today===checkin && minute<'00:01')return {ok:false,reason:'not_started'};
    return {ok:true,guest:{
      firstName:String(r[14]||'').trim().slice(0,80),
      checkin,checkout,
      people:Math.max(1,Math.min(20,Number(r[6])||1)),
      lockerName:CONFIG.skiLockerName,
      lockerNumber:String(r[55]||'').trim().slice(0,40)
    }};
  }
  return {ok:false,reason:'invalid'};
}
function normaliseDate_(v) {
  const s=String(v||'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0') : '';
}
/** Ejecutar UNA vez para crear tokens aleatorios criptográficos en I (solo donde falten). */
function issueMissingTokens() {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if(!sheet)throw Error('No existe la pestaña Reservas');
  const last=sheet.getLastRow();
  if(last<2)return;
  const rows=sheet.getRange(2,1,last-1,9).getDisplayValues();
  rows.forEach((r,i)=>{
    if(r[0] && !String(r[8]).trim()) {
      // Dos UUID v4 independientes aportan 244 bits aleatorios aproximadamente.
      const token=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toLowerCase();
      sheet.getRange(i+2,9).setValue(token);
    }
  });
}
/** Opcional: reemitir token para revocar un enlace, usando el código interno de reserva. */
function revokeAndReplaceToken(bookingCode) {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  const rows=sheet.getRange(2,1,Math.max(1,sheet.getLastRow()-1),1).getDisplayValues();
  const ix=rows.findIndex(r=>r[0]===bookingCode);
  if(ix<0)throw Error('Reserva no encontrada');
  const token=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toLowerCase();
  sheet.getRange(ix+2,9).setValue(token);
  return token;
}
