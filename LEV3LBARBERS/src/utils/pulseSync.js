// Shared "beat" for the Special Offers badge glow (Home.jsx) and the
// active-chair spotlight glow (Availability.jsx) so the two read as one
// connected pulse instead of two animations drifting independently.
//
// Each element starts its own animation at its own mount time — and the
// chair spotlight in particular only mounts once an async shop-status
// fetch resolves, which is unpredictable — so simply giving both the same
// duration isn't enough to keep them in phase.
//
// Fix: anchor every instance to the same point in absolute wall-clock time
// via a negative start delay. For any real time t, using
// -(t mod PULSE_PERIOD) as the delay makes the animation behave as if it
// had been running since Unix epoch zero, so the position in the cycle at
// any later moment depends only on that moment — never on when the element
// actually mounted. Two elements using this formula are phase-locked even
// if they appear seconds apart.
export const PULSE_PERIOD = 2.6; // seconds

export const getPulsePhaseOffset = () => -((Date.now() / 1000) % PULSE_PERIOD);
