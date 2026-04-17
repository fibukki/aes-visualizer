import { motion, AnimatePresence } from 'framer-motion';

const STATUS = {
  idle:          'Ready — configure the key and plaintext, then click START DECRYPTION.',
  init:          'Ciphertext loaded into the state matrix. Press NEXT STEP to begin.',
  addRoundKey:   'AddRoundKey: XOR each state byte with the round key — watch the scanning laser.',
  invSubBytes:   'InvSubBytes: Each byte looked up in the 16×16 Inverse S-Box.',
  invShiftRows:  'InvShiftRows: Bytes slide cyclically right along their row tracks.',
  invMixColumns: 'InvMixColumns: Each column multiplied by the inverse MDS matrix in GF(2⁸).',
  final:         'Decryption complete — all 10 rounds reversed. Original plaintext recovered.',
};

const OP_COLOR = {
  init:          'var(--accent)',
  addRoundKey:   'var(--accent-warn)',
  invSubBytes:   'var(--accent-hl)',
  invShiftRows:  'var(--accent)',
  invMixColumns: 'var(--accent-green)',
  final:         'var(--accent-green)',
};

const SPEEDS = [
  { label: 'SLOW',   value: 3.0, key: 's' },
  { label: 'NORM',   value: 1.4, key: 'n' },
  { label: 'FAST',   value: 0.4, key: 'f' },
];

const CONFIRM_LABEL = {
  addRoundKey:   '▸ CONFIRM XOR',
  invSubBytes:   '▸ CONFIRM BYTE',
  invShiftRows:  '▸ BEGIN SHIFT',
  invMixColumns: '▸ CONFIRM COLUMN',
};

const CONFIRM_STATUS = {
  addRoundKey:   '▸ Manual — CONFIRM XOR to apply each cell',
  invSubBytes:   '▸ Manual — CONFIRM BYTE to substitute and advance',
  invShiftRows:  '▸ Manual — CONFIRM to start the cyclic shift',
  invMixColumns: '▸ Manual — CONFIRM COLUMN to mix and advance',
};

export default function ControlBar({
  started, stepIndex, totalSteps, step, isPlaying,
  onBack, onPlayPause, onNext, onReset,
  speed = 0.8, onSpeedChange,
  manualMode = false, onManualToggle,
  animNeedsConfirm = false, onConfirm,
  animBusy = false,
}) {
  const op = step?.op || 'idle';
  const statusMsg   = STATUS[started ? op : 'idle'];
  const statusColor = OP_COLOR[op] || 'var(--accent)';
  const round       = step?.round;
  const progress    = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  const isLastStep   = stepIndex >= totalSteps - 1;
  const nextDisabled = !started || isLastStep || animBusy;
  const confirmLabel = CONFIRM_LABEL[op] || '▸ CONFIRM STEP';

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-control)',
      borderTop: '2px solid var(--border)',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
    }}>
      
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-2)',
        background: 'color-mix(in srgb, var(--bg-card) 60%, var(--bg-control))',
      }}>
        <div className="pulse-dot" style={{ background: statusColor }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'Orbitron, monospace', fontSize: 9, fontWeight: 700,
            letterSpacing: 3, color: statusColor, flexShrink: 0,
          }}>STATUS</span>
          <span style={{
            fontFamily: 'Exo 2, sans-serif', fontSize: 14, fontWeight: 600,
            color: 'var(--text)', letterSpacing: 0.3, lineHeight: 1.4,
          }}>
            {animNeedsConfirm
              ? (CONFIRM_STATUS[op] || '▸ Manual mode — click CONFIRM to advance')
              : statusMsg}
          </span>
        </div>
        {started && totalSteps > 0 && (
          <span style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 13, fontWeight: 700,
            color: 'var(--text-2)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {stepIndex + 1} / {totalSteps}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8, padding: '10px 20px',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{
              fontFamily: 'Orbitron, monospace', fontSize: 7, fontWeight: 700,
              letterSpacing: 2, color: 'var(--text-3)', marginRight: 6,
            }}>SPEED</span>
            {SPEEDS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => onSpeedChange?.(s.value)}
                style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 8, fontWeight: 700,
                  letterSpacing: 1,
                  padding: '7px 12px',
                  border: '1.5px solid var(--border)',
                  borderLeft: i > 0 ? 'none' : '1.5px solid var(--border)',
                  background: speed === s.value
                    ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-card))'
                    : 'var(--bg-card)',
                  color: speed === s.value ? 'var(--accent)' : 'var(--text-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: speed === s.value
                    ? 'none' : 'none',
                  boxShadow: speed === s.value
                    ? `inset 0 -2px 0 var(--accent)` : 'none',
                }}
              >{s.label}</button>
            ))}
          </div>

          <button
            onClick={onManualToggle}
            title="Step through each computation manually"
            style={{
              fontFamily: 'Orbitron, monospace', fontSize: 8, fontWeight: 700,
              letterSpacing: 1, padding: '7px 14px',
              border: `1.5px solid ${manualMode ? 'var(--accent-hl)' : 'var(--border)'}`,
              background: manualMode
                ? 'color-mix(in srgb, var(--accent-hl) 14%, var(--bg-card))'
                : 'var(--bg-card)',
              color: manualMode ? 'var(--accent-hl)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {manualMode ? '⊙ MANUAL' : '⊙ AUTO'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-control" onClick={onBack}
            disabled={!started || stepIndex === 0 || animBusy}>
            ◀ BACK
          </button>

          <button
            className={`btn-control ${isPlaying ? 'active' : ''}`}
            onClick={onPlayPause}
            disabled={!started || animNeedsConfirm}
            style={{ minWidth: 130 }}
          >
            {isPlaying ? '⏸  PAUSE' : '▶  AUTO-PLAY'}
          </button>

          <AnimatePresence>
            {animNeedsConfirm ? (
              <motion.button
                key="confirm"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                onClick={onConfirm}
                style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 700,
                  letterSpacing: 2,
                  border: '1.5px solid var(--accent-warn)',
                  color: 'var(--accent-warn)',
                  background: 'color-mix(in srgb, var(--accent-warn) 12%, var(--bg-card))',
                  padding: '11px 22px',
                  cursor: 'pointer',
                  minWidth: 160,
                  boxShadow: '0 0 16px color-mix(in srgb, var(--accent-warn) 30%, transparent)',
                }}
              >
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                >{confirmLabel}</motion.span>
              </motion.button>
            ) : (
              <motion.button
                key="next"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                className="btn-control"
                onClick={onNext}
                disabled={nextDisabled}
                style={{ minWidth: 130 }}
              >
                NEXT STEP ▶
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {started && round !== undefined && (
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, color: 'var(--text-2)',
              padding: '9px 16px',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-card)',
              whiteSpace: 'nowrap',
            }}>
              ROUND <span style={{ color: 'var(--accent)', fontSize: 14 }}>{round}</span>
              <span style={{ color: 'var(--text-dim)' }}>/10</span>
            </div>
          )}
          {started && (
            <button
              className="btn-control"
              onClick={onReset}
              style={{
                borderColor: 'color-mix(in srgb, var(--accent-red) 50%, var(--border))',
                color: 'var(--accent-red)',
              }}
            >✕ RESET</button>
          )}
        </div>
      </div>
    </div>
  );
}
