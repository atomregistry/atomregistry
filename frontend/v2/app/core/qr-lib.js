
'use strict';

window.ArQR = (function () {

  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = (x << 1) ^ (x & 0x80 ? 0x11D : 0);
      x &= 0xFF;
    }
    for (var i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : EXP[(LOG[a] + LOG[b]) % 255];
  }

  function genPoly(degree) {
    var poly = [1];
    for (var i = 0; i < degree; i++) {
      var n = new Array(poly.length + 1);
      n[0] = poly[0];
      for (var j = 1; j < poly.length; j++) n[j] = poly[j] ^ gfMul(poly[j - 1], EXP[i]);
      n[poly.length] = gfMul(poly[poly.length - 1], EXP[i]);
      poly = n;
    }
    return poly;
  }

  function rsEcc(data, eccLen) {
    var g = genPoly(eccLen);
    var ecc = new Array(eccLen);
    for (var i = 0; i < eccLen; i++) ecc[i] = 0;
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ ecc[0];
      for (var j = 0; j < eccLen - 1; j++) ecc[j] = ecc[j + 1] ^ gfMul(g[j + 1], factor);
      ecc[eccLen - 1] = gfMul(g[eccLen], factor);
    }
    return ecc;
  }

  var BLOCKS_M = [
    null,
    [1, 16, 0, 0, 10],
    [1, 28, 0, 0, 16],
    [1, 44, 0, 0, 26],
    [2, 32, 0, 0, 18],
    [2, 43, 0, 0, 24],
    [4, 27, 0, 0, 16],
    [4, 31, 0, 0, 18],
    [2, 38, 2, 39, 22],
    [3, 36, 2, 37, 22],
    [4, 43, 1, 44, 26]
  ];

  function dataCapacityBytes(version) {
    var b = BLOCKS_M[version];
    return b[0] * b[1] + b[2] * b[3];
  }

  function pickVersion(byteCount) {
    for (var v = 1; v <= 10; v++) {
      var cciBits = (v <= 9) ? 8 : 16;
      var bits = 4 + cciBits + byteCount * 8;
      if (bits + 4 <= dataCapacityBytes(v) * 8) return v;
    }
    throw new Error('Data too long for QR v1–v10 (' + byteCount + ' bytes) - shorten the payload.');
  }

  function encodeBytes(text, version) {
    var bytes = new TextEncoder().encode(text);
    var capacityBits = dataCapacityBytes(version) * 8;
    var cciBits = (version <= 9) ? 8 : 16;

    var bits = [];
    function push(value, count) {
      for (var i = count - 1; i >= 0; i--) bits.push((value >> i) & 1);
    }
    push(0x4, 4);
    push(bytes.length, cciBits);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var term = Math.min(4, capacityBits - bits.length);
    for (var i = 0; i < term; i++) bits.push(0);

    while (bits.length % 8 !== 0) bits.push(0);

    var padBytes = [0xEC, 0x11];
    var idx = 0;
    while (bits.length < capacityBits) {
      push(padBytes[idx % 2], 8);
      idx++;
    }
    var out = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      out.push(b);
    }
    return out;
  }

  function buildCodewords(data, version) {
    var b = BLOCKS_M[version];
    var numG1 = b[0], lenG1 = b[1], numG2 = b[2], lenG2 = b[3], eccLen = b[4];
    var blocks = [];
    var off = 0;
    for (var i = 0; i < numG1; i++) { blocks.push(data.slice(off, off + lenG1)); off += lenG1; }
    for (var i = 0; i < numG2; i++) { blocks.push(data.slice(off, off + lenG2)); off += lenG2; }
    var eccBlocks = blocks.map(function (blk) { return rsEcc(blk, eccLen); });

    var interleaved = [];
    var maxData = Math.max(lenG1, lenG2);
    for (var i = 0; i < maxData; i++) {
      for (var k = 0; k < blocks.length; k++) {
        if (i < blocks[k].length) interleaved.push(blocks[k][i]);
      }
    }
    for (var i = 0; i < eccLen; i++) {
      for (var k = 0; k < eccBlocks.length; k++) interleaved.push(eccBlocks[k][i]);
    }
    return interleaved;
  }

  function moduleCount(version) { return 17 + 4 * version; }

  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  function newMatrix(size) {
    var m = [], f = [];
    for (var r = 0; r < size; r++) {
      m.push(new Array(size).fill(0));
      f.push(new Array(size).fill(false));
    }
    return { m: m, f: f, size: size };
  }

  function setM(mat, r, c, dark) {
    mat.m[r][c] = dark ? 1 : 0;
    mat.f[r][c] = true;
  }

  function placeFinder(mat, r0, c0) {
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var r = r0 + dr, c = c0 + dc;
        if (r < 0 || c < 0 || r >= mat.size || c >= mat.size) continue;
        var dark;
        if (dr === -1 || dr === 7 || dc === -1 || dc === 7) dark = false;
        else if (dr === 0 || dr === 6 || dc === 0 || dc === 6) dark = true;
        else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) dark = true;
        else dark = false;
        setM(mat, r, c, dark);
      }
    }
  }

  function placeAlignment(mat, r0, c0) {
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        var d = Math.max(Math.abs(dr), Math.abs(dc));
        setM(mat, r0 + dr, c0 + dc, d !== 1);
      }
    }
  }

  function reserveFormatArea(mat) {
    var s = mat.size;

    for (var i = 0; i <= 8; i++) {
      if (!mat.f[8][i]) mat.f[8][i] = true;
      if (!mat.f[i][8]) mat.f[i][8] = true;
    }

    for (var i = 0; i < 8; i++) mat.f[s - 1 - i][8] = true;
    for (var i = 0; i < 8; i++) mat.f[8][s - 1 - i] = true;
  }

  function buildMatrix(version) {
    var size = moduleCount(version);
    var mat = newMatrix(size);

    placeFinder(mat, 0, 0);
    placeFinder(mat, 0, size - 7);
    placeFinder(mat, size - 7, 0);

    var aligns = ALIGN[version];
    for (var i = 0; i < aligns.length; i++) {
      for (var j = 0; j < aligns.length; j++) {
        var r = aligns[i], c = aligns[j];
        if ((r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8)) continue;
        placeAlignment(mat, r, c);
      }
    }

    for (var i = 8; i < size - 8; i++) {
      if (!mat.f[6][i]) setM(mat, 6, i, i % 2 === 0);
      if (!mat.f[i][6]) setM(mat, i, 6, i % 2 === 0);
    }

    setM(mat, size - 8, 8, true);

    reserveFormatArea(mat);

    return mat;
  }

  function placeData(mat, codewords) {
    var size = mat.size;
    var bits = [];
    for (var i = 0; i < codewords.length; i++) {
      for (var j = 7; j >= 0; j--) bits.push((codewords[i] >> j) & 1);
    }
    var bi = 0;
    var upward = true;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right--;
      for (var vert = 0; vert < size; vert++) {
        for (var k = 0; k < 2; k++) {
          var c = right - k;
          var r = upward ? size - 1 - vert : vert;
          if (!mat.f[r][c]) {
            if (bi < bits.length) {
              mat.m[r][c] = bits[bi++];
            } else {
              mat.m[r][c] = 0;
            }
          }
        }
      }
      upward = !upward;
    }
  }

  var MASKS = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r, c) { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
    function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
    function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
  ];

  function applyMask(mat, idx) {
    var fn = MASKS[idx];
    var s = mat.size;
    var copy = [];
    for (var r = 0; r < s; r++) {
      var row = mat.m[r].slice();
      for (var c = 0; c < s; c++) {
        if (!mat.f[r][c] && fn(r, c)) row[c] ^= 1;
      }
      copy.push(row);
    }
    return copy;
  }

  function penalty(modules) {
    var s = modules.length;
    var p = 0;

    for (var r = 0; r < s; r++) {
      var run = 1;
      for (var c = 1; c < s; c++) {
        if (modules[r][c] === modules[r][c - 1]) {
          run++;
          if (run === 5) p += 3; else if (run > 5) p += 1;
        } else run = 1;
      }
    }
    for (var c = 0; c < s; c++) {
      var run = 1;
      for (var r = 1; r < s; r++) {
        if (modules[r][c] === modules[r - 1][c]) {
          run++;
          if (run === 5) p += 3; else if (run > 5) p += 1;
        } else run = 1;
      }
    }

    for (var r = 0; r < s - 1; r++) {
      for (var c = 0; c < s - 1; c++) {
        var v = modules[r][c];
        if (modules[r][c + 1] === v && modules[r + 1][c] === v && modules[r + 1][c + 1] === v) p += 3;
      }
    }

    var dark = 0;
    for (var r = 0; r < s; r++) for (var c = 0; c < s; c++) if (modules[r][c]) dark++;
    var pct = (dark * 100) / (s * s);
    p += Math.floor(Math.abs(pct - 50) / 5) * 10;

    return p;
  }

  function pickBestMask(mat) {
    var bestIdx = 0, bestPen = Infinity, bestMods = null;
    for (var i = 0; i < 8; i++) {
      var masked = applyMask(mat, i);
      var pen = penalty(masked);
      if (pen < bestPen) { bestPen = pen; bestIdx = i; bestMods = masked; }
    }
    return { mask: bestIdx, modules: bestMods };
  }

  function bchFormatInfo(eccLevelBits, maskIdx) {
    var data = (eccLevelBits << 3) | maskIdx;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) ? 0x537 : 0);
    var fmt = ((data << 10) | rem) ^ 0x5412;
    return fmt & 0x7FFF;
  }

  function placeFormatInfo(modules, size, fmt) {

    for (var i = 0; i <= 5; i++) modules[8][i] = (fmt >> i) & 1;
    modules[8][7] = (fmt >> 6) & 1;
    modules[8][8] = (fmt >> 7) & 1;
    modules[7][8] = (fmt >> 8) & 1;
    for (var i = 9; i < 15; i++) modules[14 - i][8] = (fmt >> i) & 1;

    for (var i = 0; i < 7; i++) modules[size - 1 - i][8] = (fmt >> i) & 1;
    for (var i = 7; i < 15; i++) modules[8][size - 15 + i] = (fmt >> i) & 1;

    modules[size - 8][8] = 1;
  }

  function encode(text, eccLevel) {

    if (typeof text !== 'string') text = String(text == null ? '' : text);
    var bytes = new TextEncoder().encode(text);
    var version = pickVersion(bytes.length);
    var dataCodewords = encodeBytes(text, version);
    var allCodewords = buildCodewords(dataCodewords, version);
    var mat = buildMatrix(version);
    placeData(mat, allCodewords);
    var best = pickBestMask(mat);

    var fmt = bchFormatInfo(0, best.mask);
    placeFormatInfo(best.modules, mat.size, fmt);
    return {
      size: mat.size,
      version: version,
      modules: best.modules,
      isDark: function (r, c) { return best.modules[r][c] === 1; }
    };
  }

  return {
    encode: encode,
    moduleCount: moduleCount
  };
})();
