// Cloud sync: posts and votes are stored on our own Python server (server.py),
// so everyone who opens the site sees the same data.
// persist() in js/app.js calls cloudSync() after every save.
(function () {
  const lastSynced = {};   // what each post looks like on the server, used to find changed posts
  let version = -1;        // server data version; it changes when anyone posts or votes

  // Turn an object into text with sorted keys, so the same content always gives the same text
  function stable(x) {
    if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
    if (x && typeof x === "object") {
      return "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + stable(x[k])).join(",") + "}";
    }
    return JSON.stringify(x);
  }

  // Copy to upload: the owner's private decision (bought / skipped) stays on this device only
  function publicCopy(c) {
    const copy = JSON.parse(JSON.stringify(c));
    delete copy.decision;
    return copy;
  }

  // Is the only change some new votes?
  function onlyNewVotes(oldCase, newCase) {
    const oldVotes = oldCase.votes || [], newVotes = newCase.votes || [];
    if (newVotes.length <= oldVotes.length) return false;
    return stable({ ...newCase, votes: newVotes.slice(0, oldVotes.length) }) === stable(oldCase);
  }

  function send(method, url, body) {
    return fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(r => {
      if (!r.ok) return r.json().then(e => { throw new Error(e.detail || r.status); });
    }).catch(e => toast("Cloud save failed: " + e.message));
  }

  // Called by persist(): upload every post that changed
  window.cloudSync = function () {
    if (version < 0) return;   // wait until the first download from the server
    const stillHere = new Set();
    for (const c of state.cases) {
      const id = String(c.id);
      stillHere.add(id);
      const now = publicCopy(c);
      const nowText = stable(now);
      if (lastSynced[id] === nowText) continue;   // unchanged, skip
      const before = lastSynced[id] ? JSON.parse(lastSynced[id]) : null;
      if (before && onlyNewVotes(before, now)) {
        send("POST", "/api/cases/" + encodeURIComponent(id) + "/votes", now.votes.slice((before.votes || []).length));
      } else {
        send("PUT", "/api/cases/" + encodeURIComponent(id), now);
      }
      lastSynced[id] = nowText;
    }
    for (const id of Object.keys(lastSynced)) {
      if (!stillHere.has(id)) { send("DELETE", "/api/cases/" + encodeURIComponent(id)); delete lastSynced[id]; }
    }
  };

  // Download all posts from the server and replace the local list
  async function pull() {
    const data = await fetch("/api/cases").then(r => r.json());
    version = data.version;
    if (!data.cases.length) {          // server is empty (just started): upload the example posts
      window.cloudSync();
      return;
    }
    const mine = {};
    state.cases.forEach(c => { mine[c.id] = c; });
    const fresh = data.cases.map(c => {
      if (mine[c.id] && mine[c.id].decision) c.decision = mine[c.id].decision;   // keep the private decision from this device
      lastSynced[String(c.id)] = stable(publicCopy(c));
      return c;
    });
    fresh.sort((a, b) => b.id - a.id);
    state.cases = fresh;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    render();
    if (!document.getElementById("exploreView").hidden) renderExplore();
  }

  // Every 3 seconds, ask the server for its version; download again if it changed
  async function check() {
    try {
      const v = (await fetch("/api/version").then(r => r.json())).version;
      if (v !== version) await pull();
    } catch (e) { /* server unreachable for now: keep using local data */ }
  }

  check();
  setInterval(check, 3000);
})();
