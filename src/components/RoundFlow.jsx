import { motion } from 'framer-motion';

const PIPELINE = [
  { id: 'ark10',  label: 'ARK₁₀',    op: 'addRoundKey',   round: 10 },
  { id: 'isub9',  label: 'InvSub₉',  op: 'invSubBytes',   round: 9 },
  { id: 'ishr9',  label: 'InvShr₉',  op: 'invShiftRows',  round: 9 },
  { id: 'imc9',   label: 'InvMix₉',  op: 'invMixColumns', round: 9 },
  { id: 'ark9',   label: 'ARK₉',     op: 'addRoundKey',   round: 9 },
  { id: 'dots',   label: '···',       op: null,            round: null },
  { id: 'ark1',   label: 'ARK₁',     op: 'addRoundKey',   round: 1 },
  { id: 'isub0',  label: 'InvSub₀',  op: 'invSubBytes',   round: 0 },
  { id: 'ishr0',  label: 'InvShr₀',  op: 'invShiftRows',  round: 0 },
  { id: 'ark0',   label: 'ARK₀',     op: 'addRoundKey',   round: 0 },
  { id: 'done',   label: 'Plain',     op: 'final',         round: 0 },
];

function isActive(pill, step) {
  if (!step) return false;
  if (pill.op === null) return false;
  return pill.op === step.op && pill.round === step.round;
}

export default function RoundFlow({ step }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', padding: '4px 0' }}>
        {PIPELINE.map((pill, i) => {
          const active = isActive(pill, step);
          return (
            <div key={pill.id} style={{ display: 'flex', alignItems: 'center' }}>
              <motion.div
                className={`flow-pill ${active ? 'active' : ''}`}
                animate={{
                  scale: active ? 1.08 : 1,
                  opacity: pill.op === null ? 0.4 : active ? 1 : 0.45,
                }}
                transition={{ duration: 0.25 }}
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: 8,
                  letterSpacing: 1,
                }}
              >
                {pill.label}
              </motion.div>
              {i < PIPELINE.length - 1 && (
                <div style={{
                  width: 12, height: 1,
                  background: active
                    ? 'var(--accent)'
                    : 'var(--border-2)',
                  flexShrink: 0,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
