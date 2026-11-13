const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/affiliate-conversions.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const codes = [...home.matchAll(/data-px-copy="([^"]+)"/g)].map(m => m[1]);
function setup({secure=true, reject=false, fallback=true, ga=true}={}) {
  const events=[], handlers=[], copied=[], status={textContent:''};
  const context={dataset:{pxVendor:'axon',pxPlacement:'featured_strip',pxOffer:'coupon'}};
  const offer={querySelector:()=>status};
  const button={dataset:{pxCopy:'AXONMB'},disabled:false,closest:s=>s==='.px-offer'?offer:context};
  const selection={rangeCount:0,removeAllRanges(){},addRange(){}};
  let focusRestored=false, removed=false;
  const document={activeElement:{focus(){focusRestored=true;}},body:{appendChild(){}},
    createElement(){return {style:{},select(){},remove(){removed=true;}};},
    execCommand:()=>fallback,addEventListener:(name,fn)=>handlers.push(fn)};
  const window={isSecureContext:secure,getSelection:()=>selection};
  if(ga) window.gtag=(...args)=>events.push(args);
  const navigator={clipboard:{writeText:async text=>{if(reject)throw Error('Denied');copied.push(text);}}};
  const sandbox={window,document,navigator,location:{pathname:'/'},URL};
  vm.runInNewContext(source,sandbox);vm.runInNewContext(source,sandbox);
  assert.equal(handlers.length,1,'repeated script includes must not duplicate listeners');
  const clickButton=()=>handlers[0]({target:{closest:s=>s==='button[data-px-copy]'?button:null}});
  const clickLink=link=>handlers[0]({target:{closest:s=>s==='a[href]'?link:null}});
  return {events,copied,status,button,context,clickButton,clickLink,cleaned:()=>focusRestored&&removed};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  assert.deepEqual(codes.sort(),['AXONMB','SWISSMB','krakenmb','mikeyb7189','mikeyb7189'].sort());
  for(const code of codes){
    const s=setup();s.button.dataset.pxCopy=code;s.clickButton();s.clickButton();await flush();
    assert.deepEqual(s.copied,[code]);assert.equal(s.status.textContent,'Code copied!');
    assert.equal(s.events.length,1);assert.equal(s.events[0][1],'discount_copy');
    assert.deepEqual(Object.keys(s.events[0][2]).sort(),['offer_type','page_type','placement','vendor']);
    assert.equal(s.button.disabled,false);
  }
  for(const options of [{reject:true},{secure:false}]){
    const s=setup(options);s.clickButton();await flush();
    assert.equal(s.events.length,1);assert.equal(s.cleaned(),true);
  }
  const failed=setup({reject:true,fallback:false});failed.clickButton();await flush();
  assert.equal(failed.events.length,0);assert.match(failed.status.textContent,/Unable to copy/);
  const noGA=setup({ga:false});noGA.clickButton();await flush();assert.equal(noGA.status.textContent,'Code copied!');
  for(const [href,vendor] of [['https://ionpeptide.com/?ref=mikeyb7189','ion'],['https://www.axonpeptide.com/?sca_ref=11311207.TWZhDavjKf','axon'],['https://thekrakenpep.com/?coupon=krakenmb','kraken']]){
    const s=setup();s.clickLink({href,dataset:{},closest:()=>null});
    assert.equal(s.events.length,1);assert.equal(s.events[0][1],'affiliate_click');assert.equal(s.events[0][2].vendor,vendor);
    assert.ok(!JSON.stringify(s.events).includes('mikeyb7189'));assert.ok(!JSON.stringify(s.events).includes('sca_ref'));
  }
  for(const event of ['trust_to_profile','article_to_trust']){
    const s=setup();s.clickLink({href:'https://www.protokolx.com/trust-index.html',dataset:{pxEvent:event},closest:()=>s.context});
    assert.equal(s.events.length,1);assert.equal(s.events[0][1],event);
  }
  const documentation=setup();documentation.clickLink({href:'https://www.axonverified.com',dataset:{},closest:()=>null});
  assert.equal(documentation.events.length,0);
  console.log('PASS: all 5 copy controls, success/failure/fallback, focus cleanup, rapid click guard, repeated initialization, four event types, vendor matching, payload privacy, absent GA, documentation exclusion.');
})().catch(error=>{console.error(error);process.exitCode=1;});
