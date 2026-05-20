'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['docmaker'] = (function() {

const TYPE_STORE="/cosmwasm.wasm.v1.MsgStoreCode";
const TYPE_INIT="/cosmwasm.wasm.v1.MsgInstantiateContract";

const TYPE_PUBKEY=window.CFG?.TYPE_PUBKEY||"/cosmos.crypto.secp256k1.PubKey";
const GAS_PRICE=window.CFG?.GAS_PRICE??0.025;
const GAS_ADJ=window.CFG?.GAS_ADJ??1.8;
const GAS_FALLBACK_STORE=10000000;
const CHAIN_ID=window.CFG?.CHAIN_ID||"cosmoshub-4";
const LCD=window.CFG?.REST||[
  "https://cosmos-rest.publicnode.com",
  "https://rest.cosmos.directory/cosmoshub",
  "https://cosmoshub-api.lavenderfive.com"
];

function anyMsg(t,v){return new PW().s(1,t).b(2,v).fin();}
function txBody(mb,tu){return new PW().b(1,anyMsg(tu,mb)).fin();}
function modeInfoDirect(){return new PW().b(1,new PW().u64(1,1n).fin()).fin();}
function signerInfo(pk,seq){return new PW().b(1,anyMsg(TYPE_PUBKEY,new PW().b(1,pk).fin())).b(2,modeInfoDirect()).u64(3,seq).fin();}
function feeMsg(amt,gas){return new PW().b(1,new PW().s(1,"uatom").s(2,String(amt)).fin()).u64(2,BigInt(gas)).fin();}
function authInfo(pk,seq,fee,gas){return new PW().b(1,signerInfo(pk,seq)).b(2,feeMsg(fee,gas)).fin();}
function txRaw(body,auth,sig){return new PW().b(1,body).b(2,auth).b(3,sig).fin();}
function encodeMsgStoreCode(sender,wb){return new PW().s(1,sender).b(2,wb).fin();}

function encodeMsgInstantiate(sender,admin,codeId,label,initBytes){
  var pw=new PW().s(1,sender);
  if(admin) pw.s(2,admin);
  pw.u64(3,BigInt(codeId)).s(4,label).b(5,initBytes);
  return pw.fin();
}

async function getAccount(addr){
  for(var i=0;i<LCD.length;i++){
    try{
      var r=await fetch(LCD[i]+"/cosmos/auth/v1beta1/accounts/"+addr);
      if(!r.ok)continue;
      var d=await r.json();
      var a=d.account?.base_account||d.account;
      return{accountNumber:parseInt(a?.account_number||0),sequence:parseInt(a?.sequence||0)};
    }catch(e){}
  }
  return{accountNumber:0,sequence:0};
}

async function simulateGas(bb,ab){
  var sim=txRaw(bb,ab,new Uint8Array(64));
  for(var i=0;i<LCD.length;i++){
    try{
      var r=await fetch(LCD[i]+"/cosmos/tx/v1beta1/simulate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tx_bytes:toB64(sim)})
      });
      if(!r.ok)continue;
      var j=await r.json();
      var gas=parseInt((j.gas_info||{}).gas_used||0);
      if(gas>50000)return Math.ceil(gas*GAS_ADJ);
    }catch(e){}
  }
  return GAS_FALLBACK;
}

async function broadcastTx(rb){
  var last;
  for(var i=0;i<LCD.length;i++){
    try{
      var r=await fetch(LCD[i]+"/cosmos/tx/v1beta1/txs",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tx_bytes:toB64(rb),mode:"BROADCAST_MODE_SYNC"})
      });
      if(!r.ok)throw new Error("HTTP "+r.status);
      var j=await r.json();
      var res=j.tx_response||j;
      return{code:parseInt(res.code||0),txhash:res.txhash||"",rawLog:res.raw_log||""};
    }catch(e){last=e;}
  }
  throw last||new Error("Broadcast failed");
}

async function waitForTx(hash,max=12){
  for(var i=0;i<max;i++){
    await new Promise(r=>setTimeout(r,5000));
    for(var j=0;j<LCD.length;j++){
      try{
        var r=await fetch(LCD[j]+"/cosmos/tx/v1beta1/txs/"+hash);
        if(!r.ok)continue;
        var d=await r.json();
        if(d.tx_response?.code===0)return d.tx_response;
      }catch(e){}
    }
  }
  return null;
}

async function signAndBroadcast(msgBytes,typeUrl,stepsEl,barEl){
  var bodyBytes=txBody(msgBytes,typeUrl);

  addStep(stepsEl,1,"active","Fetching account...");
  var acct=await getAccount(window.userAddress);

  var ph=GAS_FALLBACK;
  var ab=authInfo(window.pubKey,acct.sequence,String(Math.ceil(ph*GAS_PRICE)),ph);

  updStep(stepsEl,1,"done","Account fetched");

  addStep(stepsEl,2,"active","Simulating gas...");
  var gasLimit=await simulateGas(bodyBytes,ab);
  var fee=String(Math.ceil(gasLimit*GAS_PRICE));
  ab=authInfo(window.pubKey,acct.sequence,fee,gasLimit);

  updStep(stepsEl,2,"done","Gas: "+gasLimit+" · Fee: "+(gasLimit*GAS_PRICE/1e6).toFixed(4)+" ATOM");
  if(barEl) barEl.style.width="35%";

  addStep(stepsEl,3,"active","Waiting for Keplr...");
  toast("Review and approve in Keplr…");

  var signResp=await window.keplr.signDirect(CHAIN_ID,window.userAddress,{
    bodyBytes,
    authInfoBytes:ab,
    chainId:CHAIN_ID,
    accountNumber:String(acct.accountNumber)
  });

  var sigBytes=unb64(signResp.signature.signature);
  var rawBytes=txRaw(signResp.signed.bodyBytes,signResp.signed.authInfoBytes,sigBytes);

  updStep(stepsEl,3,"done","Signed ✓");
  if(barEl) barEl.style.width="60%";

  addStep(stepsEl,4,"active","Broadcasting...");
  var result=await broadcastTx(rawBytes);

  if(result.code!==0) throw new Error("Chain error ("+result.code+"): "+result.rawLog.slice(0,200));

  updStep(stepsEl,4,"done","TX: "+result.txhash.slice(0,14)+"...");
  if(barEl) barEl.style.width="80%";

  addStep(stepsEl,5,"active","Confirming...");
  var confirmed=await waitForTx(result.txhash);

  updStep(stepsEl,5,"done",confirmed?"Confirmed ✓":"Broadcast accepted");
  if(barEl) barEl.style.width="100%";

  return{txhash:result.txhash,txResponse:confirmed};
}

function $(id){return document.getElementById(id);}

let toastTimer;

function toast(msg,type="ok"){
  const el=$("toast");
  if(!el)return;
  el.textContent=msg;
  el.style.borderColor=type==="error"?"rgba(239,68,68,0.4)":type==="warn"?"rgba(251,191,36,0.4)":"rgba(167,139,250,0.4)";
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove("show"),4500);
}

function addStep(c,n,state,label){
  if(!c)return;
  var el=document.createElement("div");
  el.className="tx-step"+(state==="active"?" is-active":"");
  el.id="step_"+c.id+"_"+n;
  el.innerHTML=`<span class="sn">${n}</span><span>${label}</span>`;
  c.appendChild(el);
}

function updStep(c,n,state,label){
  var el=c?.querySelector("#step_"+c.id+"_"+n);
  if(!el)return;

  el.classList.remove("is-active","is-done");
  el.classList.add(state==="done"?"is-done":"is-active");

  var sn=el.querySelector(".sn");
  if(sn)sn.innerHTML=state==="done"?"✓":n;

  var labelEl=el.querySelector("span:last-child");
  if(labelEl)labelEl.textContent=label;
}

function setStep(n){
  for(var i=1;i<=7;i++){
    var sc=$("sc"+i);
    if(!sc)continue;

    if(i<n)sc.className="step-circle done";
    else if(i===n)sc.className="step-circle active";
    else sc.className="step-circle";

    if(i<7){
      var c=$("c"+i+(i+1));
      if(c)c.className=i<n?"step-connector done":"step-connector";
    }
  }
}

function showPanel(n){
  for(var i=1;i<=7;i++){
    var p=$("p"+i);
    if(p)p.classList.add("hidden");
  }
  $("p"+n)?.classList.remove("hidden");
  setStep(n);
}

function tryAtob(s){
  try{return atob(s||"");}
  catch(e){return s||"";}
}

let docContent=null,docType="file",docBase64=null,docMimeType=null;
let extractedFields=[];
let generatedRust="";
let contractName="";
let wasmBytes=null;
let storedCodeId=null,storeTxHash=null;
let pollIntervalId=null;

const TEMPLATES={
  resume:`Name: John Smith\nEmail: john@example.com\nPhone: 555-1234\nAddress: 123 Main St\nSummary: Experienced software developer\nSkills: Rust, Python, JavaScript\nExperience: 5 years\nEducation: BS Computer Science\nEmployer: Tech Corp\nPosition: Senior Developer`,
  invoice:`Invoice Number: INV-001\nDate: 2025-01-01\nDue Date: 2025-01-31\nFrom: Sean's Company\nTo: Client Corp\nDescription: Web Development Services\nAmount: 5000\nCurrency: USD\nStatus: Unpaid\nPayment Terms: Net 30`,
  deed:`Parcel ID: 12345-678\nProperty Address: 456 Oak Ave\nCity: Lexington\nState: KY\nZip: 40502\nLegal Description: Lot 12 Block 4\nGrantor: Previous Owner\nGrantee: New Owner\nSale Price: 250000\nDate of Sale: 2025-01-01\nAcres: 0.25`,
  employment:`Applicant Name: Jane Doe\nDate: 2025-01-01\nPosition Applied: Software Engineer\nEmail: jane@example.com\nPhone: 555-5678\nAddress: 789 Pine St\nExperience Years: 3\nEducation: BS Computer Science\nAvailable Start Date: 2025-02-01\nSalary Requirement: 80000\nReferences: Available upon request`,
  nda:`Agreement Date: 2025-01-01\nDisclosing Party: Company A\nReceiving Party: Company B\nConfidential Information: Trade secrets and proprietary data\nDuration Years: 2\nJurisdiction: Kentucky\nPurpose: Business evaluation\nSigned By Disclosing: CEO Name\nSigned By Receiving: Partner Name`,
  certificate:`Certificate Title: Certificate of Completion\nRecipient Name: John Smith\nCourse: Advanced Rust Programming\nIssuer: Atom Academy\nIssue Date: 2025-01-01\nExpiry Date: 2027-01-01\nCertificate ID: CERT-2025-001\nScore: 95\nInstructor: Dr. Jane Smith`
};

function setActiveDocTab(name){
  document.querySelectorAll(".doc-tab-btn").forEach(b=>{
    b.classList.toggle("active-doc-tab",b.dataset.doc===name);
  });

  ["doc-file","doc-text","doc-type"].forEach(id=>$(id)?.classList.add("hidden"));
  $("doc-"+name)?.classList.remove("hidden");

  docType=name;
}

document.querySelectorAll(".doc-tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    setActiveDocTab(btn.dataset.doc);
  });
});

document.querySelectorAll(".template-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".template-btn").forEach(b=>b.classList.remove("is-selected"));
    btn.classList.add("is-selected");

    const tmpl=TEMPLATES[btn.dataset.template]||"";
    $("docText").value=tmpl;
    $("docDescription").value=btn.dataset.template+" document";

    setActiveDocTab("text");
    toast("Template loaded - click Extract Fields");
  });
});

const dz=$("docDropZone");

$("docBrowseBtn")?.addEventListener("click",()=>$("docFile").click());
dz?.addEventListener("click",()=>$("docFile").click());
dz?.addEventListener("dragover",e=>{e.preventDefault();dz.classList.add("over");});
dz?.addEventListener("dragleave",()=>dz.classList.remove("over"));
dz?.addEventListener("drop",e=>{
  e.preventDefault();
  dz.classList.remove("over");
  handleDocFile(e.dataTransfer.files[0]);
});
$("docFile")?.addEventListener("change",e=>handleDocFile(e.target.files[0]));

async function handleDocFile(file){
  if(!file) return;

  const reader=new FileReader();

  reader.onload=async e=>{
    const buf=e.target.result;

    if(file.type.startsWith("image/")||file.name.endsWith(".pdf")){
      docBase64=toB64(new Uint8Array(buf));
      docMimeType=file.type||"image/jpeg";
      docContent=null;
    } else {
      docContent=new TextDecoder().decode(buf);
      docBase64=null;
    }

    $("docFileName").textContent=file.name;
    $("docFileSize").textContent=(file.size/1024).toFixed(1)+" KB";
    $("docFileStats").classList.remove("hidden");
    dz.style.display="none";

    toast("Loaded: "+file.name);
  };

  reader.readAsArrayBuffer(file);
}

$("docClearBtn")?.addEventListener("click",()=>{
  docContent=null;
  docBase64=null;
  $("docFileStats").classList.add("hidden");
  dz.style.display="";
});

$("continueP1Btn")?.addEventListener("click",()=>{
  if(!$("claudeKey").value.trim()){
    toast("Enter your Claude API key","error");
    return;
  }

  if(!$("githubPat").value.trim()){
    toast("Enter your GitHub PAT","error");
    return;
  }

  if(!$("githubRepo").value.trim()){
    toast("Enter your GitHub repo","error");
    return;
  }

  showPanel(2);
  toast("Configuration saved ✓");
});

$("extractBtn")?.addEventListener("click",async()=>{
  const apiKey=$("claudeKey").value.trim();

  if(!apiKey){
    toast("Enter Claude API key first","error");
    return;
  }

  let textContent=null,imageData=null,imageMime=null;

  if(docType==="text"){
    textContent=$("docText").value.trim();
    if(!textContent){
      toast("Paste some document text first","error");
      return;
    }
  } else if(docType==="file"){
    if(!docContent&&!docBase64){
      toast("Upload a document first","error");
      return;
    }
    textContent=docContent;
    imageData=docBase64;
    imageMime=docMimeType;
  } else {
    textContent=$("docText").value.trim();
    if(!textContent){
      toast("Select a template first","error");
      return;
    }
  }

  const desc=$("docDescription").value.trim()||"document";
  const btn=$("extractBtn");

  btn.disabled=true;
  btn.innerHTML=`<span class="spin-icon mr-2"></span> Extracting fields with Claude AI...`;

  try{
    const userContent=[];

    if(imageData){
      userContent.push({
        type:"image",
        source:{type:"base64",media_type:imageMime,data:imageData}
      });
    }

    userContent.push({
      type:"text",
      text:`Analyze this ${desc} and extract ALL fields/data points you can identify. Return ONLY a JSON array like this, nothing else:
[
  {"name":"field_name","type":"String","value":"example value","description":"what this field represents"},
  {"name":"amount","type":"Uint128","value":"5000","description":"monetary amount"},
  {"name":"is_verified","type":"bool","value":"false","description":"verification status"},
  {"name":"recipient","type":"Addr","value":"","description":"blockchain address"}
]

Rules for types:
- String: names, addresses, descriptions, IDs, dates as strings, text fields
- Uint128: monetary amounts, counts, numeric values (convert to integer, remove decimals)
- bool: yes/no, true/false, verified/unverified fields
- Addr: fields that would hold a blockchain wallet address

Make field names snake_case. Include ALL fields you can identify. Also include standard smart contract fields: owner (Addr), created_at (String for date), document_type (String), document_hash (String).${textContent?"\n\nDocument content:\n"+textContent:""}`
    });

    const resp=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":apiKey,
        "anthropic-version":"2023-06-01"
      },
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:2000,
        messages:[{role:"user",content:userContent}]
      })
    });

    if(!resp.ok){
      const err=await resp.json();
      throw new Error(err.error?.message||"Claude API error "+resp.status);
    }

    const data=await resp.json();
    const text=data.content[0].text;

    const jsonMatch=text.match(/\[[\s\S]*\]/);
    if(!jsonMatch) throw new Error("Could not parse fields from Claude response");

    extractedFields=JSON.parse(jsonMatch[0]);

    renderFields();
    showPanel(3);
    toast("Extracted "+extractedFields.length+" fields ✓");

  }catch(e){
    toast("Extraction failed: "+e.message,"error");
  }finally{
    btn.disabled=false;
    btn.innerHTML=`<i class="fas fa-brain mr-2"></i> Extract Fields with AI`;
  }
});

function renderFields(){
  const list=$("fieldsList");
  list.innerHTML="";

  extractedFields.forEach((f,i)=>{
    const row=document.createElement("div");
    row.className="field-row";

    row.innerHTML=`
      <input type="text" value="${esc(f.name)}" class="field-name-input" data-idx="${i}" placeholder="field_name"/>
      <select class="field-type-select" data-idx="${i}">
        <option value="String" ${f.type==="String"?"selected":""}>String</option>
        <option value="Uint128" ${f.type==="Uint128"?"selected":""}>Uint128</option>
        <option value="bool" ${f.type==="bool"?"selected":""}>Bool</option>
        <option value="Addr" ${f.type==="Addr"?"selected":""}>Addr</option>
        <option value="Option<String>" ${f.type==="Option<String>"?"selected":""}>Option&lt;String&gt;</option>
        <option value="Vec<String>" ${f.type==="Vec<String>"?"selected":""}>Vec&lt;String&gt;</option>
      </select>
      <button class="text-red-400 hover:text-red-300 text-xs px-2" onclick="removeField(${i})" type="button"><i class="fas fa-xmark"></i></button>
    `;

    list.appendChild(row);
  });

  $("fieldCount").textContent=extractedFields.length+" fields";

  list.querySelectorAll(".field-name-input").forEach(el=>{
    el.addEventListener("input",e=>{
      extractedFields[e.target.dataset.idx].name=e.target.value;
    });
  });

  list.querySelectorAll(".field-type-select").forEach(el=>{
    el.addEventListener("change",e=>{
      extractedFields[e.target.dataset.idx].type=e.target.value;
    });
  });
}

function removeField(i){
  extractedFields.splice(i,1);
  renderFields();
}

window.removeField=removeField;

$("addFieldBtn")?.addEventListener("click",()=>{
  const name=$("newFieldName").value.trim();

  if(!name){
    toast("Enter a field name","error");
    return;
  }

  extractedFields.push({
    name,
    type:$("newFieldType").value,
    value:"",
    description:""
  });

  $("newFieldName").value="";
  renderFields();
});

function esc(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

$("generateRustBtn")?.addEventListener("click",async()=>{
  const apiKey=$("claudeKey").value.trim();

  if(!extractedFields.length){
    toast("No fields to generate from","error");
    return;
  }

  const btn=$("generateRustBtn");
  btn.disabled=true;
  btn.innerHTML=`<span class="spin-icon mr-2"></span> Generating Rust contract with Claude...`;

  const includeDoc=$("includeDocContent").checked;
  const docDesc=$("docDescription").value.trim()||"document";
  const fieldList=extractedFields.map(f=>`  ${f.name}: ${f.type}`).join(",\n");

  try{
    const prompt=`Generate a complete, production-ready CosmWasm smart contract in Rust for storing and managing a "${docDesc}".

The contract state should have these exact fields:
${fieldList}
${includeDoc?"\nAlso include: document_content: String  (for storing full document as base64)":""}

Requirements:
1. Use cosmwasm-std 1.5, cw-storage-plus 1.2, cw2 1.1, schemars 0.8, serde 1.0, thiserror 1.0
2. Complete Cargo.toml with [lib] crate-type = ["cdylib", "rlib"]
3. lib.rs, contract.rs, state.rs, msg.rs, error.rs - ALL in one file separated by // === FILENAME: xxx.rs === comments
4. InstantiateMsg with all fields as optional except owner
5. ExecuteMsg: UpdateField variants for each field, Verify {}, TransferOwnership {new_owner: String}, AddAttestation {content: String}
6. QueryMsg: GetDocument {}, GetField {name: String}, IsVerified {}, GetOwner {}
7. State: Item<DocumentData> for main doc, Item<Vec<String>> for attestations
8. Full error types with thiserror
9. set_contract_version in instantiate
10. All arithmetic must use checked_add/checked_sub
11. Complete integration tests using cw-multi-test

Return ONLY the Rust code. Start with // === FILENAME: Cargo.toml ===`;

    const resp=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":apiKey,
        "anthropic-version":"2023-06-01"
      },
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:8000,
        messages:[{role:"user",content:prompt}]
      })
    });

    if(!resp.ok){
      const err=await resp.json();
      throw new Error(err.error?.message||"Claude API error");
    }

    const data=await resp.json();
    generatedRust=data.content[0].text;

    const nameMatch=generatedRust.match(/name\s*=\s*"([^"]+)"/);
    contractName=nameMatch?nameMatch[1]:"document-contract";
    contractName=contractName.replace(/[^a-z0-9-]/g,"-");

    $("rustCodeBlock").textContent=generatedRust;
    $("rustLines").textContent=generatedRust.split("\n").length;
    $("rustFields").textContent=extractedFields.length;
    $("rustSize").textContent=(new TextEncoder().encode(generatedRust).length/1024).toFixed(1)+" KB";
    $("displayRepo").textContent=$("githubRepo").value;
    $("displayBranch").textContent=$("githubBranch").value||"main";
    $("displayContractName").textContent=contractName;

    const initObj={};

    extractedFields.forEach(f=>{
      if(f.name==="owner") initObj.owner=null;
      else if(f.type==="Uint128") initObj[f.name]="0";
      else if(f.type==="bool") initObj[f.name]=false;
      else if(f.type==="Addr") initObj[f.name]=null;
      else initObj[f.name]=f.value||null;
    });

    if(includeDoc) initObj.document_content=docBase64?btoa(docContent||""):null;

    $("deployInitMsg").value=JSON.stringify(initObj,null,2);
    $("deployLabel").value=docDesc+" Contract";

    showPanel(4);
    toast("Rust contract generated - "+generatedRust.split("\n").length+" lines ✓");

  }catch(e){
    toast("Generation failed: "+e.message,"error");
  }finally{
    btn.disabled=false;
    btn.innerHTML=`<i class="fas fa-code mr-2"></i> Generate Rust Contract`;
  }
});

function copyRust(){
  navigator.clipboard.writeText(generatedRust).then(()=>toast("Copied!"));
}

function downloadRust(){
  const blob=new Blob([generatedRust],{type:"text/plain"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=contractName+"-contract.rs";
  a.click();
}

window.copyRust=copyRust;
window.downloadRust=downloadRust;

$("pushAndCompileBtn")?.addEventListener("click",async()=>{
  const pat=$("githubPat").value.trim();
  const repoStr=$("githubRepo").value.trim();
  const branch=$("githubBranch").value.trim()||"main";

  if(!pat||!repoStr){
    toast("Enter GitHub PAT and repo","error");
    return;
  }

  const [owner,repo]=repoStr.split("/");

  if(!owner||!repo){
    toast("Repo must be owner/repo format","error");
    return;
  }

  const btn=$("pushAndCompileBtn");
  btn.disabled=true;
  btn.innerHTML=`<span class="spin-icon mr-2"></span> Pushing to GitHub...`;

  showPanel(5);
  $("c5Repo").textContent=repoStr;
  c5log("Parsing generated contract...");

  try{
    const files=parseRustFiles(generatedRust,contractName);

    c5log("Pushing "+Object.keys(files).length+" files to "+repoStr+"/"+branch+"...");
    $("c5ProgFill").style.width="10%";

    for(const [path,content] of Object.entries(files)){
      await pushFileToGitHub(owner,repo,branch,pat,path,content);
      c5log("Pushed: "+path);
    }

    $("c5ProgFill").style.width="30%";
    c5log("All files pushed. Triggering GitHub Actions...");

    const trigResp=await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/build.yml/dispatches`,{
      method:"POST",
      headers:{
        "Authorization":"token "+pat,
        "Accept":"application/vnd.github.v3+json",
        "Content-Type":"application/json"
      },
      body:JSON.stringify({ref:branch,inputs:{contract_path:"."}})
    });

    if(trigResp.status!==204){
      const err=await trigResp.json();
      throw new Error(err.message||"Trigger failed "+trigResp.status);
    }

    c5log("Build triggered! Polling for status...");
    $("c5ProgFill").style.width="35%";
    updateCompileStatus("running","Building on GitHub...");

    await new Promise(r=>setTimeout(r,5000));
    pollBuild(owner,repo,branch,pat);

  }catch(e){
    toast("Push failed: "+e.message,"error");
    btn.disabled=false;
    btn.innerHTML=`<i class="fab fa-github mr-2"></i> Push to GitHub & Compile`;
    showPanel(4);
  }
});

function parseRustFiles(rustCode,cname){
  const files={};
  const sections=rustCode.split(/\/\/\s*===\s*FILENAME:\s*/);

  for(const sec of sections){
    if(!sec.trim()) continue;

    const lines=sec.split("\n");
    const filename=lines[0].replace(/\s*===/,"").trim();
    const content=lines.slice(1).join("\n").trim();

    if(filename&&content){
      if(filename==="Cargo.toml") files["Cargo.toml"]=content;
      else files["src/"+filename]=content;
    }
  }

  if(!files["src/lib.rs"]){
    files["src/lib.rs"]="pub mod contract;\npub mod error;\npub mod msg;\npub mod state;\n";
  }

  files[".github/workflows/build.yml"]=`name: Build CosmWasm Contract
on:
  workflow_dispatch:
    inputs:
      contract_path:
        required: false
        default: "."
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: |
          cd \${{ github.event.inputs.contract_path }}
          docker run --rm -v "$(pwd)":/code --mount type=volume,source="$(basename $(pwd))_cache",target=/target --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry cosmwasm/optimizer:0.16.0
      - uses: actions/upload-artifact@v4
        with:
          name: contract-wasm
          path: \${{ github.event.inputs.contract_path }}/artifacts/*.wasm
          retention-days: 7`;

  return files;
}

async function pushFileToGitHub(owner,repo,branch,pat,path,content){
  let sha=null;

  try{
    const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,{
      headers:{
        "Authorization":"token "+pat,
        "Accept":"application/vnd.github.v3+json"
      }
    });

    if(r.ok){
      const d=await r.json();
      sha=d.sha;
    }
  }catch(e){}

  const body={
    message:`Update ${path} - generated by Atom Registry Doc Contract Maker`,
    content:btoa(unescape(encodeURIComponent(content))),
    branch
  };

  if(sha) body.sha=sha;

  const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,{
    method:"PUT",
    headers:{
      "Authorization":"token "+pat,
      "Accept":"application/vnd.github.v3+json",
      "Content-Type":"application/json"
    },
    body:JSON.stringify(body)
  });

  if(!r.ok){
    const err=await r.json();
    throw new Error("Failed to push "+path+": "+err.message);
  }
}

function c5log(msg){
  const el=$("c5Log");
  const div=document.createElement("div");
  div.className="text-xs text-gray-500 mono";
  div.textContent=new Date().toLocaleTimeString()+" - "+msg;
  el.appendChild(div);
  el.scrollTop=el.scrollHeight;
}

function updateCompileStatus(type,text){
  const pill=$("compilePill");
  $("compileStatusTxt").textContent=text;
  pill.className="text-xs px-3 py-1 rounded-full status-"+type;
}

async function pollBuild(owner,repo,branch,pat){
  let polls=0;
  const startTime=Date.now();

  pollIntervalId=setInterval(async()=>{
    polls++;

    if(polls>60){
      clearInterval(pollIntervalId);
      toast("Build timeout - check GitHub","warn");
      return;
    }

    try{
      const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${branch}&per_page=5`,{
        headers:{
          "Authorization":"token "+pat,
          "Accept":"application/vnd.github.v3+json"
        }
      });

      const d=await r.json();
      const run=(d.workflow_runs||[]).find(r=>r.path?.includes("build.yml")||r.name==="Build CosmWasm Contract");

      if(!run) return;

      const elapsed=Math.floor((Date.now()-startTime)/1000);

      $("c5RunLink").textContent="Run #"+run.id;
      $("c5RunLink").href=run.html_url;
      $("c5Duration").textContent=elapsed+"s";
      $("c5ProgFill").style.width=Math.min(90,35+elapsed)+"%";

      if(run.status==="completed"){
        clearInterval(pollIntervalId);

        if(run.conclusion==="success"){
          updateCompileStatus("success","Build succeeded ✓");
          $("c5ProgFill").style.width="100%";
          c5log("Build succeeded! Downloading .wasm artifact...");
          toast("Compiled! Downloading .wasm...");
          await downloadAndProceed(owner,repo,run.id,pat);
        } else {
          updateCompileStatus("failed","Build failed ✗");
          c5log("Build failed. Check GitHub Actions for details.");
          toast("Build failed - check GitHub Actions","error");
          $("pushAndCompileBtn").disabled=false;
          $("pushAndCompileBtn").innerHTML=`<i class="fab fa-github mr-2"></i> Push to GitHub & Compile`;
        }
      }
    }catch(e){
      c5log("Poll error: "+e.message);
    }
  },5000);
}

async function downloadAndProceed(owner,repo,runId,pat){
  try{
    const artResp=await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,{
      headers:{
        "Authorization":"token "+pat,
        "Accept":"application/vnd.github.v3+json"
      }
    });

    const artData=await artResp.json();
    const artifact=(artData.artifacts||[]).find(a=>a.name==="contract-wasm");

    if(!artifact) throw new Error("No artifact found");

    const dlResp=await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`,{
      headers:{
        "Authorization":"token "+pat,
        "Accept":"application/vnd.github.v3+json"
      }
    });

    if(!dlResp.ok) throw new Error("Download failed");

    const zipBuf=await dlResp.arrayBuffer();
    const wasmFile=extractWasmFromZip(zipBuf);

    if(!wasmFile) throw new Error("No .wasm in artifact");

    wasmBytes=wasmFile.bytes;

    c5log("Downloaded: "+wasmFile.name+" ("+(wasmFile.bytes.length/1024).toFixed(1)+"KB)");
    $("p6WasmInfo").textContent=wasmFile.name+" · "+(wasmFile.bytes.length/1024).toFixed(1)+" KB";

    toast("Downloaded "+wasmFile.name+" - ready to deploy!");
    showPanel(6);

  }catch(e){
    toast("Artifact download failed: "+e.message,"error");
    c5log("Download error: "+e.message);
  }
}

function extractWasmFromZip(buffer){
  const view=new DataView(buffer);
  const bytes=new Uint8Array(buffer);
  let offset=0;

  while(offset<bytes.length-4){
    if(view.getUint32(offset,true)===0x04034b50){
      const fnLen=view.getUint16(offset+26,true);
      const exLen=view.getUint16(offset+28,true);
      const compSz=view.getUint32(offset+18,true);
      const fn_=new TextDecoder().decode(bytes.slice(offset+30,offset+30+fnLen));
      const dataStart=offset+30+fnLen+exLen;

      if(fn_.endsWith(".wasm")){
        return{name:fn_.split("/").pop(),bytes:bytes.slice(dataStart,dataStart+compSz)};
      }

      offset=dataStart+compSz;
    } else {
      offset++;
    }
  }

  return null;
}

let deployCodeId=null,deployStoreTxHash=null;

$("storeBtn")?.addEventListener("click",async()=>{
  if(!wasmBytes){
    toast("Need compiled .wasm","error");
    return;
  }

  if(!window.userAddress){
    if(typeof openWalletModal==="function")openWalletModal();
    toast("Connect wallet from the top menu first","error");
    return;
  }

  const btn=$("storeBtn");
  btn.disabled=true;
  btn.innerHTML=`<span class="spin-icon mr-2"></span> Storing...`;

  $("storeProg").classList.remove("hidden");
  $("storeSteps").innerHTML="";
  $("storeProgFill").style.width="0%";

  try{
    const msgBytes=encodeMsgStoreCode(window.userAddress,wasmBytes);
    const result=await signAndBroadcast(msgBytes,TYPE_STORE,$("storeSteps"),$("storeProgFill"));

    deployStoreTxHash=result.txhash;

    let codeId=null;

    if(result.txResponse){
      for(const ev of (result.txResponse.events||[])){
        const attr=(ev.attributes||[]).find(a=>a.key==="code_id"||tryAtob(a.key)==="code_id");
        if(attr){
          codeId=attr.value||tryAtob(attr.value);
          break;
        }
      }

      if(!codeId){
        for(const log of (result.txResponse.logs||[])){
          for(const ev of (log.events||[])){
            const attr=(ev.attributes||[]).find(a=>a.key==="code_id");
            if(attr){
              codeId=attr.value;
              break;
            }
          }
        }
      }
    }

    if(!codeId){
      await new Promise(r=>setTimeout(r,3000));

      for(const ep of LCD){
        try{
          const r=await fetch(`${ep}/cosmwasm/wasm/v1/code?pagination.limit=1&pagination.reverse=true`);
          if(!r.ok)continue;
          const d=await r.json();
          codeId=d.code_infos?.[0]?.code_id;
          if(codeId)break;
        }catch(e){}
      }
    }

    deployCodeId=codeId;

    $("deployCodeId").textContent=codeId||"(check Mintscan)";
    $("deployStoreTx").textContent=deployStoreTxHash;
    $("deployStoreTx").href=`https://www.mintscan.io/cosmos/tx/${deployStoreTxHash}`;

    $("storeResCard").classList.remove("hidden");
    $("initBtn").classList.remove("hidden");
    $("storeBtn").classList.add("hidden");

    setStep(6);
    toast("Code stored! Code ID: "+codeId);

  }catch(e){
    const msg=e.message||String(e);

    if(/rejected|denied|cancel/i.test(msg)) toast("Cancelled","warn");
    else toast("Store failed: "+msg.slice(0,100),"error");

  }finally{
    btn.disabled=false;
    btn.innerHTML=`<i class="fas fa-upload mr-2"></i> Store Contract On-Chain`;
  }
});

$("initBtn")?.addEventListener("click",async()=>{
  if(!deployCodeId) return;

  if(!window.userAddress){
    if(typeof openWalletModal==="function")openWalletModal();
    toast("Connect wallet from the top menu first","error");
    return;
  }

  const initMsgRaw=$("deployInitMsg").value.trim();

  if(!initMsgRaw){
    toast("Enter init message","error");
    return;
  }

  try{
    JSON.parse(initMsgRaw);
  }catch(e){
    toast("Invalid JSON","error");
    return;
  }

  const label=$("deployLabel").value.trim()||"Document Contract";
  const admin=$("deployAdmin").value.trim()||null;
  const btn=$("initBtn");

  btn.disabled=true;
  btn.innerHTML=`<span class="spin-icon mr-2"></span> Instantiating...`;

  $("initProg").classList.remove("hidden");
  $("initSteps").innerHTML="";
  $("initProgFill").style.width="0%";

  try{
    const initMsgBytes=new TextEncoder().encode(initMsgRaw);
    const msgBytes=encodeMsgInstantiate(window.userAddress,admin,deployCodeId,label,initMsgBytes);
    const result=await signAndBroadcast(msgBytes,TYPE_INIT,$("initSteps"),$("initProgFill"));

    let contractAddr=null;

    if(result.txResponse){
      for(const ev of (result.txResponse.events||[])){
        const attr=(ev.attributes||[]).find(a=>{
          const k=a.key||"";
          return k==="contract_address"||k==="_contract_address"||tryAtob(k)==="contract_address"||tryAtob(k)==="_contract_address";
        });

        if(attr){
          contractAddr=attr.value||tryAtob(attr.value);
          break;
        }
      }

      if(!contractAddr){
        for(const log of (result.txResponse.logs||[])){
          for(const ev of (log.events||[])){
            const attr=(ev.attributes||[]).find(a=>a.key==="contract_address"||a.key==="_contract_address");
            if(attr){
              contractAddr=attr.value;
              break;
            }
          }
        }
      }
    }

    $("doneAddr").textContent=contractAddr||"(check Mintscan)";
    $("doneAddrBlock").textContent=contractAddr||"Check Mintscan";
    $("doneCode").textContent=deployCodeId;
    $("doneDocType").textContent=$("docDescription").value||"document";
    $("doneFieldCount").textContent=extractedFields.length+" fields";

    $("doneStoreTx").textContent=deployStoreTxHash;
    $("doneStoreTx").href=`https://www.mintscan.io/cosmos/tx/${deployStoreTxHash}`;

    $("doneInitTx").textContent=result.txhash;
    $("doneInitTx").href=`https://www.mintscan.io/cosmos/tx/${result.txhash}`;

    if(contractAddr){
      $("doneQueryCmd").textContent=`gaiad query wasm contract-state smart ${contractAddr} '{"get_document":{}}' --node https://cosmos-rpc.publicnode.com:443 -o json`;
    }

    showPanel(7);
    toast("Document deployed on-chain! "+contractAddr?.slice(0,20)+"...");

  }catch(e){
    const msg=e.message||String(e);

    if(/rejected|denied|cancel/i.test(msg)) toast("Cancelled","warn");
    else toast("Instantiate failed: "+msg.slice(0,100),"error");

  }finally{
    btn.disabled=false;
    btn.innerHTML=`<i class="fas fa-rocket mr-2"></i> Instantiate Contract`;
  }
});

$("startOverBtn")?.addEventListener("click",()=>{
  extractedFields=[];
  generatedRust="";
  wasmBytes=null;
  deployCodeId=null;
  deployStoreTxHash=null;
  docContent=null;
  docBase64=null;

  $("docText").value="";
  $("docDescription").value="";
  $("docFileStats").classList.add("hidden");
  $("docDropZone").style.display="";

  $("storeResCard").classList.add("hidden");
  $("initBtn").classList.add("hidden");
  $("storeBtn").classList.remove("hidden");
  $("storeProg").classList.add("hidden");
  $("initProg").classList.add("hidden");

  showPanel(2);
});

setActiveDocTab("file");

})();
