import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AESVisualizer, encrypt } from './aes';
import AnimCenter     from './components/AnimCenter';
import RoundFlow      from './components/RoundFlow';
import AlgorithmPanel from './components/AlgorithmPanel';
import KeySchedule    from './components/KeySchedule';
import AvalancheDemo  from './components/AvalancheDemo';
import ControlBar     from './components/ControlBar';
import './index.css';

function randomBytes(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n))); }
function toHex2(b)       { return b.toString(16).padStart(2,'0').toUpperCase(); }
function toAscii(bytes)  { return bytes.map(b => (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.').join(''); }

const TABS = ['DECRYPT','KEY SCHED','AVALANCHE'];

function animTypeFor(op) {
  if (op === 'addRoundKey')   return 'ark';
  if (op === 'invSubBytes')   return 'sub-bytes';
  if (op === 'invShiftRows')  return 'shift-drag';
  if (op === 'invMixColumns') return 'mix-cols';
  return 'crossfade';
}

function SegmentedKeyInput({ keyBytes, onChange }) {
  const refs = useRef([]);
  function handle(i, val) {
    const clean = val.replace(/[^0-9a-fA-F]/g,'').slice(0,2);
    const next = [...keyBytes]; next[i] = parseInt(clean.padEnd(2,'0'),16) || 0;
    onChange(next);
    if (clean.length === 2 && i < 15) refs.current[i+1]?.focus();
  }
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
      {keyBytes.map((b,i) => (
        <input key={i} ref={el => refs.current[i]=el} className="hex-seg"
          value={toHex2(b)} onChange={e => handle(i,e.target.value)}
          onFocus={e => e.target.select()} maxLength={2} spellCheck={false} />
      ))}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button className="theme-toggle" onClick={onToggle}>
      <span>{dark ? '☀' : '☾'}</span>
      <div className={`toggle-track ${dark ? '' : 'on'}`}>
        <div className={`toggle-thumb ${dark ? '' : 'on'}`} />
      </div>
      <span style={{ fontFamily:'Orbitron,monospace', fontSize:9, letterSpacing:2 }}>
        {dark ? 'DARK' : 'LIGHT'}
      </span>
    </button>
  );
}

function SectionCard({ label, accentVar, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)' }}>
      <div style={{
        padding:'7px 12px', fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, letterSpacing:3,
        color:`var(${accentVar})`, borderBottom:'1px solid var(--border-2)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <span style={{ width:5, height:5, background:`var(${accentVar})`, transform:'rotate(45deg)', display:'inline-block', flexShrink:0 }} />
        {label}
      </div>
      <div style={{ padding:'12px' }}>{children}</div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme]   = useState('dark');
  const [tab, setTab]       = useState(0);
  const [keyBytes, setKeyBytes] = useState(() => randomBytes(16));
  const [plainBytes, setPlainBytes] = useState(() => Array.from(new TextEncoder().encode('AES Decrypt Demo!')));
  const [plaintextInput, setPlaintextInput] = useState('AES Decrypt Demo!');
  const [inputError, setInputError] = useState('');

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const getCipher = useCallback(() => encrypt(plainBytes, keyBytes), [plainBytes, keyBytes]);

  const vizRef      = useRef(null);
  const playRef     = useRef(null);
  const confirmRef  = useRef(null);
  const [step, setStep]                     = useState(null);
  const [stepIndex, setStepIndex]           = useState(0);
  const [started, setStarted]               = useState(false);
  const [isPlaying, setIsPlaying]           = useState(false);

  const [speed, setSpeed]           = useState(1.4);       
  const [manualMode, setManualMode] = useState(false);
  const speedMult = speed / 0.8; 

  const [displayedState, setDisplayedState] = useState(null);
  const [anim, setAnim]                     = useState(null);
  const [animNeedsConfirm, setAnimNeedsConfirm] = useState(false);
  const animBusy = !!anim;

  const initViz = useCallback(() => {
    const ct = getCipher();
    vizRef.current = new AESVisualizer(ct, keyBytes);
    const first = vizRef.current.current;
    setStep({ ...first });
    setStepIndex(0);
    setDisplayedState([...first.state]);
    setStarted(true);
    setAnim(null);
    setIsPlaying(false);
  }, [getCipher, keyBytes]);

  const reset = useCallback(() => {
    setIsPlaying(false); setStarted(false);
    setStep(null); setDisplayedState(null);
    setAnim(null); setAnimNeedsConfirm(false);
    confirmRef.current = null; vizRef.current = null;
  }, []);

  const triggerNext = useCallback(() => {
    if (!vizRef.current || animBusy) return;
    const viz = vizRef.current;
    if (viz.currentStep >= viz.totalSteps - 1) return;

    const fromState = [...viz.current.state];
    
    const nextStepData = viz.steps[viz.currentStep + 1];
    const toState      = [...nextStepData.state];
    const { op, roundKey } = nextStepData;
    const type = animTypeFor(op);

    viz.executeNextStep();
    setStepIndex(viz.currentStep);
    setStep({ ...viz.current });

    setAnim({ type, fromState, toState, roundKey: roundKey ? [...roundKey] : null, op, speedMult });
    setDisplayedState(null);
  }, [animBusy, speedMult]);

  const handleWaitConfirm = useCallback((advanceFn) => {
    confirmRef.current = advanceFn;
    setAnimNeedsConfirm(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setAnimNeedsConfirm(false);
    const fn = confirmRef.current;
    confirmRef.current = null;
    fn?.();
  }, []);

  const handleAnimDone = useCallback((toState) => {
    setDisplayedState(toState);
    setAnim(null);
    setAnimNeedsConfirm(false);
    confirmRef.current = null;
  }, []);

  const goBack = useCallback(() => {
    if (!vizRef.current || vizRef.current.currentStep === 0 || animBusy) return;
    vizRef.current.goToStep(vizRef.current.currentStep - 1);
    const cur = vizRef.current.current;
    setStepIndex(vizRef.current.currentStep);
    setStep({ ...cur });
    setDisplayedState([...cur.state]);
    setIsPlaying(false);
  }, [animBusy]);

  useEffect(() => {
    if (!isPlaying) { clearInterval(playRef.current); return; }
    playRef.current = setInterval(() => {
      if (!vizRef.current || animBusy) return;
      const viz = vizRef.current;
      if (viz.currentStep >= viz.totalSteps - 1) { setIsPlaying(false); return; }
      triggerNext();
    }, 2200);
    return () => clearInterval(playRef.current);
  }, [isPlaying, animBusy, triggerNext]);

  const applyPlaintext = useCallback(() => {
    const bytes = Array.from(new TextEncoder().encode(plaintextInput));
    if (bytes.length !== 16) { setInputError('Must be exactly 16 ASCII chars'); return; }
    setPlainBytes(bytes); setInputError(''); reset();
  }, [plaintextInput, reset]);

  const ct = getCipher();
  const totalSteps = vizRef.current?.totalSteps ?? 0;
  const plain = step?.op === 'final' ? step.state : null;

  const nextOp = vizRef.current?.steps[vizRef.current?.currentStep + 1]?.op;
  const statusForControlBar = animBusy ? `Animating: ${anim?.op || ''}…` : undefined;

  return (
    <div data-theme={theme} style={{ minHeight:'100vh', display:'flex', flexDirection:'column', paddingBottom:128 }}>

      <header style={{
        background:'var(--bg-card)', borderBottom:'1.5px solid var(--border)',
        padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:50, boxShadow:'var(--shadow)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:34, height:34, border:'2px solid var(--accent)', transform:'rotate(45deg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <div style={{ width:10, height:10, background:'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:15, fontWeight:900, letterSpacing:4, color:'var(--text)', lineHeight:1.1 }}>
              AES-128 DECRYPTION VISUALIZER
            </h1>
            <p style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-3)', letterSpacing:2, marginTop:2 }}>
              INTERACTIVE CRYPTOGRAPHIC ANALYSIS TOOL
            </p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {TABS.map((t,i) => (
            <button key={t} onClick={() => { setTab(i); setIsPlaying(false); }}
              style={{
                fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, letterSpacing:2,
                background:'transparent', border:'none', cursor:'pointer',
                color: tab===i ? 'var(--accent)' : 'var(--text-3)',
                borderBottom: `2px solid ${tab===i ? 'var(--accent)' : 'transparent'}`,
                padding:'4px 2px', transition:'all 0.18s',
              }}>
              {t}
            </button>
          ))}
          <div style={{ width:1, height:24, background:'var(--border)' }} />
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => t==='dark'?'light':'dark')} />
        </div>
      </header>

      <AnimatePresence mode="wait">

        {tab === 0 && (
          <motion.div key="decrypt" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ flex:1, display:'grid', gridTemplateColumns:'290px 1fr 320px', minHeight:0 }}>

            <div style={{ background:'var(--bg)', borderRight:'1.5px solid var(--border)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
              <div className="panel-label">
                <div className="panel-label-dot" />
                AES Configuration
              </div>

              <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:14 }}>
                <SectionCard label="KEY (128-BIT)" accentVar="--accent-warn">
                  <SegmentedKeyInput keyBytes={keyBytes} onChange={k => { setKeyBytes(k); reset(); }} />
                  <button className="btn btn-filled" onClick={() => { reset(); setKeyBytes(randomBytes(16)); }}
                    style={{ marginTop:10, width:'100%', borderColor:'var(--accent-warn)', color:'var(--accent-warn)' }}>
                    🔑 Generate New Key
                  </button>
                </SectionCard>

                <SectionCard label="PLAINTEXT (16 CHARS)" accentVar="--accent-green">
                  <input value={plaintextInput} onChange={e => setPlaintextInput(e.target.value)} maxLength={16}
                    style={{
                      width:'100%', background:'var(--bg-input)', border:'1.5px solid var(--border)',
                      color:'var(--text)', fontFamily:'Share Tech Mono,monospace', fontSize:14, fontWeight:600,
                      padding:'8px 10px', outline:'none',
                    }}
                    onFocus={e => e.target.style.borderColor='var(--accent-green)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}
                  />
                  {inputError && <p style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--accent-red)', marginTop:4 }}>{inputError}</p>}
                  <button className="btn" onClick={applyPlaintext}
                    style={{ marginTop:8, width:'100%', borderColor:'var(--accent-green)', color:'var(--accent-green)' }}>
                    Apply
                  </button>
                </SectionCard>

                <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border-2)', padding:'10px 12px' }}>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:8, fontWeight:700, letterSpacing:3, color:'var(--text-3)', marginBottom:6 }}>
                    CIPHERTEXT (HEX)
                  </div>
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-2)', wordBreak:'break-all', lineHeight:1.7 }}>
                    {ct.map(toHex2).join('')}
                  </div>
                </div>

                {!started ? (
                  <button className="btn btn-filled" onClick={initViz}
                    style={{ padding:'12px', fontSize:11, fontWeight:700 }}>
                    ▶ START DECRYPTION
                  </button>
                ) : (
                  <div style={{
                    background:'var(--bg-card2)',
                    border:`1.5px solid ${plain ? 'var(--accent-green)' : 'var(--border)'}`,
                    padding:'10px 12px', transition:'border-color 0.3s',
                  }}>
                    <div style={{ fontFamily:'Orbitron,monospace', fontSize:8, fontWeight:700, letterSpacing:3, color:'var(--text-3)', marginBottom:6 }}>
                      RECOVERED PLAINTEXT
                    </div>
                    <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:15, fontWeight:700, color: plain ? 'var(--accent-green)' : 'var(--text-dim)', letterSpacing:1 }}>
                      {plain ? `"${toAscii(plain)}"` : '—'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background:'var(--bg)', borderRight:'1.5px solid var(--border)', display:'flex', flexDirection:'column' }}>
              <div className="panel-label" style={{ justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="panel-label-dot" />
                  State &amp; Process Visualizer
                </div>
                {started && step && (
                  <motion.span key={step.label} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                    style={{ fontFamily:'Orbitron,monospace', fontSize:8, fontWeight:700, color:'var(--accent)', letterSpacing:1 }}>
                    {step.label?.toUpperCase()}
                  </motion.span>
                )}
              </div>

              <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border-2)', overflowX:'auto' }}>
                <RoundFlow step={step} />
              </div>

              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:16, overflowY:'auto' }}>
                {!started ? (
                  <div style={{ textAlign:'center', opacity:0.25 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,44px)', gap:4, marginBottom:12 }}>
                      {Array(16).fill(0).map((_,i) => (
                        <div key={i} style={{ width:44, height:44, border:'1px solid var(--border-2)', background:'var(--bg-card2)' }} />
                      ))}
                    </div>
                    <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, letterSpacing:2, color:'var(--text-dim)' }}>
                      AWAITING INPUT
                    </div>
                  </div>
                ) : (
                  <>
                    <AnimCenter
                      displayedState={displayedState}
                      anim={anim}
                      currentOp={step?.op}
                      onAnimDone={handleAnimDone}
                      manualMode={manualMode}
                      onWaitConfirm={handleWaitConfirm}
                    />

                    <AnimatePresence mode="wait">
                      <motion.div key={stepIndex} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{ textAlign:'center' }}>
                        {plain && (
                          <div style={{ fontFamily:'Orbitron,monospace', fontSize:11, fontWeight:900, letterSpacing:3, color:'var(--accent-green)', marginBottom:4 }}>
                            ✓ DECRYPTION COMPLETE
                          </div>
                        )}
                        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'var(--text-3)' }}>
                          Step {stepIndex + 1} of {totalSteps}
                        </div>
                        {animBusy && (
                          <motion.div
                            animate={{ opacity:[0.4,1,0.4] }}
                            transition={{ repeat:Infinity, duration:1.2 }}
                            style={{ fontFamily:'Orbitron,monospace', fontSize:8, letterSpacing:2, color:'var(--accent)', marginTop:4 }}>
                            ANIMATING…
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>

            <div style={{ background:'var(--bg)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
              <AlgorithmPanel
                step={step}
                roundKey={step?.roundKey}
                animActive={animBusy}
                animType={anim?.type}
              />
            </div>
          </motion.div>
        )}

        {tab === 1 && (
          <motion.div key="keysched" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ flex:1, padding:'24px' }}>
            <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)' }}>
              <div className="panel-label">
                <div className="panel-label-dot" />
                Key Expansion — 11 Round Keys
              </div>
              <div style={{ padding:'20px', overflowX:'auto' }}>
                <p style={{ fontFamily:'Exo 2,sans-serif', fontSize:13, fontWeight:500, color:'var(--text)', lineHeight:1.75, marginBottom:20 }}>
                  AES-128 expands the 128-bit key into 11 round keys (176 bytes total) using RotWord, SubWord, and RCON XOR operations.
                </p>
                <KeySchedule keyBytes={keyBytes} activeRound={step?.round ?? 0} />
              </div>
            </div>
          </motion.div>
        )}

        {tab === 2 && (
          <motion.div key="avalanche" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ flex:1, padding:'24px' }}>
            <AvalancheDemo />
          </motion.div>
        )}
      </AnimatePresence>

      <ControlBar
        started={started}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        step={step}
        isPlaying={isPlaying}
        animBusy={animBusy}
        onBack={goBack}
        onPlayPause={() => !animBusy && !animNeedsConfirm && setIsPlaying(p => !p)}
        onNext={!animBusy ? triggerNext : undefined}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        manualMode={manualMode}
        onManualToggle={() => setManualMode(m => !m)}
        animNeedsConfirm={animNeedsConfirm}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
