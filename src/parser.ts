import { Expression, Program, Statement } from "./ast";
import { Token, TokenType } from "./token";

class Parser {
  private tokens: Token[];
  private pos: number;

  private PRECEDENCE: Partial<Record<TokenType, number>> = {
    [TokenType.EQUALS]: 1,
    [TokenType.NOT_EQUALS]: 1,
    [TokenType.LESS_THAN]: 2,
    [TokenType.GREATER_THAN]: 2,
    [TokenType.GREATER_EQUAL]: 2,
    [TokenType.LESS_EQUAL]: 2,
    [TokenType.PLUS]: 3,
    [TokenType.MINUS]: 3,
    [TokenType.ASTERISK]: 4,
    [TokenType.SLASH]: 4
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

  // Pratt parser
  parseExpression(precedence: number = 0): Expression {
    // First we parse left-hand side (could be a literal, identifier, or parenthesized expression)
    let left = this.parsePrimary();

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
      case TokenType.NUMBER:
        this.consume();
        return { type: 'NumberLiteral', value: Number(token.value) };
      case TokenType.STRING:
        this.consume();
        return { type: 'StringLiteral', value: token.value };
      case TokenType.TRUE:
      case TokenType.FALSE:
        this.consume();
        return { type: 'BooleanLiteral', value: token.type === TokenType.TRUE };
      case TokenType.IDENTIFIER:
        this.consume();
        // Function call if the next token is a left parenthesis
        if (this.peek().type === TokenType.LEFT_PAREN) {
          return this.parseCallExpression(token.value);
        }
        return { type: 'Identifier', name: token.value };
      // Parenthesized expression, e.g., (10 + 5) or (x > 3)
      case TokenType.LEFT_PAREN:
        this.consume();
        const expr = this.parseExpression();
        this.expect(TokenType.RIGHT_PAREN);
        return expr;
      default:
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
  }
}
