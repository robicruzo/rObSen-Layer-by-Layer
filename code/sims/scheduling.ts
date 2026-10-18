// scheduling.ts — a tiny discrete-time CPU scheduling simulator.
// It reproduces "The Whole Story" table from the Chapter 5 slides.
//
//   tsc --target es2022 scheduling.ts && node scheduling.js

type Policy = "FCFS" | "SJF" | "SRTF" | "PRIORITY" | "PRIORITY-P" | "RR";

interface Proc {
  id: string;
  arrival: number;
  burst: number;
  priority: number; // smaller number = more important
}

interface Result {
  timeline: string;
  turnaround: Map<string, number>;
  wait: Map<string, number>;
}

function simulate(procs: Proc[], policy: Policy, quantum = 2): Result {
  const remaining = new Map(procs.map((p) => [p.id, p.burst] as [string, number]));
  const finish = new Map<string, number>();
  const ready: Proc[] = [];
  let current: Proc | null = null;
  let used = 0; // ticks the current process has run in this quantum
  const timeline: string[] = [];

  // "Who should run next?" — the heart of each policy.
  const pick = (): Proc | null => {
    if (ready.length === 0) return null;
    let best = 0;
    for (let i = 1; i < ready.length; i++) {
      const a = ready[i], b = ready[best];
      if ((policy === "SJF" || policy === "SRTF") && remaining.get(a.id)! < remaining.get(b.id)!) best = i;
      if ((policy === "PRIORITY" || policy === "PRIORITY-P") && a.priority < b.priority) best = i;
      // FCFS and RR always take ready[0]; ties everywhere fall back to queue order (FCFS).
    }
    return ready.splice(best, 1)[0];
  };

  for (let t = 0; finish.size < procs.length; t++) {
    // 1. Arrivals join the back of the ready queue *before* any preemption decision.
    procs.filter((p) => p.arrival === t).forEach((p) => ready.push(p));

    // 2. Preemption checks (only for preemptive policies).
    if (current) {
      const preempt =
        (policy === "RR" && used === quantum) ||
        (policy === "SRTF" && ready.some((p) => remaining.get(p.id)! < remaining.get(current!.id)!)) ||
        (policy === "PRIORITY-P" && ready.some((p) => p.priority < current!.priority));
      if (preempt) {
        ready.push(current); // back of the line
        current = null;
      }
    }

    // 3. Dispatch if the CPU is free.
    if (!current) {
      current = pick();
      used = 0;
    }

    // 4. Run one tick.
    if (!current) {
      timeline.push("-");
      continue;
    }
    timeline.push(current.id);
    remaining.set(current.id, remaining.get(current.id)! - 1);
    used++;
    if (remaining.get(current.id) === 0) {
      finish.set(current.id, t + 1);
      current = null;
    }
  }

  const turnaround = new Map<string, number>();
  const wait = new Map<string, number>();
  for (const p of procs) {
    const tt = finish.get(p.id)! - p.arrival;
    turnaround.set(p.id, tt);
    wait.set(p.id, tt - p.burst);
  }
  return { timeline: timeline.join(" "), turnaround, wait };
}

// The process set used throughout the Chapter 5 slides.
const slideProcs: Proc[] = [
  { id: "A", arrival: 0, burst: 3, priority: 2 },
  { id: "B", arrival: 1, burst: 1, priority: 1 },
  { id: "C", arrival: 3, burst: 5, priority: 0 },
  { id: "D", arrival: 4, burst: 2, priority: 1 },
  { id: "E", arrival: 7, burst: 1, priority: 2 },
];

const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);

const runs: [string, Policy, number?][] = [
  ["FCFS", "FCFS"],
  ["NP-SJF", "SJF"],
  ["P-SJF", "SRTF"],
  ["NP-Pri", "PRIORITY"],
  ["P-Pri", "PRIORITY-P"],
  ["RR q=2", "RR", 2],
  ["RR q=5", "RR", 5],
  ["RR q=1", "RR", 1],
];

console.log("Policy   Timeline                  avgTT  avgWT");
for (const [label, policy, q] of runs) {
  const r = simulate(slideProcs, policy, q);
  console.log(
    `${label.padEnd(8)} ${r.timeline.padEnd(25)} ${sum(r.turnaround)}/5   ${sum(r.wait)}/5`,
  );
}
