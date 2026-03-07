import { Chunk, Instruction, OpCode } from "./opcode";
import Scope from "./scope";

interface CallFrame {
  name?: string;
  instructions: Instruction[];
  ip: number;
  scope: Scope;
  upvalues?: Record<string, { get: () => any; set: (value: any) => void }>;
}

export interface TraceStep {
  section: string;
  ip: number;
  instruction: Instruction;
  stackBefore: any[];
  stackAfter: any[];
}

class VM {
  private stack: any[] = [];
  private callStack: CallFrame[] = [];
  private natives: Map<string, (...args: any[]) => any> = new Map();
  private tracing: boolean = false;
  private trace: TraceStep[] = [];

  constructor(
    private instructions: Instruction[],
    private chunks: Map<string, Chunk>,
    private initialScope?: Scope
  ) { }

  private push(value: any): void {
    this.stack.push(value);
  }

  private pop(): any {
    if (this.stack.length === 0) {
      throw new Error("Stack underflow");
    }
    return this.stack.pop();
  }

  enableTracing(): void {
    this.tracing = true;
  }

  getTrace(): TraceStep[] {
    return this.trace;
  }

  registerNatives(natives: { [name: string]: (...args: any[]) => any }): void {
    for (const name in natives) {
      this.natives.set(name, natives[name]);
    }
  }

  getResult(): any {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }

  run(): void {
    this.callStack.push({
      instructions: this.instructions,
      ip: 0,
      scope: this.initialScope ?? new Scope(),
    })

    while (this.callStack.length > 0) {
      const frame = this.callStack[this.callStack.length - 1];

      if (frame.ip >= frame.instructions.length) {
        this.callStack.pop();
        continue;
      }

      const instruction = frame.instructions[frame.ip];
      frame.ip++;

      const stackBefore = [...this.stack];

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
          const name = instruction.operand;
          if (frame.upvalues?.[name]) {
            this.push(frame.upvalues[name].get());
          } else {
            this.push(frame.scope.get(name));
          }
          break;
        }

        case OpCode.STORE: {
          const name = instruction.operand;
          const value = this.pop();
          if (frame.upvalues?.[name]) {
            frame.upvalues[name].set(value);
          } else {
            try {
              frame.scope.assign(name, value);
            } catch {
              frame.scope.set(name, value);
            }
          }
          break;
        }

        case OpCode.JUMP: {
          frame.ip = instruction.operand;
          break;
        }

        case OpCode.JUMP_IF_FALSE: {
          if (!this.pop()) frame.ip = instruction.operand;
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
            // This ensures that if chunks were serialized as plain objects, we convert them back to Maps -> .mbc files
            const chunks = instruction.operand.chunks instanceof Map
              ? instruction.operand.chunks
              : new Map(Object.entries(instruction.operand.chunks));

            for (const [name, chunk] of chunks) {
              this.chunks.set(name, chunk);
            }
          }

          // Capture upvalues (only free vars)
          const upvalues: Record<string, { get: () => any; set: (value: any) => void }> = {};
          for (const name of (instruction.operand.freeVars ?? [])) {
            const capturedScope = frame.scope;
            upvalues[name] = {
              get: () => capturedScope.get(name),
              set: (value) => capturedScope.assign(name, value)
            }
          }

          this.push({
            ...instruction.operand,
            upvalues,
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
                  const fnScope = new Scope(frame.scope);
                  arg.parameters.forEach((param: string, i: number) => {
                    fnScope.set(param, innerArgs[i]);
                  });

                  const vm = new VM(arg.instructions, arg.chunks ?? this.chunks, fnScope);
                  vm.registerNatives(Object.fromEntries(this.natives));
                  vm.run();

                  return vm.getResult();
                };
              }
              return arg;
            });

            const result = native(...wrappedArgs);
            if (result !== undefined) this.push(result);

            break;
          }

          // 2. FunctionExpression (anonymous function) - stored in the current scope
          const variable = frame.scope.tryGet(name);
          if (variable?.instructions) {
            const fnScope = new Scope(variable.capturedScope ?? frame.scope);

            variable.parameters.forEach((p: string, i: number) => fnScope.set(p, args[i]));

            this.callStack.push({
              name: name,
              instructions: variable.instructions,
              ip: 0,
              scope: fnScope,
              upvalues: variable.upvalues // Upvalues captured from PUSH_FN
            });

            break;
          }

          // 3. Declared function - stored in chunks
          const chunk = this.chunks.get(name);
          if (!chunk) throw new Error(`Undefined function: ${name}`);

          const fnScope = new Scope(frame.scope);
          chunk.parameters.forEach((p, i) => fnScope.set(p, args[i]));

          this.callStack.push({
            name: name,
            instructions: chunk.instructions,
            ip: 0,
            scope: fnScope,
          });

          break;
        }

        case OpCode.RETURN: {
          const returnValue = this.stack.length > 0 ? this.pop() : undefined;
          this.callStack.pop();
          if (returnValue !== undefined) this.push(returnValue);
          break;
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

      if (this.tracing) {
        this.trace.push({
          section: frame.name ?? 'main',
          ip: frame.ip - 1,
          instruction,
          stackBefore,
          stackAfter: [...this.stack],
        })
      }
    }
  }
}

export default VM;
