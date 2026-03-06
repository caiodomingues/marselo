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

        case OpCode.PUSH_FN: {
          if (instruction.operand.chunks) {
            for (const [name, chunk] of instruction.operand.chunks) {
              this.chunks.set(name, chunk);
            }
          }
          this.push({
            ...instruction.operand,
            capturedScope: this.scope
          });
          break;
        }

        case OpCode.CALL: {
          const { name, arity } = instruction.operand;

          const args: any[] = [];
          for (let i = 0; i < arity; i++) {
            args.unshift(this.pop());
          }

          // 1. Native fn first
          const native = this.natives.get(name);
          if (native) {
            // Convert PUSH_FN into callable JS functions
            const wrappedArgs = args.map(arg => {
              if (arg && typeof arg === 'object' && arg.instructions) {
                return (...innerArgs: any[]) => {
                  const fnScope = new Scope(this.scope);
                  arg.parameters.forEach((param: string, i: number) => {
                    fnScope.set(param, innerArgs[i]);
                  });
                  const vm = new VM(arg.instructions, arg.chunks ?? this.chunks, fnScope);
                  vm.registerNatives(Object.fromEntries(this.natives));
                  vm.run();
                  return vm.returnValue;
                };
              }
              return arg;
            });

            const result = native(...wrappedArgs);
            if (result !== undefined) this.push(result);
            break;
          }

          // 2. FunctionExpression (anonymous function) - stored in the current scope
          const variable = this.scope.tryGet(name);
          if (variable && typeof variable === 'object' && variable.instructions) {
            const fnScope = new Scope(variable.capturedScope ?? this.scope); // use captured scope for closures, or current scope if not available
            variable.parameters.forEach((param: string, i: number) => {
              fnScope.set(param, args[i]);
            });
            const vm = new VM(variable.instructions, variable.chunks ?? this.chunks, fnScope);
            vm.registerNatives(Object.fromEntries(this.natives));
            vm.run();
            if (vm.returnValue !== undefined) this.push(vm.returnValue);
            break;
          }

          // 3. Declared function - stored in chunks
          const chunk = this.chunks.get(name);
          if (!chunk) throw new Error(`Undefined function: ${name}`);

          const fnScope = new Scope(this.scope);
          chunk.parameters.forEach((param, i) => fnScope.set(param, args[i]));
          const vm = new VM(chunk.instructions, this.chunks, fnScope);
          vm.registerNatives(Object.fromEntries(this.natives));
          vm.run();
          if (vm.returnValue !== undefined) this.push(vm.returnValue);

          break;
        }

        case OpCode.RETURN: {
          if (this.stack.length > 0) {
            this.returnValue = this.pop();
          }
          return;
        }

        case OpCode.BUILD_ARRAY: {
          const elements = [];

          for (let i = 0; i < instruction.operand; i++) {
            elements.unshift(this.pop());
          }

          this.push(elements);
          break;
        }

        case OpCode.GET_INDEX: {
          const index = this.pop();
          const object = this.pop();

          if (Array.isArray(object)) this.push(object[index]);
          else if (object instanceof Map) this.push(object.get(index));
          else throw new Error(`Cannot index into type ${typeof object}`);

          break;
        }

        case OpCode.SET_INDEX: {
          const value = this.pop();
          const index = this.pop();
          const object = this.pop();

          if (Array.isArray(object)) object[index] = value;
          else if (object instanceof Map) object.set(index, value);
          else throw new Error(`Cannot index into type ${typeof object}`);

          this.push(value);
          break;
        }

        case OpCode.BUILD_MAP: {
          const map = new Map();
          for (let i = 0; i < instruction.operand; i++) {
            const key = this.pop();
            const value = this.pop();
            map.set(key, value);
          }
          this.push(map);
          break;
        }

        default:
          throw new Error(`Unsupported opcode: ${instruction.op}`);
      }
    }
  }
}

export default VM;
