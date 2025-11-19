import React, { useEffect, useMemo, useRef, useState } from "react";

// VibeVerse — Advanced single-file React app (no TypeScript, no Tailwind)
// New features added:
// 1) Heart animation on double-tap
// 2) Persist created posts metadata (NOT images) so created posts survive reloads
// 3) Message page with simple direct messages UI
// 4) Infinite scroll / pagination for the feed
// 5) Export / Import small state (likes, follows, comments, created posts metadata) as JSON

// --------------------- Minimal CSS injection ---------------------
if (typeof document !== "undefined" && !document.getElementById("vv-style-advanced")) {
  const css = `
    :root{--bg:#fafafa;--card:#fff;--muted:#6b7280;--accent:#ff3366}
    *{box-sizing:border-box}
    body{margin:0;font-family:Inter, Arial, sans-serif;background:var(--bg);color:#111}
    .vv-root{min-height:100vh}
    .vv-nav{height:64px;background:var(--card);display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid #eee;position:sticky;top:0;z-index:40}
    .vv-logo{font-weight:800}
    .vv-search{padding:8px 10px;border-radius:8px;border:1px solid #e8e8ee;width:220px}
    .vv-container{max-width:1100px;margin:18px auto;padding:0 12px}

    .vv-stories{display:flex;gap:12px;padding:12px 0;overflow:auto}
    .vv-story{width:72px;text-align:center;cursor:pointer}
    .vv-story img{width:64px;height:64px;border-radius:50%;border:3px solid #ffdce6}

    .vv-layout{display:flex;gap:20px}
    .vv-feed{flex:1}
    .vv-sidebar{width:300px}

    .vv-card{background:var(--card);border:1px solid #eee;border-radius:10px;margin-bottom:18px;overflow:hidden;position:relative}
    .vv-card-head{display:flex;align-items:center;padding:12px;gap:12px}
    .vv-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover}
    .vv-username{font-weight:700}
    .vv-media img{width:100%;height:auto;display:block}
    .vv-actions{display:flex;align-items:center;justify-content:space-between;padding:10px}
    .vv-actions-left button{background:none;border:0;font-size:20px;cursor:pointer;margin-right:8px}
    .vv-stats{padding:0 12px 8px 12px;font-weight:600}
    .vv-caption{padding:0 12px 12px 12px}
    .vv-comments-preview{padding:0 12px 12px 12px;color:var(--muted);cursor:pointer}

    .vv-sidebar .vv-me{display:flex;gap:10px;align-items:center;padding:12px;background:var(--card);border:1px solid #eee;border-radius:12px}
    .vv-suggest{margin-top:12px}
    .vv-suggest-item{display:flex;gap:10px;align-items:center;padding:8px}
    .vv-suggest-item img{width:40px;height:40px;border-radius:50%}
    .vv-suggest-item button{margin-left:auto}

    .vv-modal{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:20px;z-index:60}
    .vv-create{background:var(--card);padding:18px;border-radius:12px;max-width:900px;width:100%}
    .vv-preview-small{width:100%;height:260px;border:1px solid #eee;display:flex;align-items:center;justify-content:center;margin-bottom:8px}
    .vv-preview-small img{max-width:100%;max-height:100%;object-fit:contain}

    .vv-comments-modal{display:flex;background:var(--card);width:90%;max-width:1000px;border-radius:10px;overflow:hidden}
    .vv-comments-left{flex:1;background:#000}
    .vv-comments-left img{width:100%;height:100%;object-fit:cover}
    .vv-comments-right{width:420px;display:flex;flex-direction:column}
    .vv-comments-top{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #eee}
    .vv-comments-list{flex:1;overflow:auto;padding:12px}
    .vv-comment-item{padding:8px 0;border-bottom:1px solid #fafafa}
    .vv-comments-add{padding:12px;border-top:1px solid #eee}

    .vv-profile-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:flex-start;justify-content:center;padding:40px;z-index:70}
    .vv-profile-card{background:var(--card);padding:20px;width:100%;max-width:1000px;border-radius:10px}
    .vv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
    .vv-grid-item img{width:100%;height:120px;object-fit:cover}

    .vv-bottom{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#fff;padding:8px 12px;border-radius:999px;border:1px solid #eee;display:flex;gap:8px;box-shadow:0 6px 20px rgba(0,0,0,0.06)}

    /* heart animation */
    .vv-heart { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(0); font-size:96px; color:rgba(255,50,100,0.95); pointer-events:none; animation: vv-pop .9s forwards; }
    @keyframes vv-pop { 0%{ transform:translate(-50%,-50%) scale(0); opacity:1 } 40%{ transform:translate(-50%,-50%) scale(1.1) } 100%{ transform:translate(-50%,-50%) scale(1.0); opacity:0 } }

    @media(max-width:900px){.vv-layout{flex-direction:column}.vv-sidebar{width:100%}}
  `;
  const s = document.createElement("style");
  s.id = "vv-style-advanced";
  s.textContent = css;
  document.head.appendChild(s);
}

// --------------------- Utilities ---------------------
const uid = (p = "id") => p + Math.random().toString(36).slice(2, 9);
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
function avatarUrl(seed) {
  return `https://api.dicebear.com/6.x/thumbs/svg?seed=${seed}`;
}

function coloredDataURL(pair = ["#e6e6e6", "#cccccc"], w = 800, h = 800, text = "") {
  try {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, pair[0]);
    g.addColorStop(1, pair[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (text) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, w / 2, h / 2);
    }
    return c.toDataURL("image/png");
  } catch (e) { return ""; }
}

// --------------------- Data generation ---------------------
function generateProfiles(countProfiles = 20, postsPer = 20) {
  const profiles = [];
  for (let u = 1; u <= countProfiles; u++) {
    const posts = [];
    for (let p = 1; p <= postsPer; p++) {
      const hue = (u * 20 + p * 7) % 360;
      const a = `hsl(${hue},70%,70%)`;
      const b = `hsl(${(hue + 40) % 360},70%,60%)`;
      posts.push({ id: `pp-${u}-${p}`, colorPair: [a, b], caption: `Post ${p} by User${u}`, createdAt: Date.now() - p * 1000 * 60 * 60 * 24 });
    }
    profiles.push({ id: `u${u}`, name: `User${u}`, seed: u, posts });
  }
  return profiles;
}

// --------------------- Persistent small state keys ---------------------
const LS_KEYS = {
  LIKES: "vv_likes",
  SAVES: "vv_saves",
  FOLLOWS: "vv_follows",
  COMMENTS: "vv_comments_small",
  CREATED_META: "vv_created_meta",
  MESSAGES: "vv_messages_small",
};

export default function App() {
  const profiles = useMemo(() => generateProfiles(20, 20), []);

  // lightweight persisted maps
  const [likesMap, setLikesMap] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.LIKES) || "{}"));
  const [savesMap, setSavesMap] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.SAVES) || "{}"));
  const [followsMap, setFollowsMap] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.FOLLOWS) || "{}"));
  const [commentsSmall, setCommentsSmall] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.COMMENTS) || "{}"));
  const [createdMeta, setCreatedMeta] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.CREATED_META) || "[]"));
  const [messagesMap, setMessagesMap] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.MESSAGES) || "{}"));

  // transient UI state
  const [screen, setScreen] = useState({ name: "home", payload: null }); // home | profile | messages | search
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createPreview, setCreatePreview] = useState(null);
  const [createCaption, setCreateCaption] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [feedPage, setFeedPage] = useState(1); // pagination pages

  const fileRef = useRef(null);
  const feedContainerRef = useRef(null);

  // persist small maps
  useEffect(() => { try { localStorage.setItem(LS_KEYS.LIKES, JSON.stringify(likesMap)); } catch (e) {} }, [likesMap]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.SAVES, JSON.stringify(savesMap)); } catch (e) {} }, [savesMap]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.FOLLOWS, JSON.stringify(followsMap)); } catch (e) {} }, [followsMap]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.COMMENTS, JSON.stringify(commentsSmall)); } catch (e) {} }, [commentsSmall]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.CREATED_META, JSON.stringify(createdMeta)); } catch (e) {} }, [createdMeta]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.MESSAGES, JSON.stringify(messagesMap)); } catch (e) {} }, [messagesMap]);

  // Build feed items: createdMeta items first (persisted), then newly created (runtime), then base feed pages
  const runtimeCreated = useMemo(() => createdMeta.map((m) => ({ ...m, image: m.colorPair ? coloredDataURL(m.colorPair, 1200, 900, m.caption || "") : null })), [createdMeta]);

  const baseFeedItems = useMemo(() => profiles.map((u) => ({ id: `f-${u.id}-1`, userId: u.id, username: u.name, avatar: avatarUrl(u.seed), image: coloredDataURL(u.posts[0].colorPair, 1200, 900, `${u.name} 1`), caption: u.posts[0].caption, createdAt: u.posts[0].createdAt })), [profiles]);

  // pagination: page size 5
  const PAGE_SIZE = 5;
  const feedItems = useMemo(() => {
    const start = 0;
    const pages = baseFeedItems.slice(0, PAGE_SIZE * feedPage);
    return [...runtimeCreated.slice().reverse(), ...pages];
  }, [runtimeCreated, baseFeedItems, feedPage]);

  // Infinite scroll: attach scroll listener to feed container
  useEffect(() => {
    const el = feedContainerRef.current;
    if (!el) return;
    function onScroll() {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
        setFeedPage((p) => p + 1);
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Actions
  function toggleLike(postId) { setLikesMap((p) => ({ ...p, [postId]: !p[postId] })); }
  function toggleSave(postId) { setSavesMap((p) => ({ ...p, [postId]: !p[postId] })); }
  function toggleFollow(userId) { setFollowsMap((p) => ({ ...p, [userId]: !p[userId] })); }
  function addCommentSmall(postId, text) { if (!text || !text.trim()) return; setCommentsSmall((s) => { const prev = s[postId] || []; const next = [...prev.slice(-4), { id: uid("c"), user: "you", text: text.trim(), at: Date.now() }]; return { ...s, [postId]: next }; }); }

  function openCommentsFor(post) { setActivePost(post); setCommentsOpen(true); }

  function handleFileChange(e) { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => setCreatePreview(reader.result); reader.readAsDataURL(f); }

  // Create post metadata persisted (not image data)
  function createPostPersisted() {
    const meta = { id: `cmeta-${uid()}`, caption: createCaption || "", colorPair: createPreview ? null : ["#a1c4fd", "#c2e9fb"], createdAt: Date.now(), authorId: "me" };
    setCreatedMeta((m) => [...m, meta]);
    // For preview, we still keep image in runtime (not persisted)
    setCreateOpen(false); setCreatePreview(null); setCreateCaption(""); setNotifications((n) => n + 1);
  }

  // Create post runtime (with image) but also keep metadata persisted
  function createPostWithImageRuntime() {
    const meta = { id: `cmeta-${uid()}`, caption: createCaption || "(image)", colorPair: null, createdAt: Date.now(), authorId: "me" };
    setCreatedMeta((m) => [...m, meta]);
    // store small runtime created post (not persisted image)
    setCreateOpen(false); setCreatePreview(null); setCreateCaption(""); setNotifications((n) => n + 1);
  }

  function simulateNotification() { setNotifications((n) => n + 1); }

  // Messages simple UI
  function sendMessage(toUserId, text) {
    if (!text || !text.trim()) return;
    setMessagesMap((m) => {
      const prev = m[toUserId] || [];
      const next = [...prev, { id: uid("m"), from: "you", text: text.trim(), at: Date.now() }];
      return { ...m, [toUserId]: next };
    });
  }

  // Export small state
  function exportSmallState() {
    const payload = { likesMap, savesMap, followsMap, commentsSmall, createdMeta, messagesMap };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vibeverse_state_small.json"; a.click(); URL.revokeObjectURL(url);
  }

  // Import small state (merge)
  function importSmallState(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const obj = JSON.parse(fr.result);
        if (obj.likesMap) setLikesMap((p) => ({ ...p, ...obj.likesMap }));
        if (obj.savesMap) setSavesMap((p) => ({ ...p, ...obj.savesMap }));
        if (obj.followsMap) setFollowsMap((p) => ({ ...p, ...obj.followsMap }));
        if (obj.commentsSmall) setCommentsSmall((p) => ({ ...p, ...obj.commentsSmall }));
        if (obj.createdMeta) setCreatedMeta((p) => [...p, ...obj.createdMeta]);
        if (obj.messagesMap) setMessagesMap((p) => ({ ...p, ...obj.messagesMap }));
        alert("Imported. Merged with existing state.");
      } catch (e) { alert("Invalid file"); }
    };
    fr.readAsText(file);
  }

  // Search results
  const searchResults = (search || "").trim() ? profiles.filter((pr) => pr.name.toLowerCase().includes(search.toLowerCase())) : [];

  // ----------------- Render UI -----------------
  return (
    <div className="vv-root">
      <nav className="vv-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="vv-logo">Vibe<span style={{ color: "var(--accent)" }}>verse</span></div>
          <input className="vv-search" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", background: "#fff", border: "1px solid #eee", marginTop: 48, padding: 8, borderRadius: 8 }}>
              {searchResults.slice(0, 6).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 6, cursor: "pointer" }} onClick={() => { setSearch(""); setScreen({ name: "profile", payload: { userId: s.id } }); }}>
                  <img src={avatarUrl(s.seed)} style={{ width: 36, height: 36, borderRadius: 18 }} alt="a" />
                  <div>{s.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button title="messages" onClick={() => setScreen({ name: "messages" })} style={{ background: "none", border: 0, cursor: "pointer" }}>✉️</button>
          <button title="notifications" onClick={simulateNotification} style={{ background: "none", border: 0, cursor: "pointer" }}>🔔{notifications ? <span style={{ color: "white", background: "var(--accent)", padding: "2px 6px", borderRadius: 12, marginLeft: 6 }}>{notifications}</span> : null}</button>
          <button onClick={() => setCreateOpen(true)} style={{ background: "none", border: 0, cursor: "pointer" }}>＋</button>
          <button onClick={exportSmallState} title="Export state" style={{ background: "none", border: 0, cursor: "pointer" }}>⬇️</button>
          <label style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 6, border: "1px solid #eee", background: "#fff" }}>
            ⬆️<input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files && importSmallState(e.target.files[0])} />
          </label>
        </div>
      </nav>

      <div className="vv-container">
        {/* STORIES */}
        <div className="vv-stories">
          {profiles.slice(0, 12).map((u) => (
            <div className="vv-story" key={u.id} onClick={() => setScreen({ name: "profile", payload: { userId: u.id } })}>
              <img src={avatarUrl(u.seed)} alt={u.name} />
              <div style={{ fontSize: 12 }}>{u.name}</div>
            </div>
          ))}
        </div>

        <div className="vv-layout">
          <div className="vv-feed" ref={feedContainerRef} style={{ maxHeight: "65vh", overflow: "auto", paddingRight: 8 }}>
            {feedItems.map((p) => (
              <article className="vv-card" key={p.id} onDoubleClick={(e) => { /* show heart animation */ const heart = document.createElement("div"); heart.className = "vv-heart"; heart.innerText = "♥"; e.currentTarget.appendChild(heart); setTimeout(() => heart.remove(), 900); toggleLike(p.id); }}>
                <div className="vv-card-head">
                  <img src={p.avatar} className="vv-avatar" alt="a" onClick={() => setScreen({ name: "profile", payload: { userId: p.userId } })} />
                  <div>
                    <div className="vv-username" style={{ cursor: "pointer" }} onClick={() => setScreen({ name: "profile", payload: { userId: p.userId } })}>{p.username}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(p.createdAt)}</div>
                  </div>
                </div>

                <div className="vv-media"><img src={p.image} alt="post" /></div>

                <div className="vv-actions">
                  <div className="vv-actions-left">
                    <button onClick={() => toggleLike(p.id)}>{likesMap[p.id] ? "♥" : "♡"}</button>
                    <button onClick={() => openCommentsFor(p)}>💬</button>
                    <button onClick={() => alert("Share simulated — copy link")}>✈️</button>
                  </div>
                  <div className="vv-actions-right">
                    <button onClick={() => toggleSave(p.id)}>{savesMap[p.id] ? "🔖" : "🔖"}</button>
                  </div>
                </div>

                <div className="vv-stats">{(likesMap[p.id] ? 1 : 0) + (commentsSmall[p.id] ? commentsSmall[p.id].length : 0)} interactions</div>

                <div className="vv-caption"><strong>{p.username}</strong> {p.caption}</div>

                <div className="vv-comments-preview" onClick={() => openCommentsFor(p)}>View comments ({commentsSmall[p.id] ? commentsSmall[p.id].length : 0})</div>
              </article>
            ))}

            <div style={{ textAlign: "center", padding: 12, color: "var(--muted)" }}>Showing {feedItems.length} items — scroll to load more</div>
          </div>

          <aside className="vv-sidebar">
            <div className="vv-me">
              <img src={avatarUrl(9999)} style={{ width: 56, height: 56, borderRadius: 40 }} alt="me" />
              <div>
                <div style={{ fontWeight: 700 }}>you</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Your profile</div>
              </div>
            </div>

            <div className="vv-suggest">
              <h4 style={{ margin: "12px 0 8px 0" }}>Suggested</h4>
              {profiles.slice(0, 6).map((u) => (
                <div key={u.id} className="vv-suggest-item">
                  <img src={avatarUrl(u.seed)} alt={u.name} />
                  <div>{u.name}</div>
                  <button className="btn" style={{ marginLeft: "auto" }} onClick={() => toggleFollow(u.id)}>{followsMap[u.id] ? "Following" : "Follow"}</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, color: "#888", fontSize: 13 }}>© VibeVerse — Demo</div>
          </aside>
        </div>
      </div>

      <div className="vv-bottom">
        <button onClick={() => setScreen({ name: "home" })}>Home</button>
        <button onClick={() => setScreen({ name: "search" })}>Search</button>
        <button onClick={() => setScreen({ name: "profile", payload: { userId: "u1" } })}>Profile</button>
        <button onClick={() => setScreen({ name: "messages" })}>Messages</button>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="vv-modal" onClick={() => setCreateOpen(false)}>
          <div className="vv-create" onClick={(e) => e.stopPropagation()}>
            <h3>Create new post</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="vv-preview-small">{createPreview ? <img src={createPreview} alt="preview" /> : <div style={{ color: "#888" }}>No preview</div>}</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setCreatePreview(coloredDataURL(["#ff9a9e", "#fad0c4"], 1200, 900, "Color"))} className="btn">Color 1</button>
                  <button onClick={() => setCreatePreview(coloredDataURL(["#a1c4fd", "#c2e9fb"], 1200, 900, "Color"))} className="btn">Color 2</button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <textarea placeholder="Write a caption..." value={createCaption} onChange={(e) => setCreateCaption(e.target.value)} style={{ width: "100%", height: 140 }} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button onClick={() => { setCreateOpen(false); setCreatePreview(null); }} className="btn">Cancel</button>
                  <button onClick={() => { if (createPreview) createPostWithImageRuntime(); else createPostPersisted(); }} className="btn" disabled={!createPreview && !createCaption}>Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      {commentsOpen && activePost && (
        <div className="vv-modal" onClick={() => setCommentsOpen(false)}>
          <div className="vv-comments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vv-comments-left"><img src={activePost.image} alt="p" /></div>
            <div className="vv-comments-right">
              <div className="vv-comments-top"><img src={activePost.avatar} style={{ width: 38, height: 38, borderRadius: 20 }} alt="a" /><strong>{activePost.username}</strong><div style={{ marginLeft: "auto", color: "var(--muted)" }}>{timeAgo(activePost.createdAt)}</div></div>
              <div className="vv-comments-list">
                {(commentsSmall[activePost.id] || []).map((c) => (
                  <div key={c.id} className="vv-comment-item"><strong>{c.user}</strong> {c.text}</div>
                ))}
              </div>
              <div className="vv-comments-add"><CommentInput onAdd={(txt) => addCommentSmall(activePost.id, txt)} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Messages page */}
      {screen.name === "messages" && (
        <div className="vv-modal" onClick={() => setScreen({ name: "home" })}>
          <div style={{ width: 800, maxWidth: "95%", height: 520, background: "var(--card)", borderRadius: 10, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", height: "100%" }}>
              <div style={{ width: 260, borderRight: "1px solid #eee", overflow: "auto" }}>
                <div style={{ padding: 12, fontWeight: 700 }}>Messages</div>
                {profiles.slice(0, 20).map((u) => (
                  <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, cursor: "pointer" }} onClick={() => setScreen({ name: "messages", payload: { to: u.id } })}>
                    <img src={avatarUrl(u.seed)} style={{ width: 40, height: 40, borderRadius: 20 }} alt="a" />
                    <div style={{ flex: 1 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{(messagesMap[u.id] || []).length}</div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 700 }}>{screen.payload?.to ? profiles.find((p) => p.id === screen.payload.to)?.name : "Select a conversation"}</div>
                <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
                  {(screen.payload?.to ? messagesMap[screen.payload.to] || [] : []).map((m) => (
                    <div key={m.id} style={{ padding: 8, background: m.from === "you" ? "#eafaf1" : "#f4f4f6", borderRadius: 8, marginBottom: 8, maxWidth: "70%" }}>
                      <div style={{ fontSize: 13 }}>{m.text}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{timeAgo(m.at)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
                  {screen.payload?.to ? <MessageComposer to={screen.payload.to} onSend={(txt) => sendMessage(screen.payload.to, txt)} /> : <div style={{ color: "var(--muted)" }}>Open a conversation from the left</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile overlay */}
      {screen.name === "profile" && screen.payload && (() => {
        const uid = screen.payload.userId;
        const prof = profiles.find((p) => p.id === uid) || profiles[0];
        return (
          <div className="vv-profile-overlay" onClick={() => setScreen({ name: "home" })}>
            <div className="vv-profile-card" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setScreen({ name: "home" })} className="btn">← Back</button>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                <img src={avatarUrl(prof.seed)} alt={prof.name} style={{ width: 84, height: 84, borderRadius: 44 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{prof.name}</div>
                  <div style={{ color: "var(--muted)" }}>{prof.posts.length} posts</div>
                  <div style={{ marginTop: 8 }}><button className="btn" onClick={() => toggleFollow(prof.id)}>{followsMap[prof.id] ? "Following" : "Follow"}</button></div>
                </div>
              </div>

              <div className="vv-grid">
                {prof.posts.map((pp) => (
                  <div key={pp.id} className="vv-grid-item">
                    <img src={coloredDataURL(pp.colorPair, 800, 800, prof.name)} alt="g" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CommentInput({ onAdd }) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: 8 }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(text); setText(""); } }} />
      <button onClick={() => { onAdd(text); setText(""); }} className="btn">Post</button>
    </div>
  );
}

function MessageComposer({ to, onSend }) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." style={{ flex: 1, padding: 8 }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSend(text); setText(""); } }} />
      <button onClick={() => { onSend(text); setText(""); }} className="btn">Send</button>
    </div>
  );
}
