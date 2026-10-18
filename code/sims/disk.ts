// disk.ts — disk-arm scheduling on the textbook request queue.
//
//   tsc --target es2022 disk.ts && node disk.js

type Order = (queue: number[], head: number, maxCyl: number) => number[]; // returns visit order (stops)

const fcfs: Order = (q) => [...q];

const sstf: Order = (q, head) => {
  const pending = [...q];
  const path: number[] = [];
  let at = head;
  while (pending.length) {
    pending.sort((a, b) => Math.abs(a - at) - Math.abs(b - at));
    at = pending.shift()!;
    path.push(at);
  }
  return path;
};

// SCAN toward 0 first: sweep down to cylinder 0, then reverse.
const scanDown: Order = (q, head) => {
  const down = q.filter((c) => c <= head).sort((a, b) => b - a);
  const up = q.filter((c) => c > head).sort((a, b) => a - b);
  return [...down, 0, ...up];
};

// LOOK toward 0 first: reverse at the last request instead of at the platter's edge.
const lookDown: Order = (q, head) => {
  const down = q.filter((c) => c <= head).sort((a, b) => b - a);
  const up = q.filter((c) => c > head).sort((a, b) => a - b);
  return [...down, ...up];
};

// C-SCAN moving up: sweep to the end, jump back to 0, keep sweeping up.
const cscanUp: Order = (q, head, maxCyl) => {
  const up = q.filter((c) => c >= head).sort((a, b) => a - b);
  const wrap = q.filter((c) => c < head).sort((a, b) => a - b);
  return [...up, maxCyl, 0, ...wrap];
};

// C-LOOK moving up: jump from the highest request straight to the lowest.
const clookUp: Order = (q, head) => {
  const up = q.filter((c) => c >= head).sort((a, b) => a - b);
  const wrap = q.filter((c) => c < head).sort((a, b) => a - b);
  return [...up, ...wrap];
};

function distance(path: number[], head: number): number {
  let total = 0;
  let at = head;
  for (const c of path) {
    total += Math.abs(c - at);
    at = c;
  }
  return total;
}

const queue = [98, 183, 37, 122, 14, 124, 65, 67];
const head = 53;
const algorithms: [string, Order][] = [
  ["FCFS", fcfs],
  ["SSTF", sstf],
  ["SCAN (down)", scanDown],
  ["LOOK (down)", lookDown],
  ["C-SCAN (up)", cscanUp],
  ["C-LOOK (up)", clookUp],
];
for (const [name, order] of algorithms) {
  const path = order(queue, head, 199);
  console.log(`${name.padEnd(12)} ${String(distance(path, head)).padStart(4)} cylinders   ${[head, ...path].join(" → ")}`);
}
