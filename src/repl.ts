import * as readline from "readline";
import Marselo from "./marselo";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (prompt: string): Promise<string> => new Promise(resolve => rl.question(prompt, resolve));

async function repl() {
  const mrs = new Marselo({ mode: 'vm' });

  while (true) {
    const line = await ask("mrs> ");
    if (line === "exit" || line === "quit") break;
    if (line.trim() === "") continue;

    if (line === "clear" || line === "cls" || line === "clear()") {
      console.clear();
      continue;
    }

    try {
      const result = mrs.eval(line);

      if (result !== undefined) {
        console.log(result);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  rl.close()
}

repl();
