'use strict';
const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const QRCode=require('qrcode');
const crypto=require('crypto');
const path=require('path');
const app=express();const server=http.createServer(app);const io=new Server(server,{maxHttpBufferSize:1e5,pingTimeout:25000});
app.set('trust proxy',1);app.use(express.static(path.join(__dirname,'public')));
const Q=[
 {q:'Čo znamená „Lectio divina“?',a:['Božské čítanie','Biblická olympiáda','Rýchločítanie Biblie','Latinská rozcvička'],c:0,why:'Lectio divina je modlitbové čítanie Božieho slova – nie preteky v rýchlosti. 📖'},
 {q:'Čo je prvým krokom klasickej Lectio divina?',a:['Contemplatio – spočinutie','Lectio – čítanie','Actio – konanie','Meditatio – uvažovanie'],c:1,why:'Najprv text pozorne čítame (lectio), potom nad ním rozjímame.'},
 {q:'Pri Lectio divina otázka „Čo mi Boh hovorí cez tento text?“ patrí najmä ku kroku…',a:['Nakupovanie','Zapisovanie bodov','Meditatio – rozjímanie','Hľadanie rýmov'],c:2,why:'Meditatio znamená rozjímať nad tým, čo Božie slovo hovorí mne.'},
 {q:'Koľko kníh má katolícke Sväté písmo?',a:['66','70','72','73'],c:3,why:'Katolícka Biblia má 73 kníh: 46 v Starom a 27 v Novom zákone.'},
 {q:'Koľko kníh tvorí Starý zákon katolíckej Biblie?',a:['46','27','39','50'],c:0,why:'Starý zákon má v katolíckej Biblii 46 kníh.'},
 {q:'Koľko kníh má Nový zákon?',a:['12','27','40','46'],c:1,why:'Nový zákon obsahuje 27 kníh.'},
 {q:'Ktorý žalm je najkratší podľa hebrejského číslovania?',a:['Žalm 23','Žalm 119','Žalm 117','Žalm 150'],c:2,why:'Žalm 117 má iba dva verše. V gréckom/latinskom číslovaní je to Žalm 116.'},
 {q:'Kto sa staral o mladého Samuela vo svätyni?',a:['Mojžiš','Dávid','Jonáš','Kňaz Héli'],c:3,why:'Samuel slúžil pod dohľadom kňaza Héliho (1 Sam 3).'},
 {q:'Čo povedal Samuel, keď pochopil, že ho volá Pán?',a:['Hovor, tvoj sluha počúva.','Teraz nemám čas.','Kto je tam?','Pošli mi správu.'],c:0,why:'Samuel odpovedal: „Hovor, tvoj sluha počúva.“ (1 Sam 3,10).'},
 {q:'Ktorého izraelského kráľa Samuel pomazal ako prvého?',a:['Šalamúna','Saula','Herodesa','Achaba'],c:1,why:'Samuel pomazal Saula (1 Sam 10) a neskôr aj Dávida.'}
];
const games=new Map();
const makePin=()=>{let p;do{p=String(crypto.randomInt(100000,1000000))}while(games.has(p));return p};
const pub=(g)=>({pin:g.pin,phase:g.phase,count:g.players.size,players:[...g.players.values()].map(p=>({name:p.name,connected:p.connected})),index:g.index,total:g.questions.length,question:g.phase==='question'?{q:g.questions[g.index].q,a:g.questions[g.index].a}:null,endsAt:g.endsAt,answered:[...g.players.values()].filter(p=>p.answered).length,ranking:rank(g).map(p=>({name:p.name,score:p.score})),result:g.phase==='results'||g.phase==='finished'?g.lastResult:null});
const rank=(g)=>[...g.players.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'sk'));
const emit=(g)=>io.to(g.pin).emit('state',pub(g));
function finishQuestion(g){if(g.phase!=='question')return;clearTimeout(g.timer);const q=g.questions[g.index];g.lastResult={correct:q.c,why:q.why,answers:[...g.players.values()].filter(p=>p.answered).length};g.phase='results';emit(g)}
function next(g){if(!['lobby','results'].includes(g.phase))return false;if(g.phase==='results')g.index++;if(g.index>=g.questions.length){g.phase='finished';g.lastResult=null;emit(g);return true}g.phase='question';g.endsAt=Date.now()+21000;g.lastResult=null;for(const p of g.players.values()){p.answered=false;p.answer=null}emit(g);g.timer=setTimeout(()=>finishQuestion(g),21000);return true}
function clean(){for(const [pin,g] of games){if(Date.now()-g.updatedAt>1000*60*60*5){clearTimeout(g.timer);games.delete(pin)}}}setInterval(clean,15*60*1000).unref();
io.on('connection',sock=>{
 sock.on('create',async (cb)=>{try{const pin=makePin(),token=crypto.randomBytes(24).toString('hex');const g={pin,token,phase:'lobby',index:0,questions:Q.map(x=>({...x,a:[...x.a]})),players:new Map(),endsAt:null,lastResult:null,timer:null,updatedAt:Date.now(),hostId:sock.id};games.set(pin,g);sock.join(pin);sock.data.hostPin=pin;const base=(process.env.PUBLIC_URL||`${sock.handshake.headers['x-forwarded-proto']||'http'}://${sock.handshake.headers.host}`).replace(/\/$/,'');const joinUrl=`${base}/?pin=${pin}`;const qr=await QRCode.toDataURL(joinUrl,{width:360,margin:2,errorCorrectionLevel:'M'});cb({ok:true,pin,token,joinUrl,qr});emit(g)}catch(e){cb({ok:false,error:'Nepodarilo sa vytvoriť hru.'})}});
 sock.on('host:resume',({pin,token},cb)=>{const g=games.get(String(pin));if(!g||g.token!==token)return cb({ok:false,error:'Hra alebo moderátorský kľúč neexistuje.'});g.hostId=sock.id;g.updatedAt=Date.now();sock.join(g.pin);sock.data.hostPin=g.pin;cb({ok:true});emit(g)});
 sock.on('join',({pin,name,playerId},cb)=>{pin=String(pin||'').trim();name=String(name||'').trim().replace(/\s+/g,' ').slice(0,25);const g=games.get(pin);if(!g)return cb({ok:false,error:'Hra s týmto PIN kódom neexistuje.'});if(!name)return cb({ok:false,error:'Zadaj svoju prezývku.'});let p=playerId&&g.players.get(String(playerId));if(p){if(p.name!==name)return cb({ok:false,error:'Prezývka sa pri opätovnom pripojení musí zhodovať.'});}else{if(g.phase!=='lobby')return cb({ok:false,error:'Hra už začala. Noví hráči sa pridať nemôžu.'});if(g.players.size>=500)return cb({ok:false,error:'Hra je plná.'});if([...g.players.values()].some(x=>x.name.toLowerCase()===name.toLowerCase()))return cb({ok:false,error:'Táto prezývka už je obsadená.'});playerId=crypto.randomUUID();p={id:playerId,name,score:0,answered:false,answer:null,connected:true,socketId:sock.id};g.players.set(playerId,p)}p.connected=true;p.socketId=sock.id;sock.data.player={pin,id:p.id};sock.join(pin);g.updatedAt=Date.now();cb({ok:true,playerId:p.id});emit(g)});
 sock.on('answer',({choice},cb)=>{const ident=sock.data.player;if(!ident)return cb?.({ok:false,error:'Najprv sa prihlás.'});const g=games.get(ident.pin),p=g?.players.get(ident.id);if(!g||!p||p.socketId!==sock.id||g.phase!=='question'||p.answered||!Number.isInteger(choice)||choice<0||choice>3||Date.now()>g.endsAt)return cb?.({ok:false,error:'Odpoveď už nie je možné odoslať.'});p.answered=true;p.answer=choice;const correct=g.questions[g.index].c===choice;if(correct){const left=Math.max(0,g.endsAt-Date.now());p.score+=500+Math.floor(500*left/21000)}g.updatedAt=Date.now();cb?.({ok:true,correct,score:p.score});emit(g);if([...g.players.values()].every(x=>x.answered))finishQuestion(g)});
 sock.on('host:next',({pin,token},cb)=>{const g=games.get(String(pin));if(!g||g.token!==token)return cb?.({ok:false,error:'Nedostatočné oprávnenie.'});if(g.phase==='lobby'&&g.players.size<1)return cb?.({ok:false,error:'Počkaj aspoň na jedného hráča.'});g.updatedAt=Date.now();cb?.({ok:next(g)})});
 sock.on('host:close',({pin,token},cb)=>{const g=games.get(String(pin));if(!g||g.token!==token)return cb?.({ok:false});clearTimeout(g.timer);io.to(g.pin).emit('closed');games.delete(g.pin);cb?.({ok:true})});
 sock.on('disconnect',()=>{const ident=sock.data.player;if(!ident)return;const g=games.get(ident.pin),p=g?.players.get(ident.id);if(p&&p.socketId===sock.id){p.connected=false;emit(g)}});
});
app.get('/health',(_req,res)=>res.json({ok:true,games:games.size}));
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Biblický kvíz beží na porte '+(process.env.PORT||3000)));
