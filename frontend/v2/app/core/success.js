'use strict';

function showSuccessModal(name, txhash){
  var txUrl = 'https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(txhash || '');
  var el=document.createElement('div');
  el.style.cssText='position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(6,2,13,0.86);backdrop-filter:blur(10px);padding:1rem';
  el.innerHTML='<div style="background:linear-gradient(180deg,rgba(14,8,31,.98),rgba(8,4,21,.98));border:1px solid rgba(34,211,238,0.28);border-radius:1.5rem;padding:2rem;max-width:560px;width:100%;text-align:left;box-shadow:0 0 80px rgba(34,211,238,0.12),0 24px 90px rgba(0,0,0,.45)">'+
    '<div style="display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.35rem"><div style="width:3.2rem;height:3.2rem;border-radius:1rem;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);display:flex;align-items:center;justify-content:center;color:#34d399;font-size:1.4rem;box-shadow:0 0 30px rgba(16,185,129,.15)"><i class="fas fa-check"></i></div><div><div style="font-family:Orbitron,sans-serif;font-size:1.35rem;font-weight:900;color:#fff;margin-bottom:.25rem">Domain registered successfully</div><div style="color:rgba(255,255,255,.55);font-size:.82rem;line-height:1.6">Your name is now live on Cosmos Hub. No renewals, no expiry dates, no middleman circus.</div></div></div>'+
    '<div style="background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.07);border-radius:1rem;padding:1rem;margin-bottom:1rem">'+
      '<div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:.7rem"><span style="color:rgba(255,255,255,.42);font-size:.72rem">Domain</span><strong style="color:#34d399;font-family:Roboto Mono,monospace">'+esc(name)+'</strong></div>'+
      '<div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:.7rem"><span style="color:rgba(255,255,255,.42);font-size:.72rem">Status</span><strong style="color:#fff">Confirmed on-chain</strong></div>'+
      '<div style="border-top:1px solid rgba(255,255,255,.07);padding-top:.75rem"><div style="font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.34);font-weight:900;margin-bottom:.3rem">Transaction</div><a href="'+txUrl+'" target="_blank" rel="noopener" style="color:#22d3ee;text-decoration:none;font-family:Roboto Mono,monospace;font-size:.78rem;word-break:break-all">'+esc(txhash)+'</a></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;margin-bottom:1rem">'+
      '<div style="border:1px solid rgba(255,255,255,.06);border-radius:.8rem;padding:.75rem;background:rgba(255,255,255,.03);color:#c4b5fd;font-size:.68rem"><i class="fas fa-user-check" style="margin-right:.35rem"></i>Set primary</div>'+
      '<div style="border:1px solid rgba(255,255,255,.06);border-radius:.8rem;padding:.75rem;background:rgba(255,255,255,.03);color:#67e8f9;font-size:.68rem"><i class="fas fa-list-check" style="margin-right:.35rem"></i>Manage records</div>'+
      '<div style="border:1px solid rgba(255,255,255,.06);border-radius:.8rem;padding:.75rem;background:rgba(255,255,255,.03);color:#6ee7b7;font-size:.68rem"><i class="fas fa-arrow-right-arrow-left" style="margin-right:.35rem"></i>Transfer anytime</div>'+
    '</div>'+
    '<div class="success-actions"><a href="'+txUrl+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:.45rem;background:linear-gradient(90deg,#9333ea,#22d3ee);color:white;padding:.85rem;border-radius:.8rem;font-family:Orbitron,sans-serif;font-weight:900;font-size:.78rem;text-decoration:none">View on Mintscan <i class="fas fa-arrow-up-right-from-square"></i></a><button id="scPortfolio" class="success-secondary" style="padding:.85rem;border-radius:.8rem;font-family:Orbitron,sans-serif;font-weight:900;font-size:.78rem;cursor:pointer">My Domains</button></div>'+
    '<button id="scClose" style="width:100%;margin-top:.7rem;background:transparent;border:0;color:rgba(255,255,255,.45);padding:.55rem;border-radius:.65rem;font-weight:800;font-size:.72rem;cursor:pointer">Close</button>'+
  '</div>';
  document.body.appendChild(el);
  el.querySelector('#scClose').addEventListener('click',function(){el.remove();});
  el.querySelector('#scPortfolio').addEventListener('click',function(){el.remove();showPage('portfolio');});
  el.addEventListener('click',function(e){if(e.target===el)el.remove();});
}

function launchConfetti(){
  var c=$('confetti-canvas'),ctx=c.getContext('2d');
  c.width=innerWidth;c.height=innerHeight;
  var colors=['#a78bfa','#22d3ee','#f472b6','#34d399','#fbbf24','#fff'];
  var particles=[];
  for(var i=0;i<130;i++){particles.push({x:Math.random()*c.width,y:-10-Math.random()*200,r:Math.random()*5+2,color:colors[Math.floor(Math.random()*colors.length)],vx:(Math.random()-0.5)*5,vy:Math.random()*4+2,rot:Math.random()*360,vrot:(Math.random()-0.5)*7,alpha:1});}
  var life=200;
  function draw(){ctx.clearRect(0,0,c.width,c.height);life--;particles.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.rot+=p.vrot;p.alpha=Math.min(1,life/60);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});if(life>0)requestAnimationFrame(draw);else ctx.clearRect(0,0,c.width,c.height);}
  draw();
}

