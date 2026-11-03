// Apps Script 환경을 흉내 내 Code.gs를 그대로 실행하는 로컬 테스트 서버
const http=require('http'), fs=require('fs'), vm=require('vm'), url=require('url');
const cache={}, sheets={};
function Sheet(name){ this.name=name; this.rows=[]; }
Sheet.prototype={ appendRow(r){this.rows.push(r.slice());}, setFrozenRows(){}, getLastRow(){return this.rows.length;},
  getRange(r,c,nr,nc){ const sh=this; nr=nr||1; nc=nc||1; return {
    getValues(){ const o=[]; for(let i=0;i<nr;i++){ const row=sh.rows[r-1+i]||[]; o.push(Array.from({length:nc},(_,j)=>row[c-1+j]===undefined?'':row[c-1+j])); } return o; },
    getValue(){ return this.getValues()[0][0]; },
    setValues(v){ v.forEach((row,i)=>{ const R=sh.rows[r-1+i]||(sh.rows[r-1+i]=[]); row.forEach((x,j)=>R[c-1+j]=x); }); return this; },
    setFontWeight(){return this;}, setWrap(){return this;}, setVerticalAlignment(){return this;} }; } };
const ctx={ console, JSON, Math, Date, Object, Array, String, Number,
  CacheService:{getScriptCache:()=>({get:k=>cache[k]||null, put:(k,v)=>{ if(v.length>100000) throw new Error('cache too big '+v.length); cache[k]=v; }})},
  LockService:{getScriptLock:()=>({waitLock(){}, releaseLock(){}})},
  SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n]||null, insertSheet:n=>(sheets[n]=new Sheet(n))})},
  ContentService:{MimeType:{JSON:'json'}, createTextOutput:t=>({setMimeType(){return {text:t};}})} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/Code.gs','utf8'), ctx);
const port=+process.argv[2]||8787;
http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  const u=url.parse(req.url,true);
  if(u.pathname==='/__sheets'){ res.end(JSON.stringify(Object.fromEntries(Object.entries(sheets).map(([k,s])=>[k,s.rows.length])))); return; }
  if(u.pathname.startsWith('/exec')){
    if(req.method==='GET'){ const o=ctx.doGet({parameter:u.query}); res.setHeader('Content-Type','application/json'); res.end(o.text); return; }
    let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ const o=ctx.doPost({postData:{contents:b}}); res.setHeader('Content-Type','application/json'); res.end(o.text); }); return; }
  // 정적 파일
  const f=__dirname+'/..'+(u.pathname==='/'?'/index.html':u.pathname);
  if(fs.existsSync(f)&&fs.statSync(f).isFile()){ const ext=f.split('.').pop(); res.setHeader('Content-Type',{html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css'}[ext]||'text/plain'); res.end(fs.readFileSync(f)); return; }
  res.statusCode=404; res.end('nf');
}).listen(port,()=>console.log('mock on',port));
