/* =====================================================================
   InkBrawl networking v2
   ---------------------------------------------------------------------
   The original game connected players only with WebRTC (PeerJS). That
   works on one machine or one Wi-Fi, but between real devices it often
   fails: phones on mobile data sit behind symmetric NATs, some routers
   block UDP, and the PeerJS public TURN servers are frequently down.

   This file keeps WebRTC as the fast path and adds a second, always-
   available path: a relay through the same free public MQTT brokers that
   already power the server list. No server of your own is needed.

     host  : registers on PeerJS (if it can) AND listens on the relay
     client: tries WebRTC first; if the data channel is not open within a
             few seconds (or PeerJS is unreachable) it joins via the relay

   Both paths produce a "conn" object with the same tiny surface the game
   uses (peer, open, send, close, on('open'|'data'|'close'|'error')), so
   the rest of the game code does not care which one is in use.
   ===================================================================== */
(() => {
  'use strict';
  const RELAY_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const RELAY_ROOT = 'inkbrawl/v2/relay/';
  const P2P_WAIT = 3500;          // ms to wait for a WebRTC data channel before also trying the relay
  const JOIN_TIMEOUT = 22000;     // ms before giving up completely
  // several independent STUN servers + the PeerJS TURN pair; more candidates = more NATs punched
  const ICE = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ];
  const PEER_OPTS = { debug: 0, config: { iceServers: ICE, sdpSemantics: 'unified-plan' } };
  const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

  // test.mosquitto.org's websocket port answers 502 for most people now: drop it from the lobby list.
  try { const i = LOBBY_BROKERS.indexOf('wss://test.mosquitto.org:8081/mqtt'); if (i >= 0) LOBBY_BROKERS.splice(i, 1); } catch (e) { }

  /* ---------- tiny event emitter used by relay conns ---------- */
  class Emitter {
    constructor() { this._h = {}; }
    on(ev, fn) { (this._h[ev] || (this._h[ev] = [])).push(fn); return this; }
    off(ev, fn) { const a = this._h[ev]; if (a) this._h[ev] = a.filter(f => f !== fn); return this; }
    emit(ev, ...a) { for (const f of (this._h[ev] || []).slice()) { try { f(...a); } catch (e) { console.warn('net handler', e); } } }
  }
  const mqttOpts = (extra) => Object.assign({ clientId: 'ibr_' + rid(), clean: true, connectTimeout: 8000, reconnectPeriod: 3000, keepalive: 20, protocolVersion: 4 }, extra || {});

  /* ---------- a relay connection (same shape as a PeerJS DataConnection) ---------- */
  class RelayConn extends Emitter {
    constructor(client, pubTopic, wrap, peerId) {
      super(); this.client = client; this.pubTopic = pubTopic; this.wrap = wrap; this.peer = peerId; this.open = false; this.relay = true; this.lastIn = performance.now();
    }
    send(m) { if (!this.open || !this.client || !this.client.connected) return; try { this.client.publish(this.pubTopic, JSON.stringify(this.wrap(m)), { qos: 0 }); } catch (e) { } }
    close() { if (this._closed) return; this._closed = true; const was = this.open; this.open = false; try { if (this.client && this.client.connected) this.client.publish(this.pubTopic, JSON.stringify(this.wrap(null, true)), { qos: 0 }); } catch (e) { } if (was || this._everOpen) this.emit('close'); if (this.onClosed) this.onClosed(); }
    _in(m) { this.lastIn = performance.now(); this.emit('data', m); }
    _open() { if (this.open || this._closed) return; this.open = true; this._everOpen = true; this.emit('open'); }
    _remoteClose() { if (this._closed) return; this._closed = true; this.open = false; this.emit('close'); if (this.onClosed) this.onClosed(); }
  }

  /* ---------- host side: listens on every broker for joiners ---------- */
  class RelayHub extends Emitter {
    constructor(code) { super(); this.code = code; this.base = RELAY_ROOT + code + '/'; this.clients = []; this.conns = new Map(); this.destroyed = false; }
    async start() {
      if (!(await libMqtt()) || !window.mqtt) return false;
      for (const url of RELAY_BROKERS) {
        try {
          const c = mqtt.connect(url, mqttOpts({ will: { topic: this.base + 'bye', payload: '1', qos: 0, retain: false } }));
          c.on('connect', () => { c.subscribe(this.base + 'h', { qos: 0 }); this.emit('status'); });
          c.on('message', (topic, buf) => this._msg(c, buf));
          c.on('error', () => { }); c.on('offline', () => this.emit('status'));
          this.clients.push(c);
        } catch (e) { }
      }
      // relay conns have no transport-level close when a phone just vanishes: time them out
      this.sweep = setInterval(() => { const t = performance.now(); for (const k of [...this.conns.keys()]) { const cn = this.conns.get(k); if (t - cn.lastIn > 15000) cn._remoteClose(); } }, 3000);
      return true;
    }
    get connected() { return this.clients.some(c => c.connected); }
    _msg(client, buf) {
      let j; try { j = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!j || typeof j.f !== 'string' || j.f.length > 40) return;
      let cn = this.conns.get(j.f);
      if (j.x) { if (cn) cn._remoteClose(); return; }
      if (j.o) {
        if (!cn) {
          const cid = j.f; cn = new RelayConn(client, this.base + 'c/' + cid, (m, bye) => bye ? { x: 1 } : { d: m }, 'relay:' + cid);
          cn.onClosed = () => this.conns.delete(cid); this.conns.set(cid, cn);
          this.emit('connection', cn); cn._open();
        }
        cn.client = client; // answer on whichever broker the joiner reached us on
        try { client.publish(this.base + 'c/' + j.f, JSON.stringify({ o: 1 }), { qos: 0 }); } catch (e) { }
        return;
      }
      if (cn && 'd' in j) cn._in(j.d);
    }
    destroy() { this.destroyed = true; clearInterval(this.sweep); for (const cn of [...this.conns.values()]) cn.close(); for (const c of this.clients) { try { c.publish(this.base + 'bye', '1'); } catch (e) { } setTimeout(() => { try { c.end(true); } catch (e) { } }, 300); } this.clients = []; }
  }

  /* ---------- client side: reach the host through whichever broker answers first ---------- */
  function relayJoin(code) {
    return new Promise(async (res) => {
      if (!(await libMqtt()) || !window.mqtt) return res(null);
      const cid = rid(), base = RELAY_ROOT + code + '/'; const clients = []; let done = false, conn = null;
      const finish = (c) => {
        if (done) return; done = true; clearInterval(knock); clearTimeout(to);
        for (const o of clients) if (o !== c) { try { o.end(true); } catch (e) { } }
        if (!c) return res(null);
        conn = new RelayConn(c, base + 'h', (m, bye) => bye ? { f: cid, x: 1 } : { f: cid, d: m }, 'relay-host:' + code);
        conn.onClosed = () => setTimeout(() => { try { c.end(true); } catch (e) { } }, 300);
        conn._client = c; res(conn); setTimeout(() => conn._open(), 0);
      };
      for (const url of RELAY_BROKERS) {
        try {
          const c = mqtt.connect(url, mqttOpts({ will: { topic: base + 'h', payload: JSON.stringify({ f: cid, x: 1 }), qos: 0, retain: false } }));
          c.on('connect', () => { c.subscribe([base + 'c/' + cid, base + 'bye'], { qos: 0 }, () => { try { c.publish(base + 'h', JSON.stringify({ f: cid, o: 1 })); } catch (e) { } }); });
          c.on('message', (topic, buf) => {
            if (topic === base + 'bye') { if (conn && conn._client === c) conn._remoteClose(); return; }
            let j; try { j = JSON.parse(buf.toString()); } catch (e) { return; }
            if (!done && j && j.o) { finish(c); return; }
            if (conn && conn._client === c) { if (j.x) conn._remoteClose(); else if ('d' in j) conn._in(j.d); }
          });
          c.on('error', () => { });
          clients.push(c);
        } catch (e) { }
      }
      // keep knocking: the first knock can race the subscription on a fresh broker connection
      const knock = setInterval(() => { for (const c of clients) if (c.connected) try { c.publish(base + 'h', JSON.stringify({ f: cid, o: 1 })); } catch (e) { } }, 1200);
      const to = setTimeout(() => finish(null), JOIN_TIMEOUT - 2000);
    });
  }

  /* ---------- a host "peer" that merges PeerJS + relay into one object ---------- */
  class HostHub extends Emitter {
    constructor(code, peer, relay) { super(); this.code = code; this.peer = peer; this.relay = relay; this.destroyed = false; }
    get disconnected() { return !!(this.peer && this.peer.disconnected); }
    reconnect() { try { if (this.peer && !this.peer.destroyed && this.peer.disconnected) this.peer.reconnect(); } catch (e) { } }
    destroy() { this.destroyed = true; try { this.peer && this.peer.destroy(); } catch (e) { } try { this.relay && this.relay.destroy(); } catch (e) { } }
  }
  Net.via = null; // 'p2p' | 'relay' for a client; shown in the HUD

  /* ---------- replace openHostPeer: never fails just because PeerJS is down ---------- */
  window.openHostPeer = openHostPeer = function () {
    return new Promise(async (res, rej) => {
      const [hasPeer, hasMqtt] = await Promise.all([libPeer(), libMqtt()]);
      if (!hasPeer && !hasMqtt) return rej('Could not load the networking libraries (no internet?)');
      const tryPeer = (code) => new Promise(r => {
        if (!hasPeer || !window.Peer) return r(null);
        let peer; try { peer = new Peer(PEER_PREFIX + code, PEER_OPTS); } catch (e) { return r(null); }
        let settled = false; const to = setTimeout(() => { if (!settled) { settled = true; r(null); /* keep trying in background */ } }, 9000);
        peer.on('open', () => { if (!settled) { settled = true; clearTimeout(to); r(peer); } });
        peer.on('error', err => { if (!settled) { settled = true; clearTimeout(to); try { peer.destroy(); } catch (e) { } r(err && err.type === 'unavailable-id' ? 'taken' : null); } });
      });
      let code, peer = null;
      for (let i = 0; i < 5; i++) { code = genCode(); peer = await tryPeer(code); if (peer !== 'taken') break; }
      if (peer === 'taken') peer = null;
      let relay = null; if (hasMqtt) { relay = new RelayHub(code); if (!(await relay.start())) relay = null; }
      if (!peer && !relay) return rej('Could not reach any matchmaking server. Check the internet connection.');
      res({ peer: new HostHub(code, peer, relay), code });
    });
  };

  /* ---------- replace hostWire: one handler for both kinds of conn ---------- */
  window.hostWire = hostWire = function (hub) {
    const wire = conn => {
      conn.on('data', m => { m = netUnpart(conn, m); if (m) hostRecv(conn, m); });
      conn.on('close', () => hostDrop(conn)); conn.on('error', () => hostDrop(conn));
    };
    if (hub.relay) hub.relay.on('connection', wire);
    const peer = hub.peer; if (!peer) return;
    peer.on('connection', wire);
    let backoff = 1500;
    peer.on('disconnected', () => {
      if (Net.peer !== hub || peer.destroyed) return; Net.reconnecting = true;
      setTimeout(() => { try { if (!peer.destroyed && peer.disconnected) peer.reconnect(); } catch (e) { } }, backoff); backoff = Math.min(15000, backoff * 1.6);
    });
    peer.on('open', () => { Net.reconnecting = false; backoff = 1500; });
    peer.on('error', err => { /* after the room is open errors are non-fatal: the relay keeps the room reachable */ if (err && err.type === 'unavailable-id') Net.reconnecting = false; });
  };

  /* ---------- message framing: parts may arrive out of order on the relay ---------- */
  window.netSend = netSend = function (conn, m) {
    try {
      if (!conn || !conn.open) return;
      const s = JSON.stringify(m);
      const lim = conn.relay ? 60000 : 15500;
      if (s.length < 5000 || NET_ENC.encode(s).length < lim) { conn.send(m); return; }
      const k = netPartId++, N = conn.relay ? 24000 : 4000, n = Math.ceil(s.length / N);
      for (let i = 0; i < n; i++) conn.send({ t: '_pt', k, i, n, d: s.slice(i * N, (i + 1) * N) });
    } catch (e) { }
  };
  window.netUnpart = netUnpart = function (conn, m) {
    if (!m || m.t !== '_pt') return m;
    if (!(m.n > 0 && m.n < 5000 && m.i >= 0 && m.i < m.n)) return null;
    const P = conn._parts || (conn._parts = {}); const b = P[m.k] || (P[m.k] = { got: 0, a: new Array(m.n), t: performance.now() });
    if (b.a[m.i] === undefined) { b.a[m.i] = m.d; b.got++; }
    if (b.got < m.n) {
      // forget half-received messages after a while so a lost part cannot leak memory forever
      const t = performance.now(); for (const k in P) if (t - P[k].t > 30000) delete P[k];
      return null;
    }
    delete P[m.k]; try { return JSON.parse(b.a.join('')); } catch (e) { return null; }
  };

  /* ---------- replace startClient: WebRTC first, relay as automatic fallback ---------- */
  window.startClient = startClient = function (code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); if (code.length !== 5) { UI.joinError('Room codes are 5 letters.'); return; }
    try { localStorage.setItem('inkbrawl.lastCode', code); } catch (e) { }
    stopSession(); UI.show('connecting'); $('#connTitle').textContent = 'Joining ' + code; $('#connSub').textContent = 'Shaking hands with the host…'; $('#connErr').textContent = '';
    const token = Net.token = Math.random(); let chosen = null, joined = false, p2pDead = false, relayStarted = false, relayDead = false;
    const alive = () => Net.token === token;
    const fail = msg => { if (!alive() || G.mode === 'play' || joined) return; $('#connErr').textContent = msg; $('#connSub').textContent = 'Could not join'; stopSession(true); };
    const sub = t => { if (alive() && !joined) $('#connSub').textContent = t; };
    const hello = () => ({ t: 'hello', name: UI.name, color: UI.color, char: UI.char, v: 1, have: Weapons.list.filter(w => w.img && w.path && !/^picked/.test(w.path)).map(w => w.id + '|' + w.path) });
    const choose = (conn, via) => {
      if (!alive() || chosen) { try { conn.close(); } catch (e) { } return; }
      chosen = conn; Net.hostConn = conn; Net.via = via; sub(via === 'relay' ? 'Connected through the relay, loading the arena…' : 'Connected, loading the arena…');
      conn.on('data', m => { if (!alive()) return; m = netUnpart(conn, m); if (!m) return; if (m.t === 'welcome') { joined = true; clearTimeout(to); } if (m.t === 'closed') { lostConnection('The host closed the room.'); return; } clientRecv(m); });
      conn.on('close', () => { if (!alive() || Net.hostConn !== conn) return; if (joined) lostConnection('Lost the connection to the host.'); else fail('Connection closed by the host.'); });
      conn.on('error', () => { });
      const go = () => netSend(conn, hello()); if (conn.open) go(); else conn.on('open', go);
      // the other path is no longer needed
      if (via === 'relay' && Net.peer) { try { Net.peer.destroy(); } catch (e) { } Net.peer = null; }
    };
    const to = setTimeout(() => { if (alive() && !joined) fail(chosen ? 'The host stopped answering while loading. Try again.' : 'No room with code ' + code + ' answered. Check the code, or the room may have closed.'); }, JOIN_TIMEOUT);
    const startRelay = () => {
      if (relayStarted || !alive() || chosen) return; relayStarted = true; if (!p2pDead) sub('Direct link is slow, trying the relay too…');
      relayJoin(code).then(conn => {
        if (!alive()) { if (conn) conn.close(); return; }
        if (!conn) { relayDead = true; if (p2pDead && !chosen) fail('No room with code ' + code + ' is online.'); return; }
        // the relay conn is open immediately; prefer WebRTC if it opened in the meantime
        if (chosen) { conn.close(); return; }
        choose(conn, 'relay');
      });
    };
    const p2pFailed = () => { p2pDead = true; if (!relayStarted) startRelay(); else if (relayDead && !chosen) fail('No room with code ' + code + ' is online.'); };
    setTimeout(startRelay, P2P_WAIT);
    libPeer().then(ok => {
      if (!alive()) return;
      if (!ok || !window.Peer) return p2pFailed();
      let peer; try { peer = new Peer(PEER_OPTS); } catch (e) { return p2pFailed(); } Net.peer = peer;
      peer.on('open', () => {
        if (!alive() || chosen) return;
        const conn = peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' });
        conn.on('open', () => choose(conn, 'p2p'));
        conn.on('error', () => { });
        // ICE can silently stall forever: if the channel is not up soon, fall back
        setTimeout(() => { if (alive() && !conn.open && !chosen) startRelay(); }, P2P_WAIT);
      });
      peer.on('error', err => { if (!alive()) return; if (!chosen) p2pFailed(); });
      peer.on('disconnected', () => { try { if (!peer.destroyed && Net.peer === peer) peer.reconnect(); } catch (e) { } });
    });
  };

  /* ---------- server list: tolerate device clocks that are minutes apart ---------- */
  try {
    Lobby.list = function () {
      const t = Date.now(), n = now();
      return [...this.rooms.values()].filter(r => n - r.seen < 14 && (r.live || t - r.ts < 120000)).filter(r => !(this.hosting && r.code === this.hosting.code)).sort((a, b) => b.ts - a.ts);
    };
    const _onMsg = Lobby.onMsg.bind(Lobby);
    Lobby.onMsg = function (topic, msg, packet) { _onMsg(topic, msg); const code = topic.split('/').pop(); const r = this.rooms.get(code); if (r && packet && !packet.retain) r.live = true; };
    const _ensure = Lobby.ensure.bind(Lobby);
    Lobby.ensure = async function () {
      if (this.started) return; await _ensure();
      // re-route messages with the packet so we can tell fresh broadcasts from stale retained ones
      for (const c of this.clients) { c.removeAllListeners('message'); c.on('message', (topic, msg, packet) => this.onMsg(topic, msg, packet)); }
    };
  } catch (e) { }

  /* ---------- tiny dev hook used by the automated tests ---------- */
  window.__net = { RelayHub, relayJoin, ICE, forceRelay: false };
  const _rtc = window.RTCPeerConnection;
  if (/[?&]relay=1/.test(location.search) && _rtc) {
    // simulate a network where WebRTC never connects (used to test the relay path)
    window.RTCPeerConnection = function (cfg) { const pc = new _rtc(Object.assign({}, cfg, { iceServers: [], iceTransportPolicy: 'relay' })); return pc; };
    window.RTCPeerConnection.prototype = _rtc.prototype;
  }
})();
