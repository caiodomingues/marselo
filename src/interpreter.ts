import { Expression, Program, Statement } from "./ast";
import ReturnSignal from "./return-signal";
import Scope from "./scope";

class Interpreter {
  private globalScope: Scope = new Scope();

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

      case "IndexExpression": {
        const object = this.evaluate(node.object, scope);
        const index = this.evaluate(node.index, scope);

        if (Array.isArray(object)) {
          // Accept only number indexes for arrays, to prevent confusion with object property access
          if (typeof index !== 'number') {
            throw new Error(`Array index must be a number, got ${typeof index}`);
          }
          return object[index];
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

      case 'AssignmentExpression': {
        const value = this.evaluate(node.value, scope);
        scope.assign(node.name, value);
        return value;
      }

      case 'CallExpression': {
        if (node.name === 'print') {
          const args = node.arguments.map(arg => this.evaluate(arg, scope));
          console.log(...args);
          return;
        }

        const func = scope.get(node.name);
        if (typeof func !== 'function') {
          throw new Error(`"${node.name}" is not a function`);
        }
        const args = node.arguments.map(arg => this.evaluate(arg, scope));
        return func(...args);
      }
    }
  }
}

export default Interpreter;
