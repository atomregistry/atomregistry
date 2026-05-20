'use strict';

var CFG = {
  CHAIN_ID:      'cosmoshub-4',
  DENOM:         'uatom',
  GAS_PRICE:     0.025,
  GAS_ADJ:       1.8,
  GAS_FALLBACK:  400000,
  MIN_COMMIT:    10,
  MAX_COMMIT:    1800,
  SITE_REGISTRY: 'cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt',
  REGISTRY:      'cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe',
  REGISTRAR:     'cosmos1w4rknyllzt7mu6tsl6m7qm0sss66stwemvc4p4utdsyrjdf9q44ss0697x',
  TLD_MANAGER:   'cosmos12sseygvx4ykhp0df70ndg82l7p9a7ld7l0n0pptwj7c2h726cc9sahh4hz',
  RESOLVER:      'cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv',
  MARKETPLACE:   'cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc',
  METADATA:      'cosmos1cu35kuzrvlprssa3j5p0ypwy9v6j4s6ugc5sm7gz6klj4pxmjeksvxcea0',
  DSSL:          'cosmos1pmuxqc3ehdjkm8wzpqz5saxztwn97a84ga27uktt6huckxw3j8lszgjnpp',
  DID_ADAPTER:   'cosmos146n3zuu32nlqqa3rln2l70a6wez2wrzvwy0k5h30phl4d900h6gspyl95l',
  TYPE_EXECUTE:  '/cosmwasm.wasm.v1.MsgExecuteContract',
  TYPE_PUBKEY:   '/cosmos.crypto.secp256k1.PubKey',
  LEDGER_MOCK:      false,
  LEDGER_MOCK_ADDR: '',
  REST: [
    'https://cosmos-rest.publicnode.com',
    'https://rest.cosmos.directory/cosmoshub',
    'https://cosmoshub-api.lavenderfive.com',
    'https://cosmos-api.polkachu.com'
  ]
};

var DOMAIN_PREMIUM_KEYWORDS = ['ai','btc','crypto','defi','nft','shop','pay','dex','dao'];

function calculateDomainPrice(label) {
  var name = String(label || '').replace(/^\./, '').toLowerCase().trim();
  if (name.length <= 1) return 0;
  var base = name.length === 2 ? 100 : name.length === 3 ? 50 : name.length === 4 ? 25 : 15;
  var premium = 0;
  if (/^[0-9]+$/.test(name)) premium += 10;
  if (DOMAIN_PREMIUM_KEYWORDS.indexOf(name) !== -1) premium += 25;
  return Math.max(15, base + premium);
}

function calculateDomainPriceUatom(label) {
  return calculateDomainPrice(label) * 1000000;
}

window.calculateDomainPrice = calculateDomainPrice;
window.calculateDomainPriceUatom = calculateDomainPriceUatom;
