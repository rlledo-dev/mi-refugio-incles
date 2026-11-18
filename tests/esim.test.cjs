const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const keys=['Código reserva','Estado reserva','Entrada','Salida','Número huéspedes','Token enlace','Huésped 1 - Nombre','Ski Locker - número','ROAT_SECRET','eSIM - Estado','eSIM - Proveedor','eSIM - Datos','eSIM - Duración','eSIM - Enlace instalación','eSIM - ICCID','eSIM - SM-DP+','eSIM - Código activación'];
const sample=()=>({status:'Asignada',provider:'Airalo',dataAmount:'1 GB',duration:'7 días',installationUrl:'https://www.airalo.com/esim/install/fixture',smdpAddress:'smdp.fixture.net',activationCode:'A1B2C3D4E5F6G7H8',iccid:'8900000000000000000'});
function setup(){
 const rows=[keys],reads=[];
 for(let i=0;i<2;i++)rows.push(['RESERVA-'+i,'Confirmada','2026-01-03','2027-01-09',3,(i?'b':'a').repeat(64),'Persona '+i,'737','NO LEER','Asignada','Airalo','1 GB','7 días','https://www.airalo.com/esim/install/fixture-'+i,'890000000000000000'+i,'smdp.fixture.net','A1B2C3D4E5F6G7H'+i]);
 const sheet={getLastRow:()=>rows.length,getLastColumn:()=>keys.length,getRange:(r,c,n=1,w=1)=>{reads.push([r,c,n,w]);return{getValue:()=>rows[r-1][c-1],getDisplayValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w).map(String))}}};
 const ctx={Date,PropertiesService:{getScriptProperties:()=>({getProperties:()=>({})})},Utilities:{parseDate:s=>new Date(s.replace(' ','T')+':00Z')},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({body:s,setMimeType(){return this}})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('reservas-apps-script.gs','utf8')+'\n'+fs.readFileSync('apps-script/RefugePrivateExtras.gs','utf8'),ctx);
 return {ctx,rows,reads,lookup:token=>JSON.parse(JSON.stringify(ctx.lookupGuest_(token,new Date('2026-11-18T12:00Z'))))};
}
test('eSIM: entrega únicamente los ocho campos de instalación de la fila autorizada',()=>{
 const x=setup();for(const [i,token] of ['a'.repeat(64),'b'.repeat(64)].entries()){
 const r=x.lookup(token);assert.equal(r.ok,true);assert.equal(r.guest.esim.activationCode,'A1B2C3D4E5F6G7H'+i);assert.equal(r.guest.esim.iccid,'890000000000000000'+i);assert.equal(Object.keys(r.guest.esim).length,8);
 }
 assert.ok(!x.reads.some(([r,c,n,w])=>r>1&&c<=9&&c+w>9));
});
test('eSIM: tokens denegados, duplicados, reservas canceladas o fuera de fecha no leen campos de instalación',()=>{
 for(const change of [x=>{},x=>x.rows[2][5]='a'.repeat(64),x=>x.rows[1][1]='Cancelada',x=>x.rows[1][2]='2028-01-01']){
 const x=setup();change(x);const token=x.rows[1][1]==='Cancelada'||x.rows[1][2]==='2028-01-01'||x.rows[1][5]===x.rows[2][5]?'a'.repeat(64):'c'.repeat(64);assert.deepEqual(x.lookup(token),{ok:false});assert.ok(!x.reads.some(([r,c])=>r>1&&c>=10));
 }
});
test('eSIM: sin asignación, demo y CODETEST conservan reserva pero no entregan códigos',()=>{
 for(const mutate of [r=>r[9]='Pendiente',r=>r[9]='',r=>r[9]='DEMO - LISTA PARA ENTREGA',r=>r[15]='demo.invalid',r=>r[16]='DEMO-CODIGO-NO-VALIDO']){
 const x=setup();mutate(x.rows[1]);const r=x.lookup('a'.repeat(64));assert.equal(r.ok,true);assert.equal(r.guest.esim,undefined);
 }
});
test('eSIM: valida enlace HTTPS Airalo, host SM-DP+, activación e ICCID sin truncar secretos',()=>{
 const x=setup();assert.ok(x.ctx.refugeValidatedEsim_(sample()));
 for(const change of [{installationUrl:'https://airalo.com.evil.net/install'},{installationUrl:'https://airalo.com@evil.net/'},{installationUrl:'http://airalo.com/install'},{installationUrl:'javascript:alert(1)'},{smdpAddress:'demo.invalid'},{smdpAddress:'x$evil.net'},{activationCode:'code$injected'},{activationCode:'x'.repeat(256)},{iccid:'8900.123'},{status:'Revocada'},{duration:'simulación'}])assert.equal(x.ctx.refugeValidatedEsim_({...sample(),...change}),null);
 const manual={...sample(),installationUrl:''};assert.ok(x.ctx.refugeValidatedEsim_(manual));assert.ok(x.ctx.refugeValidatedEsim_({...sample(),smdpAddress:'',activationCode:''}));assert.equal(x.ctx.refugeValidatedEsim_({...manual,activationCode:''}),null);
});

test('CODETEST autorizado muestra demo; una eSIM asignada válida usa el flujo normal',()=>{const x=setup();x.rows[1][0]='CODETEST';x.rows[1][9]='DEMO - LISTA PARA ENTREGA';assert.deepEqual(x.lookup('a'.repeat(64)).guest.esim,{status:'DEMO'});x.rows[1][9]='Asignada';assert.ok(x.lookup('a'.repeat(64)).guest.esim.activationCode)});
