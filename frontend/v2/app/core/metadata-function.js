'use strict';

(function(){
  var initialized = false;
  var activeTemplateKey = '';
  var selectedTemplateKeys = [];
  var lastOwnedRows = [];
  var lastPreviewDomain = '';
  var lastPreviewRows = [];

  var draftValues = {};
  var draftPublic = {};

  function captureDraftFromDom(){
    var host = byId && byId('selectedFieldsBuilder');
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.meta-v2-selected-row'), function(row){
      var key = row.getAttribute('data-key');
      if (!key) return;
      var input = row.querySelector('[data-role="value"]');
      var visibility = row.querySelector('[data-role="visibility"]');
      if (input) draftValues[key] = String(input.value || '');
      if (visibility) draftPublic[key] = visibility.getAttribute('data-public') === 'true';
    });
  }
  function clearDraftForKey(key){
    delete draftValues[key];
    delete draftPublic[key];
  }
  function clearAllDrafts(){
    draftValues = {};
    draftPublic = {};
  }

  var FIELD_GROUPS = [
    {
      name: 'Identity',
      fields: ['avatar', 'displayName', 'bio', 'location']
    },
    {
      name: 'Links',
      fields: ['website', 'twitter', 'github', 'telegram', 'discord']
    },
    {
      name: 'Project',
      fields: ['projectName', 'projectType', 'docs', 'whitepaper', 'repository']
    },
    {
      name: 'Contact',
      fields: ['email', 'support', 'security']
    },
    {
      name: 'Developer',
      fields: ['api', 'manifest', 'redirect', 'contentHash']
    },
    {
      name: 'Payments',
      description: 'Custom payment routing. By default, payments resolve to the domain owner address. Add a payment address only if you want payments routed to a different wallet.',
      fields: ['payment.cosmoshub-4.address', 'payment.cosmoshub-4.denom', 'payment.cosmoshub-4.label', 'privacy.hide_address', 'did', 'verificationMethod']
    }
  ];

  var FIELD_DEFS = {
    avatar: {
      label: 'Avatar', shortHint: 'Image shown on this domain profile', icon: 'fa-image', type: 'url', recommendedPublic: true,
      placeholder: 'https://example.com/avatar.png',
      help: 'Use a direct HTTPS image URL. PNG, JPG, WebP, GIF and SVG are supported by the UI preview.',
      normalize: normalizeUrl,
      validate: function(v){ return isHttpsUrl(v) && /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(v); }
    },
    displayName: {
      label: 'Display name', shortHint: 'Human-readable profile name', icon: 'fa-signature', type: 'text', recommendedPublic: true,
      placeholder: 'Cosmos Hub',
      help: 'Human-readable name displayed above or beside the domain.',
      validate: function(v){ return v.length > 0 && v.length <= 64; }
    },
    bio: {
      label: 'Bio', shortHint: 'Short public profile description', icon: 'fa-align-left', type: 'text', recommendedPublic: true,
      placeholder: 'Short description of this domain or project',
      help: 'Keep it short. Recommended maximum: 180 characters.',
      validate: function(v){ return v.length > 0 && v.length <= 180; }
    },
    location: {
      label: 'Location', shortHint: 'Optional place or region', icon: 'fa-location-dot', type: 'text', recommendedPublic: true,
      placeholder: 'Internet / Cosmos ecosystem',
      help: 'Optional public location or ecosystem context.',
      validate: function(v){ return v.length > 0 && v.length <= 80; }
    },
    website: {
      label: 'Website', shortHint: 'Primary public website', icon: 'fa-globe', type: 'url', recommendedPublic: true,
      placeholder: 'https://example.com',
      help: 'Primary public website connected to this domain.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    twitter: {
      label: 'Twitter / X', shortHint: 'Social profile handle or URL', icon: 'fa-brands fa-x-twitter', type: 'handle', recommendedPublic: true,
      placeholder: '@handle or https://x.com/handle',
      help: 'A public social handle. You can paste @handle or a full X URL.',
      normalize: normalizeHandle,
      validate: function(v){ return /^[A-Za-z0-9_]{1,15}$/.test(stripAt(v)); }
    },
    github: {
      label: 'GitHub', shortHint: 'Developer or project profile', icon: 'fa-brands fa-github', type: 'handle', recommendedPublic: true,
      placeholder: 'org, user or https://github.com/org',
      help: 'GitHub organization, user or repository associated with this domain.',
      normalize: normalizeGithub,
      validate: function(v){ return /^[A-Za-z0-9_.-]{1,80}(\/[A-Za-z0-9_.-]{1,100})?$/.test(v); }
    },
    telegram: {
      label: 'Telegram', shortHint: 'Community or contact channel', icon: 'fa-brands fa-telegram', type: 'handle', recommendedPublic: true,
      placeholder: '@channel or https://t.me/channel',
      help: 'Telegram handle or channel name.',
      normalize: normalizeTelegram,
      validate: function(v){ return /^[A-Za-z0-9_]{5,64}$/.test(stripAt(v)); }
    },
    discord: {
      label: 'Discord', shortHint: 'Community invite or server', icon: 'fa-brands fa-discord', type: 'text', recommendedPublic: true,
      placeholder: 'https://discord.gg/invite or community name',
      help: 'Discord invite URL or public community name.',
      normalize: normalizeUrlOrText,
      validate: function(v){ return v.length > 1 && v.length <= 120; }
    },
    projectName: {
      label: 'Project name', shortHint: 'Official project identity', icon: 'fa-diagram-project', type: 'text', recommendedPublic: true,
      placeholder: 'Atom Registry',
      help: 'Project or organization name represented by this domain.',
      validate: function(v){ return v.length > 0 && v.length <= 80; }
    },
    projectType: {
      label: 'Project type', shortHint: 'Category, product or protocol', icon: 'fa-layer-group', type: 'text', recommendedPublic: true,
      placeholder: 'wallet, explorer, protocol, DAO, dApp',
      help: 'Short category to help apps understand the domain context.',
      validate: function(v){ return v.length > 0 && v.length <= 60; }
    },
    docs: {
      label: 'Docs', shortHint: 'Documentation link', icon: 'fa-book', type: 'url', recommendedPublic: true,
      placeholder: 'https://docs.example.com',
      help: 'Documentation URL for the project or domain.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    whitepaper: {
      label: 'Whitepaper', shortHint: 'Research or whitepaper link', icon: 'fa-file-lines', type: 'url', recommendedPublic: true,
      placeholder: 'https://example.com/whitepaper.pdf',
      help: 'Public whitepaper, specification or long-form reference document.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    repository: {
      label: 'Repository', shortHint: 'Source code repository', icon: 'fa-code', type: 'url', recommendedPublic: true,
      placeholder: 'https://github.com/org/repo',
      help: 'Public code repository URL.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    email: {
      label: 'Email', shortHint: 'Public contact address', icon: 'fa-envelope', type: 'email', recommendedPublic: false,
      placeholder: 'hello@example.com',
      help: 'Only publish public inboxes. Avoid private personal email addresses.',
      validate: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    },
    support: {
      label: 'Support', shortHint: 'Support page or channel', icon: 'fa-life-ring', type: 'text', recommendedPublic: true,
      placeholder: 'https://support.example.com or support@example.com',
      help: 'Support URL, public inbox or help desk reference.',
      normalize: normalizeUrlOrText,
      validate: function(v){ return v.length > 2 && v.length <= 160; }
    },
    security: {
      label: 'Security contact', shortHint: 'Vulnerability disclosure contact', icon: 'fa-shield-halved', type: 'text', recommendedPublic: true,
      placeholder: 'security@example.com or security policy URL',
      help: 'Public security contact or disclosure policy. Do not paste secrets.',
      normalize: normalizeUrlOrText,
      validate: function(v){ return v.length > 2 && v.length <= 160; }
    },
    api: {
      label: 'API', shortHint: 'Developer API endpoint', icon: 'fa-plug', type: 'url', recommendedPublic: true,
      placeholder: 'https://api.example.com',
      help: 'Public API endpoint associated with the domain.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    manifest: {
      label: 'Manifest', shortHint: 'App-readable metadata manifest', icon: 'fa-file-code', type: 'url', recommendedPublic: true,
      placeholder: 'https://example.com/manifest.json',
      help: 'Public app or identity manifest URL.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    redirect: {
      label: 'Redirect', shortHint: 'Preferred redirect target', icon: 'fa-arrow-up-right-from-square', type: 'url', recommendedPublic: true,
      placeholder: 'https://example.com',
      help: 'Canonical redirect target for apps that support metadata routing.',
      normalize: normalizeUrl,
      validate: isHttpsUrl
    },
    contentHash: {
      label: 'Content hash', shortHint: 'Decentralized content pointer', icon: 'fa-cube', type: 'text', recommendedPublic: true,
      placeholder: 'ipfs://... or ar://...',
      help: 'Content-addressed reference such as IPFS or Arweave URI.',
      validate: function(v){ return /^(ipfs:\/\/|ar:\/\/|bafy|Qm|[A-Za-z0-9_-]{32,})/.test(v); }
    },
    'payment.cosmoshub-4.address': {
      label: 'Payment address (Cosmos Hub)', shortHint: 'Optional override - route payments to a custom wallet', icon: 'fa-wallet', type: 'text', recommendedPublic: true,
      placeholder: 'cosmos1...',
      help: 'Optional override. If empty, payments use the domain owner address. Set this only when you want payments routed to a different wallet.',
      validate: function(v){ return /^cosmos1[a-z0-9]{30,}$/i.test(v); }
    },
    'payment.cosmoshub-4.denom': {
      label: 'Payment denom (Cosmos Hub)', shortHint: 'Optional - defaults to uatom (ATOM)', icon: 'fa-coins', type: 'text', recommendedPublic: true,
      placeholder: 'uatom (default if empty)',
      help: 'Optional. Defaults to uatom for ATOM payments. Only set this if you want a non-ATOM denom.',
      validate: function(v){ return /^[a-z][a-z0-9/:._-]{1,127}$/i.test(v); }
    },
    'payment.cosmoshub-4.label': {
      label: 'Payment label (Cosmos Hub)', shortHint: 'Optional - label shown in payment confirmations', icon: 'fa-tag', type: 'text', recommendedPublic: true,
      placeholder: 'Primary Cosmos Hub wallet',
      help: 'Optional label shown in payment confirmations next to the resolved address.',
      validate: function(v){ return v.length > 0 && v.length <= 80; }
    },
    'privacy.hide_address': {
      label: 'Hide wallet address', shortHint: 'Hide cosmos1... from public pay pages', icon: 'fa-eye-slash', type: 'text', recommendedPublic: true,
      placeholder: 'true (or leave empty to show address)',
      help: 'Set to "true" to hide your wallet address from public pay/QR pages. The sender will only see your name. Their wallet still shows the real address before signing.',
      validate: function(v){ return v === 'true' || v === 'false' || v === ''; }
    },
    did: {
      label: 'DID', shortHint: 'Optional - decentralized identifier', icon: 'fa-id-card', type: 'text', recommendedPublic: true,
      placeholder: 'did:atom:user.atom',
      help: 'Optional. W3C-style DID for this Atom Registry name. Usually did:atom:<name>.',
      validate: function(v){ return /^did:[a-z0-9]+:[A-Za-z0-9._:-]{1,200}$/i.test(v); }
    },
    verificationMethod: {
      label: 'Verification method', shortHint: 'Optional - public key reference for DID verification', icon: 'fa-key', type: 'text', recommendedPublic: true,
      placeholder: 'did:atom:user.atom#key-1',
      help: 'Optional. Reference to the verification method used for this DID (key fragment or external URL).',
      validate: function(v){ return v.length > 4 && v.length <= 240; }
    }
  };

  var REQUIRED_SCORE_FIELDS = ['avatar', 'bio', 'website'];
  var OPTIONAL_SCORE_FIELDS = ['displayName', 'twitter', 'github', 'telegram', 'discord', 'projectName', 'docs', 'repository', 'email'];
  var SENSITIVE_PATTERNS = [
    /\b(seed phrase|private key|mnemonic|recovery phrase|password|secret key)\b/i,
    /\b[a-z]{3,10}(?:\s+[a-z]{3,10}){11,23}\b/i
  ];

  function byId(id){
    if (typeof window.$ === 'function') return window.$(id);
    return document.getElementById(id);
  }

  function htmlEscape(value){
    if (typeof window.esc === 'function') return window.esc(value == null ? '' : String(value));
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c];
    });
  }

  function showToast(message, tone){
    if (typeof window.toast === 'function') window.toast(message, tone || 'info');
  }

  function setMetaHealth(msg, tone){
    var el = byId('metaHealth');
    if(!el) return;
    el.className = 'meta-v2-health is-' + (tone || 'warn');
    el.textContent = msg;
  }

  function normalizeDomain(value){
    var raw = String(value || '').trim().toLowerCase();
    raw = raw.replace(/^https?:\/\//, '').replace(/^ar:\/\//, '').replace(/^www\./, '');
    raw = raw.split(/[/?#]/)[0];
    return raw.replace(/[^a-z0-9._-]/g, '');
  }

  function stripAt(value){ return String(value || '').trim().replace(/^@+/, ''); }

  function normalizeUrl(value){
    var v = String(value || '').trim();
    if (!v) return '';
    if (/^(ipfs|ar):\/\//i.test(v)) return v;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/\//, '');
    return v.replace(/^http:\/\//i, 'https://');
  }

  function normalizeUrlOrText(value){
    var v = String(value || '').trim();
    if (!v) return '';
    if (/^[a-z]+:\/\//i.test(v) || /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return normalizeUrl(v);
    return v;
  }

  function normalizeHandle(value){
    var v = String(value || '').trim();
    v = v.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '');
    return stripAt(v).split(/[/?#]/)[0];
  }

  function normalizeGithub(value){
    var v = String(value || '').trim();
    v = v.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    return v.replace(/^@+/, '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  }

  function normalizeTelegram(value){
    var v = String(value || '').trim();
    v = v.replace(/^https?:\/\/(www\.)?t\.me\//i, '');
    return stripAt(v).split(/[/?#]/)[0];
  }

  function isHttpsUrl(value){
    try { return new URL(String(value || '')).protocol === 'https:'; } catch(e) { return false; }
  }

  function detectSensitiveValue(value){
    var v = String(value || '');
    return SENSITIVE_PATTERNS.some(function(pattern){ return pattern.test(v); });
  }

  function rowKey(row){ return Array.isArray(row) ? row[0] : row && row.key; }
  function rowData(row){ return Array.isArray(row) ? (row[1] || {}) : (row || {}); }
  function rowValue(row){ var data = rowData(row); return data && data.value != null ? String(data.value) : ''; }
  function rowPublic(row){ var data = rowData(row); return data && data.public !== false; }

  function rowsToProfile(rows){
    var profile = {};
    (rows || []).forEach(function(row){
      var key = rowKey(row);
      if (!key) return;
      profile[key] = { value: rowValue(row), public: rowPublic(row) };
    });
    return profile;
  }

  function getProfileValue(profile, key){
    return profile && profile[key] ? profile[key].value : '';
  }

  function getProfileScore(rows){
    var publicKeys = {};
    (rows || []).forEach(function(row){
      var key = rowKey(row);
      if (key && rowPublic(row) && rowValue(row)) publicKeys[key] = true;
    });
    var score = 0;
    REQUIRED_SCORE_FIELDS.forEach(function(key){ if (publicKeys[key]) score += 22; });
    OPTIONAL_SCORE_FIELDS.forEach(function(key){ if (publicKeys[key]) score += 4; });
    return Math.min(100, score);
  }

  function getScoreTips(rows){
    var profile = rowsToProfile(rows || []);
    var missing = [];
    REQUIRED_SCORE_FIELDS.concat(['twitter', 'github', 'projectName']).forEach(function(key){
      if (!getProfileValue(profile, key)) missing.push(FIELD_DEFS[key] ? FIELD_DEFS[key].label : key);
    });
    if (!missing.length) return 'Strong profile. Add developer fields only if apps should consume extra metadata.';
    return 'Recommended next: ' + missing.slice(0, 3).join(', ') + '.';
  }

  function linkForField(key, value){
    var v = String(value || '').trim();
    if (!v) return '';
    if (key === 'twitter') return 'https://x.com/' + stripAt(v);
    if (key === 'github') return 'https://github.com/' + normalizeGithub(v);
    if (key === 'telegram') return 'https://t.me/' + stripAt(v);
    if (key === 'email') return 'mailto:' + v;
    if (/^(website|docs|whitepaper|repository|api|manifest|redirect|avatar)$/.test(key) && isHttpsUrl(v)) return v;
    if (/^https:\/\//i.test(v)) return v;
    return '';
  }

  function renderProfilePreview(domain, rows, isOwned){
    var profile = rowsToProfile(rows || []);
    var displayName = getProfileValue(profile, 'displayName') || getProfileValue(profile, 'projectName') || domain || 'Select a domain';
    var bio = getProfileValue(profile, 'bio') || (domain ? 'No public bio yet. Add a short profile description to make this domain easier to recognize.' : 'Choose one of your owned domains or view any public profile to preview its metadata identity.');
    var avatar = getProfileValue(profile, 'avatar');
    var score = getProfileScore(rows || []);
    var visibleCount = (rows || []).filter(function(row){ return rowPublic(row) && rowValue(row); }).length;

    if (byId('metaPreviewName')) byId('metaPreviewName').textContent = displayName;
    if (byId('metaPreviewBio')) byId('metaPreviewBio').textContent = bio;
    if (byId('metaPreviewBadge')) byId('metaPreviewBadge').textContent = domain ? (visibleCount + ' public field' + (visibleCount === 1 ? '' : 's')) : 'No domain selected';
    if (byId('metaScoreValue')) byId('metaScoreValue').textContent = score + '%';
    if (byId('metaScoreBar')) byId('metaScoreBar').style.width = score + '%';
    if (byId('metaScoreTips')) byId('metaScoreTips').textContent = getScoreTips(rows || []);

    var avatarEl = byId('metaAvatarPreview');
    if (avatarEl) {
      if (avatar && isHttpsUrl(avatar)) {
        avatarEl.innerHTML = '<img src="' + htmlEscape(avatar) + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'<i class=&quot;fas fa-globe&quot;></i>\'"/>';
      } else {
        avatarEl.innerHTML = '<i class="fas fa-globe"></i>';
      }
    }

    var linkKeys = ['website', 'twitter', 'github', 'telegram', 'discord', 'docs', 'repository', 'email'];
    var links = [];
    linkKeys.forEach(function(key){
      var value = getProfileValue(profile, key);
      if (!value) return;
      var href = linkForField(key, value);
      var def = FIELD_DEFS[key] || { label: key, icon: 'fa-link' };
      var iconClass = def.icon.indexOf('fa-brands') === 0 ? def.icon : 'fas ' + def.icon;
      var label = def.label || key;
      if (href) links.push('<a class="meta-v2-profile-link" href="' + htmlEscape(href) + '" target="_blank" rel="noreferrer"><i class="' + htmlEscape(iconClass) + '"></i><span>' + htmlEscape(label) + '</span></a>');
      else links.push('<span class="meta-v2-profile-link"><i class="' + htmlEscape(iconClass) + '"></i><span>' + htmlEscape(label) + '</span></span>');
    });
    if (byId('metaPreviewLinks')) byId('metaPreviewLinks').innerHTML = links.join('') || '<span class="meta-v2-empty-state">No public links yet. Add website or social fields to complete the identity surface.</span>';

    renderPreviewPayActions(domain, profile, !!isOwned);
  }

  function renderPreviewPayActions(domain, profile, isOwned){
    var host = byId('metaPreviewPayActions');
    if (!host) return;
    if (!domain || !window.ArPay) { host.hidden = true; host.innerHTML = ''; return; }
    var addr = getProfileValue(profile, 'payment.cosmoshub-4.address');
    if (addr) {
      renderPayPanel(host, domain, addr, 'metadata', profile, isOwned);
      return;
    }
    host.hidden = false;
    host.innerHTML = '<div class="meta-v2-pay-loading-row"><span class="spin-icon"></span> <span>Looking up domain owner as fallback recipient…</span></div>';
    window.ArPay.findOwner(domain).then(function(owner){
      if (owner) renderPayPanel(host, domain, owner, 'owner', profile, isOwned);
      else { host.hidden = true; host.innerHTML = ''; }
    }).catch(function(err){
      console.warn('[Profile Preview] owner lookup failed', err);
      host.hidden = true; host.innerHTML = '';
    });
  }

  function renderPayPanel(host, domain, address, source, profile, isOwned){
    var payHref = window.ArPay.buildLink(domain);
    var link = window.ArPay.absoluteLink(domain);
    var sourceBadge = source === 'metadata'
      ? '<span class="meta-v2-pay-source is-metadata">Source: Payment metadata</span>'
      : '<span class="meta-v2-pay-source is-owner">Source: Domain owner</span>';
    var fallbackNote = '';
    var receivePayHref = payHref + (payHref.indexOf('?') === -1 ? '?' : '&') + 'mode=receive';
    var primaryBtn = isOwned
      ? '<a class="meta-v2-pay-btn meta-v2-pay-btn-primary" data-route="pay" href="' + htmlEscape(receivePayHref) + '"><i class="fas fa-qrcode"></i> Open receive page</a>'
      : '<a class="meta-v2-pay-btn meta-v2-pay-btn-primary" data-route="pay" href="' + htmlEscape(payHref) + '"><i class="fas fa-paper-plane"></i> Send ATOM</a>';
    host.hidden = false;
    host.innerHTML =
      '<div class="meta-v2-pay-head"><i class="fas fa-paper-plane"></i><strong>Atom Registry Pay</strong>' +
        '<span class="meta-v2-pay-addr">' + htmlEscape(window.ArPay.shortAddress(address, 12, 8)) + '</span></div>' +
      sourceBadge +
      fallbackNote +
      '<div class="meta-v2-pay-buttons">' +
        primaryBtn +
        '<button class="meta-v2-pay-btn" type="button" data-pay-action="copy"><i class="fas fa-link"></i> Copy link</button>' +
      '</div>';
    var copyBtn = host.querySelector('[data-pay-action="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', function(){
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(function(){ showToast('Pay link copied', 'good'); });
    });
    var addBtn = host.querySelector('[data-pay-action="add-payment"]');
    if (addBtn) addBtn.addEventListener('click', function(e){
      e.preventDefault();
      var payKey = 'payment.cosmoshub-4.address';

      if (window.userAddress && !draftValues[payKey]) {
        draftValues[payKey] = window.userAddress;
      }
      if (selectedTemplateKeys.indexOf(payKey) === -1) {
        selectedTemplateKeys.push(payKey);
        renderSelectedFieldsBuilder();
        updateTemplateActiveState();
      } else {
        renderSelectedFieldsBuilder();
      }
      var selectedPanel = byId('selectedFieldsPanel') || byId('selectedFieldsBuilder');
      if (selectedPanel) selectedPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function(){
        var input = document.querySelector('.meta-v2-selected-row[data-key="' + payKey + '"] [data-role="value"]');
        if (input) { input.focus(); input.select(); }
      }, 250);
      showToast('Pre-filled with your connected wallet. Edit if you want a different payment address, then click Save selected fields.', 'info');
    });
  }

  function renderMetadataFields(target, rows, options){
    options = options || {};
    if(!target) return;
    if(!rows || !rows.length){
      target.innerHTML = '<div class="meta-v2-empty-state">No metadata fields found. Add avatar, bio, website or social links to build a useful domain profile.</div>';
      return;
    }
    target.innerHTML = rows.map(function(row){
      var key = rowKey(row);
      var value = rowValue(row);
      var pub = rowPublic(row);
      var def = FIELD_DEFS[key] || null;
      var label = def ? def.label : key;
      var type = def ? def.type : 'custom';
      return '<article class="meta-v2-field-card" data-key="' + htmlEscape(key) + '">' +
        '<div class="meta-v2-field-key"><strong>' + htmlEscape(label) + '</strong><span>' + htmlEscape(key) + ' · ' + htmlEscape(type) + '</span></div>' +
        '<div class="meta-v2-field-value">' + htmlEscape(value || '-') + '</div>' +
        '<div class="meta-v2-field-pill ' + (pub ? '' : 'is-private') + '">' + (pub ? 'Public' : 'Private') + '</div>' +
        (options.editable
          ? '<div class="meta-v2-field-actions">' +
              '<button class="meta-v2-field-btn" type="button" data-field-action="edit"><i class="fas fa-pen"></i> Edit</button>' +
              '<button class="meta-v2-field-btn meta-v2-field-btn-danger" type="button" data-field-action="delete"><i class="fas fa-trash"></i> Delete</button>' +
            '</div>'
          : '') +
      '</article>';
    }).join('');

    if (options.editable) {
      Array.prototype.forEach.call(target.querySelectorAll('.meta-v2-field-card'), function(card){
        var keyAttr = card.getAttribute('data-key');
        var match = (rows || []).filter(function(row){ return rowKey(row) === keyAttr; })[0];
        if (!match) return;

        function openInEditor(){
          setEditorField(keyAttr, rowValue(match), rowPublic(match));
          var editorSection = byId('metaEditorSection') || byId('selectedFieldsBuilder');
          if (editorSection) editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          var valueInput = byId('fieldValue');
          if (valueInput) setTimeout(function(){ valueInput.focus(); }, 200);
        }

        var editBtn = card.querySelector('[data-field-action="edit"]');
        if (editBtn) editBtn.addEventListener('click', function(e){ e.stopPropagation(); openInEditor(); });

        var deleteBtn = card.querySelector('[data-field-action="delete"]');
        if (deleteBtn) deleteBtn.addEventListener('click', async function(e){
          e.stopPropagation();
          if (!confirm('Delete field "' + keyAttr + '" from your domain metadata? This is on-chain and irreversible.')) return;
          if (!requireWallet()) return;
          var domainName = byId('ownedProfileDomain') && byId('ownedProfileDomain').value;
          if (!domainName) { showToast('Select an owned domain', 'warn'); return; }
          deleteBtn.disabled = true;
          try {
            await window.signAndBroadcastRegistry(window.CFG.METADATA,
              { delete_field: { name: domainName, key: keyAttr } },
              0, byId('metaTxSteps'), byId('metaTxBar'), window.TX_STEPS);
            showToast('Field deleted: ' + keyAttr, 'good');
            await loadOwnedMetadataFields();
          } catch (err) {
            showToast('Delete failed: ' + (err && err.message || err), 'error');
            deleteBtn.disabled = false;
          }
        });

        card.addEventListener('click', function(e){
          if (e.target.closest('[data-field-action]')) return;
          openInEditor();
        });
      });
    }
  }

  function renderTemplateGroups(){
    var host = byId('fieldTemplateGroups');
    if (!host) return;
    host.innerHTML = FIELD_GROUPS.map(function(group){
      var chips = group.fields.map(function(key){
        var def = FIELD_DEFS[key];
        if (!def) return '';
        var iconClass = def.icon.indexOf('fa-brands') === 0 ? def.icon : 'fas ' + def.icon;
        return '<button class="meta-v2-template-chip" type="button" data-key="' + htmlEscape(key) + '" aria-pressed="false"><i class="' + htmlEscape(iconClass) + '"></i>' + htmlEscape(def.label) + '</button>';
      }).join('');
      var desc = group.description ? '<p class="meta-v2-template-group-desc">' + htmlEscape(group.description) + '</p>' : '';
      return '<div class="meta-v2-template-group"><h4>' + htmlEscape(group.name) + '</h4>' + desc + '<div class="meta-v2-template-row">' + chips + '</div></div>';
    }).join('');

    Array.prototype.forEach.call(host.querySelectorAll('[data-key]'), function(btn){
      btn.addEventListener('click', function(){
        var key = btn.getAttribute('data-key');
        toggleSelectedTemplate(key);
        var def = FIELD_DEFS[key];
        var currentValue = byId('fieldValue') ? byId('fieldValue').value : '';
        setEditorField(key, currentValue, def ? !!def.recommendedPublic : true);
      });
    });
    renderSelectedFieldsBuilder();
  }

  function toggleSelectedTemplate(key){
    if (!FIELD_DEFS[key]) return;
    captureDraftFromDom();
    var idx = selectedTemplateKeys.indexOf(key);
    if (idx === -1) selectedTemplateKeys.push(key);
    else selectedTemplateKeys.splice(idx, 1);
    renderSelectedFieldsBuilder();
    updateTemplateActiveState();
  }

  function clearSelectedTemplates(){
    selectedTemplateKeys = [];
    renderSelectedFieldsBuilder();
    updateTemplateActiveState();
  }

  function getExistingValueForKey(key){
    var rows = lastOwnedRows || [];
    for (var i = 0; i < rows.length; i++) {
      if (rowKey(rows[i]) === key) return rowValue(rows[i]);
    }
    return '';
  }

  function getExistingPublicForKey(key){
    var rows = lastOwnedRows || [];
    for (var i = 0; i < rows.length; i++) {
      if (rowKey(rows[i]) === key) return rowPublic(rows[i]);
    }
    return FIELD_DEFS[key] ? !!FIELD_DEFS[key].recommendedPublic : true;
  }

  function renderSelectedFieldsBuilder(){
    var panel = byId('selectedFieldsPanel');
    var host = byId('selectedFieldsBuilder');
    if (!panel || !host) return;

    panel.hidden = selectedTemplateKeys.length === 0;
    if (!selectedTemplateKeys.length) {
      host.innerHTML = '';
      if (byId('selectedFieldsHint')) byId('selectedFieldsHint').textContent = 'Select fields above to build a profile update.';
      return;
    }

    host.innerHTML = selectedTemplateKeys.map(function(key){
      var def = FIELD_DEFS[key];
      var iconClass = def.icon.indexOf('fa-brands') === 0 ? def.icon : 'fas ' + def.icon;

      var existing = Object.prototype.hasOwnProperty.call(draftValues, key)
        ? draftValues[key]
        : getExistingValueForKey(key);
      var isPublic = Object.prototype.hasOwnProperty.call(draftPublic, key)
        ? draftPublic[key]
        : getExistingPublicForKey(key);
      var publicOnly = isPublicOnlyKey(key);
      var rowClass = 'meta-v2-selected-row' + (publicOnly ? ' meta-v2-selected-row--public-only' : '');
      var visibilityCell = publicOnly
        ? ''
        : '<div class="meta-v2-selected-vis-group" data-role="visibility" data-public="' + (isPublic ? 'true' : 'false') + '">' +
            '<button class="meta-v2-selected-vis-btn' + (isPublic ? ' is-active' : '') + '" type="button" data-role="vis-public">Public</button>' +
            '<button class="meta-v2-selected-vis-btn' + (!isPublic ? ' is-active' : '') + '" type="button" data-role="vis-private">Private</button>' +
          '</div>';
      return '<article class="' + rowClass + '" data-key="' + htmlEscape(key) + '">' +
        '<div class="meta-v2-selected-label"><i class="' + htmlEscape(iconClass) + '"></i><div><strong>' + htmlEscape(def.label) + '</strong><span>' + htmlEscape(def.shortHint || def.group || 'Profile field') + '</span></div></div>' +
        '<input class="meta-v2-selected-input" data-role="value" value="' + htmlEscape(existing) + '" placeholder="' + htmlEscape(def.placeholder || 'Field value') + '" autocomplete="off" />' +
        visibilityCell +
        '<button class="meta-v2-selected-remove" type="button" data-role="remove" title="Remove field"><i class="fas fa-xmark"></i></button>' +
      '</article>';
    }).join('');

    Array.prototype.forEach.call(host.querySelectorAll('.meta-v2-selected-row'), function(row){
      var key = row.getAttribute('data-key');
      var input = row.querySelector('[data-role="value"]');
      var visibility = row.querySelector('[data-role="visibility"]');
      var remove = row.querySelector('[data-role="remove"]');

      if (input) input.addEventListener('input', function(){
        draftValues[key] = String(input.value || '');
        updateSelectedFieldsHint();
      });
      if (visibility) {
        var visPublicBtn = visibility.querySelector('[data-role="vis-public"]');
        var visPrivateBtn = visibility.querySelector('[data-role="vis-private"]');
        function setVisibility(isPublic) {
          visibility.setAttribute('data-public', isPublic ? 'true' : 'false');
          if (visPublicBtn) visPublicBtn.classList.toggle('is-active', isPublic);
          if (visPrivateBtn) visPrivateBtn.classList.toggle('is-active', !isPublic);
          draftPublic[key] = isPublic;
        }
        if (visPublicBtn) visPublicBtn.addEventListener('click', function(){ setVisibility(true); });
        if (visPrivateBtn) visPrivateBtn.addEventListener('click', function(){ setVisibility(false); });
      }
      if (remove) remove.addEventListener('click', function(){
        captureDraftFromDom();
        var idx = selectedTemplateKeys.indexOf(key);
        if (idx !== -1) selectedTemplateKeys.splice(idx, 1);
        clearDraftForKey(key);
        renderSelectedFieldsBuilder();
        updateTemplateActiveState();
      });
    });

    updateSelectedFieldsHint();
  }

  function updateSelectedFieldsHint(){
    var hint = byId('selectedFieldsHint');
    if (!hint) return;
    var rows = getSelectedBuilderPayload(false);
    var filled = rows.filter(function(item){ return item.value; }).length;
    hint.textContent = filled + ' of ' + selectedTemplateKeys.length + ' selected fields have values. Empty fields will be skipped.';
  }

  function isPublicOnlyKey(key) {

    return /^payment\./.test(key) || /^privacy\./.test(key);
  }

  function getSelectedBuilderPayload(normalizeValues){
    var host = byId('selectedFieldsBuilder');
    if (!host) return [];
    return Array.prototype.map.call(host.querySelectorAll('.meta-v2-selected-row'), function(row){
      var key = row.getAttribute('data-key');
      var input = row.querySelector('[data-role="value"]');
      var visibility = row.querySelector('[data-role="visibility"]');
      var value = input ? String(input.value || '').trim() : '';
      var def = FIELD_DEFS[key];
      if (normalizeValues && value && def && typeof def.normalize === 'function') value = def.normalize(value);
      var isPublic = isPublicOnlyKey(key)
        ? true
        : (visibility ? visibility.getAttribute('data-public') === 'true' : true);
      return {
        key: key,
        value: value,
        public: isPublic
      };
    });
  }

  function updateTemplateActiveState(){
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    activeTemplateKey = FIELD_DEFS[key] ? key : '';
    Array.prototype.forEach.call(document.querySelectorAll('.meta-v2-template-chip'), function(btn){
      var chipKey = btn.getAttribute('data-key');
      var selected = selectedTemplateKeys.indexOf(chipKey) !== -1;
      btn.classList.toggle('is-active', chipKey === activeTemplateKey);
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    if (byId('metaSelectedTemplate')) {
      byId('metaSelectedTemplate').textContent = selectedTemplateKeys.length ? (selectedTemplateKeys.length + ' selected') : (activeTemplateKey ? FIELD_DEFS[activeTemplateKey].label : '0 selected');
    }
  }

  function setEditorField(key, value, isPublic){
    if (byId('fieldKey')) byId('fieldKey').value = key || '';
    if (byId('fieldValue')) byId('fieldValue').value = value || '';
    if (byId('fieldPublic')) byId('fieldPublic').checked = isPublic !== false;
    syncVisibilityButtons();
    updateEditorHelp();
    validateCurrentField();
  }

  function syncVisibilityButtons(){
    var isPublic = !!(byId('fieldPublic') && byId('fieldPublic').checked);
    if (byId('visibilityPublicBtn')) byId('visibilityPublicBtn').classList.toggle('is-active', isPublic);
    if (byId('visibilityPrivateBtn')) byId('visibilityPrivateBtn').classList.toggle('is-active', !isPublic);
  }

  function updateEditorHelp(){
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    var def = FIELD_DEFS[key];
    updateTemplateActiveState();

    var keyInput = byId('fieldKey');
    var keyGroup = keyInput && keyInput.closest ? keyInput.closest('.meta-v2-input-group') : null;
    if (keyGroup) {
      keyGroup.classList.toggle('is-known-field', !!def);
      var label = keyGroup.querySelector('label');
      if (label) {
        if (def) {
          var icon = def.icon ? '<i class="fas ' + htmlEscape(def.icon) + '"></i> ' : '';
          label.innerHTML = icon + htmlEscape(def.label);
        } else {
          label.textContent = 'Field key';
        }
      }
    }

    if (byId('fieldKeyHelp')) byId('fieldKeyHelp').textContent = def ? (def.shortHint || '') : 'Use a simple lowercase key. Custom fields are supported for advanced integrations.';
    if (byId('fieldValueHelp')) byId('fieldValueHelp').textContent = def ? def.help : 'Custom field value. Keep public values safe and app-readable.';
    if (byId('fieldValue') && def) byId('fieldValue').setAttribute('placeholder', def.placeholder || 'Field value');
  }

  function setValidation(tone, message, icon){
    var el = byId('metaFieldValidation');
    if (!el) return;
    el.className = 'meta-v2-validation is-' + tone;
    el.innerHTML = '<i class="fas ' + htmlEscape(icon || 'fa-circle-info') + '"></i><span>' + htmlEscape(message) + '</span>';
  }

  function validateCurrentField(){
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    var value = (byId('fieldValue') && byId('fieldValue').value || '').trim();
    var def = FIELD_DEFS[key];

    if (!key && !value) {
      setValidation('neutral', 'Ready to edit metadata.', 'fa-circle-info');
      return true;
    }
    if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key)) {
      setValidation('error', 'Field key should start with a letter and use letters, numbers, dot, dash or underscore only.', 'fa-circle-exclamation');
      return false;
    }
    if (detectSensitiveValue(value)) {
      setValidation('error', 'This looks sensitive. Do not publish seed phrases, private keys, passwords or recovery words in metadata.', 'fa-triangle-exclamation');
      return false;
    }
    if (!value) {
      setValidation('warn', 'Value is empty. Saving an empty value may not be useful; use Delete if you want to remove the field.', 'fa-circle-info');
      return true;
    }
    if (def && def.validate && !def.validate(value)) {
      setValidation('warn', def.label + ' value does not match the recommended format. You can still edit it, but apps may not display it correctly.', 'fa-triangle-exclamation');
      return true;
    }
    setValidation('good', def ? def.label + ' looks valid and app-readable.' : 'Custom field looks valid. Apps may need to know this key to use it.', 'fa-circle-check');
    return true;
  }

  function getNormalizedEditorValue(){
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    var value = (byId('fieldValue') && byId('fieldValue').value || '').trim();
    var def = FIELD_DEFS[key];
    if (def && typeof def.normalize === 'function') value = def.normalize(value);
    return value;
  }

  function getCurrentWalletAddress(){
    if (window.userAddress) return window.userAddress;
    try { if (typeof userAddress !== 'undefined' && userAddress) return userAddress; } catch(e) {}
    return '';
  }

  function getPersistedWalletAddress(){
    var candidates = [];

    try {
      var sessionWallet = JSON.parse(sessionStorage.getItem('ar_wallet') || 'null');
      if (sessionWallet && sessionWallet.address) candidates.push(sessionWallet.address);
    } catch(e) {}

    try {
      var latestIdentity = JSON.parse(localStorage.getItem('ar_wallet_identity_latest') || 'null');
      if (latestIdentity && latestIdentity.address) candidates.push(latestIdentity.address);
    } catch(e) {}

    try {
      var searchWallet = localStorage.getItem('ar_search_wallet');
      if (searchWallet) candidates.push(searchWallet);
    } catch(e) {}

    for (var i = 0; i < candidates.length; i++) {
      var address = String(candidates[i] || '').trim();
      if (/^cosmos1[0-9a-z]{20,}$/i.test(address)) return address;
    }

    return '';
  }

  function waitForPromiseWithTimeout(promise, timeoutMs){
    return new Promise(function(resolve){
      var done = false;
      var timer = setTimeout(function(){
        if (done) return;
        done = true;
        resolve(false);
      }, timeoutMs || 5000);

      Promise.resolve(promise).then(function(value){
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      }).catch(function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(false);
      });
    });
  }

  async function ensureMetadataOwnerAddress(){
    var connected = getCurrentWalletAddress();
    if (connected) return connected;

    if (window.walletRestorePromise && typeof window.walletRestorePromise.then === 'function') {
      await waitForPromiseWithTimeout(window.walletRestorePromise, 6000);
      connected = getCurrentWalletAddress();
      if (connected) return connected;
    }

    if (!window.__metadataRestoreAttempted && typeof window.restoreWalletSession === 'function') {
      window.__metadataRestoreAttempted = true;
      try {
        await waitForPromiseWithTimeout(window.restoreWalletSession({ silent: true, force: true }), 6000);
      } catch(e) {}
      connected = getCurrentWalletAddress();
      if (connected) return connected;
    }

    return getPersistedWalletAddress();
  }

  function normalizeOwnedNameEntry(entry){
    if (typeof entry === 'string') return normalizeDomain(entry);
    if (!entry || typeof entry !== 'object') return '';
    return normalizeDomain(entry.name || entry.domain || entry.label || entry.full_name || entry.fullName || '');
  }

  function uniqueSortedNames(entries){
    var seen = {};
    var names = [];
    (entries || []).forEach(function(entry){
      var name = normalizeOwnedNameEntry(entry);
      if (!name || seen[name]) return;
      seen[name] = true;
      names.push(name);
    });
    return names.sort(function(a, b){
      var aIsTld = a.indexOf('.') === -1;
      var bIsTld = b.indexOf('.') === -1;
      if (aIsTld !== bIsTld) return aIsTld ? -1 : 1;
      return a.localeCompare(b);
    });
  }

  function renderOwnedDomainOptions(select, names){
    if (!select) return;
    if (!names.length) {
      select.innerHTML = '<option value="">No owned names found</option>';
      return;
    }
    select.innerHTML = names.map(function(name){
      var label = name.indexOf('.') === -1 ? '.' + name + ' · TLD' : name;
      return '<option value="' + htmlEscape(name) + '">' + htmlEscape(label) + '</option>';
    }).join('');
  }

  async function waitForWalletAddress(){
    return ensureMetadataOwnerAddress();
  }

  async function loadOwnedNamesForFunctionPages(ownerAddress){
    var address = ownerAddress || await ensureMetadataOwnerAddress();
    if(!address) return [];
    var resp = await window.queryContract(window.CFG.REGISTRY, { names_by_owner: { owner: address, start_after: null, limit: 200 } });
    if (Array.isArray(resp)) return uniqueSortedNames(resp);
    if (resp && Array.isArray(resp.names)) return uniqueSortedNames(resp.names);
    return [];
  }

  function requireWallet(){
    if(getCurrentWalletAddress()) return true;
    showToast('Connect wallet first', 'warn');
    if(typeof window.openWalletModal === 'function') window.openWalletModal();
    return false;
  }

  async function loadMetadataConfig(){
    if(byId('metadataAddr')) byId('metadataAddr').textContent = window.CFG && window.CFG.METADATA ? window.CFG.METADATA : '-';
    try{
      var cfg = await window.queryContract(window.CFG.METADATA, { config: {} });
      if(byId('configOut')) byId('configOut').textContent = JSON.stringify(cfg, null, 2);
      setMetaHealth('Metadata service is online. You can view public profiles or edit domains owned by your connected wallet.', 'good');
      return cfg;
    } catch(e){
      if(byId('configOut')) byId('configOut').textContent = e.message || String(e);
      setMetaHealth('Metadata config query failed. Check network status or contract configuration.', 'error');
      throw e;
    }
  }

  async function viewMetadataFields(){
    var name = normalizeDomain(byId('viewDomain') && byId('viewDomain').value || '');
    if(byId('viewDomain')) byId('viewDomain').value = name;
    if(!name) return showToast('Enter a domain', 'warn');
    var out = byId('profileView');
    if(out) out.innerHTML = '<div class="meta-v2-empty-state">Loading public profile fields…</div>';
    try{
      var rows = await window.queryContract(window.CFG.METADATA, { fields: { name: name, include_private: false, start_after: null, limit: 100 } });
      rows = rows || [];
      lastPreviewDomain = name;
      lastPreviewRows = rows;
      renderMetadataFields(out, rows, { editable: false });
      renderProfilePreview(name, rows, false);
    } catch(e){
      if(out) out.innerHTML = '<div class="meta-v2-empty-state">' + htmlEscape(e.message || String(e)) + '</div>';
    }
  }

  async function loadOwnedMetadataDomains(){
    var select = byId('ownedProfileDomain');
    if(!select) return;

    select.innerHTML = '<option value="">Loading owned names…</option>';

    var address = await waitForWalletAddress();
    if(!address){
      select.innerHTML = '<option value="">Connect wallet to load owned names</option>';
      renderProfilePreview('', []);
      return;
    }

    try{
      var names = await loadOwnedNamesForFunctionPages(address);
      renderOwnedDomainOptions(select, names);
      if (names.length) await loadOwnedMetadataFields();
      else renderProfilePreview('', []);
    } catch(e){
      select.innerHTML = '<option value="">Could not load owned names</option>';
      showToast(e.message || String(e), 'error');
    }
  }

  async function loadOwnedMetadataFields(){
    var name = byId('ownedProfileDomain') && byId('ownedProfileDomain').value;
    if(!name) return showToast('Select an owned domain', 'warn');
    var out = byId('ownedFields');
    if(out) out.innerHTML = '<div class="meta-v2-empty-state">Loading saved fields…</div>';
    try{
      var rows = await window.queryContract(window.CFG.METADATA, { fields: { name: name, include_private: true, start_after: null, limit: 100 } });
      rows = rows || [];
      lastOwnedRows = rows;
      lastPreviewDomain = name;
      lastPreviewRows = rows.filter(function(row){ return rowPublic(row); });
      renderMetadataFields(out, rows, { editable: true });
      renderProfilePreview(name, lastPreviewRows, true);
      renderSelectedFieldsBuilder();
    } catch(e){
      if(out) out.innerHTML = '<div class="meta-v2-empty-state">' + htmlEscape(e.message || String(e)) + '</div>';
    }
  }

  async function setMetadataField(){
    if(!requireWallet()) return;
    var name = byId('ownedProfileDomain') && byId('ownedProfileDomain').value;
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    var value = getNormalizedEditorValue();
    var isPublic = !!(byId('fieldPublic') && byId('fieldPublic').checked);
    if(!name) return showToast('Select an owned domain', 'warn');
    if(!key) return showToast('Enter a field key', 'warn');
    if(!validateCurrentField()) return;
    if(byId('fieldValue')) byId('fieldValue').value = value;
    await window.signAndBroadcastRegistry(window.CFG.METADATA, { set_field: { name: name, key: key, value: value, public: isPublic } }, 0, byId('metaTxSteps'), byId('metaTxBar'), window.TX_STEPS);
    await loadOwnedMetadataFields();
  }

  async function saveSelectedMetadataFields(){
    if(!requireWallet()) return;
    var name = byId('ownedProfileDomain') && byId('ownedProfileDomain').value;
    if(!name) return showToast('Select an owned domain', 'warn');

    captureDraftFromDom();

    var payload = getSelectedBuilderPayload(true).filter(function(item){ return item.value; });
    if (!payload.length) return showToast('Add values for at least one selected field', 'warn');

    for (var i = 0; i < payload.length; i++) {
      var preItem = payload[i];
      var preDef = FIELD_DEFS[preItem.key];
      if (detectSensitiveValue(preItem.value)) {
        return showToast((preDef ? preDef.label : preItem.key) + ' looks sensitive. Remove secrets before saving.', 'error');
      }
      if (preDef && preDef.validate && !preDef.validate(preItem.value)) {
        showToast((preDef.label || preItem.key) + ' does not match the recommended format; saving anyway.', 'warn');
      }
    }

    var steps = byId('metaTxSteps');
    var bar = byId('metaTxBar');
    if (steps) {
      steps.innerHTML = '<div class="meta-save-queue">' + payload.map(function(field, idx){
        var def = FIELD_DEFS[field.key];
        var labelText = (def && def.label) || field.key;
        return '<div class="meta-save-queue-item" data-queue-idx="' + idx + '">' +
          '<span class="meta-save-queue-dot">' + (idx + 1) + '</span>' +
          '<span class="meta-save-queue-label"><strong>' + htmlEscape(labelText) + '</strong><code>' + htmlEscape(field.key) + '</code></span>' +
          '<span class="meta-save-queue-status" data-status="pending">Pending</span>' +
        '</div>';
      }).join('') + '</div>';
    }
    if (bar) bar.style.width = '0%';

    var saved = [];
    var failed = null;
    var queueRoot = steps ? steps.querySelector('.meta-save-queue') : null;

    for (var j = 0; j < payload.length; j++) {
      var field = payload[j];
      var queueItem = queueRoot ? queueRoot.querySelector('[data-queue-idx="' + j + '"]') : null;
      var statusEl = queueItem ? queueItem.querySelector('.meta-save-queue-status') : null;
      if (queueItem) queueItem.classList.add('is-active');
      if (statusEl) { statusEl.dataset.status = 'signing'; statusEl.textContent = 'Awaiting signature…'; }

      try {
        await window.signAndBroadcastRegistry(
          window.CFG.METADATA,
          { set_field: { name: name, key: field.key, value: field.value, public: field.public } },
          0,
          null,
          null,
          window.TX_STEPS
        );
        if (queueItem) queueItem.classList.remove('is-active');
        if (statusEl) { statusEl.dataset.status = 'done'; statusEl.textContent = 'Saved'; }
        if (bar) bar.style.width = (((j + 1) / payload.length) * 100) + '%';
        saved.push(field.key);
        clearDraftForKey(field.key);
      } catch (err) {
        if (queueItem) queueItem.classList.remove('is-active');
        if (statusEl) { statusEl.dataset.status = 'error'; statusEl.textContent = 'Failed'; }
        failed = { key: field.key, error: err };
        for (var k = j + 1; k < payload.length; k++) {
          var restItem = queueRoot ? queueRoot.querySelector('[data-queue-idx="' + k + '"]') : null;
          if (restItem) {
            var restStatus = restItem.querySelector('.meta-save-queue-status');
            if (restStatus) { restStatus.dataset.status = 'skipped'; restStatus.textContent = 'Skipped'; }
          }
        }
        break;
      }
    }

    if (failed) {
      var failedDef = FIELD_DEFS[failed.key];
      var failLabel = (failedDef && failedDef.label) || failed.key;
      var errMsg = (failed.error && failed.error.message) || String(failed.error);
      showToast('Saved ' + saved.length + ' of ' + payload.length + '. ' + failLabel + ' failed: ' + errMsg.slice(0, 180), 'error');
      if (saved.indexOf('payment.cosmoshub-4.address') !== -1) renderPaymentEnabledPanel(name);
      await loadOwnedMetadataFields();
      return;
    }

    showToast('Selected metadata fields saved', 'good');
    if (saved.some(function(k){ return /^payment\./.test(k); })) renderPaymentEnabledPanel(name);
    selectedTemplateKeys = [];
    clearAllDrafts();
    await loadOwnedMetadataFields();
    updateTemplateActiveState();
  }

  function renderPaymentEnabledPanel(name){
    var host = byId('paymentEnabledPanel');
    if (!host || !window.ArPay) return;
    var link = window.ArPay.absoluteLink(name);
    host.hidden = false;
    host.innerHTML = '' +
      '<div class="meta-payment-panel">' +
        '<div class="meta-payment-panel-head">' +
          '<span class="meta-payment-panel-kicker"><i class="fas fa-paper-plane"></i> Payment enabled</span>' +
          '<strong>This name can now receive payments by QR or resolver link.</strong>' +
        '</div>' +
        '<div class="meta-payment-panel-link"><code>' + htmlEscape(link) + '</code></div>' +
        '<div class="meta-payment-panel-actions">' +
          '<a class="meta-payment-panel-btn meta-payment-panel-btn-primary" data-route="pay" href="' + htmlEscape(window.ArPay.buildLink(name)) + '"><i class="fas fa-qrcode"></i> Generate Payment QR</a>' +
          '<button class="meta-payment-panel-btn" type="button" data-action="copy-pay-link" data-pay-link="' + htmlEscape(link) + '"><i class="fas fa-link"></i> Copy Pay Link</button>' +
        '</div>' +
      '</div>';
    var copyBtn = host.querySelector('[data-action="copy-pay-link"]');
    if (copyBtn) copyBtn.addEventListener('click', function(){
      navigator.clipboard && navigator.clipboard.writeText(link).then(function(){ showToast('Pay link copied', 'good'); }, function(){ showToast('Could not copy pay link', 'warn'); });
    });
  }

  async function deleteMetadataField(){
    var name = byId('ownedProfileDomain') && byId('ownedProfileDomain').value;
    var key = (byId('fieldKey') && byId('fieldKey').value || '').trim();
    if(!name) return showToast('Select an owned domain', 'warn');
    if(!key) return showToast('Enter a field key', 'warn');

    var existsOnChain = (lastOwnedRows || []).some(function(row){ return rowKey(row) === key; });
    if (!existsOnChain) {
      setEditorField('', '', true);
      showToast('Editor cleared - this field was not saved on-chain yet', 'info');
      return;
    }

    if(!requireWallet()) return;
    await window.signAndBroadcastRegistry(window.CFG.METADATA, { delete_field: { name: name, key: key } }, 0, byId('metaTxSteps'), byId('metaTxBar'), window.TX_STEPS);
    await loadOwnedMetadataFields();
  }

  async function rawMetadataQuery(){
    var out = byId('metaQueryOut');
    try{
      if(out) out.textContent = 'Running query…';
      var result = await window.queryContract(window.CFG.METADATA, JSON.parse(byId('metaQuery').value));
      if(out) out.textContent = JSON.stringify(result, null, 2);
    } catch(e){
      if(out) out.textContent = e.message || String(e);
    }
  }

  async function rawMetadataExecute(){
    if(!requireWallet()) return;
    await window.signAndBroadcastRegistry(window.CFG.METADATA, JSON.parse(byId('metaExecute').value), 0, byId('metaTxSteps'), byId('metaTxBar'), window.TX_STEPS);
  }

  async function copyProfileJson(){
    var domain = (byId('ownedProfileDomain') && byId('ownedProfileDomain').value) || lastPreviewDomain || '';
    var rows = lastOwnedRows && lastOwnedRows.length ? lastOwnedRows : lastPreviewRows;
    var profile = {};
    (rows || []).forEach(function(row){
      var key = rowKey(row);
      if (!key || !rowValue(row)) return;
      profile[key] = { value: rowValue(row), public: rowPublic(row) };
    });
    var payload = JSON.stringify({ domain: domain, profile: profile }, null, 2);
    try{
      await navigator.clipboard.writeText(payload);
      showToast('Profile JSON copied', 'good');
    } catch(e){
      showToast('Could not copy JSON', 'warn');
    }
  }

  function scrollToMetadataSection(primaryId, fallbackId){
    var el = byId(primaryId) || byId(fallbackId);
    if (!el) return;

    var headerOffset = 88;
    var rect = el.getBoundingClientRect();
    var targetTop = Math.max(0, rect.top + window.pageYOffset - headerOffset);

    window.scrollTo({ top: targetTop, behavior: 'smooth' });

    el.classList.remove('meta-v2-scroll-focus');
    window.setTimeout(function(){
      el.classList.add('meta-v2-scroll-focus');
    }, 220);
    window.setTimeout(function(){
      el.classList.remove('meta-v2-scroll-focus');
    }, 1500);
  }

  function bindMetadataEvents(){
    renderTemplateGroups();

    if(byId('viewProfileBtn')) byId('viewProfileBtn').onclick = viewMetadataFields;
    if(byId('viewDomain')) byId('viewDomain').addEventListener('keydown', function(e){ if(e.key === 'Enter') viewMetadataFields(); });
    if(byId('loadOwnedProfileBtn')) byId('loadOwnedProfileBtn').onclick = loadOwnedMetadataFields;
    if(byId('ownedProfileDomain')) byId('ownedProfileDomain').onchange = function(){

      clearAllDrafts();
      loadOwnedMetadataFields();
    };
    if(byId('saveFieldBtn')) byId('saveFieldBtn').onclick = setMetadataField;
    if(byId('saveSelectedFieldsBtn')) byId('saveSelectedFieldsBtn').onclick = saveSelectedMetadataFields;
    if(byId('clearSelectedFieldsBtn')) byId('clearSelectedFieldsBtn').onclick = clearSelectedTemplates;
    if(byId('deleteFieldBtn')) byId('deleteFieldBtn').onclick = deleteMetadataField;
    if(byId('metaRunQuery')) byId('metaRunQuery').onclick = rawMetadataQuery;
    if(byId('metaRunExecute')) byId('metaRunExecute').onclick = rawMetadataExecute;
    if(byId('copyProfileJsonBtn')) byId('copyProfileJsonBtn').onclick = copyProfileJson;
    if(byId('refreshBtn')) byId('refreshBtn').onclick = window.initMetadataFunctionPage;

    if(byId('visibilityPublicBtn')) byId('visibilityPublicBtn').onclick = function(){ byId('fieldPublic').checked = true; syncVisibilityButtons(); };
    if(byId('visibilityPrivateBtn')) byId('visibilityPrivateBtn').onclick = function(){ byId('fieldPublic').checked = false; syncVisibilityButtons(); };

    if(byId('fieldKey')) byId('fieldKey').addEventListener('input', function(){ updateEditorHelp(); validateCurrentField(); });
    if(byId('fieldValue')) byId('fieldValue').addEventListener('input', validateCurrentField);

    if(byId('metaFocusEditorBtn')) byId('metaFocusEditorBtn').onclick = function(){ scrollToMetadataSection('metaEditorSection', 'ownedProfileDomain'); };
    if(byId('metaFocusViewerBtn')) byId('metaFocusViewerBtn').onclick = function(){ scrollToMetadataSection('metaSavedFieldsSection', 'metaViewerSection'); };

    if (!window.__metadataV2WalletEventsBound) {
      window.__metadataV2WalletEventsBound = true;
      document.addEventListener('wallet:connected', function(){
        if (typeof window.initMetadataFunctionPage === 'function') window.initMetadataFunctionPage();
      });
      document.addEventListener('wallet:disconnected', function(){
        var select = byId('ownedProfileDomain');
        if (select) select.innerHTML = '<option value="">Connect wallet to load owned names</option>';
        lastOwnedRows = [];
        renderProfilePreview('', []);
        renderMetadataFields(byId('ownedFields'), [], { editable: true });
      });
    }

    syncVisibilityButtons();
    updateEditorHelp();
    validateCurrentField();
  }

  window.initMetadataFunctionPage = async function(){
    initialized = true;
    bindMetadataEvents();
    renderProfilePreview('', []);
    try { await loadMetadataConfig(); } catch(e) {}
    await loadOwnedMetadataDomains();
  };
})();
