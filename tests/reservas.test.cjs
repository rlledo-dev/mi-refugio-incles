const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const headers=['Código reserva','Estado reserva','Entrada','Hora entrada','Salida','Hora salida','Número huéspedes','Fecha confirmación','Token enlace',...Array(5).fill(''), 'Huésped 1 - Nombre',...Array(40).fill(''),'Ski Locker - número'];
function parseLocal(s){let guess=Date.parse(s.replace(' ','T')+':00Z');for(let i=0;i<3;i++){const str=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Andorra',dateStyle:'short',timeStyle:'medium',hourCycle:'h23'}).format(new Date(guess));guess+=Date.parse(s.replace(' ','T')+':00Z')-Date.parse(str.replace(' ','T')+'Z')}return new Date(guess)}
function setup(options={}){const rows=[headers,Array(56).fill('')];Object.assign(rows[1],{0:'FICTICIA',1:'Confirmada',2:'2026-01-03',4:'2027-01-09',6:3,8:'a'.repeat(64),14:'Nombre de prueba',55:'737',22:'DOCUMENTO-QUE-NO-SE-DEBE-LEER'});Object.assign(rows[1],options.values);if(options.duplicate)rows.push([...rows[1]]);const reads=[];const sheet={getLastColumn:()=>56,getLastRow:()=>rows.length,getRange:(r,c,n=1,w=1)=>{reads.push([r,c,n,w]);return {getValue:()=>rows[r-1][c-1],getDisplayValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w).map(String))}}};const ctx={Date,PropertiesService:{getScriptProperties:()=>({getProperties:()=>options.backup||{}})},Utilities:{parseDate:parseLocal,formatDate:(d,t,p)=>new Intl.DateTimeFormat('sv-SE',{timeZone:t}).format(d)},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({body:s,setMimeType(){return this}})}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('reservas-apps-script.gs','utf8'),ctx);return {ctx,reads,lookup:(time,token='a'.repeat(64))=>JSON.parse(JSON.stringify(ctx.lookupGuest_(token,new Date(time))))}}
test('reserva vigente y lectura mínima sin documentos ROAT',()=>{const x=setup();const r=x.lookup('2026-11-15T12:00:00Z');assert.equal(r.ok,true);assert.equal(r.guest.lockerNumber,'737');assert.equal(r.guest.checkin,'2026-01-03');assert.equal(r.guest.people,3);assert.deepEqual(Object.keys(r.guest).sort(),['checkin','checkout','firstName','lockerId','lockerName','lockerNumber','people','wifi','wifiBackup','departureReady'].sort());assert.ok(!x.reads.some(([r,c])=>r>1&&c===23))});
test('tokens incorrectos, códigos públicos y duplicados',()=>{for(const token of ['FICTICIA','', 'b'.repeat(64),'a'.repeat(63),null])assert.deepEqual(setup().lookup('2026-11-15',token),{ok:false});assert.deepEqual(setup({duplicate:true}).lookup('2026-11-15'),{ok:false})});
test('cancelada, fechas falsas y número de personas inválido',()=>{for(const values of [{1:'Cancelada'},{2:'2026-02-30'},{2:'2028-01-01'},{6:0},{6:2.5}])assert.deepEqual(setup({values}).lookup('2026-11-15'),{ok:false})});
test('00:01 entrada, 23:59 salida y medianoche siguiente en Andorra',()=>{const x=setup({values:{2:'2026-11-15',4:'2026-11-15'}});assert.equal(x.lookup('2026-11-14T23:00:59Z').ok,false);assert.equal(x.lookup('2026-11-14T23:01:00Z').ok,true);assert.equal(x.lookup('2026-11-15T22:59:59.999Z').ok,true);assert.equal(x.lookup('2026-11-15T23:00:00Z').ok,false)});
test('cambios horario verano/invierno y días con 23/25 horas',()=>{for(const [day,start,end] of [['2026-03-29','2026-03-28T23:01Z','2026-03-29T22:00Z'],['2026-10-25','2026-10-24T22:01Z','2026-10-25T23:00Z']]){const x=setup({values:{2:day,4:day}});assert.equal(x.lookup(start).ok,true);assert.equal(x.lookup(end).ok,false)}});
test('GET y POST inválido nunca exponen datos',()=>{const x=setup();assert.equal(x.ctx.doGet({parameter:{token:'a'.repeat(64)}}).body,'{"ok":false}');assert.equal(x.ctx.doPost({postData:{contents:'malformed'}}).body,'{"ok":false}')});

test('Wi-Fi solo de estancia válida, apellido y teléfono internacional, sin datos ROAT',()=>{
 const x=setup();
 const cols={wifiSurname:16,wifiPhone:18};
 const values={16:'Tur',18:'+34999111222'};
 const sheet={getRange:(r,c)=>({getValue:()=>values[c],getDisplayValues:()=>[[values[c]]]})};
 assert.deepEqual(JSON.parse(JSON.stringify(x.ctx.bookingWifi_(sheet,2,cols))),{ssid:'Mi Refugio_Tur',password:'+34999111222',security:'WPA'});
 for(const phone of ['999111222','', '+0034999111222']){values[18]=phone;assert.equal(x.ctx.bookingWifi_(sheet,2,cols),null)}
 values[18]='+34 999 111 222';values[16]='Á'.repeat(20);assert.equal(x.ctx.bookingWifi_(sheet,2,cols),null);
 values[16]='Tur';assert.equal(x.ctx.bookingWifi_(sheet,2,cols).password,'+34999111222');
});

test('salida visible desde las 17:00 del día anterior, con horario de Andorra',()=>{
 for(const [checkout,before,at] of [['2026-11-16','2026-11-15T15:59:59Z','2026-11-15T16:00:00Z'],['2026-07-02','2026-07-01T14:59:59Z','2026-07-01T15:00:00Z']]){
  const x=setup({values:{2:'2026-01-03',4:checkout}});
  assert.equal(x.lookup(before).guest.departureReady,false);assert.equal(x.lookup(at).guest.departureReady,true);
 }
});


test('Wi-Fi respaldo: propiedades privadas solo en reserva válida; no se consultan con token denegado',()=>{
 const backup={WIFI_BACKUP_SSID:'Respaldo ficticio',WIFI_BACKUP_USERNAME:'usuario-prueba',WIFI_BACKUP_PASSWORD:'clave-ficticia'};
 const x=setup({backup});
 assert.deepEqual(x.lookup('2026-11-18').guest.wifiBackup,{ssid:'Respaldo ficticio',username:'usuario-prueba',password:'clave-ficticia'});
 assert.deepEqual(x.lookup('2026-11-18','b'.repeat(64)),{ok:false});
 assert.deepEqual(x.lookup('2028-01-01'),{ok:false});
 assert.deepEqual(setup({backup,values:{1:'Cancelada'}}).lookup('2026-11-18'),{ok:false});
 assert.equal(setup().lookup('2026-11-18').guest.wifiBackup,null);
});
