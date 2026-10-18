// bankers.ts — the banker's algorithm's safety check, on the textbook's classic example.
//
//   tsc --target es2022 bankers.ts && node bankers.js

type Vec = number[];

const leq = (a: Vec, b: Vec) => a.every((x, i) => x <= b[i]);
const add = (a: Vec, b: Vec) => a.map((x, i) => x + b[i]);
const sub = (a: Vec, b: Vec) => a.map((x, i) => x - b[i]);

/** Returns a safe sequence of process indices, or null if the state is unsafe. */
function safeSequence(available: Vec, allocation: Vec[], max: Vec[]): number[] | null {
  const need = max.map((m, i) => sub(m, allocation[i]));
  let work = [...available];
  const finished = allocation.map(() => false);
  const order: number[] = [];

  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < allocation.length; i++) {
      if (!finished[i] && leq(need[i], work)) {
        work = add(work, allocation[i]); // P_i can finish and return everything it holds
        finished[i] = true;
        order.push(i);
        progress = true;
      }
    }
  }
  return finished.every(Boolean) ? order : null;
}

// Resources A, B, C with 10, 5, 7 instances in total.
const allocation: Vec[] = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]];
const max: Vec[] =        [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]];
const available: Vec = [3, 3, 2];

const seq = safeSequence(available, allocation, max);
console.log(seq ? `safe: <${seq.map((i) => "P" + i).join(", ")}>` : "unsafe");

// Should P1's request (1, 0, 2) be granted? Pretend to grant it, then test safety.
const req = [1, 0, 2];
const alloc2 = allocation.map((a, i) => (i === 1 ? add(a, req) : a));
const seq2 = safeSequence(sub(available, req), alloc2, max);
console.log(`after granting P1 (1,0,2): ${seq2 ? `safe: <${seq2.map((i) => "P" + i).join(", ")}>` : "unsafe — make P1 wait"}`);

// And P0's request (0, 2, 0) on top of that?
const req0 = [0, 2, 0];
const alloc3 = alloc2.map((a, i) => (i === 0 ? add(a, req0) : a));
const seq3 = safeSequence(sub(sub(available, req), req0), alloc3, max);
console.log(`then P0 (0,2,0): ${seq3 ? "safe" : "unsafe — make P0 wait"}`);
