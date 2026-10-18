// race.ts — the Chapter 6 slide's race condition, in 6502a terms.
// Two processes each run:  LDA $10 ; ADC $10 ; STA $10   (double the shared byte)
// We try every possible interleaving of their six instructions.
//
//   tsc --target es2022 race.ts && node race.js

type Instr = "LDA" | "ADC" | "STA";
const program: Instr[] = ["LDA", "ADC", "STA"];

interface Cpu { acc: number; pc: number; }

function run(schedule: number[], initial: number): number {
  let shared = initial;                       // memory location $10
  const cpus: Cpu[] = [{ acc: 0, pc: 0 }, { acc: 0, pc: 0 }];  // each process's saved registers
  for (const who of schedule) {
    const cpu = cpus[who];
    switch (program[cpu.pc++]) {
      case "LDA": cpu.acc = shared; break;
      case "ADC": cpu.acc = (cpu.acc + shared) & 0xff; break;
      case "STA": shared = cpu.acc; break;
    }
  }
  return shared;
}

// All ways to interleave two 3-instruction sequences: choose which 3 of 6 slots belong to P0.
function interleavings(): number[][] {
  const result: number[][] = [];
  const build = (prefix: number[], left0: number, left1: number) => {
    if (left0 === 0 && left1 === 0) { result.push(prefix); return; }
    if (left0 > 0) build([...prefix, 0], left0 - 1, left1);
    if (left1 > 0) build([...prefix, 1], left0, left1 - 1);
  };
  build([], 3, 3);
  return result;
}

const outcomes = new Map<number, string[]>();
for (const s of interleavings()) {
  const final = run(s, 1);
  const label = s.map((p) => "AB"[p]).join("");
  outcomes.set(final, [...(outcomes.get(final) ?? []), label]);
}
for (const [value, schedules] of [...outcomes].sort((a, b) => a[0] - b[0])) {
  console.log(`final value ${value}: ${schedules.length} schedules, e.g. ${schedules.slice(0, 4).join(" ")}`);
}
