/** Mi Refugio en Incles: solo datos de estancia, nunca campos ROAT. */
const CONFIG = Object.freeze({
  spreadsheetId: '1L1pTnkNUy0tmycRaY9yj3FeoMSrRmaxDr2CSvzC-TD0',
  sheetName: 'Reservas',
  timezone: 'Europe/Andorra',
  defaultLocker: 'sport-calbo-panini',
  lockerNames: Object.freeze({'sport-calbo-panini': 'Sport Calbó Panini'})
});
// GET nunca devuelve reservas: los tokens se envían en el cuerpo de un POST.
function doGet() { return jsonOutput_({ok:false}); }
function doPost(e) {
  try {
    const body=JSON.parse(String(e && e.postData && e.postData.contents || '{}'));
    return jsonOutput_(lookupGuest_(body.token));
  } catch (_) { return jsonOutput_({ok:false}); }
}
function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function bookingSheet_() {
  const sheet=SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName);
  if(!sheet)throw Error('Configuración de reservas no disponible');
  return sheet;
}
function bookingColumns_(sheet) {
  const names=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  const required=['Código reserva','Estado reserva','Entrada','Salida','Número huéspedes','Token enlace','Huésped 1 - Nombre','Ski Locker - número'];
  const cols={};
  required.forEach(name=>{const ix=names.indexOf(name);if(ix<0 || names.lastIndexOf(name)!==ix)throw Error('Revisar columnas de reservas');cols[name]=ix+1;});
  cols.wifiSurname=names.indexOf('Huésped 1 - Primer apellido')+1;
  cols.wifiPhone=names.indexOf('Huésped 1 - Teléfono')+1;
  cols.locker=names.indexOf('Ski Locker - establecimiento')+1;
  return cols;
}
function lookupGuest_(token, now) {
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return {ok:false};
  const sheet=bookingSheet_(),cols=bookingColumns_(sheet),last=sheet.getLastRow();
  if(last<2)return {ok:false};
  // Solo se lee la columna de tokens; no se carga la tabla de documentos ROAT.
  const tokens=sheet.getRange(2,cols['Token enlace'],last-1,1).getDisplayValues();
  const matches=[];
  tokens.forEach((r,i)=>{if(String(r[0]).trim()===token)matches.push(i+2);});
  if(matches.length!==1)return {ok:false};
  const row=matches[0],read=name=>sheet.getRange(row,cols[name]).getValue();
  const status=String(read('Estado reserva')).trim().toLowerCase();
  if(!['confirmada','confirmado'].includes(status))return {ok:false};
  const checkin=normaliseDate_(read('Entrada')),checkout=normaliseDate_(read('Salida'));
  if(!checkin||!checkout||checkout<checkin)return {ok:false};
  const startsAt=Utilities.parseDate(checkin+' 00:01',CONFIG.timezone,'yyyy-MM-dd HH:mm').getTime();
  const nextDay=new Date(checkout+'T00:00:00Z');nextDay.setUTCDate(nextDay.getUTCDate()+1);
  const expiresAt=Utilities.parseDate(nextDay.toISOString().slice(0,10)+' 00:00',CONFIG.timezone,'yyyy-MM-dd HH:mm').getTime();
  const serverNow=(now || new Date()).getTime();
  if(serverNow<startsAt||serverNow>=expiresAt)return {ok:false};
  const previousDay=new Date(checkout+'T00:00:00Z');previousDay.setUTCDate(previousDay.getUTCDate()-1);
  const departureOpensAt=Utilities.parseDate(previousDay.toISOString().slice(0,10)+' 17:00',CONFIG.timezone,'yyyy-MM-dd HH:mm').getTime();
  const people=Number(read('Número huéspedes'));
  if(!Number.isInteger(people)||people<1||people>20)return {ok:false};
  const lockerId=cols.locker?String(sheet.getRange(row,cols.locker).getValue()||CONFIG.defaultLocker).trim():CONFIG.defaultLocker;
  if(!Object.prototype.hasOwnProperty.call(CONFIG.lockerNames,lockerId))return {ok:false};
  return {ok:true,serverNow,expiresAt,guest:{
    departureReady:serverNow>=departureOpensAt,
    wifi:bookingWifi_(sheet,row,cols),
    firstName:String(read('Huésped 1 - Nombre')||'').trim().slice(0,80),
    checkin,checkout,people,lockerId,lockerName:CONFIG.lockerNames[lockerId],
    lockerNumber:String(read('Ski Locker - número')||'').trim().slice(0,40)
  }};
}
// Se calcula después de validar token, estado y fechas. Nunca se devuelve el teléfono por separado.
function bookingWifi_(sheet,row,cols){
  if(!cols.wifiSurname||!cols.wifiPhone)return null;
  const surname=String(sheet.getRange(row,cols.wifiSurname).getValue()||'').trim();
  const password=String(sheet.getRange(row,cols.wifiPhone).getDisplayValues()[0][0]||'').trim().replace(/[\s()-]/g,'');
  const ssid='Mi Refugio_'+surname;
  // Un SSID admite 32 bytes; no truncar porque dejaría de coincidir con Deco.
  const bytes=encodeURIComponent(ssid).replace(/%[A-F\d]{2}/gi,'x').length;
  if(!surname||bytes>32||/[\x00-\x1f\x7f]/.test(surname)||!/^\+[1-9]\d{7,14}$/.test(password))return null;
  return {ssid,password,security:'WPA'};
}
function normaliseDate_(value) {
  if(value instanceof Date && Number.isFinite(value.getTime()))return Utilities.formatDate(value,CONFIG.timezone,'yyyy-MM-dd');
  let s=String(value||'').trim();
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m)s=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
  const d=new Date(s+'T00:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:'';
}
function newToken_(){return (Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toLowerCase();}
/** Solo el propietario. Conserva todos los tokens existentes. */
function issueMissingTokens() {
  const sheet=bookingSheet_(),cols=bookingColumns_(sheet),lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    for(let row=2;row<=sheet.getLastRow();row++){
      if(sheet.getRange(row,cols['Código reserva']).getValue()&&!String(sheet.getRange(row,cols['Token enlace']).getValue()).trim())sheet.getRange(row,cols['Token enlace']).setValue(newToken_());
    }
  } finally {lock.releaseLock();}
}
/** Menú privado: genera/recupera SOLO el enlace de la fila seleccionada. */
function onOpen(){SpreadsheetApp.getUi().createMenu('Mi Refugio').addItem('Enlace privado de la reserva seleccionada','showSelectedBookingLink').addToUi();}
function showSelectedBookingLink(){
  const sheet=SpreadsheetApp.getActiveSheet();
  if(!sheet||sheet.getName()!==CONFIG.sheetName)throw Error('Selecciona una reserva en la pestaña Reservas');
  const row=sheet.getActiveRange().getRow(),cols=bookingColumns_(sheet);
  if(row<2||!sheet.getRange(row,cols['Código reserva']).getValue())throw Error('Selecciona una fila de reserva');
  let token=String(sheet.getRange(row,cols['Token enlace']).getValue()||'').trim();
  if(token&&!/^[a-f0-9]{64}$/.test(token))throw Error('El token existente no es válido; revísalo antes de reemplazarlo');
  if(!token){token=newToken_();sheet.getRange(row,cols['Token enlace']).setValue(token);}
  SpreadsheetApp.getUi().alert('Enlace privado del huésped','https://rlledo-dev.github.io/mi-refugio-incles/?reserva='+token,SpreadsheetApp.getUi().ButtonSet.OK);
}
/** Solo propietario; revoca el enlace anterior, nunca se llama desde doPost. */
function revokeAndReplaceToken(bookingCode){
  const sheet=bookingSheet_(),cols=bookingColumns_(sheet);
  const codes=sheet.getRange(2,cols['Código reserva'],Math.max(1,sheet.getLastRow()-1),1).getDisplayValues();
  const matches=[];codes.forEach((r,i)=>{if(r[0]===bookingCode)matches.push(i+2);});
  if(matches.length!==1)throw Error('Reserva no encontrada o duplicada');
  const token=newToken_();sheet.getRange(matches[0],cols['Token enlace']).setValue(token);return token;
}
