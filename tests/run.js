// Testes automatizados do Fluência 15+15.
// Carrega index.html num navegador simulado (jsdom) e verifica conteúdo, algoritmos e telas.
// Uso: npm test
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const pageErrors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) pageErrors.push(e.message); });
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://localhost/", virtualConsole: vc });
const w = dom.window;
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = () => {};
const E = code => w.eval(code); // avalia no escopo global da página (vê const/let do app)

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log("  ok   " + name); }
  catch (e) { fail++; console.log("  FALHA " + name + "\n        " + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "asserção falhou"); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || "diferente") + ": esperado " + JSON.stringify(b) + ", veio " + JSON.stringify(a)); }

// estado limpo, com a tela de boas-vindas concluída
E(`S = merge({}); S.onboarded = true; S.seenVersion = APP_VERSION; go("today");`);

console.log("\nConteúdo");
test("palavras sem duplicatas e com exemplo marcado", () => {
  const r = E(`(()=>{ const w = VOCAB.map(c=>c.w.toLowerCase()); return {dup: w.filter((x,i)=>w.indexOf(x)!==i), noMark: VOCAB.filter(c=>!/\\*.+\\*/.test(c.ex)).map(c=>c.w)}; })()`);
  eq(r.dup, [], "duplicatas"); eq(r.noMark, [], "exemplos sem *alvo*");
});
test("aulas de gramática: 5 questões e resposta válida", () => {
  // cada questão tem lacuna (___) ou é do tipo pergunta ("Which sentence is correct?")
  const bad = E(`GRAMMAR.filter(l=>l.q.length!==5 || l.q.some(q=>q[2]<0||q[2]>=q[1].length||!(q[0].includes("___")||q[0].trim().endsWith("?")))).map(l=>l.id)`);
  eq(bad, []);
  const ids = E(`GRAMMAR.map(l=>l.id)`); eq(ids.length, new Set(ids).size, "ids repetidos");
});
test("diálogos: exatamente 1 resposta certa entre 3 em cada fala", () => {
  eq(E(`DIALOGS.filter(d=>d.lines.some(l=>l[0]==="me" && (l[2].length!==3 || l[2].filter(o=>o[1]).length!==1))).map(d=>d.id)`), []);
  eq(E(`DIALOGS.filter(d=>d.lines[d.lines.length-1][0]!=="a").map(d=>d.id)`), [], "diálogo deve terminar com o personagem");
});
test("leituras: glossário presente no texto e perguntas válidas", () => {
  eq(E(`READINGS.flatMap(r=>Object.keys(r.gloss).filter(k=>!r.text.toLowerCase().includes(k.toLowerCase())).map(k=>r.id+":"+k))`), []);
  eq(E(`READINGS.filter(r=>r.q.some(q=>q[2]>=q[1].length)).map(r=>r.id)`), []);
});
test("ditado: sem hífens nem dígitos e sem frases repetidas", () => {
  eq(E(`LISTEN.filter(x=>/[-0-9]/.test(x[1])).map(x=>x[1])`), []);
  eq(E(`(()=>{ const t = LISTEN.map(x=>x[1]); return t.filter((x,i)=>t.indexOf(x)!==i); })()`), []);
});
test("verbos irregulares sem duplicatas", () => {
  eq(E(`(()=>{ const b = IRREG.map(v=>v[0]); return b.filter((x,i)=>b.indexOf(x)!==i); })()`), []);
});

test("jogos rápidos: respostas entre as opções e frases com lacuna", () => {
  eq(E(`COLLOC.filter(([p,a])=>!p.includes("___") || !a.every(x=>COLLOC_OPTS.includes(x))).map(x=>x[0])`), []);
  eq(E(`PREPS.filter(([p,a])=>!p.includes("___") || !PREP_OPTS.includes(a)).map(x=>x[0])`), []);
  eq(E(`FALSE_FRIENDS.filter(x=>!x[0].includes("___") || x[1]===x[2] || x.length!==4).map(x=>x[0])`), []);
  eq(E(`(()=>{ const all = COLLOC.map(x=>x[0]).concat(PREPS.map(x=>x[0]), FALSE_FRIENDS.map(x=>x[0])); return all.filter((x,i)=>all.indexOf(x)!==i); })()`), [], "itens repetidos");
});

console.log("\nFSRS");
test("cartão novo: De novo 1d, Bom 4d, Fácil 14d", () => {
  const r = E(`(()=>{ const c={due:todayKey(),ivl:0,reps:0,lapses:0}; return [0,1,2,3].map(q=>schedule(c,q).ivl); })()`);
  eq(r, [1, 1, 4, 14]);
});
test("respostas “Bom” seguidas aumentam o intervalo", () => {
  const r = E(`(()=>{ let st={due:todayKey(),ivl:0,reps:0,lapses:0}, out=[]; for(let k=0;k<5;k++){ const n=schedule(st,2); out.push(n.ivl); st=Object.assign({},st,n,{last:addDays(todayKey(),-n.ivl)}); } return out; })()`);
  for (let i = 1; i < r.length; i++) assert(r[i] > r[i - 1], "intervalos não crescem: " + r);
});
test("retenção desejada maior encurta o intervalo", () => {
  const r = E(`(()=>{ const c={due:todayKey(),ivl:20,ef:2.5,reps:4,lapses:0}; S.settings.retention=0.85; const a=schedule(c,2).ivl; S.settings.retention=0.95; const b=schedule(c,2).ivl; S.settings.retention=0.9; return [a,b]; })()`);
  assert(r[0] > r[1], "85% deveria dar intervalo maior que 95%: " + r);
});

console.log("\nVerificadores de resposta");
test("digitação: exato, quase e errado", () => {
  eq(E(`["figure out","figur out","find out"].map(g=>checkTyped(g,"figure out").v)`), ["exact", "close", "wrong"]);
});
test("ditado aceita contrações", () => {
  const ok = E(`(()=>{ const t=toks("I'm not used to it."), g=toks("I am not used to it"); return lcsOk(t,g).every(Boolean); })()`);
  assert(ok);
});
test("erros comuns: detecta os errados e ignora os corretos", () => {
  const bad = ["I have 30 years.", "It depends of you.", "People is nice.", "I didn't went.", "You must to go.", "Everybody are here.", "I work here since three years."];
  const good = ["I have 30 minutes.", "It depends on you.", "People are nice.", "I didn't go.", "You must go.", "Everybody is here.", "I have worked here for three years."];
  const r = E(`(()=>{ const b=${JSON.stringify(bad)}, g=${JSON.stringify(good)}; return {miss:b.filter(t=>!commonErrors(t).length), fp:g.filter(t=>commonErrors(t).length)}; })()`);
  eq(r.miss, [], "não detectou"); eq(r.fp, [], "falso positivo");
});
test("números: aceita o jeito brasileiro de digitar", () => {
  const r = E(`[NUM_CHECK.price("57,10","57.10"), NUM_CHECK.time("8h20","8:20"), NUM_CHECK.time("820","8:20"), NUM_CHECK.date("23/8","23/08"), NUM_CHECK.big("4.400.000","4400000"), NUM_CHECK.date("8/23","23/08")]`);
  eq(r, [true, true, true, true, true, false]);
});

test("estrutura de escrita escolhida pelo tipo de tema", () => {
  eq(E(`["Write an email to a colleague.","Argue for or against a four-day work week.","Write about a mistake you made.","Describe your ideal job."].map(p=>frameFor(p).t)`),
     ["E-mail ou mensagem", "Opinião", "História", "Descrição"]);
});

test("importação do Anki: remove HTML, ignora cabeçalho e inverte", () => {
  const txt = "#separator:tab\n#html:true\ntake for granted\tnão dar valor<br><br><i>Don&#39;t take it for granted.</i>\n<b>hang out</b>\tsair junto\nsó um campo\n";
  eq(E(`parseAnki(${JSON.stringify(txt)}, false)`), [{ w: "take for granted", pt: "não dar valor", ex: "" }, { w: "hang out", pt: "sair junto", ex: "" }]);
  eq(E(`parseAnki(${JSON.stringify("sair junto\thang out")}, true)[0].w`), "hang out");
  eq(E(`parseWordList(parseAnki(${JSON.stringify(txt)}, false).map(x=>x.w+" ; "+x.pt).join("\\n")).length`), 2, "formato intermediário reimportável");
});

console.log("\nSequência, férias e dados");
test("férias protegem a sequência", () => {
  const r = E(`(()=>{ const t=todayKey(); S.streak={count:20,best:20,last:addDays(t,-10)}; S.freezes=0;
    S.vacations=[{from:addDays(t,-9),to:addDays(t,-1),spread:true}]; const kept=effectiveStreak();
    S.vacations=[]; const lost=effectiveStreak(); return [kept,lost]; })()`);
  eq(r, [20, 0]);
});
test("estado corrompido é reparado", () => {
  const r = E(`(()=>{ const m = merge({xp:"abc",cards:[1],journal:"x",days:{"lixo":{}, "2026-01-01":{m:null}},listenLevel:9}); return [m.xp, Array.isArray(m.cards), Array.isArray(m.journal), Object.keys(m.days), m.days["2026-01-01"].m, m.listenLevel]; })()`);
  eq(r, [0, false, true, ["2026-01-01"], [0, 0, 0], 1]);
});
test("juntar progressos: combina palavras, dias, diário e mantém as configurações", () => {
  const r = E(`(()=>{
    const A = merge({xp:500, onboarded:true, settings:{level:"b1", accent:"en-US"}, streak:{count:3,best:5,last:"2026-09-20"},
      cards:{v1:{due:"2026-10-01",ivl:5,reps:3,last:"2026-09-20"}, v2:{due:"2026-09-25",ivl:2,reps:1,last:"2026-09-10"}},
      days:{"2026-09-20":{m:[1,1,1],n:[0,0,0],xp:40,newIds:["v1"]}}, journal:[{d:"2026-09-20",p:"p",text:"texto A"}], custom:[{id:"c1",w:"brand new",pt:"novinho",ex:"x"}]});
    const B = merge({xp:300, onboarded:true, settings:{level:"a1", accent:"en-GB"}, streak:{count:7,best:7,last:"2026-09-26"},
      cards:{v2:{due:"2026-10-09",ivl:14,reps:4,last:"2026-09-25"}, v3:{due:"2026-09-30",ivl:3,reps:1,last:"2026-09-26"}},
      days:{"2026-09-20":{m:[0,0,0],n:[1,1,1],xp:25,newIds:["v3"]}, "2026-09-26":{m:[1,1,1],n:[0,0,0],xp:30,newIds:[]}},
      journal:[{d:"2026-09-20",p:"p",text:"texto A"},{d:"2026-09-26",p:"p",text:"texto B"}], custom:[{id:"c9",w:"Brand new",pt:"novo",ex:"y"}]});
    const M = mergeStates(A, B);
    return {cards:Object.keys(M.cards).sort(), v2ivl:M.cards.v2.ivl, day20:[M.days["2026-09-20"].m, M.days["2026-09-20"].n, M.days["2026-09-20"].xp, M.days["2026-09-20"].newIds.sort()],
      days:Object.keys(M.days).sort(), journal:M.journal.length, custom:M.custom.length, xp:M.xp, streak:[M.streak.count, M.streak.best, M.streak.last], level:M.settings.level, accent:M.settings.accent};
  })()`);
  eq(r.cards, ["v1", "v2", "v3"], "palavras dos dois");
  eq(r.v2ivl, 14, "fica a revisão mais recente");
  eq(r.day20, [[1, 1, 1], [1, 1, 1], 40, ["v1", "v3"]], "mesmo dia: sessões dos dois");
  eq(r.days, ["2026-09-20", "2026-09-26"]);
  eq(r.journal, 2, "diário sem duplicar"); eq(r.custom, 1, "palavra própria sem duplicar");
  eq(r.xp, 500); eq(r.streak, [7, 7, "2026-09-26"]); eq([r.level, r.accent], ["b1", "en-US"], "configurações deste aparelho");
});
test("estado respeita o limite da nuvem (256 KB)", () => {
  const kb = E(`(()=>{ const t=todayKey(); for(let j=0;j<40;j++) S.journal.push({d:t,p:"p",text:"x".repeat(4000),fb:{corrected:"y".repeat(4000)}});
    for(let k=0;k<700;k++) S.days[addDays(t,-k)]={m:[1,1,1],n:[1,1,1],xp:50,newIds:[]}; trimState(); const r=JSON.stringify(S).length/1024; S=merge({}); S.onboarded=true; S.seenVersion=APP_VERSION; return r; })()`);
  assert(kb < 256, "estado com " + Math.round(kb) + " KB");
});

test("relatório do mês soma só os dias do mês", () => {
  const r = E(`(()=>{ const bak = S.days; S.days = {"2026-08-31":{m:[1,1,1],n:[0,0,0],xp:10,newIds:["a"],sec:600,rev:5},"2026-09-01":{m:[1,1,1],n:[1,1,1],xp:40,newIds:["b","c"],sec:1200,rev:20,rv:{n:10,ok:9}},"2026-09-02":{m:[0,0,0],n:[0,0,0],xp:0,newIds:[]}};
    const m = monthStats("2026-09"); S.days = bak; return [m.days,m.min,m.xp,m.words,m.rev,m.ret]; })()`);
  eq(r, [1, 20, 40, 2, 20, 90]);
});

console.log("\nTelas");
test("todas as telas abrem sem erro em todos os níveis", () => {
  const errs = E(`(()=>{ const errs=[]; const tryv=(n,f)=>{ try{ f(); if(!view.innerHTML.trim()) errs.push(n+": vazia"); if(view.querySelector("#crHome")) errs.push(n+": tela de erro"); }catch(e){ errs.push(n+": "+e.message); } };
    for(let i=0;i<20;i++) S.cards["v"+i]={due:todayKey(),ivl:3,reps:2,lapses:i%4,s:3,d:5,last:addDays(todayKey(),-3)};
    ["pp","fs","ut"].forEach(id=>S.grammar[id]={best:4,last:3,date:addDays(todayKey(),-3),stage:0,due:todayKey()});
    const subs=["listen","speak","pairs","chat","dialogs","mistakes","reading","ear","test","world","write","journal","build","guide","pron","phr","quick","mix","science","nums","irreg","gm:colloc","gm:prep","gm:ff","voices","g:b_be","d:cafe","r:memory"];
    ["a1","a2","b1","b1p","b2"].forEach(l=>{ S.settings.level=l;
      ["today","review","practice","progress"].forEach(t=>tryv(l+"/"+t,()=>go(t)));
      subs.forEach(s=>tryv(l+"/practice/"+s,()=>go("practice",s)));
      ["run","hard"].forEach(s=>tryv(l+"/review/"+s,()=>go("review",s)));
      ["m","n","x"].forEach(k=>{ session=null; tryv(l+"/sessão "+k,()=>{ startSession(k); for(let j=0;j<SESSIONS[k].blocks.length;j++){ session.i=j; go("session"); } }); });
    });
    session=null; S.settings.level="b1"; go("today"); return errs; })()`);
  eq(errs, []);
});
test("revisão completa termina (palavras + gramática)", () => {
  const r = E(`(()=>{ dueGIds(); Object.values(S.gcards).forEach(c=>c.due=todayKey()); go("review","run"); let n=0;
    while(n<300){ n++; const qs=view.querySelector(".qsent");
      if(qs){ const key=Object.keys(S.gcards).find(k=>{ const x=gItem(k); return x && qs.textContent===x.q[0].replace("___","_____"); }); const it=gItem(key);
        [...view.querySelectorAll(".opt:not(.why)")].find(b=>+b.dataset.j===it.q[2]).click(); view.querySelector("#gn").click(); }
      else if(view.querySelector("#rev")){ view.querySelector("#rev").click(); view.querySelector('[data-q="2"]').click(); }
      else break; }
    return {done: !!view.querySelector(".empty"), steps:n}; })()`);
  assert(r.done, "revisão não terminou em " + r.steps + " passos");
});
test("jogo rápido: rodada sem repetição e erro vai para Meus erros", () => {
  const r = E(`(()=>{ S.mistakes=[]; go("practice","gm:prep"); view.querySelector("#gmGo").click(); const seen=[]; let wrong=false;
    for(let k=0;k<10;k++){ const p=view.querySelector(".qsent").textContent; seen.push(p);
      const btns=[...view.querySelectorAll(".opt")]; const item=PREPS.find(x=>x[0].replace("___","_____")===p);
      const b = !wrong ? btns.find(x=>x.textContent!==item[1]) : btns.find(x=>x.textContent===item[1]); wrong=true; b.click(); view.querySelector("#qnx").click(); }
    go("practice","mistakes"); return {uniq:new Set(seen).size, mistakes:S.mistakes.filter(m=>m.k==="c").length, deckShows:!!view.querySelector(".qsent")}; })()`);
  eq(r, { uniq: 10, mistakes: 1, deckShows: true });
});
test("modo foco: sem abas durante a sessão, de volta ao sair", () => {
  const r = E(`(()=>{ session=null; startSession("m"); const inS = document.body.classList.contains("focus"); session=null; go("today"); return [inS, document.body.classList.contains("focus")]; })()`);
  eq(r, [true, false]);
});
test("velocidade rápida: botões mudam a velocidade da voz", () => {
  const r = E(`(()=>{ go("practice","listen"); view.querySelector('[data-spd="1.15"]').click(); const a = S.settings.rate; const p = view.querySelector('[data-spd="1.15"]').getAttribute("aria-pressed");
    view.querySelector('[data-spd="0.95"]').click(); return [a, p, S.settings.rate]; })()`);
  eq(r, [1.15, "true", 0.95]);
});
test("importar backup pela tela: Juntar os dois", () => {
  const r = E(`(()=>{ const bak = JSON.stringify(S); S.cards = {v5:{due:todayKey(),ivl:3,reps:1,last:todayKey()}};
    const other = merge({xp:9999, cards:{v6:{due:todayKey(),ivl:8,reps:2,last:todayKey()}}});
    go("progress"); view.querySelector("#bk").value = JSON.stringify(other); view.querySelector("#im").click();
    const shown = !!view.querySelector("#imMerge"); view.querySelector("#imMerge").click();
    const res = [shown, Object.keys(S.cards).sort(), S.xp >= 9999]; S = merge(JSON.parse(bak)); return res; })()`);
  eq(r, [true, ["v5", "v6"], true]);
});
test("rodapé mostra a versão e onde o progresso está salvo", () => {
  const r = E(`(()=>{ go("today"); const t = view.querySelector(".vfoot").textContent; go("progress"); return [t.includes(APP_VERSION), t.includes("só neste aparelho"), !!view.querySelector(".vfoot")]; })()`);
  eq(r, [true, true, true]);
});
test("nenhum erro de script durante os testes", () => { eq(pageErrors, []); });

// ---------- áudio no iPhone: navegador simulado com user-agent do iOS e voz sintetizada falsa ----------
async function iosAudioTests() {
  console.log("\nÁudio no iPhone (simulado)");
  const log = [];
  const ios = new JSDOM(html, {
    runScripts: "dangerously", url: "https://localhost/", virtualConsole: new VirtualConsole(),
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    beforeParse(win) {
      Object.defineProperty(win.navigator, "userAgent", { get: () => "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
      const voicesList = ["Luciana", "Albert", "Bad News", "Samantha", "Samantha (Enhanced)", "Daniel", "Whisper", "Zarvox", "Karen"].map(n => ({ name: n, lang: n === "Daniel" ? "en-GB" : n === "Karen" ? "en-AU" : n === "Luciana" ? "pt-BR" : "en-US", localService: true }));
      win.SpeechSynthesisUtterance = function (t) { this.text = t; this.volume = 1; this._l = {}; this.addEventListener = (e, f) => { this._l[e] = f; }; };
      win.speechSynthesis = { speaking: false, pending: false, onvoiceschanged: null,
        getVoices: () => voicesList, speak(u) { log.push(["speak", u.text, u.volume, u.voice ? u.voice.name : null]); },
        cancel() { log.push(["cancel"]); }, resume() { log.push(["resume"]); } };
      win.scrollTo = () => {};
    }
  });
  const I = code => ios.window.eval(code);
  I(`S = merge({}); S.onboarded = true; S.seenVersion = APP_VERSION; go("today");`);
  test("vozes de brincadeira e de outros idiomas ficam de fora", () => { eq(I(`voices.map(v=>v.name)`), ["Samantha", "Samantha (Enhanced)", "Daniel", "Karen"]); });
  test("escolhe explicitamente a melhor voz em inglês do sotaque (nunca a padrão em português)", () => {
    eq(I(`pickVoice().name`), "Samantha (Enhanced)");
    eq(I(`S.settings.accent="en-GB"; const n = pickVoice().name; S.settings.accent="en-US"; n`), "Daniel");
    eq(I(`makeUtter("hello").voice.name`), "Samantha (Enhanced)");
  });
  test("lista de vozes que chega atrasada ainda resulta em voz em inglês", () => {
    eq(I(`voices = []; pickVoice().name`), "Samantha (Enhanced)");
  });
  test("texto para a voz: tira reticências, travessões e barras", () => {
    eq(I(`ttsText("I'd rather… — *stay* home / go out")`), "I'd rather, stay home or go out");
  });
  test("primeiro toque destrava o áudio com uma fala muda", () => {
    log.length = 0; ios.window.document.body.dispatchEvent(new ios.window.Event("touchend", { bubbles: true }));
    eq(log.filter(x => x[0] === "speak"), [["speak", " ", 0, null]]);
  });
  test("sem nada tocando: fala na hora e não chama cancel()", () => {
    log.length = 0; I(`speakNow("hello")`);
    eq(log.map(x => x[0]), ["resume", "speak"]); eq(log[1][1], "hello");
  });
  log.length = 0; I(`speechSynthesis.speaking = true; speakNow("second")`);
  const sync = log.map(x => x[0]);
  await new Promise(r => setTimeout(r, 250));
  test("com algo tocando: cancela e só fala depois de uma pausa (evita o descarte do iOS)", () => {
    eq(sync, ["cancel", "resume"], "chamadas imediatas");
    eq(log.map(x => x[0]), ["cancel", "resume", "speak"], "depois da pausa");
  });
  I(`speechSynthesis.speaking = false`);
  test("aviso do modo silencioso aparece só uma vez", () => { eq(I(`S.iosAudioHint`), true); });
  test("escolha manual de voz é respeitada no iOS", () => {
    log.length = 0; I(`S.settings.voice = "Karen"; speakNow("hi"); S.settings.voice = ""`);
    eq(log.find(x => x[0] === "speak")[3], "Karen");
  });
  test("destaque acompanha a palavra falada", () => {
    const r = I(`(()=>{ const box = document.createElement("div"); box.innerHTML = "<span>I'm</span> <span>not</span> <span>used</span> <span>to</span> <span>it.</span>"; document.body.appendChild(box);
      const spans = [...box.querySelectorAll("span")]; const u = speakHighlight("I'm not used to it.", spans);
      const on = ()=>spans.findIndex(x=>x.classList.contains("speaking"));
      u.onboundary({name:"word", charIndex:0}); const a = on(); u.onboundary({name:"word", charIndex:8}); const b = on(); u.onboundary({name:"word", charIndex:16}); const c = on();
      u.onend(); const d = on(); box.remove(); return [a,b,c,d]; })()`);
    eq(r, [0, 2, 4, -1]);
  });
  {
    log.length = 0; const seen = [];
    I(`window.__seen = []; speakSequence(["One.","Two.","Three."], k=>window.__seen.push(k), 1, 30)`);
    const firstBatch = log.filter(x => x[0] === "speak").map(x => x[1]);
    // o mock não dispara "end": simulamos o fim de cada frase
    for (let k = 0; k < 3; k++) { I(`(liveUtter.filter(u=>["One.","Two.","Three."].includes(u.text)).pop()||{}).onend && liveUtter.filter(u=>["One.","Two.","Three."].includes(u.text)).find(u=>!u.__done && (u.__done=true)).onend()`); await new Promise(r => setTimeout(r, 60)); }
    const all = log.filter(x => x[0] === "speak").map(x => x[1]);
    test("ler junto: uma frase por vez, com pausa entre elas", () => {
      eq(firstBatch, ["One."], "só a primeira frase no início");
      eq(all, ["One.", "Two.", "Three."], "as outras vêm depois de cada pausa");
    });
  }
  test("tela de vozes: lista, testa e escolhe uma voz", () => {
    const r = I(`(()=>{ go("practice","voices"); const n = view.querySelectorAll("[data-vt]").length; view.querySelector("[data-vt]").click();
      const b = view.querySelector("[data-vu]"); b.click(); const chosen = S.settings.voice; const diag = view.querySelector("#vDiag").value;
      view.querySelector("#vAuto").click(); return {n, chosen, diagOk: diag.includes("Vozes em inglês: 4") && diag.includes("iPhone"), back: S.settings.voice}; })()`);
    eq(r.n, 4, "vozes listadas"); assert(r.chosen && r.chosen !== "", "voz não foi escolhida"); assert(r.diagOk, "diagnóstico incompleto"); eq(r.back, "", "volta ao automático");
  });
}

async function updateTests() {
  console.log("\nAtualização do app do celular");
  w.fetch = async () => ({ ok: true, text: async () => 'const APP_VERSION = "2099.01.01";' });
  E(`lastVersionCheck = 0; checkForUpdate()`);
  await new Promise(r => setTimeout(r, 50));
  test("versão nova publicada mostra o aviso Atualizar agora", () => { assert(E(`!!document.querySelector("#updGo")`), "aviso não apareceu"); });
  E(`document.querySelector("#updBar").remove()`);
  w.fetch = async () => ({ ok: true, text: async () => 'const APP_VERSION = "' + E("APP_VERSION") + '";' });
  E(`lastVersionCheck = 0; checkForUpdate()`);
  await new Promise(r => setTimeout(r, 50));
  test("mesma versão não mostra aviso", () => { assert(E(`!document.querySelector("#updBar")`), "aviso apareceu sem versão nova"); });
}

updateTests().then(iosAudioTests).then(() => {
  console.log(`\n${pass} passaram, ${fail} falharam`);
  process.exit(fail ? 1 : 0);
});
