(()=>{"use strict";
const multilingualEnabled=false;
const supported=["es","en","fr","ca"];
const normalize=v=>String(v||"").toLowerCase().split(/[-_]/)[0];
const valid=v=>supported.includes(normalize(v))?normalize(v):null;
let stored;try{stored=localStorage.getItem("refuge.language")}catch{}
let language=multilingualEnabled?(valid(new URL(location.href).searchParams.get("lang"))||valid(stored)||(navigator.languages||[navigator.language]).map(valid).find(Boolean)||"es"):"es";
const dictionaries={es:{},en:{},fr:{},ca:{}};
function t(key,fallback=key,values={}){return (dictionaries[language][key]??dictionaries.es[key]??fallback).replace(/\{([\w]+)\}/g,(m,k)=>Object.hasOwn(values,k)?String(values[k]):m)}
function render(){document.documentElement.lang=language;document.querySelectorAll("[data-i18n]").forEach(el=>{el.dataset.i18nFallback??=el.textContent;el.textContent=t(el.dataset.i18n,el.dataset.i18nFallback)});document.querySelectorAll("[data-i18n-label]").forEach(el=>{el.setAttribute("aria-label",t(el.dataset.i18nLabel));el.title=t(el.dataset.i18nLabel)});document.dispatchEvent(new CustomEvent("refuge:language",{detail:{language}}))}
function setLanguage(value){if(!multilingualEnabled)return;const next=valid(value);if(!next)return;language=next;try{localStorage.setItem("refuge.language",next)}catch{}const url=new URL(location.href);url.searchParams.set("lang",next);history.replaceState(history.state,"",url);render()}
window.RefugeI18n={multilingualEnabled,locale:()=>({es:"es-ES",en:"en-GB",fr:"fr-FR",ca:"ca-ES"}[language]),t,setLanguage,get language(){return language},register(locale,entries){if(supported.includes(locale))Object.assign(dictionaries[locale],entries)},render};
})();
