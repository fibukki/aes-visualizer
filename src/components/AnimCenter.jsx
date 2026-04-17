import { motion, AnimatePresence } from 'framer-motion';
import { toRowMajor, hex2, CELL, GAP } from '../animations/shared';
import CrossfadeGrid  from '../animations/CrossfadeGrid';
import ARKAnim        from '../animations/ARKAnim';
import ShiftRowsAnim  from '../animations/ShiftRowsAnim';
import SubBytesAnim   from '../animations/SubBytesAnim';
import MixColsAnim    from '../animations/MixColsAnim';

function StaticGrid({ state, op }) {
  if (!state) return null;
  const cells = toRowMajor(state);
  const opClass = {
    addRoundKey:   'op-ark',
    invSubBytes:   'op-sub',
    invShiftRows:  'op-shr',
    invMixColumns: 'op-mix',
    final:         'op-done',
  }[op] || '';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(4, ${CELL}px)`,
      gap: GAP, padding: 14,
      background: 'var(--bg-card2)',
      border: '2px solid var(--border)',
    }}>
      {cells.map(({ value, row, col, displayIdx }) => (
        <div key={displayIdx} className={`state-cell ${opClass}`}>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 22, fontWeight: 700,
          }}>
            {hex2(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnimCenter({
  displayedState, anim, currentOp, onAnimDone,
  manualMode = false,
  onWaitConfirm,
}) {
  if (!anim) {
    return <StaticGrid state={displayedState} op={currentOp} />;
  }

  const { type, fromState, toState, roundKey, speedMult = 1 } = anim;
  const done = () => onAnimDone?.(toState);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type + JSON.stringify(fromState?.slice(0, 2))}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {type === 'crossfade' && (
          <CrossfadeGrid fromState={fromState} toState={toState} op={anim.op} onDone={done} />
        )}
        {type === 'ark' && (
          <ARKAnim
            fromState={fromState} toState={toState} roundKey={roundKey}
            onDone={done} speedMult={speedMult}
            manualMode={manualMode} onWaitConfirm={onWaitConfirm}
          />
        )}
        {type === 'shift-drag' && (
          <ShiftRowsAnim fromState={fromState} toState={toState} onDone={done} speedMult={speedMult}
            manualMode={manualMode} onWaitConfirm={onWaitConfirm}
          />
        )}
        {type === 'sub-bytes' && (
          <SubBytesAnim
            fromState={fromState} toState={toState} onDone={done}
            speedMult={speedMult}
            manualMode={manualMode}
            onWaitConfirm={onWaitConfirm}
          />
        )}
        {type === 'mix-cols' && (
          <MixColsAnim fromState={fromState} toState={toState} onDone={done} speedMult={speedMult}
            manualMode={manualMode} onWaitConfirm={onWaitConfirm}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
