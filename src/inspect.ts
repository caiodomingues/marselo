import { Chunk, Instruction, OpCode } from "./opcode";

function formatInstruction(index: number, instruction: Instruction): string {
  const idx = String(index).padStart(4, '0');
  const opCodeName = OpCode[instruction.op].padEnd(16);
  const operand = formatOperand(instruction);
  return `${idx} ${opCodeName} ${operand}`;
}

function formatOperand(instruction: Instruction): string {
  const operand = instruction.operand;
  if (operand === undefined) return '';
  if (operand === null) return "null";

  if (typeof operand === "object" && operand.parameters) {
    return `<fn> (${operand.parameters.join(', ')})`;
  }

  if (typeof operand === "object" && operand.name !== undefined && operand.arity !== undefined) {
    return `${operand.name} (${operand.arity} args)`;
  }

  return String(operand);
}

export function inspect(
  instructions: Instruction[],
  chunks: Map<string, Chunk>
): string {
  const lines: string[] = [];

  lines.push('=== main ===');
  instructions.forEach((instruction, index) => lines.push(formatInstruction(index, instruction)));

  for (const [name, chunk] of chunks) {
    lines.push(`\n=== ${name} ===`);
    chunk.instructions.forEach((instruction, index) => lines.push(formatInstruction(index, instruction)));
  }

  return lines.join('\n');
}
