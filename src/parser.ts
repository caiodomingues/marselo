import { Expression, Program, Statement } from "./ast";
import { Token, TokenType } from "./token";

class Parser {
  private tokens: Token[];
  private pos: number;

  private PRECEDENCE: Partial<Record<TokenType, number>> = {
    [TokenType.NULLISH_COALESCING]: 1,
    [TokenType.OR]: 2,
    [TokenType.AND]: 3,
    [TokenType.EQUALS]: 4,
    [TokenType.NOT_EQUALS]: 4,
    [TokenType.LESS_THAN]: 5,
    [TokenType.GREATER_THAN]: 5,
    [TokenType.GREATER_EQUAL]: 5,
    [TokenType.LESS_EQUAL]: 5,
    [TokenType.PLUS]: 6,
    [TokenType.MINUS]: 6,
    [TokenType.ASTERISK]: 7,
    [TokenType.SLASH]: 7
  };

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  // Look the token without consuming it
  peek(): Token {
    return this.tokens[this.pos];
  }

  // Consume and move
  consume(): Token {
    return this.tokens[this.pos++];
  }

  // Consume if matches the expected type, otherwise throws
  expect(type: TokenType): Token {
    const token = this.peek();

    if (token.type !== type) {
      throw new Error(`Expected token type ${type} but got ${token.type} at line ${token.line}`);
    }

    return this.consume();
  }

  // Entry point for parsing, return the root of the AST (program)
  parse(): Program {
    const body: Statement[] = [];
    while (this.peek().type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  parseStatement(): Statement {
    const token = this.peek();

    switch (token.type) {
      case TokenType.VAR:
        return this.parseVariableDeclaration();
      case TokenType.FN:
        return this.parseFunctionDeclaration();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  // Structure: VAR   IDENTIFIER   ASSIGN   [expression]   SEMICOLON
  parseVariableDeclaration(): Statement {
    this.expect(TokenType.VAR);
    const nameToken = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return {
      type: 'VariableDeclaration',
      name: nameToken.value,
      value
    };
  }

  // Structure: FN   IDENTIFIER   LEFT_PAREN   [parameters - optional]   RIGHT_PAREN   LEFT_BRACE   body   RIGHT_BRACE
  parseFunctionDeclaration(): Statement {
    this.expect(TokenType.FN);
    const nameToken = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.LEFT_PAREN);
    const parameters: string[] = [];

    if (this.peek().type !== TokenType.RIGHT_PAREN) {
      do {
        const paramToken = this.expect(TokenType.IDENTIFIER);
        parameters.push(paramToken.value);
      } while (this.peek().type === TokenType.COMMA && this.consume());
    }

    this.expect(TokenType.RIGHT_PAREN);
    const body = this.parseBlock();
    return {
      type: 'FunctionDeclaration',
      name: nameToken.value,
      parameters,
      body
    }
  }

  // Structure: IDENTIFIER   LEFT_PAREN   [arguments - optional]   RIGHT_PAREN
  parseCallExpression(functionName: string): Expression {
    this.expect(TokenType.LEFT_PAREN);
    const args: Expression[] = [];

    // Parse arguments if the next token isn't a R parenthesis. This allows for both `fn()` and `fn(arg1, arg2)`
    if (this.peek().type !== TokenType.RIGHT_PAREN) {
      do {
        args.push(this.parseExpression());
      } while (this.peek().type === TokenType.COMMA && this.consume());
    }

    this.expect(TokenType.RIGHT_PAREN);
    return {
      type: 'CallExpression',
      name: functionName,
      arguments: args
    };
  }

  // Structure: IF   LEFT_PAREN   condition   RIGHT_PAREN   [ELSE - optional]   else
  parseIfStatement(): Statement {
    let elseBranch: Statement[] | undefined = undefined;

    this.expect(TokenType.IF);
    this.expect(TokenType.LEFT_PAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN);

    // Then branch = the block following the if condition
    const thenBranch = this.parseBlock();

    // Else branch = the block following the else keyword, if it exists
    if (this.peek().type === TokenType.ELSE) {
      this.expect(TokenType.ELSE);
      elseBranch = this.parseBlock();
    }

    return {
      type: 'IfStatement',
      condition,
      then: thenBranch,
      else: elseBranch
    };
  }

  // Structure: WHILE   LEFT_PAREN   condition   RIGHT_PAREN   body
  parseWhileStatement(): Statement {
    let condition: Expression;

    this.expect(TokenType.WHILE);
    this.expect(TokenType.LEFT_PAREN);
    condition = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN);
    const body = this.parseBlock();

    return {
      type: 'WhileStatement',
      condition,
      body
    };
  }

  // Structure: FOR   LEFT_PAREN   [initializer]   SEMICOLON   [condition]   SEMICOLON   [increment]   RIGHT_PAREN   body
  parseForStatement(): Statement {
    let initializer: Statement | undefined = undefined;
    let condition: Expression | undefined = undefined;
    let increment: Statement | undefined = undefined;

    this.expect(TokenType.FOR);
    this.expect(TokenType.LEFT_PAREN);

    // Parse initializer if it's not a semicolon. This allows for both `for (var i = 0; i < 10; i++)` and `for (; i < 10; i++)`
    if (this.peek().type !== TokenType.SEMICOLON) {
      initializer = this.parseStatement();
      this.expect(TokenType.SEMICOLON);
    } else {
      this.expect(TokenType.SEMICOLON);
    }

    // Parse condition if it's not a semicolon. This allows for both `for (var i = 0; i < 10; i++)` and `for (var i = 0;; i++)`
    if (this.peek().type !== TokenType.SEMICOLON) {
      condition = this.parseExpression();
    } else {
      this.expect(TokenType.SEMICOLON);
    }
    // Parse increment if it's not a right parenthesis. This allows for both `for (var i = 0; i < 10; i++)` and `for (var i = 0; i < 10;)`
    if (this.peek().type !== TokenType.RIGHT_PAREN) {
      increment = this.parseStatement();
    }

    this.expect(TokenType.RIGHT_PAREN);
    const body = this.parseBlock();

    return {
      type: 'ForStatement',
      initializer: initializer!,
      condition: condition!,
      increment: increment!,
      body
    }
  }

  // Structure: RETURN [expression - optional] SEMICOLON
  parseReturnStatement(): Statement {
    let value: Expression | undefined = undefined;

    this.expect(TokenType.RETURN);
    // If the next token is not a semicolon, we expect an expression
    if (this.peek().type !== TokenType.SEMICOLON) {
      value = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON);
    return {
      type: 'ReturnStatement',
      value
    };
  }

  // Expression statement is just an expression followed by a semicolon, e.g., `print(x);` or `x + 5;`
  parseExpressionStatement(): Statement {
    const expression = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  // Pratt parser
  parseExpression(precedence: number = 0): Expression {
    // First we parse left-hand side (could be a literal, identifier, or parenthesized expression)
    let left = this.parsePrimary();

    // Max precedence, so we resolve then before any binary operator.
    // This allows for expressions like `arr[0] + 5` or `arr[0] = 10` to be parsed correctly, where the array access has higher precedence than the addition or assignment.

    // Treats array access and assignment by index
    while (this.peek().type === TokenType.LEFT_BRACKET) {
      this.consume();
      const index = this.parseExpression();
      this.expect(TokenType.RIGHT_BRACKET);

      if (this.peek().type === TokenType.ASSIGN) {
        this.consume();
        const value = this.parseExpression();
        left = { type: 'IndexAssignment', object: left, index, value };
      } else {
        left = { type: 'IndexExpression', object: left, index };
      }
    }

    // While the next operator has higher precedence, we consume it and parse the right-hand side
    while (
      this.PRECEDENCE[this.peek().type] !== undefined &&
      this.PRECEDENCE[this.peek().type]! > precedence
    ) {
      const opToken = this.peek(); // Look at the operator token to determine its precedence
      const opPrecedence = this.PRECEDENCE[opToken.type]; // Get the precedence of the operator
      const operator = this.consume().value; // Consume the operator token

      // If we haven't did the above check, passing `this.PRECEDENCE[this.peek().type]` directly would cause an error if the next token is not an operator,
      // because it would be undefined. So we need to check if it's defined before using it.
      const right = this.parseExpression(opPrecedence);

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parsePrimary(): Expression {
    const token = this.peek();

    switch (token.type) {
      case TokenType.NUMBER: {
        this.consume();
        return { type: 'NumberLiteral', value: Number(token.value) };
      }

      case TokenType.STRING: {
        this.consume();
        return { type: 'StringLiteral', value: token.value };
      }

      case TokenType.NULL: {
        this.consume();
        return { type: 'NullLiteral' };
      }

      case TokenType.TRUE:
      case TokenType.FALSE:
        this.consume();
        return { type: 'BooleanLiteral', value: token.type === TokenType.TRUE };

      case TokenType.IDENTIFIER: {
        this.consume();
        // Function call if the next token is a left parenthesis
        if (this.peek().type === TokenType.LEFT_PAREN) {
          return this.parseCallExpression(token.value);
        }

        // Otherwise, it's just a variable reference
        if (this.peek().type === TokenType.ASSIGN) {
          this.consume(); // consume the =
          const value = this.parseExpression();
          return { type: 'AssignmentExpression', name: token.value, value };
        }

        return { type: 'Identifier', name: token.value };
      }

      // Parenthesized expression, e.g., (10 + 5) or (x > 3)
      case TokenType.LEFT_PAREN: {
        this.consume();
        const expr = this.parseExpression();
        this.expect(TokenType.RIGHT_PAREN);
        return expr;
      }

      case TokenType.FN: {
        this.consume();
        this.expect(TokenType.LEFT_PAREN);
        const parameters: string[] = [];

        if (this.peek().type !== TokenType.RIGHT_PAREN) {
          do {
            const paramToken = this.expect(TokenType.IDENTIFIER);
            parameters.push(paramToken.value);
          } while (this.peek().type === TokenType.COMMA && this.consume());
        }

        this.expect(TokenType.RIGHT_PAREN);
        const body = this.parseBlock();

        return {
          type: 'FunctionExpression',
          parameters,
          body
        };
      }

      // Array literal
      case TokenType.LEFT_BRACKET: {
        this.consume();
        const elements: Expression[] = [];

        if (this.peek().type !== TokenType.RIGHT_BRACKET) {
          do {
            elements.push(this.parseExpression());
          } while (this.peek().type === TokenType.COMMA && this.consume());
        }

        this.expect(TokenType.RIGHT_BRACKET);
        return { type: 'ArrayLiteral', elements };
      }

      default:
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
  }

  // Parse a block of statements enclosed in braces: for() {...}, if() {...} else {...}, while() {...}, fn() {...}
  parseBlock(): Statement[] {
    this.expect(TokenType.LEFT_BRACE);
    const body: Statement[] = [];

    while (this.peek().type !== TokenType.RIGHT_BRACE) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.RIGHT_BRACE);
    return body;
  }
}

export default Parser;
