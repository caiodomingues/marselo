export enum OpCode {
  PUSH,
  POP,

  LOAD,
  STORE,

  ADD,
  SUB,
  MUL,
  DIV,
  MOD,

  EQ,
  NEQ,
  LT,
  GT,
  LTE,
  GTE,

  AND,
  OR,
  NOT,
  NULLISH,

  JUMP,
  JUMP_IF_FALSE,

  CALL,
  RETURN
}

export interface Instruction {
  op: OpCode;
  operand?: any;
}

// When writing the `FunctionDeclaration` case in the compiler, I realized that we need to compile each chunk of code in a separate pass,
// and the main Program just stores a reference to the chunk. Why? Because otherwise, when the compiler encounters a fn declaration,
// the VM would execute the fn body every time it reaches the fn declaration, which is not what we want. So we create a Chunk interface that represents a chunk
// of code, and the main Program just stores a reference to the chunk. The compiler compiles each chunk separately, and the VM executes each chunk separately.
export interface Chunk {
  name: string;
  parameters: string[];
  instructions: Instruction[];
}
