(function(){
'use strict';
var menu=document.getElementById('navlinks'),burger=document.getElementById('burger');
if(burger&&menu){burger.addEventListener('click',function(){menu.classList.toggle('open');burger.setAttribute('aria-expanded',String(menu.classList.contains('open')))});menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');burger.setAttribute('aria-expanded','false')})})}
document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')});
document.querySelectorAll('.faq').forEach(function(d){d.addEventListener('toggle',function(){if(d.open)document.querySelectorAll('.faq').forEach(function(o){if(o!==d)o.open=false})})});
var top=document.getElementById('totop');if(top){window.addEventListener('scroll',function(){top.classList.toggle('show',window.scrollY>600)},{passive:true});top.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})})}
document.querySelectorAll('[data-newsletter]').forEach(function(form){
var service=null,initialButton=form.querySelector('button'),initialStatus=form.parentElement.querySelector('.signup-status');initialButton.disabled=true;
fetch('assets/newsletter-config.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('unavailable');return r.json()}).then(function(s){service=s.endpoint;if(service){initialButton.disabled=false;initialStatus.textContent=''}else{initialStatus.textContent='Email signup is being connected. Please check back shortly.'}}).catch(function(){initialStatus.textContent='Email signup is temporarily unavailable. Please try again later.'});
form.addEventListener('submit',async function(e){
e.preventDefault();if(!form.reportValidity())return;var email=form.elements.email.value.trim(),status=form.parentElement.querySelector('.signup-status'),button=form.querySelector('button');
if(form.elements['bot-field'].value)return;
button.disabled=true;status.textContent='Saving your subscription…';
try{if(!service)throw new Error('unavailable');
var r=await fetch(service,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,consent:true,source:'nonprofitwizard.org',website:form.elements['bot-field'].value})});var result=await r.json();if(!r.ok||!result.ok)throw new Error('failed');
status.textContent=result.message||"You're on the list. Watch your inbox for our weekly articles.";form.reset();button.textContent='Subscribed';
}catch(err){status.textContent="We couldn't save your subscription. Please try again in a moment.";button.disabled=false;button.textContent='Try again'}
})});
})();