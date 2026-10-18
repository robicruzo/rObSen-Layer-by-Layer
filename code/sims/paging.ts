// paging.ts — page-replacement policies as interchangeable strategies.
//
//   tsc --target es2022 paging.ts && node paging.js

interface ReplacementPolicy {
  readonly name: string;
  /** Choose which resident page to evict. `now` is the index into the reference string. */
  victim(frames: number[], refs: number[], now: number, history: Map<number, number>): number;
}

class Fifo implements ReplacementPolicy {
  readonly name = "FIFO";
  victim(frames: number[]): number {
    return frames[0]; // frames are kept in load order, oldest first
  }
}

class Lru implements ReplacementPolicy {
  readonly name = "LRU";
  victim(frames: number[], _refs: number[], _now: number, lastUsed: Map<number, number>): number {
    return frames.reduce((oldest, p) => (lastUsed.get(p)! < lastUsed.get(oldest)! ? p : oldest));
  }
}

class Optimal implements ReplacementPolicy {
  readonly name = "OPT";
  victim(frames: number[], refs: number[], now: number): number {
    // Evict the page whose next use is farthest in the future (or never).
    const nextUse = (p: number) => {
      const i = refs.indexOf(p, now + 1);
      return i === -1 ? Infinity : i;
    };
    return frames.reduce((far, p) => (nextUse(p) > nextUse(far) ? p : far));
  }
}

function countFaults(refs: number[], frameCount: number, policy: ReplacementPolicy): number {
  const frames: number[] = [];
  const lastUsed = new Map<number, number>();
  let faults = 0;
  refs.forEach((page, now) => {
    if (!frames.includes(page)) {
      faults++;
      if (frames.length === frameCount) {
        const v = policy.victim(frames, refs, now, lastUsed);
        frames.splice(frames.indexOf(v), 1);
      }
      frames.push(page);
    }
    lastUsed.set(page, now);
  });
  return faults;
}

const refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
for (const policy of [new Fifo(), new Optimal(), new Lru()]) {
  const three = countFaults(refs, 3, policy);
  const four = countFaults(refs, 4, policy);
  console.log(`${policy.name.padEnd(5)} 3 frames: ${three} faults   4 frames: ${four} faults`);
}
