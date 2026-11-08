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

  // Copy the post and its final decision to the shared server.
  function publicCopy(c) {
    const copy = JSON.parse(JSON.stringify(c));
    // The decision is part of the shared post, but only shown to eligible viewers in the UI.
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
    if (!data.cases.length) {          // server is empty (just started): start again from the example posts only
      state.cases = SEED.map(c => ({ ...c }));
      for (const id of Object.keys(lastSynced)) delete lastSynced[id];
      window.cloudSync();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      render();
      return;
    }
    const mine = {};
    state.cases.forEach(c => { mine[c.id] = c; });
    const fresh = data.cases.map(c => {
      // Server is the shared source of truth for final decisions.
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
  let checking = false;   // never run two checks at the same time
  async function check() {
    if (checking) return;
    checking = true;
    try {
      const v = (await fetch("/api/version").then(r => r.json())).version;
      if (v !== version) await pull();
    } catch (e) { /* server unreachable for now: keep using local data */ }
    checking = false;
  }

  check();
  setInterval(check, 3000);
})();
