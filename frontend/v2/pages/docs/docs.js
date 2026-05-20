'use strict';

var SEARCH_INDEX = [
    {section:"s1", title:"Introduction", text:"what is atom registry architecture key concepts quick start"},
    {section:"s1-arch", title:"Architecture", text:"contracts protowriter registry resolver site registry cosmoshub cosmwasm"},
    {section:"s1-concepts", title:"Key Concepts", text:"tld domain on-chain sites permanent ownership protowriter signing"},
    {section:"s1-quickstart", title:"Quick Start", text:"keplr register name tld deploy site five minutes"},
    {section:"s2", title:"Core Platform", text:"atomregistry.com dashboard names tlds portfolio"},
    {section:"s2-connect", title:"Connecting Keplr", text:"keplr connect wallet cosmoshub-4 mainnet"},
    {section:"s2-domain", title:"Register a Domain", text:"register name search availability fee tld owner"},
    {section:"s2-tld", title:"Register a TLD", text:"register tld namespace 2.5 atom launch price revenue"},
    {section:"s2-portfolio", title:"Portfolio Management", text:"portfolio names tlds owned wallet dns records transfer"},
    {section:"s2-policy", title:"TLD Settings", text:"policy price open closed registration transfer subdomain"},
    {section:"s3", title:"On-Chain Sites", text:"on-chain sites html blockchain deploy version history fee"},
    {section:"s3-what", title:"What Is an On-Chain Site", text:"site registry html content cosmos hub version fee 5 atom 100kb"},
    {section:"s3-deploy", title:"Deploying a Site", text:"deploy html upload file preview kb limit"},
    {section:"s3-update", title:"Updating and Versions", text:"update version history query site_versions gas"},
    {section:"s3-csp", title:"CSP and Zero-JS Rule", text:"javascript blocked csp content security policy css animations svg"},
    {section:"s4", title:"Page Builder", text:"profiles on-chain page builder profile no code"},
    {section:"s4-build", title:"Building a Profile", text:"identity image links design color scheme extra content"},
    {section:"s4-image", title:"Image Upload and WebP", text:"webp conversion base64 quality canvas 100kb storage"},
    {section:"s4-deploy", title:"Deploy Profile to Chain", text:"deploy profile chain keplr 5 atom site registry"},
    {section:"s5", title:"Web3 Search and Browser", text:"search resolve domain extension chrome"},
    {section:"s5-search", title:"Using Search", text:"search page url param q= resolve overlay"},
    {section:"s5-resolve", title:"Resolution Order", text:"resolution site registry a record cname txt not found"},
    {section:"s5-ext", title:"Chrome Extension", text:"extension chrome ar shortcut popup keplr portfolio"},
    {section:"s5-install", title:"Extension Install", text:"install extension zip developer mode load unpacked chrome://extensions"},
    {section:"s6", title:"Contract Launcher", text:"smart contract launcher compile store instantiate wasm cosmwasm"},
    {section:"s6-prereq", title:"Prerequisites", text:"keplr atom github pat workflow scope repo"},
    {section:"s6-workflow", title:"GitHub Workflow", text:"build.yml github actions workflow dispatch cosmwasm optimizer"},
    {section:"s6-compile", title:"Compile via GitHub", text:"compile github actions trigger poll download wasm artifact"},
    {section:"s6-store", title:"Store and Instantiate", text:"store code instantiate msgstorercode msginstantiatecontract code id contract address tx hash"},
    {section:"s7", title:"Document to Contract", text:"document contract pipeline resume invoice deed certificate ai claude"},
    {section:"s7-concept", title:"Concept", text:"document smart contract ownership verifiable timestamped permanent"},
    {section:"s7-extract", title:"AI Field Extraction", text:"claude ai extract fields string uint128 bool addr types"},
    {section:"s7-embed", title:"Document Embedding", text:"embed document base64 128kb storage webp on-chain"},
    {section:"s7-usecases", title:"Use Cases", text:"resume invoice deed application certificate medical financial rwa"},
    {section:"s8", title:"Widget SDK", text:"widget sdk embeddable tld availability checker"},
    {section:"s8-embed", title:"Embed Methods", text:"iframe script tag html embed widget"},
    {section:"s8-options", title:"Options Reference", text:"bgcolor bordercolor btnfrom btnto accent text fontfamily borderradius width title"},
    {section:"s8-callbacks", title:"Callbacks", text:"oncheck onregister onerror onview callback"},
    {section:"s8-analytics", title:"Analytics", text:"analytics enabled url widget id session events"},
    {section:"s9", title:"Contract Reference", text:"contract reference addresses execute query messages"},
    {section:"s9-registry", title:"Registry Contract", text:"registry mint transfer setprimarydomain subdomainconfig royalty registrar marketplace authorized"},
    {section:"s9-registrar", title:"Registrar Contract", text:"registrar commit reveal commitment hash secret price tiers name length register"},
    {section:"s9-tldmanager", title:"TLD Manager Contract", text:"tld manager commit register tld 90 second delay subdomain setup pricing treasury"},
    {section:"s9-resolver", title:"Resolver Contract", text:"resolver setrecord address ipfs federation mastodon cross-chain ethereum timelock"},
    {section:"s9-marketplace", title:"Marketplace Contract", text:"marketplace listing offer auction buy sell bid finalize royalty settlement"},
    {section:"s9-metadata", title:"Metadata Contract", text:"metadata profile avatar bio website email twitter github discord telegram custom fields patch"},
    {section:"s9-dssl", title:"dSSL Manager Contract", text:"dssl trust reputation cosmos toml level spark beacon citadel attestation score expire"},
    {section:"s9-site", title:"Site Registry Contract", text:"site registry deploysite html version history fee 5 atom"},
    {section:"s9-proto", title:"ProtoWriter", text:"protowriter protobuf signing cosmjs replacement txraw txbody authinfo signdirect"},
    {section:"s10", title:"Developer Guide", text:"developer gaiad cli query integrate build"},
    {section:"s10-cli", title:"CLI Examples", text:"gaiad query wasm contract-state smart node rpc mainnet"},
    {section:"s10-query", title:"Querying Contracts", text:"rest query base64 json fetch cosmwasm wasm v1 contract smart"},
    {section:"s10-integrate", title:"Integration Guide", text:"integrate widget ownership verification protowriter pattern"},
    {section:"s11", title:"On-Chain NFTs and RWA", text:"nft rwa real world asset 128kb storage webp on-chain image"},
    {section:"s11-128k", title:"128KB Storage", text:"128kb cosmwasm state storage nft image metadata permanent"},
    {section:"s11-webp", title:"WebP On-Chain Images", text:"webp base64 quality 40 8.5kb on-chain image data url"},
    {section:"s11-rwa", title:"Real World Assets", text:"property deed vehicle title credential lease art provenance tokenize"},
    {section:"s12", title:"Deployment and Ops", text:"server deployment files layout webroot almalinux"},
    {section:"s12-server", title:"Server Setup", text:"file layout index onchain search profiles contracts docmaker browser widget extension"},
    {section:"s12-endpoints", title:"LCD Endpoints", text:"lcd rest endpoints publicnode cosmos directory lavender five polkachu"},
    {section:"s12-gas", title:"Gas and Fees", text:"gas price 0.025 uatom adjustment 1.8 simulation fee costs register deploy store"},
    {section:"s14", title:"Atom Registry Pay", text:"atomregistry pay payment intent receive send scan resolve pay qr code name cosmos atom"},
    {section:"s14-overview", title:"What is Atom Registry Pay", text:"payment intent layer name identity resolver wallet address confirmation before signing"},
    {section:"s14-default", title:"Receive payments by default", text:"default owner fallback no setup metadata optional receive payments automatic registered name"},
    {section:"s14-send", title:"Send a payment", text:"send pay link confirmation review amount preset minimum 0.01 atom keplr sign mintscan"},
    {section:"s14-qr", title:"QR codes and Receive page", text:"qr code payment intent url not wallet address receive page mode receive download copy share"},
    {section:"s14-custom", title:"Custom payment routing", text:"custom payment routing metadata override payment.cosmoshub-4.address denom label optional rotate"},
    {section:"s14-safety", title:"Safety checks", text:"safety address change warning localStorage trust copy source badge metadata owner amount validation never auto send"},
    {section:"s14-faq", title:"Atom Registry Pay FAQ", text:"faq troubleshooting non-atom denom hardware wallet ledger amino history localStorage rotate"},
  ];

function getSearchElements() {
  return {
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),
  };
}

function hideSearchResults() {
  const { searchInput, searchResults } = getSearchElements();
  if (searchResults) searchResults.style.display = "none";
  if (searchInput) searchInput.value = "";
}

function renderSearchResults(hits) {
  const { searchResults } = getSearchElements();
  if (!searchResults) return;

  searchResults.innerHTML = hits.map((hit) => `
    <button class="search-result-item" type="button" data-doc-section="${hit.section}">
      <strong>${hit.title}</strong>${hit.text.slice(0, 60)}...
    </button>
  `).join("");

  searchResults.style.display = "block";
}

function bindDocsSearch() {
  const { searchInput, searchResults } = getSearchElements();
  if (!searchInput || !searchResults) return;

  const handleSearch = () => {
    const query = searchInput.value.trim().toLowerCase();

    if (query.length < 2) {
      searchResults.style.display = "none";
      return;
    }

    const hits = SEARCH_INDEX.filter((item) => (
      item.title.toLowerCase().includes(query) || item.text.includes(query)
    )).slice(0, 8);

    if (!hits.length) {
      searchResults.style.display = "none";
      return;
    }

    renderSearchResults(hits);
  };

  const debouncedSearch = typeof debounce === 'function' ? debounce(handleSearch, 200) : handleSearch;
  searchInput.addEventListener("input", debouncedSearch);

  searchResults.addEventListener("click", (event) => {
    const resultButton = event.target.closest("[data-doc-section]");
    if (!resultButton) return;
    docScrollTo(resultButton.dataset.docSection);
    hideSearchResults();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#searchWrap")) searchResults.style.display = "none";
  });
}

function docScrollTo(id) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  document.querySelectorAll(".nav-item, .nav-sub").forEach((navItem) => {
    navItem.classList.remove("active");
  });

  const nav = document.querySelector(`[onclick="docScrollTo('${id}')"]`);
  if (nav) nav.classList.add("active");
}

function bindActiveNavObserver() {
  const allSections = document.querySelectorAll("[id^='s']");
  const allNavLinks = document.querySelectorAll(".nav-item, .nav-sub");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      allNavLinks.forEach((navItem) => {
        const onclick = navItem.getAttribute("onclick") || "";
        navItem.classList.toggle("active", onclick.includes(`'${id}'`));
      });
    });
  }, { rootMargin: "-10% 0px -80% 0px" });

  allSections.forEach((section) => observer.observe(section));
}

function bindReadProgress() {
  const progressBar = document.getElementById("readProgress");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight <= 0 ? 0 : (window.scrollY / scrollableHeight) * 100;
    progressBar.style.width = `${Math.min(100, progress)}%`;
  }, { passive: true });
}

function initDocsPage() {
  window.docScrollTo = docScrollTo;
  bindDocsSearch();
  bindActiveNavObserver();
  bindReadProgress();
}

window.ArViewInit = window.ArViewInit || {};
window.ArViewInit['docs'] = function () { initDocsPage(); };
