// fit.ts — first-fit, best-fit, worst-fit on the Chapter 8 slide example.
// Memory is 20 units (1..20). A 4k@1, B 2k@11, C 3k@17 are already resident.
// D (1k), E (4k), F (2k) arrive in that order.
//
//   tsc --target es2022 fit.ts && node fit.js

interface Hole { start: number; size: number; }
type Strategy = (holes: Hole[], need: number) => Hole | undefined;

const firstFit: Strategy = (holes, need) => holes.find((h) => h.size >= need);
const bestFit: Strategy = (holes, need) =>
  holes.filter((h) => h.size >= need).sort((a, b) => a.size - b.size)[0];
const worstFit: Strategy = (holes, need) =>
  holes.filter((h) => h.size >= need).sort((a, b) => b.size - a.size)[0];

function place(strategy: Strategy): string {
  // Holes left by A, B, C in a 20-unit memory: 5..10, 13..16, 20.
  let holes: Hole[] = [
    { start: 5, size: 6 },
    { start: 13, size: 4 },
    { start: 20, size: 1 },
  ];
  const placed: string[] = [];
  for (const [name, need] of [["D", 1], ["E", 4], ["F", 2]] as const) {
    const hole = strategy(holes, need);
    if (!hole) {
      placed.push(`${name}: no fit`);
      continue;
    }
    placed.push(`${name}@${hole.start}`);
    holes = holes
      .map((h) => (h === hole ? { start: h.start + need, size: h.size - need } : h))
      .filter((h) => h.size > 0)
      .sort((a, b) => a.start - b.start);
  }
  return placed.join("  ");
}

console.log("first fit:", place(firstFit));
console.log("best fit: ", place(bestFit));
console.log("worst fit:", place(worstFit));
