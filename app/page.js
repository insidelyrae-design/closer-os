"use client";
import { useState, useEffect, useRef } from "react";
import { SYS } from "../lib/prompts";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PRICE_TIERS = [
  { label: "Under €1,000", value: "under1k" },
  { label: "€1,000 – €10,000", value: "1k_10k" },
  { label: "€10,000 – €50,000", value: "10k_50k" },
  { label: "€50,000 – €250,000", value: "50k_250k" },
  { label: "€250,000+", value: "over250k" },
];
const EMOTIONAL_STATES = ["Fearful","Hopeful","Confused","Skeptical","Overwhelmed","Excited","Desperate","Curious"];
const OBJECTION_TYPES = ["Money","Time","Trust","Authority","Priority","Information","Emotional","Unknown"];
const OUTCOMES = ["Closed","Lost","Follow-up","Ghosted","Not Qualified"];
const NAV = [
  { id:"analyze",   icon:"⚡", label:"Analyzer" },
  { id:"script",    icon:"💬", label:"Script" },
  { id:"offer",     icon:"🏗️", label:"Offer Builder" },
  { id:"persona",   icon:"🎭", label:"Persona" },
  { id:"content",   icon:"📲", label:"Content" },
  { id:"followup",  icon:"🔄", label:"Follow-Up" },
  { id:"ab",        icon:"🆚", label:"A/B Test" },
  { id:"crm",       icon:"📋", label:"CRM" },
  { id:"dashboard", icon:"📊", label:"Dashboard" },
];
const ANALYZE_MODES = [
  { id:"objection", icon:"🎯", label:"Objection Handler" },
  { id:"decision",  icon:"🧠", label:"Decision Engine" },
  { id:"link",      icon:"🔍", label:"Link Forensics" },
  { id:"forensics", icon:"🕵️", label:"Decision Forensics" },
];
const GOLD = "#c8a96e";
const BG = "#080808";
const CARD = "#0d0d0d";
const BORDER = "#1e1e1e";

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function runAnalysis(system, user, maxTokens = 1400) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, maxTokens }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}

async function fetchUrl(url) {
  const res = await fetch("/api/fetch-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.content;
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? GOLD + "18" : "transparent",
      border: `1px solid ${active ? GOLD : "#252525"}`,
      color: active ? GOLD : "#666",
      padding: "7px 14px", borderRadius: 5, cursor: "pointer",
      fontFamily: "monospace", fontSize: 11, letterSpacing: 1,
      transition: "all .2s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, rows, type = "text", disabled }) {
  const style = {
    width: "100%", padding: "10px 12px", fontSize: 13,
    background: "#0a0a0a", border: `1px solid ${BORDER}`, borderRadius: 6,
    color: "#e8e8e8", fontFamily: "Georgia, serif", outline: "none",
    transition: "border-color .2s", opacity: disabled ? 0.5 : 1,
  };
  if (rows) return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled}
      style={{ ...style, resize: "vertical", lineHeight: 1.6 }}
      onFocus={e => e.target.style.borderColor = GOLD}
      onBlur={e => e.target.style.borderColor = BORDER}
    />
  );
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={style}
      onFocus={e => e.target.style.borderColor = GOLD}
      onBlur={e => e.target.style.borderColor = BORDER}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: "100%", padding: "10px 12px", fontSize: 13,
      background: "#0a0a0a", border: `1px solid ${BORDER}`, borderRadius: 6,
      color: "#e8e8e8", fontFamily: "Georgia, serif", outline: "none",
    }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

function GoldBtn({ onClick, disabled, children, small, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#111" : danger ? "#3a0a0a" : `linear-gradient(135deg, ${GOLD}, #a07030)`,
      color: disabled ? "#333" : danger ? "#e76e6e" : "#080808",
      border: danger ? "1px solid #e76e6e44" : "none",
      padding: small ? "8px 16px" : "13px 28px",
      borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "monospace", fontSize: small ? 10 : 12,
      letterSpacing: 2, fontWeight: "bold", textTransform: "uppercase",
      transition: "all .2s", width: small ? "auto" : "100%",
    }}>{children}</button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "22px 26px", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ children, color = GOLD }) {
  return <div style={{ color, fontFamily: "monospace", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>{children}</div>;
}

function Bar({ label, val, max = 10, color = GOLD }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 3 }}>
        <span>{label}</span><span style={{ color }}>{val}/{max}</span>
      </div>
      <div style={{ background: "#111", borderRadius: 3, height: 5 }}>
        <div style={{ width: `${(val / max) * 100}%`, height: "100%", background: `linear-gradient(90deg,${color}55,${color})`, borderRadius: 3, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ color: GOLD, fontFamily: "monospace", fontSize: 10, letterSpacing: 4, marginBottom: 16 }}>ANALYZING</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 3, height: 18, background: GOLD, borderRadius: 2,
            animation: `pb 1.1s ease-in-out ${i * .14}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
}

function ResultDisplay({ text, onClear }) {
  if (!text) return null;
  return (
    <div>
      <div style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "24px 28px", marginTop: 20, lineHeight: 1.85 }}>
        {text.split("\n").map((line, i) => {
          if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
          if (/^[A-Z][A-Z\s&\/\-:]+$/.test(line.trim()) && line.trim().length < 70 && line.trim().length > 3)
            return <div key={i} style={{ color: GOLD, fontFamily: "monospace", fontSize: 10, letterSpacing: 3, marginTop: 24, marginBottom: 8 }}>{line}</div>;
          if (line.includes("[DIRECT EVIDENCE]"))
            return <div key={i} style={{ color: "#6ee7a0", fontSize: 13, marginBottom: 4 }}>{line}</div>;
          if (line.includes("[INFERRED]"))
            return <div key={i} style={{ color: "#e7c96e", fontSize: 13, marginBottom: 4 }}>{line}</div>;
          if (line.includes("[ASSUMPTION]"))
            return <div key={i} style={{ color: "#e76e6e", fontSize: 13, marginBottom: 4 }}>{line}</div>;
          if (line.startsWith("- ") || line.startsWith("• "))
            return <div key={i} style={{ color: "#ccc", fontSize: 13, paddingLeft: 16, marginBottom: 3 }}>{line}</div>;
          return <div key={i} style={{ color: "#ddd", fontSize: 13, marginBottom: 3 }}>{line}</div>;
        })}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          {[["🟢","DIRECT EVIDENCE"],["🟡","INFERRED"],["🔴","ASSUMPTION"]].map(([dot,lbl]) => (
            <span key={lbl} style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>{dot} {lbl}</span>
          ))}
        </div>
      </div>
      {onClear && (
        <button onClick={onClear} style={{
          marginTop: 12, background: "transparent", border: `1px solid #222`,
          color: "#444", padding: "8px 16px", borderRadius: 5,
          cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: 2
        }}>← NEW ANALYSIS</button>
      )}
    </div>
  );
}

// ─── ANALYZER ─────────────────────────────────────────────────────────────────
function AnalyzerPage() {
  const [mode, setMode] = useState("objection");
  const [input, setInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkContent, setLinkContent] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [priceTier, setPriceTier] = useState("1k_10k");
  const [emotion, setEmotion] = useState("Skeptical");
  const [offer, setOffer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => { if (result && ref.current) ref.current.scrollIntoView({ behavior: "smooth" }); }, [result]);

  const handleFetchUrl = async () => {
    if (!linkUrl.trim()) return;
    setFetching(true);
    setFetchStatus(null);
    setLinkContent("");
    try {
      const content = await fetchUrl(linkUrl);
      setLinkContent(content);
      setFetchStatus({ ok: true, msg: `✓ Page fetched — ${content.length.toLocaleString()} characters extracted` });
    } catch (err) {
      setFetchStatus({ ok: false, msg: `✗ ${err.message} — paste the page content manually below` });
    } finally {
      setFetching(false);
    }
  };

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      let user = "";
      if (mode === "link") {
        user = `URL: ${linkUrl}\nPage content extracted:\n${linkContent || "(paste content below)"}\nExtra context: ${input || "none"}`;
      } else {
        user = `Price tier: ${priceTier}\nEmotional state: ${emotion}\nOffer: ${offer || "not specified"}\nSituation: ${input}`;
      }
      setResult(await runAnalysis(SYS[mode], user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const canRun = mode === "link" ? (linkUrl.trim() && (linkContent.trim() || input.trim())) : input.trim();

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {ANALYZE_MODES.map(m => (
          <Pill key={m.id} active={mode === m.id} onClick={() => { setMode(m.id); setResult(null); setError(null); }}>
            {m.icon} {m.label}
          </Pill>
        ))}
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {mode !== "link" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Price Tier</Label><Select value={priceTier} onChange={e => setPriceTier(e.target.value)} options={PRICE_TIERS} /></div>
              <div><Label>Buyer Emotional State</Label><Select value={emotion} onChange={e => setEmotion(e.target.value)} options={EMOTIONAL_STATES.map(s=>({value:s,label:s}))} /></div>
            </div>
            <div><Label>Offer Context (optional)</Label><Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. 6-week coaching program, €3,500" /></div>
          </>
        )}

        {mode === "link" && (
          <>
            <div>
              <Label>Asset URL</Label>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Input value={linkUrl} onChange={e => { setLinkUrl(e.target.value); setFetchStatus(null); }} placeholder="https://yourpage.com/offer" />
                </div>
                <GoldBtn small onClick={handleFetchUrl} disabled={fetching || !linkUrl.trim()}>
                  {fetching ? "⟳ Fetching..." : "Fetch Page"}
                </GoldBtn>
              </div>
              {fetchStatus && (
                <div style={{ marginTop: 8, fontSize: 12, color: fetchStatus.ok ? "#6ee7a0" : "#e7c96e", fontFamily: "monospace" }}>
                  {fetchStatus.msg}
                </div>
              )}
            </div>
            <div>
              <Label>Page Content {linkContent ? `(${linkContent.length.toLocaleString()} chars fetched)` : "(paste manually if fetch fails)"}</Label>
              <Input value={linkContent} onChange={e => setLinkContent(e.target.value)} rows={8}
                placeholder="Page content will appear here after fetching — or paste it manually..." />
            </div>
          </>
        )}

        <div>
          <Label>
            {mode === "objection" ? "Objection or Situation"
              : mode === "decision" ? "Buyer Situation — What Happened?"
              : mode === "link" ? "Additional Context (optional)"
              : "Describe What Happened in This Sale"}
          </Label>
          <Input value={input} onChange={e => setInput(e.target.value)} rows={mode === "link" ? 3 : 7}
            placeholder={
              mode === "objection" ? '"She said it\'s too expensive and needs to think about it. Spoke twice. Seemed excited, now going cold."'
              : mode === "decision" ? '"Loved it on the call, asked great questions, went silent after I sent the proposal. Three follow-ups, no response."'
              : mode === "link" ? "Any specific concerns or questions about this asset..."
              : '"Discovery call went great. Said yes on the call. Sent contract. Now they want a cheaper version."'
            }
          />
        </div>

        <GoldBtn onClick={run} disabled={loading || !canRun}>
          {loading ? "⟳ Analyzing..."
            : mode === "objection" ? "⚡ Classify + Handle Objection"
            : mode === "decision" ? "🧠 Run Decision Engine"
            : mode === "link" ? "🔍 Run Forensic Audit"
            : "🕵️ Reconstruct Decision"}
        </GoldBtn>
      </div>

      {error && <div style={{ marginTop: 14, padding: 14, background: "#1a0808", border: "1px solid #e76e6e33", borderRadius: 6, color: "#e76e6e", fontSize: 13 }}>{error}</div>}
      {loading && <Spinner />}
      <div ref={ref}>
        <ResultDisplay text={result} onClear={() => { setResult(null); setInput(""); setLinkUrl(""); setLinkContent(""); setFetchStatus(null); }} />
      </div>
    </div>
  );
}

// ─── SCRIPT PAGE ──────────────────────────────────────────────────────────────
function ScriptPage() {
  const [conversation, setConversation] = useState("");
  const [priceTier, setPriceTier] = useState("1k_10k");
  const [emotion, setEmotion] = useState("Skeptical");
  const [offer, setOffer] = useState("");
  const [channel, setChannel] = useState("DM");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Price tier: ${priceTier}\nEmotional state: ${emotion}\nOffer: ${offer || "not specified"}\nChannel: ${channel}\nConversation so far:\n${conversation}`;
      setResult(await runAnalysis(SYS.script, user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>Live Sales Script Generator</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Paste the conversation so far. Get the exact next message calibrated to where the buyer is psychologically right now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><Label>Price Tier</Label><Select value={priceTier} onChange={e => setPriceTier(e.target.value)} options={PRICE_TIERS} /></div>
          <div><Label>Buyer State</Label><Select value={emotion} onChange={e => setEmotion(e.target.value)} options={EMOTIONAL_STATES.map(s=>({value:s,label:s}))} /></div>
          <div><Label>Channel</Label><Select value={channel} onChange={e => setChannel(e.target.value)} options={["DM","Email","Phone Call","In-Person","WhatsApp"].map(s=>({value:s,label:s}))} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><Label>Offer</Label><Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="What are you selling?" /></div>
        <div style={{ marginBottom: 14 }}><Label>Conversation So Far</Label><Input value={conversation} onChange={e => setConversation(e.target.value)} rows={9} placeholder={"Paste the full conversation thread here — DMs, emails, notes from the call...\n\nThe more context, the more precisely calibrated the script."} /></div>
        <GoldBtn onClick={run} disabled={loading || !conversation.trim()}>{loading ? "⟳ Generating..." : "💬 Generate Exact Script"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── OFFER BUILDER ────────────────────────────────────────────────────────────
function OfferBuilderPage() {
  const [desc, setDesc] = useState("");
  const [priceTier, setPriceTier] = useState("1k_10k");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Price tier: ${priceTier}\nTarget audience: ${audience || "not specified"}\nOffer description:\n${desc}`;
      setResult(await runAnalysis(SYS.offer, user, 1500));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>Offer Builder</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Describe your offer. Get a complete psychology-optimized sales package: headlines, DM scripts, objection pre-handles, follow-up sequence, and close.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><Label>Price Tier</Label><Select value={priceTier} onChange={e => setPriceTier(e.target.value)} options={PRICE_TIERS} /></div>
          <div><Label>Target Audience</Label><Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Female founders, 30-45, 6-fig revenue" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><Label>Describe Your Offer</Label><Input value={desc} onChange={e => setDesc(e.target.value)} rows={9} placeholder={"Describe your offer in detail:\n- What is it?\n- What problem does it solve?\n- What's included?\n- What result does the client get?\n- What makes it different?"} /></div>
        <GoldBtn onClick={run} disabled={loading || !desc.trim()}>{loading ? "⟳ Building..." : "🏗️ Build Full Offer Package"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── PERSONA ──────────────────────────────────────────────────────────────────
function PersonaPage() {
  const [desc, setDesc] = useState("");
  const [offer, setOffer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Offer being sold: ${offer || "not specified"}\nIdeal buyer description:\n${desc}`;
      setResult(await runAnalysis(SYS.persona, user, 1400));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>Buyer Persona Builder</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Build a full psychological profile of your ideal buyer — not demographics, but what drives them, stops them, and exactly how to reach them.</p>
        <div style={{ marginBottom: 14 }}><Label>Offer Being Sold</Label><Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. High-ticket sales coaching, €5,000" /></div>
        <div style={{ marginBottom: 14 }}><Label>Describe Your Ideal Buyer</Label><Input value={desc} onChange={e => setDesc(e.target.value)} rows={8} placeholder={"Tell me everything you know about your ideal buyer:\n- Their situation, job, age\n- What they struggle with\n- What they've tried before\n- What they really want\n- What they're afraid of"} /></div>
        <GoldBtn onClick={run} disabled={loading || !desc.trim()}>{loading ? "⟳ Profiling..." : "🎭 Build Psychological Profile"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── CONTENT ──────────────────────────────────────────────────────────────────
function ContentPage() {
  const [content, setContent] = useState("");
  const [offer, setOffer] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Platform: ${platform}\nOffer: ${offer || "not specified"}\nContent to audit:\n${content}`;
      setResult(await runAnalysis(SYS.content, user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>Content Psychology Auditor</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Paste your bio, caption, reel script, or ad copy. Find out if it attracts buyers or browsers — and exactly what to change.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><Label>Platform</Label><Select value={platform} onChange={e => setPlatform(e.target.value)} options={["Instagram","TikTok","LinkedIn","YouTube","Twitter/X","Email"].map(s=>({value:s,label:s}))} /></div>
          <div><Label>Offer / Product</Label><Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="What are you selling?" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><Label>Paste Your Content</Label><Input value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder={"Paste your:\n- Instagram bio\n- Reel script or caption\n- Ad copy\n- Email\n- YouTube description"} /></div>
        <GoldBtn onClick={run} disabled={loading || !content.trim()}>{loading ? "⟳ Auditing..." : "📲 Run Content Audit"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── FOLLOW-UP ────────────────────────────────────────────────────────────────
function FollowUpPage() {
  const [convo, setConvo] = useState("");
  const [priceTier, setPriceTier] = useState("1k_10k");
  const [daysGone, setDaysGone] = useState("7");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Price tier: ${priceTier}\nDays since last contact: ${daysGone}\nConversation that went cold:\n${convo}`;
      setResult(await runAnalysis(SYS.followup, user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>Follow-Up Intelligence</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Paste a conversation that went cold. Get the psychological diagnosis and exact reactivation messages.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><Label>Price Tier</Label><Select value={priceTier} onChange={e => setPriceTier(e.target.value)} options={PRICE_TIERS} /></div>
          <div><Label>Days Since Last Contact</Label><Input value={daysGone} onChange={e => setDaysGone(e.target.value)} placeholder="e.g. 7" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><Label>The Conversation That Went Cold</Label><Input value={convo} onChange={e => setConvo(e.target.value)} rows={10} placeholder={"Paste the full conversation — from first contact to where it died.\n\nInclude what was said, where they seemed engaged, and where they went quiet."} /></div>
        <GoldBtn onClick={run} disabled={loading || !convo.trim()}>{loading ? "⟳ Diagnosing..." : "🔄 Generate Reactivation Strategy"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── A/B TEST ─────────────────────────────────────────────────────────────────
function ABPage() {
  const [vA, setVA] = useState("");
  const [vB, setVB] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const user = `Context / offer: ${context || "not specified"}\n\nVERSION A:\n${vA}\n\nVERSION B:\n${vB}`;
      setResult(await runAnalysis(SYS.ab, user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <SectionHead>A/B Psychology Tester</SectionHead>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18, marginTop: 0 }}>Submit two headlines, hooks, CTAs, or full copy variations. Get a definitive winner with the psychological mechanism explained.</p>
        <div style={{ marginBottom: 14 }}><Label>Context / Offer</Label><Input value={context} onChange={e => setContext(e.target.value)} placeholder="What is this copy for? What are you selling?" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><Label>Version A</Label><Input value={vA} onChange={e => setVA(e.target.value)} rows={9} placeholder={"Paste Version A...\n\nHeadline, hook, CTA, email subject, ad copy, or full caption."} /></div>
          <div><Label>Version B</Label><Input value={vB} onChange={e => setVB(e.target.value)} rows={9} placeholder={"Paste Version B...\n\nMake it different enough to test meaningfully."} /></div>
        </div>
        <GoldBtn onClick={run} disabled={loading || !vA.trim() || !vB.trim()}>{loading ? "⟳ Testing..." : "🆚 Declare Winner"}</GoldBtn>
        {error && <div style={{ marginTop: 12, color: "#e76e6e", fontSize: 12 }}>{error}</div>}
      </Card>
      {loading && <Spinner />}
      <ResultDisplay text={result} onClear={() => setResult(null)} />
    </div>
  );
}

// ─── CRM ──────────────────────────────────────────────────────────────────────
function CRMPage({ deals, onAdd, onDelete }) {
  const [form, setForm] = useState({ name:"", offer:"", priceTier:"1k_10k", emotion:"Skeptical", objectionType:"Trust", outcome:"Follow-up", notes:"" });
  const [adding, setAdding] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return;
    onAdd({ ...form, id: Date.now(), date: new Date().toISOString() });
    setForm({ name:"", offer:"", priceTier:"1k_10k", emotion:"Skeptical", objectionType:"Trust", outcome:"Follow-up", notes:"" });
    setAdding(false);
  };

  const oc = { Closed:"#6ee7a0", Lost:"#e76e6e", "Follow-up":GOLD, Ghosted:"#666", "Not Qualified":"#e76e6e88" };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <SectionHead>Deal Tracker</SectionHead>
          <p style={{ color: "#444", fontSize: 13, margin: 0 }}>{deals.length} deals logged</p>
        </div>
        <GoldBtn small onClick={() => setAdding(a => !a)}>{adding ? "✕ Cancel" : "+ Log Deal"}</GoldBtn>
      </div>

      {adding && (
        <Card>
          <SectionHead>New Deal</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><Label>Prospect Name</Label><Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Name or alias" /></div>
            <div><Label>Offer</Label><Input value={form.offer} onChange={e => f("offer", e.target.value)} placeholder="What was pitched?" /></div>
            <div><Label>Price Tier</Label><Select value={form.priceTier} onChange={e => f("priceTier", e.target.value)} options={PRICE_TIERS} /></div>
            <div><Label>Emotional State</Label><Select value={form.emotion} onChange={e => f("emotion", e.target.value)} options={EMOTIONAL_STATES.map(s=>({value:s,label:s}))} /></div>
            <div><Label>Primary Objection</Label><Select value={form.objectionType} onChange={e => f("objectionType", e.target.value)} options={OBJECTION_TYPES.map(s=>({value:s,label:s}))} /></div>
            <div><Label>Outcome</Label><Select value={form.outcome} onChange={e => f("outcome", e.target.value)} options={OUTCOMES.map(s=>({value:s,label:s}))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><Label>Notes</Label><Input value={form.notes} onChange={e => f("notes", e.target.value)} rows={3} placeholder="What happened? What was the key moment?" /></div>
          <GoldBtn onClick={save} disabled={!form.name.trim()}>Save Deal</GoldBtn>
        </Card>
      )}

      {deals.length === 0 && !adding && (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: "#444", fontSize: 13 }}>No deals logged yet. Click "+ Log Deal" to start tracking.</div>
        </Card>
      )}

      {deals.map(d => (
        <Card key={d.id} style={{ borderLeft: `3px solid ${oc[d.outcome] || GOLD}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#e8e8e8", fontSize: 15 }}>{d.name}</span>
                <span style={{ background: (oc[d.outcome]||GOLD)+"22", color: oc[d.outcome]||GOLD, border:`1px solid ${(oc[d.outcome]||GOLD)}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontFamily:"monospace" }}>{d.outcome}</span>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["Offer",d.offer],["Price",PRICE_TIERS.find(t=>t.value===d.priceTier)?.label],["Objection",d.objectionType],["State",d.emotion]].map(([k,v])=>v&&(
                  <span key={k} style={{ fontSize:11, color:"#555" }}><span style={{color:"#333"}}>{k}: </span><span style={{color:"#777"}}>{v}</span></span>
                ))}
              </div>
              {d.notes && <div style={{ color:"#555", fontSize:12, marginTop:8, lineHeight:1.5 }}>{d.notes}</div>}
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
              <span style={{ fontSize:10, color:"#333", fontFamily:"monospace" }}>{new Date(d.date).toLocaleDateString()}</span>
              <button onClick={()=>onDelete(d.id)} style={{ background:"transparent", border:"1px solid #1a1a1a", color:"#333", padding:"4px 8px", borderRadius:4, cursor:"pointer", fontSize:10 }}>✕</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ deals }) {
  if (deals.length < 2) {
    return (
      <Card style={{ textAlign:"center", padding:50 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📊</div>
        <div style={{ color:"#555", fontSize:14 }}>Log at least 2 deals in the CRM to unlock pattern analysis.</div>
        <div style={{ color:"#333", fontSize:12, marginTop:8 }}>{deals.length}/2 deals logged</div>
      </Card>
    );
  }

  const total = deals.length;
  const closed = deals.filter(d=>d.outcome==="Closed").length;
  const lost = deals.filter(d=>d.outcome==="Lost").length;
  const ghosted = deals.filter(d=>d.outcome==="Ghosted").length;
  const rate = Math.round((closed/total)*100);

  const objCount = {};
  deals.forEach(d => { objCount[d.objectionType] = (objCount[d.objectionType]||0)+1; });
  const topObj = Object.entries(objCount).sort((a,b)=>b[1]-a[1]);

  const emotionCount = {};
  deals.forEach(d => { emotionCount[d.emotion] = (emotionCount[d.emotion]||0)+1; });

  const closedByTier = {}, totalByTier = {};
  deals.forEach(d => {
    totalByTier[d.priceTier] = (totalByTier[d.priceTier]||0)+1;
    if (d.outcome==="Closed") closedByTier[d.priceTier]=(closedByTier[d.priceTier]||0)+1;
  });

  const tierLabels = { under1k:"<€1k","1k_10k":"€1k-10k","10k_50k":"€10k-50k","50k_250k":"€50k-250k",over250k:"€250k+" };

  const insights = [
    `Most common killer objection: ${topObj[0][0]} — ${topObj[0][1]} deals (${Math.round((topObj[0][1]/total)*100)}%). Build pre-handles for this into every pitch.`,
    `Close rate: ${rate}% — ${rate>50?"Above average. Optimize for volume and referrals.":rate>30?"Room to grow. Focus on trust and proof earlier in the conversation.":"Below average. Audit offer clarity and buyer qualification process."}`,
    ghosted>1 ? `${ghosted} deals ghosted — indicates a trust gap or follow-up timing issue. Run those conversations through Follow-Up Intelligence.` : null,
    `Most common buyer state: ${Object.entries(emotionCount).sort((a,b)=>b[1]-a[1])[0][0]} — adjust your opening to address this state first, before pitching.`,
  ].filter(Boolean);

  return (
    <div style={{ display:"grid", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Deals", val:total, color:"#e8e8e8" },
          { label:"Close Rate", val:`${rate}%`, color:"#6ee7a0" },
          { label:"Lost", val:lost, color:"#e76e6e" },
          { label:"Ghosted", val:ghosted, color:"#666" },
        ].map(k=>(
          <Card key={k.label} style={{ textAlign:"center", padding:"18px 12px" }}>
            <div style={{ color:k.color, fontSize:26, fontFamily:"monospace", marginBottom:4 }}>{k.val}</div>
            <div style={{ color:"#333", fontSize:10, fontFamily:"monospace", letterSpacing:2 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <SectionHead>Top Objection Types</SectionHead>
          {topObj.map(([type,count])=>(
            <Bar key={type} label={type} val={count} max={Math.max(...Object.values(objCount))} color={type===topObj[0][0]?"#e76e6e":GOLD} />
          ))}
          <div style={{ marginTop:14, padding:12, background:"#080808", borderRadius:6, border:`1px solid ${BORDER}` }}>
            <div style={{ color:"#e76e6e", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:6 }}>KILLING MOST DEALS</div>
            <div style={{ color:"#ccc", fontSize:13 }}>{topObj[0][0]} — {topObj[0][1]} deals ({Math.round((topObj[0][1]/total)*100)}%)</div>
          </div>
        </Card>

        <Card>
          <SectionHead>Buyer Emotional States at Entry</SectionHead>
          {Object.entries(emotionCount).sort((a,b)=>b[1]-a[1]).map(([e,c])=>(
            <Bar key={e} label={e} val={c} max={Math.max(...Object.values(emotionCount))} />
          ))}
        </Card>
      </div>

      <Card>
        <SectionHead>Close Rate by Price Tier</SectionHead>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:12 }}>
          {Object.entries(totalByTier).map(([tier,tot])=>{
            const cls = closedByTier[tier]||0;
            const r = Math.round((cls/tot)*100);
            return (
              <div key={tier} style={{ background:"#080808", border:`1px solid ${BORDER}`, borderRadius:8, padding:"14px 10px", textAlign:"center" }}>
                <div style={{ color:r>50?"#6ee7a0":r>25?GOLD:"#e76e6e", fontSize:22, fontFamily:"monospace", marginBottom:4 }}>{r}%</div>
                <div style={{ color:"#444", fontSize:10, fontFamily:"monospace" }}>{tierLabels[tier]}</div>
                <div style={{ color:"#333", fontSize:10 }}>{cls}/{tot}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ borderLeft:`3px solid ${GOLD}` }}>
        <SectionHead>Pattern Intelligence</SectionHead>
        <div style={{ display:"grid", gap:10 }}>
          {insights.map((insight,i)=>(
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ color:GOLD, marginTop:2, flexShrink:0 }}>→</span>
              <span style={{ color:"#ccc", fontSize:13, lineHeight:1.6 }}>{insight}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function CloserOS() {
  const [nav, setNav] = useState("analyze");
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("closer_deals");
      if (saved) setDeals(JSON.parse(saved));
    } catch {}
  }, []);

  const addDeal = (deal) => {
    const next = [deal, ...deals];
    setDeals(next);
    try { localStorage.setItem("closer_deals", JSON.stringify(next)); } catch {}
  };
  const deleteDeal = (id) => {
    const next = deals.filter(d => d.id !== id);
    setDeals(next);
    try { localStorage.setItem("closer_deals", JSON.stringify(next)); } catch {}
  };

  const PAGE_TITLES = {
    analyze:"Analyzer", script:"Live Script Generator", offer:"Offer Builder",
    persona:"Buyer Persona Builder", content:"Content Auditor",
    followup:"Follow-Up Intelligence", ab:"A/B Psychology Tester",
    crm:"Deal Tracker CRM", dashboard:"Pattern Dashboard",
  };

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#e8e8e8", fontFamily:"Georgia,'Times New Roman',serif" }}>
      <style>{`
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px;}
        select option{background:#0a0a0a;color:#e8e8e8;}
        textarea::placeholder,input::placeholder{color:#2e2e2e!important;}
        @keyframes pb{0%,100%{opacity:.15;transform:scaleY(.4)}50%{opacity:1;transform:scaleY(1)}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:"#060606", borderBottom:`1px solid ${BORDER}`, padding:"0 24px", display:"flex", alignItems:"stretch", overflowX:"auto", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", paddingRight:24, borderRight:`1px solid ${BORDER}`, marginRight:4, flexShrink:0 }}>
          <span style={{ color:GOLD, fontFamily:"monospace", fontSize:15, letterSpacing:6 }}>CLOSER</span>
        </div>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setNav(n.id)} style={{
            background:nav===n.id?GOLD+"10":"transparent",
            border:"none", borderBottom:nav===n.id?`2px solid ${GOLD}`:"2px solid transparent",
            color:nav===n.id?GOLD:"#3a3a3a", padding:"14px 14px", cursor:"pointer",
            fontFamily:"monospace", fontSize:10, letterSpacing:1, whiteSpace:"nowrap",
            transition:"all .2s", display:"flex", alignItems:"center", gap:5,
          }}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 24px 80px" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ margin:0, fontSize:18, fontWeight:"normal", color:"#e8e8e8", letterSpacing:1 }}>{PAGE_TITLES[nav]}</h1>
          <div style={{ height:1, background:BORDER, marginTop:12 }} />
        </div>

        {nav==="analyze"   && <AnalyzerPage />}
        {nav==="script"    && <ScriptPage />}
        {nav==="offer"     && <OfferBuilderPage />}
        {nav==="persona"   && <PersonaPage />}
        {nav==="content"   && <ContentPage />}
        {nav==="followup"  && <FollowUpPage />}
        {nav==="ab"        && <ABPage />}
        {nav==="crm"       && <CRMPage deals={deals} onAdd={addDeal} onDelete={deleteDeal} />}
        {nav==="dashboard" && <DashboardPage deals={deals} />}
      </div>
    </div>
  );
}
