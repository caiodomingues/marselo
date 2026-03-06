import { Expression, Program, Statement } from "./ast";
import { Chunk, Instruction, OpCode } from "./opcode";

class Compiler {
  private instructions: Instruction[] = [];
  private chunks: Map<string, Chunk> = new Map();

  private emit(op: OpCode, operand?: any): number {
    this.instructions.push({ op, operand });
    return this.instructions.length - 1;
  }

  // May compile a Program OR a Chunk, since a Chunk is just a function body, which is also a Program
  compile(program: Program): { instructions: Instruction[], chunks: Map<string, Chunk> } {
    for (const statement of program.body) {
      this.compileStatement(statement);
    }
    return {
      instructions: this.instructions,
      chunks: this.chunks
    };
  }

  private compileExpression(node: Expression): void {
    switch (node.type) {
      case 'NullLiteral': {
        this.emit(OpCode.PUSH, null);
        break;
      }

      case 'ArrayLiteral': {
        // TODO: implement array literals
        break;
      }

      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        this.emit(OpCode.PUSH, node.value);
        break;

      case 'Identifier': {
        this.emit(OpCode.LOAD, node.name);
        break;
      }

      case 'BinaryExpression': {
        this.compileExpression(node.left);
        this.compileExpression(node.right);
        this.emit(this.getBinaryOpCode(node.operator));
        break;
      }

      case 'CallExpression': {
        for (const arg of node.arguments) {
          this.compileExpression(arg);
        }
        // arity = number of args, params or operands passed to the function, operation or relation (aridade in pt-br, new word to me tbh)
        this.emit(OpCode.CALL, { name: node.name, arity: node.arguments.length });
        break;
      }

      case "AssignmentExpression": {
        this.compileExpression(node.value);
        this.emit(OpCode.STORE, node.name);
        break;
      }

      case "FunctionExpression": {
        // TODO: implement function expressions
        break;
      }

      case "IndexAssignment": {
        // TODO: implement array first
        break;
      }

      case "IndexExpression": {
        // TODO: implement array first
        break;
      }

      case "UnaryExpression": {
        this.compileExpression(node.argument);
        switch (node.operator) {
          case '-': {
            this.emit(OpCode.PUSH, -1)
            this.emit(OpCode.MUL);
            break;
          }

          case '!': {
            this.emit(OpCode.NOT);
            break;
          }

          default:
            throw new Error(`Unsupported unary operator: ${node.operator}`);
        }
        break;
      }

      case "ObjectLiteral": {
        // TODO: implement object literals
        break;
      }

      default:
        throw new Error(`Unsupported expression type: ${node}`);
    }
  }

  private compileStatement(node: Statement): void {
    switch (node.type) {
      case "VariableDeclaration": {
        this.compileExpression(node.value);
        this.emit(OpCode.STORE, node.name);
        break;
      }

      case "ExpressionStatement": {
        this.compileExpression(node.expression);
        break;
      }

      // We do not know where to jump when using JUMP_IF_FALSE, because the if body wasn't compiled yet, so we will backpatch the jump address after compiling the if body;
      case "IfStatement": {
        this.compileExpression(node.condition);

        // Emit a JUMP_IF_FALSE with a placeholder address, we will backpatch it later
        const jumpIfFalse = this.emit(OpCode.JUMP_IF_FALSE, -1);

        for (const statement of node.then) {
          this.compileStatement(statement);
        }

        if (node.else) {
          // Emit a JUMP to skip the else block after executing the then block
          const jumpOver = this.emit(OpCode.JUMP, -1);

          // Now we backpath by setting the jumpIfFalse operand to the current instruction address, which is the start of the else block
          this.instructions[jumpIfFalse].operand = this.instructions.length;

          for (const statement of node.else) {
            this.compileStatement(statement);
          }

          // Finally, we backpatch the jumpOver to the current instruction address, which is the end of the else block
          this.instructions[jumpOver].operand = this.instructions.length;
        } else {
          // If there is no else block, we just backpatch the jumpIfFalse to the current instruction address, which is the end of the then block
          this.instructions[jumpIfFalse].operand = this.instructions.length;
        }

        break;
      }

      // It has some similarities with the if statement, but we will need to emit a JUMP at the end of the loop body to jump back to the condition check,
      // and we will need to backpatch the JUMP_IF_FALSE to jump to the end of the loop body;
      case "WhileStatement": {
        const loopStart = this.instructions.length; // Store the start of the loop to jump back to it later

        this.compileExpression(node.condition);
        const jumpIfFalse = this.emit(OpCode.JUMP_IF_FALSE, -1);

        for (const statement of node.body) {
          this.compileStatement(statement);
        }

        this.emit(OpCode.JUMP, loopStart); // Jump back to the start of the loop

        // And now we backpatch the JUMP_IF_FALSE to jump to the end of the loop body
        this.instructions[jumpIfFalse].operand = this.instructions.length;

        break;
      }

      // A bit more complex, we need to initialize the loop variable, then we need to emit a JUMP at the end of the loop body to jump back to the condition check,
      // and we will need to backpatch the JUMP_IF_FALSE to jump to the end of the loop body. That's me thinking on how the structure should look like:
      // [initializer] <- executes once before the loop starts
      // [condition] <- start of the loop
      // JUMP_IF_FALSE end
      // [body]
      // [increment] <- executes after every iteration
      // JUMP condition
      // [end]
      case "ForStatement": {
        this.compileStatement(node.initializer);

        const loopStart = this.instructions.length; // Store the start of the loop to jump back to it later

        this.compileExpression(node.condition);
        const jumpIfFalse = this.emit(OpCode.JUMP_IF_FALSE, -1);

        for (const statement of node.body) {
          this.compileStatement(statement);
        }

        this.compileStatement(node.increment);
        this.emit(OpCode.JUMP, loopStart); // Jump back to the start of the loop

        // And now we backpatch the JUMP_IF_FALSE to jump to the end of the loop body
        this.instructions[jumpIfFalse].operand = this.instructions.length;

        break;
      }

      case "FunctionDeclaration": {
        const funcCompiler = new Compiler()
        for (const statement of node.body) {
          funcCompiler.compileStatement(statement);
        }

        this.chunks.set(node.name, {
          name: node.name,
          parameters: node.parameters,
          instructions: funcCompiler.getInstructions(),
        });
        break;
      }

      case "ImportStatement": {
        // TODO: implement imports
        break;
      }

      case "ReturnStatement": {
        if (node.value) {
          this.compileExpression(node.value);
        }
        this.emit(OpCode.RETURN);
        break;
      }

      default:
        throw new Error(`Unsupported statement type: ${node}`);
    }
  }

  getInstructions(): Instruction[] {
    return this.instructions;
  }

  getChunks(): Map<string, Chunk> {
    return this.chunks;
  }

  private getBinaryOpCode(operator: string): OpCode {
    switch (operator) {
      case '+': return OpCode.ADD;
      case '-': return OpCode.SUB;
      case '*': return OpCode.MUL;
      case '/': return OpCode.DIV;
      case '%': return OpCode.MOD;
      case '==': return OpCode.EQ;
      case '!=': return OpCode.NEQ;
      case '<': return OpCode.LT;
      case '>': return OpCode.GT;
      case '<=': return OpCode.LTE;
      case '>=': return OpCode.GTE;
      case '&&': return OpCode.AND;
      case '||': return OpCode.OR;
      case '??': return OpCode.NULLISH;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
}

export default Compiler;
