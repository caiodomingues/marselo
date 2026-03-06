import readLineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';

import Lexer from './lexer';
import Parser from './parser';

import { Expression, Program, Statement } from "./ast";
import ReturnSignal from "./return-signal";
import Scope from "./scope";

class Interpreter {
  private globalScope: Scope = new Scope();
  private baseDir: string = process.cwd();

  constructor() {
    this.registerNatives();
  }

  setBaseDir(dir: string): void {
    this.baseDir = dir;
  }

  run(program: Program): void {
    for (const statement of program.body) {
      this.execute(statement, this.globalScope);
    }
  }

  execute(node: Statement, scope: Scope): any {
    switch (node.type) {
      // Evaluate the variable declaration, store and return the value
      case 'VariableDeclaration': {
        const value = this.evaluate(node.value, scope);
        scope.set(node.name, value);
        return value;
      }

      case 'FunctionDeclaration': {
        // Create a function that creates a new scope, binds the parameters to the args and executes the fn body
        const func = (...args: any[]) => {
          const funcScope = new Scope(scope);

          // Bind parameters to arguments in the fn scope
          node.parameters.forEach((param, index) => {
            funcScope.set(param, args[index]);
          });

          // Execute each statement in the function body, return if a ReturnStatement is found
          try {
            for (const statement of node.body) {
              this.execute(statement, funcScope);
            }
          } catch (e) {
            // Bit of a hack to handle return statements, but it works for this simple interpreter
            if (e instanceof ReturnSignal) {
              return e.value;
            }
            throw e;
          }
        }

        scope.set(node.name, func);
        break;
      }

      case 'IfStatement': {
        const condition = this.evaluate(node.condition, scope);
        if (condition) {
          for (const statement of node.then) {
            this.execute(statement, scope);
          }
        } else if (node.else) {
          for (const statement of node.else) {
            this.execute(statement, scope);
          }
        }
        break;
      }

      case 'WhileStatement': {
        let condition = this.evaluate(node.condition, scope);
        while (condition) {
          for (const statement of node.body) {
            this.execute(statement, scope);
          }
          condition = this.evaluate(node.condition, scope);
        }
        break;
      }

      case 'ForStatement': {
        this.execute(node.initializer, scope);
        let condition = this.evaluate(node.condition, scope);
        while (condition) {
          for (const statement of node.body) {
            this.execute(statement, scope);
          }
          this.execute(node.increment, scope);
          condition = this.evaluate(node.condition, scope);
        }
        break;
      }

      case 'ImportStatement': {
        // For simplicity, we will just read the file and execute it in the current scope
        const fullPath = path.resolve(this.baseDir, node.path);
        const source = fs.readFileSync(fullPath, 'utf-8');
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const program = parser.parse();
        this.run(program);
        break;
      }

      case 'ReturnStatement': {
        const value = node.value ? this.evaluate(node.value, scope) : undefined;
        throw new ReturnSignal(value);
      }

      case 'ExpressionStatement':
        return this.evaluate(node.expression, scope);
    }
  }

  evaluate(node: Expression, scope: Scope): any {
    switch (node.type) {
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        return node.value;

      case 'NullLiteral':
        return null;

      case "ArrayLiteral": {
        return node.elements.map(element => this.evaluate(element, scope));
      }

      case "ObjectLiteral": {
        // Use JS Map to store object properties, allow any type of keys and avoid issues with proto properties.
        const obj = new Map<string, any>();
        for (const prop of node.properties) {
          // evaluate each prop.value and call map.set with the prop.key and the evaluated value
          const value = this.evaluate(prop.value, scope);
          obj.set(prop.key, value);
        }
        return obj;
      }

      case "IndexExpression": {
        const object = this.evaluate(node.object, scope);
        const index = this.evaluate(node.index, scope);

        if (Array.isArray(object)) {
          // Accept only number indexes for arrays, to prevent confusion with object property access
          if (typeof index !== 'number') {
            throw new Error(`Array index must be a number, got ${typeof index}`);
          }
          return object[index];
        } else if (object instanceof Map) {
          return object.get(index);
        } else {
          throw new Error(`Cannot index into type ${typeof object}`);
        }
      }

      case "IndexAssignment": {
        const object = this.evaluate(node.object, scope);
        const index = this.evaluate(node.index, scope);
        const value = this.evaluate(node.value, scope);

        if (Array.isArray(object)) {
          // Accept only number indexes for arrays, to prevent confusion with object property access
          if (typeof index !== 'number') {
            throw new Error(`Array index must be a number, got ${typeof index}`);
          }
          object[index] = value;
          return value;
        } else if (object instanceof Map) {
          object.set(index, value);
          return value;
        } else {
          throw new Error(`Cannot index into type ${typeof object}`);
        }
      }

      case 'Identifier': {
        return scope.get(node.name);
      }

      case 'FunctionExpression': {
        return (...args: any[]) => {
          const funcScope = new Scope(scope);
          node.parameters.forEach((param, index) => {
            funcScope.set(param, args[index]);
          });
          try {
            for (const statement of node.body) {
              this.execute(statement, funcScope);
            }
          } catch (e) {
            if (e instanceof ReturnSignal) {
              return e.value;
            }
            throw e;
          }
        }
      }

      case 'BinaryExpression': {
        const left = this.evaluate(node.left, scope);
        const right = this.evaluate(node.right, scope);
        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '%':
            return left % right;
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '<':
            return left < right;
          case '>':
            return left > right;
          case '<=':
            return left <= right;
          case '>=':
            return left >= right;
          case '&&':
            return Boolean(left) && Boolean(right);
          case '||':
            return Boolean(left) || Boolean(right);
          case '??':
            return left ?? right;
          default:
            throw new Error(`Unknown operator "${node.operator}"`);
        }
      }

      case 'UnaryExpression': {
        const argument = this.evaluate(node.argument, scope);
        switch (node.operator) {
          case '-':
            return -argument;
          case '!':
            return !argument;
          default:
            throw new Error(`Unknown operator "${node.operator}"`);
        }
      }

      case 'AssignmentExpression': {
        const value = this.evaluate(node.value, scope);
        scope.assign(node.name, value);
        return value;
      }

      case 'CallExpression': {
        const func = scope.get(node.name);
        if (typeof func !== 'function') {
          throw new Error(`"${node.name}" is not a function`);
        }
        const args = node.arguments.map(arg => this.evaluate(arg, scope));
        return func(...args);
      }
    }
  }

  // Register native functions in the global scope
  private registerNatives(): void {
    // A simple print function to output messages from the interpreted code
    this.globalScope.set('print', (...args: any[]) => {
      console.log(...args);
    });

    // Return length of an array, throw an error if the argument is not an array
    this.globalScope.set('len', (array: any[]) => {
      if (!Array.isArray(array)) {
        throw new Error(`len() expects an array, got ${typeof array}`);
      }
      return array.length;
    });

    // Push a value to an array, return the new length. Throw an error if the first argument is not an array
    this.globalScope.set('push', (array: any[], value: any) => {
      if (!Array.isArray(array)) {
        throw new Error(`push() expects an array as the first argument, got ${typeof array}`);
      }

      array.push(value);
      return array.length;
    });

    // Pop a value from an array, return the removed element. Throw an error if the argument is not an array
    this.globalScope.set('pop', (array: any[]) => {
      if (!Array.isArray(array)) {
        throw new Error(`pop() expects an array, got ${typeof array}`);
      }

      return array.pop();
    });

    // A simple range function to generate an array of numbers from start to end (exclusive)
    this.globalScope.set('range', (start: number, end: number) => {
      if (typeof start !== 'number' || typeof end !== 'number') {
        throw new Error(`range() expects two numbers, got ${typeof start} and ${typeof end}`);
      }
      const result = [];
      for (let i = start; i < end; i++) {
        result.push(i);
      }
      return result;
    });

    // A simple map function to apply a function to each element of an array and return a new array with the results
    this.globalScope.set('map', (array: any[], func: (x: any) => any) => {
      if (!Array.isArray(array)) {
        throw new Error(`map() expects an array as the first argument, got ${typeof array}`);
      }
      if (typeof func !== 'function') {
        throw new Error(`map() expects a function as the second argument, got ${typeof func}`);
      }
      return array.map(func);
    });

    this.globalScope.set('split', (str: string, separator: string) => {
      return str.split(separator);
    });

    this.globalScope.set('join', (array: any[], separator: string) => {
      return array.join(separator);
    });

    this.globalScope.set('upper', (str: string) => {
      return str.toUpperCase();
    });

    this.globalScope.set('lower', (str: string) => {
      return str.toLowerCase();
    });

    this.globalScope.set('trim', (str: string) => {
      return str.trim();
    });

    this.globalScope.set('substring', (str: string, start: number, end?: number) => {
      return str.substring(start, end);
    });

    this.globalScope.set('input', (prompt: string) => {
      return readLineSync.question(prompt ?? '');
    });

    this.globalScope.set('num', (value: any) => {
      const res = Number(value);
      if (isNaN(res)) {
        throw new Error(`num() could not convert "${value}" to a number`);
      }
      return res;
    });
  }
}

export default Interpreter;
