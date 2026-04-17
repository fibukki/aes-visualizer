import { motion, AnimatePresence } from 'framer-motion';

const INV_SBOX_PARTIAL = [
  [0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38],
  [0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb],
  [0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87],
  [0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb],
  [0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d],
  [0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e],
  [0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2],
  [0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25],
];

function SBoxTable({ highlightByte }) {
  const hl = highlightByte !== undefined ? highlightByte : -1;
  
  const hlRow = hl >= 0 ? Math.floor(hl / 8) : -1;
  const hlCol = hl >= 0 ? hl % 8 : -1;
  const inRange = hlRow >= 0 && hlRow < 8;

  return (
    <div>
      <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:2, marginBottom:8 }}>
        INV S-BOX LOOKUP (rows 0x00–0x3F)
      </div>
      {inRange && (
        <div style={{ marginBottom:8, padding:'6px 10px', background:'var(--bg-card2)', border:'1px solid var(--accent-hl)', fontSize:12 }}>
          <span style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--text-2)' }}>
            InvSBox[<span style={{ color:'var(--accent)', fontWeight:700 }}>0x{(hl).toString(16).padStart(2,'0').toUpperCase()}</span>]
            {' = '}
            <span style={{ color:'var(--text)', fontWeight:700 }}>
              0x{INV_SBOX_PARTIAL[hlRow][hlCol].toString(16).padStart(2,'0').toUpperCase()}
            </span>
          </span>
        </div>
      )}
      <div style={{ overflowX:'auto' }}>
        <table className="sbox-table">
          <thead>
            <tr>
              <th style={{ color:'var(--text-dim)', width:28 }}></th>
              {[0,1,2,3,4,5,6,7].map(c => (
                <th key={c}>_{c.toString(16).toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INV_SBOX_PARTIAL.map((row, ri) => (
              <tr key={ri}>
                <td style={{ color:'var(--text-3)', fontWeight:600, borderColor:'var(--border)' }}>
                  {(ri).toString(16).toUpperCase()}_
                </td>
                {row.map((val, ci) => {
                  const active = inRange && ri === hlRow && ci === hlCol;
                  return (
                    <td key={ci} className={active ? 'sbox-active' : ''}>
                      {val.toString(16).padStart(2,'0').toUpperCase()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShiftDiagram() {
  const rows = [
    { r: 0, shift: 0, before: ['a₀','b₀','c₀','d₀'], after: ['a₀','b₀','c₀','d₀'] },
    { r: 1, shift: 1, before: ['a₁','b₁','c₁','d₁'], after: ['d₁','a₁','b₁','c₁'] },
    { r: 2, shift: 2, before: ['a₂','b₂','c₂','d₂'], after: ['c₂','d₂','a₂','b₂'] },
    { r: 3, shift: 3, before: ['a₃','b₃','c₃','d₃'], after: ['b₃','c₃','d₃','a₃'] },
  ];
  return (
    <div>
      <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:2, marginBottom:10 }}>
        RIGHT CYCLIC SHIFT PER ROW
      </div>
      {rows.map(({ r, shift, before, after }) => (
        <div key={r} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-3)', width:44, flexShrink:0 }}>
            Row {r}:
          </span>
          <div style={{ display:'flex', gap:2 }}>
            {before.map((c,i) => (
              <div key={i} style={{
                width:28, height:24, display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-2)',
                background:'var(--bg-card2)', border:'1px solid var(--border)',
              }}>{c}</div>
            ))}
          </div>
          <span style={{ color:'var(--accent)', fontSize:14, fontWeight:700 }}>→</span>
          <div style={{ display:'flex', gap:2 }}>
            {after.map((c,i) => (
              <div key={i} style={{
                width:28, height:24, display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Share Tech Mono,monospace', fontSize:10,
                color: shift > 0 ? 'var(--text)' : 'var(--text-2)',
                background: shift > 0 ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-card2))' : 'var(--bg-card2)',
                border: `1px solid ${shift > 0 ? 'var(--accent)' : 'var(--border)'}`,
              }}>{c}</div>
            ))}
          </div>
          {shift > 0 && (
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--accent)', fontWeight:700 }}>
              +{shift}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MixColDiagram() {
  const mat = [[0x0e,0x0b,0x0d,0x09],[0x09,0x0e,0x0b,0x0d],[0x0d,0x09,0x0e,0x0b],[0x0b,0x0d,0x09,0x0e]];
  return (
    <div>
      <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:2, marginBottom:10 }}>
        INV MDS MATRIX × COLUMN IN GF(2⁸)
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,28px)', gap:2 }}>
          {mat.flat().map((v,i) => (
            <div key={i} style={{
              width:28, height:26, display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, fontWeight:700,
              color:'var(--accent-green)',
              background:'color-mix(in srgb, var(--accent-green) 8%, var(--bg-card2))',
              border:'1px solid color-mix(in srgb, var(--accent-green) 30%, var(--border))',
            }}>{v.toString(16)}</div>
          ))}
        </div>
        <span style={{ color:'var(--text-3)', fontSize:20 }}>×</span>
        <div style={{ display:'grid', gridTemplateColumns:'28px', gap:2 }}>
          {['s₀','s₁','s₂','s₃'].map((s,i) => (
            <div key={i} style={{
              width:28, height:26, display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text)',
              background:'var(--bg-card2)', border:'1px solid var(--border)',
            }}>{s}</div>
          ))}
        </div>
        <span style={{ color:'var(--text-3)', fontSize:20 }}>=</span>
        <div style={{ display:'grid', gridTemplateColumns:'28px', gap:2 }}>
          {["s'₀","s'₁","s'₂","s'₃"].map((s,i) => (
            <div key={i} style={{
              width:28, height:26, display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, fontWeight:700,
              color:'var(--accent-green)',
              background:'color-mix(in srgb, var(--accent-green) 8%, var(--bg-card2))',
              border:'1px solid color-mix(in srgb, var(--accent-green) 35%, var(--border))',
            }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ marginTop:8, fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-2)', lineHeight:1.8 }}>
        s'₀ = 0e·s₀ ⊕ 0b·s₁ ⊕ 0d·s₂ ⊕ 09·s₃<br/>
        All multiplications in GF(2⁸) mod x⁸+x⁴+x³+x+1
      </div>
    </div>
  );
}

function AddRKDiagram({ roundKey }) {
  return (
    <div>
      <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:2, marginBottom:10 }}>
        XOR STATE WITH ROUND KEY
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        {['S₀₀','S₁₀','S₂₀','S₃₀'].map((s,i) => (
          <div key={i} style={{
            width:32, height:28, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Share Tech Mono,monospace', fontSize:10, fontWeight:700,
            color:'var(--text)', background:'var(--bg-card2)', border:'1px solid var(--border)',
          }}>{s}</div>
        ))}
        <span style={{ color:'var(--accent-warn)', fontSize:18, fontWeight:900 }}>⊕</span>
        {['K₀₀','K₁₀','K₂₀','K₃₀'].map((k,i) => (
          <div key={i} style={{
            width:32, height:28, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Share Tech Mono,monospace', fontSize:10, fontWeight:700,
            color:'var(--accent-warn)',
            background:'color-mix(in srgb, var(--accent-warn) 10%, var(--bg-card2))',
            border:'1px solid color-mix(in srgb, var(--accent-warn) 40%, var(--border))',
          }}>{k}</div>
        ))}
        <span style={{ color:'var(--text-3)', fontSize:18 }}>=</span>
        {["R₀₀","R₁₀","R₂₀","R₃₀"].map((r,i) => (
          <div key={i} style={{
            width:32, height:28, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Share Tech Mono,monospace', fontSize:10, fontWeight:900,
            color:'var(--text)',
            background:'color-mix(in srgb, var(--accent) 10%, var(--bg-card2))',
            border:'1px solid var(--accent)',
          }}>{r}</div>
        ))}
      </div>
      {roundKey && (
        <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', padding:'8px 10px' }}>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:8, color:'var(--text-3)', letterSpacing:2, marginBottom:6 }}>ROUND KEY BYTES</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {roundKey.map((b,i) => (
              <span key={i} style={{
                fontFamily:'Share Tech Mono,monospace', fontSize:12, fontWeight:700,
                color:'var(--accent-warn)',
                background:'color-mix(in srgb, var(--accent-warn) 8%, var(--bg-card2))',
                padding:'2px 5px', border:'1px solid color-mix(in srgb, var(--accent-warn) 25%, var(--border))',
              }}>{b.toString(16).padStart(2,'0').toUpperCase()}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CONTENT = {
  init: {
    title: 'INITIAL STATE',
    accent: 'var(--accent)',
    body: 'The 128-bit ciphertext is loaded into a 4×4 state matrix in column-major order. Each cell holds one byte (8 bits). AES-128 decryption reverses all 10 encryption rounds to recover the original plaintext.',
    diagram: null,
  },
  addRoundKey: {
    title: 'ADD ROUND KEY',
    accent: 'var(--accent-warn)',
    body: 'Every byte in the state is XOR\'d (⊕) with the corresponding byte from the round key. XOR is its own inverse — so applying the same key twice recovers the original value. The round key comes from the Key Schedule.',
    diagram: null, 
  },
  invSubBytes: {
    title: 'INV SUB BYTES',
    accent: 'var(--accent-hl)',
    body: 'Each state byte is replaced using the AES Inverse S-Box — a non-linear substitution table built over GF(2⁸). The highlighted cell in the matrix and the table below show which byte is currently being substituted.',
    diagram: null, 
  },
  invShiftRows: {
    title: 'INV SHIFT ROWS',
    accent: 'var(--accent)',
    body: 'Each row is cyclically shifted RIGHT by its row index. Row 0 is unchanged. Row 1 shifts right by 1, Row 2 by 2, Row 3 by 3. This is the inverse of the left-shift performed during encryption.',
    diagram: <ShiftDiagram />,
  },
  invMixColumns: {
    title: 'INV MIX COLUMNS',
    accent: 'var(--accent-green)',
    body: 'Each column of the state is multiplied by a fixed inverse MDS matrix in the finite field GF(2⁸). This provides diffusion — each output byte depends on all 4 input bytes in the column.',
    diagram: <MixColDiagram />,
  },
  final: {
    title: 'DECRYPTION COMPLETE',
    accent: 'var(--accent-green)',
    body: 'All 10 rounds have been successfully reversed. The state now contains the original plaintext. AES-128 security rests entirely on the secrecy of the 128-bit key — the algorithm itself is public.',
    diagram: null,
  },
};

export default function AlgorithmPanel({ step, roundKey, highlightByte }) {
  const op = step?.op || 'init';
  const info = CONTENT[op] || CONTENT.init;

  const diagram = op === 'invSubBytes'
    ? <SBoxTable highlightByte={highlightByte} />
    : op === 'addRoundKey'
      ? <AddRKDiagram roundKey={roundKey} />
      : info.diagram;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="panel-label">
        <div className="panel-label-dot" />
        Algorithm Principles
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={op}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.22 }}
          >
            
            <div style={{
              fontFamily:'Orbitron,monospace', fontSize:12, fontWeight:900,
              letterSpacing:2, color:info.accent,
              paddingBottom:10, marginBottom:12,
              borderBottom:`2px solid color-mix(in srgb, ${info.accent} 30%, transparent)`,
            }}>
              {info.title}
            </div>

            <p style={{
              fontFamily:'Exo 2,sans-serif', fontSize:13, fontWeight:500,
              color:'var(--text)',
              lineHeight:1.75,
              marginBottom:14,
            }}>
              {info.body}
            </p>

            {diagram && (
              <div style={{
                background:'var(--bg-card2)',
                border:'1px solid var(--border)',
                padding:'12px',
                marginBottom:12,
              }}>
                {diagram}
              </div>
            )}

            {step && (
              <div style={{
                display:'flex', gap:12, flexWrap:'wrap',
                paddingTop:10, borderTop:'1px solid var(--border-2)',
              }}>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-3)' }}>
                  OP: <strong style={{ color:'var(--text)' }}>{step.op?.toUpperCase() || '—'}</strong>
                </div>
                {step.round !== undefined && (
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-3)' }}>
                    ROUND: <strong style={{ color:info.accent }}>{step.round}</strong>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
