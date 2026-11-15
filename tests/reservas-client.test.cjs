const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');const start=html.indexOf('// La URL /exec es pública');const end=html.indexOf('function skiLockerView(',start);const code=html.slice(start,end).replace(/const REFUGE_RESERVATION_API='[^']*';/,"const REFUGE_RESERVATION_API='https://script.google.com/macros/s/FICTICIO/exec';");
function setup(query='?reserva='+'a'.repeat(64),elements={}){
const removed=[],timers=new Map(),calls=[],listeners={};let id=0;const nodes=[];const target={prepend:e=>nodes.push(e)};
const doc={hidden:false,body:{style:{}},getElementById:id=>elements[id]||null,addEventListener:(n,cb)=>listeners[n]=cb,querySelector:s=>s.includes(' .content')?target:null,querySelectorAll:s=>s==='.guest-welcome'?nodes.splice(0):[],createElement:()=>({append(){},remove(){},className:'',textContent:''})};
const context={TextEncoder,URLSearchParams,AbortController,performance:{now:()=>100},location:{search:query},localStorage:{removeItem:k=>removed.push(k),getItem:()=>{throw Error('No debe recuperar un token guardado')}},document:doc,window:{addEventListener:(n,cb)=>listeners[n]=cb},setTimeout:(cb,ms)=>{timers.set(++id,{cb,ms});return id},clearTimeout:id=>timers.delete(id),fetch:async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>context.response}},response:{ok:false},skiLockerView:()=>{}};
vm.createContext(context);vm.runInContext(code,context);return {context,timers,calls,removed,listeners,guest:()=>vm.runInContext('refugeGuest',context),load:()=>context.loadRefugeGuest()};}
const valid=()=>({ok:true,serverNow:10000,expiresAt:15000,guest:{firstName:'Prueba',checkin:'2026-11-15',checkout:'2026-11-15',people:3,lockerId:'sport-calbo-panini',lockerName:'Sport Calbó Panini',lockerNumber:'737'}});
test('token solo en POST no-store, sin cookies, URL ni almacenamiento',async()=>{const x=setup();x.context.response=valid();await x.load();assert.equal(x.guest().lockerNumber,'737');assert.ok(x.removed.includes('refuge-reservation-token'));const {url,init}=x.calls[0];assert.ok(!url.includes('token'));assert.equal(init.method,'POST');assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.referrerPolicy,'no-referrer');assert.deepEqual(JSON.parse(init.body),{token:'a'.repeat(64)})});
test('sin token y código público: no recupera credencial antigua ni consulta',async()=>{for(const query of ['', '?reserva=CODETEST']){const x=setup(query);await x.load();assert.equal(x.calls.length,0);assert.equal(x.guest(),null)}});
test('una denegación posterior retira una reserva previamente visible',async()=>{const x=setup();x.context.response=valid();await x.load();assert.ok(x.guest());x.context.response={ok:false};await x.load();assert.equal(x.guest(),null)});
test('caducidad enviada por el servidor borra datos aunque no haya otra consulta',async()=>{const x=setup();x.context.response=valid();await x.load();const expiry=[...x.timers.values()].find(t=>t.ms===5000);assert.ok(expiry);expiry.cb();assert.equal(x.guest(),null)});
test('al ocultar o abandonar se borran datos; respuestas con campos inválidos se rechazan',async()=>{const x=setup();x.context.response=valid();await x.load();x.context.document.hidden=true;x.listeners.visibilitychange();assert.equal(x.guest(),null);for(const change of [{lockerId:'inexistente'},{people:0},{firstName:null}]){const y=setup();y.context.response=valid();Object.assign(y.context.response.guest,change);await y.load();assert.equal(y.guest(),null)}});

test('tarjeta de recogida: datos de reserva, revalidación sin cierre y borrado al revocar',async()=>{const number={textContent:''},guest={textContent:''};const pass={open:false,addEventListener(){},showModal(){this.open=true},close(){this.open=false}};const x=setup('?reserva='+'a'.repeat(64),{lockerPass:pass,lockerPassNumber:number,lockerPassGuest:guest});x.context.response=valid();await x.load();x.context.openLockerPass();assert.equal(pass.open,true);assert.equal(number.textContent,'737');assert.equal(guest.textContent,'Prueba');await x.load();assert.equal(pass.open,true);x.context.response={ok:false};await x.load();assert.equal(pass.open,false);assert.equal(number.textContent,'');assert.equal(guest.textContent,'')});

test('Wi-Fi: QR escapado, datos privados borrados tras denegación y caducidad',async()=>{
 const box={children:[],replaceChildren(){this.children=[]},append(e){this.children.push(e)}};
 const x=setup('?reserva='+'a'.repeat(64),{refugeWifi:box});x.context.response=valid();
 x.context.response.guest.wifi={ssid:'Mi Refugio_Tur',password:'+34999111222',security:'WPA'};
 await x.load();assert.equal(box.children[0].className,'wifi-field');
 assert.equal(x.context.wifiQrPayload(x.guest().wifi),'WIFI:T:WPA;S:Mi Refugio_Tur;P:+34999111222;;');
 assert.equal(x.context.wifiQrPayload({ssid:'Mi Refugio_A;B',password:'+34999111222'}),'WIFI:T:WPA;S:Mi Refugio_A\\;B;P:+34999111222;;');
 x.context.response={ok:false};await x.load();assert.equal(box.children.length,1);assert.ok(!box.children[0].textContent.includes('+34'));
});

test('llegada y parking requieren reserva; salida requiere permiso del servidor; revocación borra todo',async()=>{
 const node=()=>({innerHTML:'',hidden:false,replaceChildren(){this.innerHTML=''}});
 const arrival=node(),parking=node(),departure=node(),card=node();
 const x=setup('?reserva='+'a'.repeat(64),{refugeArrival:arrival,refugeParking:parking,refugeDeparture:departure,departureCard:card});
 x.context.REFUGE_LOCATION=[42.58,1.66];
 x.context.response=valid();x.context.response.guest.departureReady=false;await x.load();
 assert.match(arrival.innerHTML,/Principat Park/);assert.match(parking.innerHTML,/61/);assert.equal(card.hidden,true);assert.equal(departure.innerHTML,'');
 x.context.response.guest.departureReady=true;await x.load();assert.equal(card.hidden,false);assert.match(departure.innerHTML,/10:00/);assert.match(departure.innerHTML,/calefacción/);
 x.context.response={ok:false};await x.load();assert.equal(card.hidden,true);assert.equal(departure.innerHTML,'');assert.ok(!arrival.innerHTML.includes('4º'));assert.ok(!parking.innerHTML.includes('61'));
});

test('revalidación y caducidad no reabren el locker al estar en inicio, estancia o explorar',async()=>{
 for(const panel of ['home','stay','explore']){
  let reopened=0;const x=setup('?reserva='+'a'.repeat(64),{skiLockerMap:{},detail:{classList:{contains:()=>false}}});
  x.context.skiLockerView=()=>{reopened++};x.context.response=valid();
  await x.load();const refresh=[...x.timers.values()].find(t=>t.ms===30000);await refresh.cb();
  assert.equal(reopened,0,panel);assert.ok(x.guest());
  [...x.timers.values()].find(t=>t.ms===5000).cb();assert.equal(reopened,0,panel);assert.equal(x.guest(),null);
 }
});
test('el locker visible se actualiza sin solicitar navegación',async()=>{
 const navigations=[];const x=setup('?reserva='+'a'.repeat(64),{skiLockerMap:{},detail:{classList:{contains:c=>c==='active'}}});
 x.context.skiLockerView=navigate=>navigations.push(navigate);x.context.response=valid();await x.load();await x.load();
 assert.deepEqual(navigations,[false,false]);
});
