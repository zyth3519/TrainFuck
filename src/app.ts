import fs from "fs";
import readline from "readline";
function printUsage() {
  console.log("Usage: node dist/app.js program.bf");
}
function readFile(filename: string): string {
  const res = fs.readFileSync(filename, "utf8");
  return res;
}

function findJumps(code: string | string[]) {
  const map = new Map<number, number>();
  const stack: number[] = [];

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    switch (char) {
      case "[":
        stack.push(i);
        break;
      case "]":
        const start = stack.pop();
        if (start === undefined) {
          throw new Error("Unmatched ]");
        }
        map.set(start, i);
        map.set(i, start);
        break;
      default:
        break;
    }
  }
  return map;
}

function input() {
  return new Promise<number>((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.once("keypress", (char, evt) => {
      if (evt.ctrl || evt.meta || evt.shift) {
        if (evt.name === "c" && evt.ctrl) {
          process.exit(0);
        }
        return;
      }
      resolve(char.charCodeAt(0));
    });
  });
}

async function parse(
  code: string,
  codeIndex: number,
  memory: Uint8Array,
  memoryIndex: number,
  jumps: Map<number, number>,
) {
  while (codeIndex < code.length) {
    const char = code[codeIndex];
    switch (char) {
      case "+":
        memory[memoryIndex]++;
        break;
      case "-":
        memory[memoryIndex]--;
        break;
      case ">":
        memoryIndex++;
        break;
      case "<":
        memoryIndex--;
        break;
      case ".":
        process.stdout.write(String.fromCharCode(memory[memoryIndex]));
        break;
      case ",":
        const data = await input();
        memory[memoryIndex] = data;
        break;
      case "[":
        if (memory[memoryIndex] === 0) {
          codeIndex = jumps.get(codeIndex) as number;
          continue;
        }
        break;
      case "]":
        if (memory[memoryIndex] !== 0) {
          codeIndex = jumps.get(codeIndex) as number;
          continue;
        }
        break;
      default:
        break;
    }
    codeIndex++;
  }
}

async function main() {
  const args = process.argv;
  if (args.length < 3) {
    printUsage();
    process.exit(1);
  }
  const filename = args[2];
  const code = readFile(filename);
  const codeIndex = 0;
  const memory = new Uint8Array(1000);
  const memoryIndex = 0;
  const jumps = findJumps(code);
  await parse(code, codeIndex, memory, memoryIndex, jumps);
  process.exit(0);
}

main();
