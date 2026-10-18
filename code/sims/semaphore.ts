// semaphore.ts — a counting semaphore built on Promises, and the dining philosophers.
//
//   tsc --target es2022 semaphore.ts && node semaphore.js

class Semaphore {
  private waiting: (() => void)[] = [];   // resolvers of blocked wait() calls, FIFO
  constructor(private value: number) {}

  /** P(): take a unit, or block (asynchronously) until one is available. */
  wait(): Promise<void> {
    if (this.value > 0) {
      this.value--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  /** V(): give a unit back, waking the longest waiter if there is one. */
  signal(): void {
    const next = this.waiting.shift();
    if (next) next();          // hand the unit straight to the waiter
    else this.value++;
  }
}

const pause = () => new Promise<void>((r) => setTimeout(r, 0)); // yield to the event loop

// --- 1. Check-then-act across an await: a race, even on one thread -----------------
let tickets = 1;
async function buyTicket(who: string, log: string[]) {
  if (tickets > 0) {          // check …
    await pause();            // … something asynchronous happens (a payment, a disk write) …
    tickets--;                // … act
    log.push(`${who} got a ticket (tickets now ${tickets})`);
  }
}

async function buyTicketSafely(who: string, lock: Semaphore, log: string[]) {
  await lock.wait();          // critical section begins
  try {
    if (tickets > 0) {
      await pause();
      tickets--;
      log.push(`${who} got a ticket (tickets now ${tickets})`);
    } else {
      log.push(`${who}: sold out`);
    }
  } finally {
    lock.signal();            // critical section ends, even if something threw
  }
}

// --- 2. Dining philosophers -------------------------------------------------------
async function dine(n: number, ordered: boolean): Promise<string> {
  const chopsticks = Array.from({ length: n }, () => new Semaphore(1));
  let meals = 0;
  const philosopher = async (i: number) => {
    let first = i, second = (i + 1) % n;
    if (ordered && second < first) [first, second] = [second, first]; // always lower number first
    await chopsticks[first].wait();
    await pause();                       // everyone grabs their first chopstick "at once"
    await chopsticks[second].wait();
    meals++;
    chopsticks[second].signal();
    chopsticks[first].signal();
  };
  const all = Promise.all(Array.from({ length: n }, (_, i) => philosopher(i)));
  const timeout = new Promise<string>((r) => setTimeout(() => r("DEADLOCK: nobody can eat"), 200));
  return Promise.race([all.then(() => `all ${meals} philosophers ate`), timeout]);
}

async function main() {
  const log1: string[] = [];
  tickets = 1;
  await Promise.all([buyTicket("Ana", log1), buyTicket("Ben", log1)]);
  console.log("unsafe:", log1.join("; "));

  const log2: string[] = [];
  tickets = 1;
  const lock = new Semaphore(1);
  await Promise.all([buyTicketSafely("Ana", lock, log2), buyTicketSafely("Ben", lock, log2)]);
  console.log("safe:  ", log2.join("; "));

  console.log("naive philosophers:  ", await dine(5, false));
  console.log("ordered philosophers:", await dine(5, true));
}

main();
