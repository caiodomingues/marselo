import Compiler from "./compiler";
import Interpreter from "./interpreter";
import Lexer from "./lexer";
import { NATIVES } from "./natives";
import { Chunk } from "./opcode";
import Parser from "./parser";
import Scope from "./scope";
import VM from "./vm";

interface MarceloOptions {
  mode?: 'vm' | 'interpret';
}

class Marselo {
  // persistent state between calls
  private mode: 'vm' | 'interpret';
  private scope: Scope;
  private chunks: Map<string, Chunk>;
  private extraNatives: Record<string, (...args: any[]) => any> = {};
  private interpreter: Interpreter;

  constructor(options: MarceloOptions = {}) {
    this.mode = options.mode || 'vm';
    this.scope = new Scope();
    this.chunks = new Map();
    this.interpreter = new Interpreter();
  }

  register(name: string, fn: (...args: any[]) => any): void {
    this.extraNatives[name] = fn;
    this.interpreter.registerNative(name, fn);
  }

  // Executes the code, so:
  // Lexer -> Parser -> Compiler/Interpreter -> Execution
  run(source: string): void {
    this.execute(source);
  }

  // Evaluates the code and returns the result of the last expression, so:
  // Lexer -> Parser -> Compiler/Interpreter -> Execution -> Result (print or return)
  eval(source: string): any {
    const vm = this.execute(source);
    return vm?.getResult();
  }

  private execute(source: string): VM | null {
    const tokens = new Lexer(source).tokenize();
    const ast = new Parser(tokens).parse();

    if (this.mode === "vm") {
      const { instructions, chunks } = new Compiler().compile(ast);

      for (const [name, chunk] of chunks) {
        this.chunks.set(name, chunk);
      }

      const vm = new VM(instructions, this.chunks, this.scope);
      vm.registerNatives({ ...NATIVES, ...this.extraNatives });
      vm.run();

      return vm;
    } else {
      this.interpreter.run(ast);
      return null;
    }
  }
}

export default Marselo;
