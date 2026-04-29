import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Brain, Copy, MessageSquare, Target, Database, Activity, Sparkles } from 'lucide-react';
import './styles.css';

const doctrine = [
  'Control precedes persuasion',
  'Exit logic > entry price',
  'Speed is structural',
  'Not all conversations are transactions',
  'Buyers self-segment by behavior',
];

function detectLeadType(chat, context) {
  const text = `${chat} ${context}`.toLowerCase();
  if (text.includes('owner') || text.includes('my unit') || text.includes('i own')) return 'Owner / Owner-like';
  if (text.includes('investment') || text.includes('roi') || text.includes('rent') || text.includes('yield')) return 'Investor';
  if (text.includes('my use') || text.includes('family') || text.includes('live') || text.includes('end user') || text.includes('home for myself')) return 'End User';
  if (text.includes('commission') || text.includes('client')) return 'Agent / Broker';
  return 'Unclear / Needs qualification';
}

function detectStyle(chat) {
  const text = chat.toLowerCase();
  if (text.includes('best price') || text.includes('last price') || text.includes('discount') || text.includes('too high')) return 'Price-dominant / testing strength';
  if (text.includes('details') || text.includes('breakdown') || text.includes('size') || text.includes('floor') || text.includes('unit number')) return 'Analytical / detail-oriented';
  if (text.includes('not interested') || text.includes('sorry') || text.includes('later') || text.includes('postponing')) return 'Defensive / pulling back';
  if (text.includes('thank you') || text.includes('appreciate')) return 'Polite but not necessarily committed';
  return 'Neutral / insufficient signals';
}

function detectStrategy(chat, notes) {
  const text = `${chat} ${notes}`.toLowerCase();
  if (text.includes('too high') || text.includes('best price') || text.includes('last price') || text.includes('discount')) return 'Reframe';
  if (text.includes("didn't like") || text.includes('not like') || text.includes('another option')) return 'Replace option';
  if (text.includes('time') || text.includes('later') || text.includes('finance') || text.includes('not ready') || text.includes('postponing')) return 'Park + soft pressure';
  if (text.includes('viewing') || text.includes('mou') || text.includes('cash') || text.includes('ready')) return 'Push';
  if (text.includes('not interested')) return 'Pull';
  return 'Qualify + control frame';
}

function buildMessage(name, strategy) {
  const n = name ? `${name}` : '';
  if (strategy === 'Reframe') {
    return `Hi ${n}, just to clarify one point — I’m not trying to force the price down or up.\n\nThe main difference here is the floor/position and how clean the option is compared to the previous one. If the unit itself works for you, we can move based on facts rather than just comparing headline prices.`;
  }
  if (strategy === 'Replace option') {
    return `Hi ${n}, noted. If this option is not the right fit, I’ll not push it.\n\nI’ll focus on finding something closer to your actual criteria — better position, cleaner numbers, and stronger exit/rent logic.`;
  }
  if (strategy === 'Park + soft pressure') {
    return `Hi ${n}, fully understood — no pressure at all.\n\nJust keeping you updated: options around this level usually don’t stay long, especially when the price and position are both clean. If your side becomes ready, I’d rather we move before the market leaves us with weaker alternatives.`;
  }
  if (strategy === 'Push') {
    return `Hi ${n}, based on what you told me, this is one of the cleaner options to seriously consider.\n\nThe numbers are clear, the position is strong, and the next practical step is to test the owner properly rather than keeping it theoretical.`;
  }
  if (strategy === 'Pull') {
    return `Hi ${n}, understood. I won’t push something that doesn’t match your direction.\n\nI’ll keep your criteria in mind, and if I find something that genuinely fits better, I’ll share it with you directly.`;
  }
  return `Hi ${n}, just to understand properly before I send more options — are you mainly comparing for investment return, or are you looking for something you may personally use later?`;
}

function leadScore(strategy, chat) {
  const text = chat.toLowerCase();
  let score = 50;
  if (text.includes('cash')) score += 15;
  if (text.includes('mou') || text.includes('viewing')) score += 20;
  if (text.includes('best price') || text.includes('last price')) score += 10;
  if (text.includes('not interested')) score -= 25;
  if (text.includes('later') || text.includes('time') || text.includes('postponing')) score -= 10;
  if (strategy === 'Push') score += 10;
  if (strategy === 'Park + soft pressure') score -= 5;
  return Math.max(0, Math.min(100, score));
}

function App() {
  const [leadName, setLeadName] = useState('');
  const [context, setContext] = useState('');
  const [chat, setChat] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('');
  const [property, setProperty] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState('');

  function analyzeLead() {
    const leadType = detectLeadType(chat, context);
    const style = detectStyle(chat);
    const strategy = detectStrategy(chat, notes);
    const score = leadScore(strategy, chat);
    const message = buildMessage(leadName, strategy);
    const riskLevel = score >= 75 ? 'Low' : score >= 45 ? 'Medium' : 'High';
    const crmStage = score >= 75 ? 'Hot' : score >= 45 ? 'Warm' : strategy.includes('Park') ? 'Parked' : 'Cold';

    setAnalysis({
      leadType,
      style,
      strategy,
      score,
      riskLevel,
      crmStage,
      message,
      diagnosis: leadType === 'Investor'
        ? 'Focus on ROI, rent reality, entry price, liquidity, and exit logic.'
        : leadType === 'End User'
        ? 'Focus on comfort, position, timing, family use, and availability.'
        : leadType.includes('Owner')
        ? 'Clarify whether they own, compare, or fish for market data before giving too much.'
        : 'Need cleaner qualification before sending too many options.',
      controlPoint: strategy === 'Reframe'
        ? 'Do not defend the price. Separate unit quality from headline comparison.'
        : strategy === 'Push'
        ? 'Move from conversation to commitment/test offer.'
        : strategy === 'Park + soft pressure'
        ? 'Respect timing but keep scarcity visible.'
        : 'Avoid over-selling. Reset criteria first.',
      nextAction: strategy === 'Push'
        ? 'Call or ask permission to start negotiation.'
        : strategy === 'Park + soft pressure'
        ? 'Follow up in 48 hours unless they reply.'
        : strategy === 'Replace option'
        ? 'Send 1 stronger replacement only.'
        : 'Send qualification message.',
    });
  }

  const crmRow = useMemo(() => {
    if (!analysis) return '';
    return [leadName, analysis.leadType, budget, area, property, analysis.crmStage, analysis.strategy, 'Analyzed by AI', analysis.nextAction, '48 hours', notes]
      .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
      .join(',');
  }, [analysis, leadName, budget, area, property, notes]);

  async function copyText(text, label) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1400);
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <div className="titleRow">
            <Brain size={32} />
            <h1>Mohamed Sales Doctor AI</h1>
          </div>
          <p>Mobile-first lead analyzer based on your Abu Dhabi real estate sales doctrine.</p>
        </div>
        <div className="chips">
          {doctrine.map((d) => <span key={d}>{d}</span>)}
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h2><MessageSquare size={20} /> Lead Input</h2>
          <div className="fields two">
            <input placeholder="Lead name" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
            <input placeholder="Budget e.g. 3.7M" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <input placeholder="Area e.g. Yas / Reem" value={area} onChange={(e) => setArea(e.target.value)} />
            <input placeholder="Property e.g. 2BR / Townhouse" value={property} onChange={(e) => setProperty(e.target.value)} />
          </div>
          <textarea placeholder="Context: buyer type, situation, call notes..." value={context} onChange={(e) => setContext(e.target.value)} />
          <textarea className="large" placeholder="Paste WhatsApp chat history here..." value={chat} onChange={(e) => setChat(e.target.value)} />
          <textarea placeholder="Your notes / instinct / hidden signals..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="primary" onClick={analyzeLead}><Sparkles size={18} /> Analyze Lead</button>
        </div>

        <div className="card">
          <h2><Target size={20} /> Agent Output</h2>
          {!analysis ? (
            <div className="empty">Paste a lead conversation and click Analyze Lead.</div>
          ) : (
            <div className="output">
              <div className="stats">
                <div><small>Score</small><strong>{analysis.score}/100</strong></div>
                <div><small>Risk</small><strong>{analysis.riskLevel}</strong></div>
                <div><small>Stage</small><strong>{analysis.crmStage}</strong></div>
              </div>

              <div className="box">
                <h3>Lead Diagnosis</h3>
                <p><b>Type:</b> {analysis.leadType}</p>
                <p><b>Style:</b> {analysis.style}</p>
                <p>{analysis.diagnosis}</p>
              </div>

              <div className="box">
                <h3>Best Strategy</h3>
                <p className="big">{analysis.strategy}</p>
                <p>{analysis.controlPoint}</p>
              </div>

              <div className="box">
                <div className="boxHead">
                  <h3>WhatsApp Message</h3>
                  <button onClick={() => copyText(analysis.message, 'message')}><Copy size={16} /> Copy</button>
                </div>
                <pre>{analysis.message}</pre>
              </div>

              <div className="box">
                <h3>Next Action</h3>
                <p>{analysis.nextAction}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="boxHead">
          <h2><Database size={20} /> CRM Row</h2>
          <button disabled={!crmRow} onClick={() => copyText(crmRow, 'crm')}><Copy size={16} /> Copy CSV</button>
        </div>
        <pre className="crm">{crmRow || 'Analyze a lead first.'}</pre>
      </section>

      <section className="card doctrine">
        <h2><Activity size={20} /> Doctrine Engine</h2>
        <div className="doctrineGrid">
          {doctrine.map((d, i) => <div key={d}><small>Rule {i + 1}</small><strong>{d}</strong></div>)}
        </div>
      </section>

      {copied && <div className="toast">Copied {copied} ✅</div>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
