const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('todos los diccionarios de dominio registran las mismas claves',()=>{
 const dictionaries={es:{},en:{},fr:{},ca:{}};
 const RefugeI18n={register(locale,entries){Object.assign(dictionaries[locale],entries)}};
 const context=vm.createContext({RefugeI18n,window:{}});
 for(const file of fs.readdirSync(root).filter(x=>/^i18n-(?:core|apartment|stay|arrival|guest|esim)\.js$/.test(x))){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 }
 const union=new Set(['en','fr','ca'].flatMap(locale=>Object.keys(dictionaries[locale])));
 for(const locale of ['en','fr','ca']){
  const missing=[...union].filter(key=>!(key in dictionaries[locale]));
  assert.deepEqual(missing,[],`${locale} carece de: ${missing.join(', ')}`);
 }
});

test('el adaptador de contenido tiene cuatro variantes y no contiene credenciales',()=>{
 const source=fs.readFileSync(path.join(root,'i18n-content.js'),'utf8');
 assert.match(source,/const rows=\[/);
 assert.match(source,/dict\.es\[r\[0\]\]=r\[0\]/);
 assert.match(source,/dict\.en\[r\[0\]\]=r\[1\]/);
 assert.match(source,/dict\.fr\[r\[0\]\]=r\[2\]/);
 assert.match(source,/dict\.ca\[r\[0\]\]=r\[3\]/);
 assert.doesNotMatch(source,/[a-f0-9]{64}/i);
 assert.doesNotMatch(source,/34617400600|DEMO-CODIGO-NO-VALIDO/);
});

test('la versión 1.3.0 y todos los recursos i18n están en la caché offline',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(html,/v1\.3\.0/);
 assert.match(html,/sw\.js\?v=70/);
 for(const file of ['i18n.js','i18n-core.js','i18n-apartment.js','i18n-stay.js','i18n-arrival.js','i18n-guest.js','i18n-esim.js','i18n-content.js'])assert.ok(sw.includes(`./${file}`),file);
 assert.match(sw,/mi-refugio-v70/);
});
