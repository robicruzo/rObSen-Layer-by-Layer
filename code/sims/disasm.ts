// disasm.ts — a disassembler for Alan's 6502a subset.
//
//   tsc --target es2022 disasm.ts && node disasm.js "A9 05 8D 50 00 ..."

// Tell the compiler that Node's `process` exists, without installing @types/node.
declare const process: { argv: string[] };

interface OpInfo {
  mnemonic: string;
  mode: "implied" | "immediate" | "absolute" | "relative";
}

const OPCODES: Record<number, OpInfo> = {
  0xa9: { mnemonic: "LDA", mode: "immediate" },
  0xad: { mnemonic: "LDA", mode: "absolute" },
  0x8d: { mnemonic: "STA", mode: "absolute" },
  0x6d: { mnemonic: "ADC", mode: "absolute" },
  0xa2: { mnemonic: "LDX", mode: "immediate" },
  0xae: { mnemonic: "LDX", mode: "absolute" },
  0xa0: { mnemonic: "LDY", mode: "immediate" },
  0xac: { mnemonic: "LDY", mode: "absolute" },
  0xea: { mnemonic: "NOP", mode: "implied" },
  0x00: { mnemonic: "BRK", mode: "implied" },
  0xec: { mnemonic: "CPX", mode: "absolute" },
  0xd0: { mnemonic: "BNE", mode: "relative" },
  0xee: { mnemonic: "INC", mode: "absolute" },
  0xff: { mnemonic: "SYS", mode: "implied" },
};

const hex = (n: number, width = 2) => n.toString(16).toUpperCase().padStart(width, "0");

function disassemble(bytes: number[], stopAtFirstBrk = true): string[] {
  const lines: string[] = [];
  let pc = 0;
  while (pc < bytes.length) {
    const op = bytes[pc];
    const info = OPCODES[op];
    if (!info) {
      lines.push(`${hex(pc)}: ${hex(op)}         .byte $${hex(op)}`);
      pc += 1;
      continue;
    }
    let raw = hex(op);
    let operand = "";
    if (info.mode === "immediate") {
      raw += " " + hex(bytes[pc + 1]);
      operand = `#$${hex(bytes[pc + 1])}`;
      pc += 2;
    } else if (info.mode === "absolute") {
      const lo = bytes[pc + 1], hi = bytes[pc + 2];
      raw += ` ${hex(lo)} ${hex(hi)}`;
      operand = `$${hex((hi << 8) | lo, 4)}`; // little-endian: low byte first
      pc += 3;
    } else if (info.mode === "relative") {
      const offset = bytes[pc + 1];
      const signed = offset < 0x80 ? offset : offset - 0x100; // two's complement
      pc += 2;
      raw += " " + hex(offset);
      operand = `$${hex((pc + signed) & 0xff)}   ; ${signed >= 0 ? "+" : ""}${signed}`;
    } else {
      pc += 1;
    }
    const start = pc - raw.split(" ").length;
    lines.push(`${hex(start)}: ${raw.padEnd(10)} ${info.mnemonic} ${operand}`.trimEnd());
    if (stopAtFirstBrk && op === 0x00) break;
  }
  return lines;
}

const input = process.argv[2] ??
  "A9 05 8D 50 00 A9 00 8D 51 00 A2 05 A9 00 8D 60 00 AD 60 00 6D 50 00 8D 60 00 EE 51 00 EC 51 00 D0 EF A9 00 8D 51 00 A9 00 8D 61 00 AD 61 00 6D 60 00 8D 61 00 EE 51 00 EC 51 00 D0 EF AD 61 00 A2 01 FF 00";
const bytes = input.trim().split(/\s+/).map((t) => parseInt(t, 16));
console.log(disassemble(bytes).join("\n"));
