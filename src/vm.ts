import { Chunk, Instruction, OpCode } from "./opcode";
import Scope from "./scope";

class VM {
  private stack: any[] = [];
  private scope: Scope = new Scope();
  private returnValue: any = undefined;
  private natives: Map<string, (...args: any[]) => any> = new Map();

  constructor(
    private instructions: Instruction[],
    private chunks: Map<string, Chunk>,
    scope?: Scope
  ) {
    if (scope) this.scope = scope;
  }

  private push(value: any): void {
    this.stack.push(value);
  }

  private pop(): any {
    if (this.stack.length === 0) {
      throw new Error("Stack underflow");
    }
    return this.stack.pop();
  }

  registerNatives(natives: { [name: string]: (...args: any[]) => any }): void {
    for (const name in natives) {
      this.natives.set(name, natives[name]);
    }
  }

  run(): void {
    let ip = 0; // instruction pointer

    while (ip < this.instructions.length) {
      const instruction = this.instructions[ip];
      ip++; // move to the next instruction by default

      switch (instruction.op) {
        case OpCode.PUSH: {
          this.push(instruction.operand);
          break;
        }

        case OpCode.POP: {
          this.pop();
          break;
        }

        case OpCode.LOAD: {
          this.push(this.scope.get(instruction.operand));
          break;
        }

        case OpCode.STORE: {
          const value = this.pop();
          try {
            this.scope.assign(instruction.operand, value);
          } catch {
            this.scope.set(instruction.operand, value);
          }
          break;
        }

        case OpCode.JUMP: {
          ip = instruction.operand;
          break;
        }

        case OpCode.JUMP_IF_FALSE: {
          if (!this.pop()) ip = instruction.operand;
          break;
        }

        case OpCode.ADD: {
          const b = this.pop();
          const a = this.pop();
          this.push(a + b);
          break;
        }

        case OpCode.SUB: {
          const b = this.pop();
          const a = this.pop();
          this.push(a - b);
          break;
        }

        case OpCode.MUL: {
          const b = this.pop();
          const a = this.pop();
          this.push(a * b);
          break;
        }

        case OpCode.DIV: {
          const b = this.pop();
          const a = this.pop();
          this.push(a / b);
          break;
        }

        case OpCode.MOD: {
          const b = this.pop();
          const a = this.pop();
          this.push(a % b);
          break;
        }

        case OpCode.EQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a === b);
          break;
        }

        case OpCode.NEQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a !== b);
          break;
        }

        case OpCode.LT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a < b);
          break;
        }

        case OpCode.GT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a > b);
          break;
        }

        case OpCode.LTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a <= b);
          break;
        }

        case OpCode.GTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a >= b);
          break;
        }

        case OpCode.AND: {
          const b = this.pop();
          const a = this.pop();
          this.push(a && b);
          break;
        }

        case OpCode.OR: {
          const b = this.pop();
          const a = this.pop();
          this.push(a || b);
          break;
        }

        case OpCode.NOT: {
          const a = this.pop();
          this.push(!a);
          break;
        }

        case OpCode.NULLISH: {
          const b = this.pop();
          const a = this.pop();
          this.push(a ?? b);
          break;
        }

        case OpCode.CALL: {
          const { name, arity } = instruction.operand;

          // Native fn first
          const native = this.natives.get(name);
          if (native) {

            const args = []
            for (let i = 0; i < arity; i++) {
              args.unshift(this.pop());
            }

            const result = native(...args);
            if (result !== undefined) {
              this.push(result);
            }
            break;
          }

          const chunk = this.chunks.get(name);
          if (!chunk) {
            throw new Error(`Undefined function: ${name}`);
          }

          const args = [];
          for (let i = 0; i < arity; i++) {
            args.unshift(this.pop());
          }

          // Create a Scope for the fn call and set the params in it
          const newScope = new Scope(this.scope);
          for (let i = 0; i < arity; i++) {
            newScope.set(chunk.parameters[i], args[i]);
          }

          // Create a new VM for the fn call and run it with the chunk's instructions and the new scope
          const vm = new VM(chunk.instructions, this.chunks, newScope);
          vm.run();

          const result = vm.returnValue;
          if (result !== undefined) {
            this.push(result);
          }

          break;
        }

        case OpCode.RETURN: {
          if (this.stack.length > 0) {
            this.returnValue = this.pop();
          }
          return;
        }

        default:
          throw new Error(`Unsupported opcode: ${instruction.op}`);
      }
    }
  }
}

export default VM;
