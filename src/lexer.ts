import { Token, TokenType, KEYWORDS } from "./token";

class Lexer {
  private source: string;
  private pos: number;
  private line: number;

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
  }

  lookahead(): string {
    return this.source[this.pos] || '';
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const char = this.lookahead();

      // We use semicolons as end of statement markers
      if (char === ';') {
        tokens.push({ type: TokenType.SEMICOLON, value: ';', line: this.line });
        this.pos++;
        // Do not increment line number here, as semicolons can be used to separate statements on the same line and not necessarily indicate a new line.
        continue;
      }

      // Skip whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        this.pos++;
        continue;
      }

      // Handle identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        let value = '';

        while (/[a-zA-Z0-9_]/.test(this.lookahead())) {
          value += this.lookahead();
          this.pos++;
        }

        const type = KEYWORDS[value] || TokenType.IDENTIFIER;
        tokens.push({ type, value, line: this.line });
        continue;
      }

      // Handle operators
      if (char === '=') {
        if (this.source[this.pos + 1] === '=') {
          tokens.push({ type: TokenType.EQUALS, value: '==', line: this.line });
          this.pos += 2;
        } else {
          tokens.push({ type: TokenType.ASSIGN, value: '=', line: this.line });
          this.pos++;
        }
        continue;
      }

      if (char === '!') {
        if (this.source[this.pos + 1] === '=') {
          tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', line: this.line });
          this.pos += 2;
        } else {
          tokens.push({ type: TokenType.BANG, value: '!', line: this.line });
          this.pos++;
        }
        continue;
      }

      if (char === '>') {
        if (this.source[this.pos + 1] === '=') {
          tokens.push({ type: TokenType.GREATER_EQUAL, value: '>=', line: this.line });
          this.pos += 2;
        } else {
          tokens.push({ type: TokenType.GREATER_THAN, value: '>', line: this.line });
          this.pos++;
        }
        continue;
      }

      if (char === '<') {
        if (this.source[this.pos + 1] === '=') {
          tokens.push({ type: TokenType.LESS_EQUAL, value: '<=', line: this.line });
          this.pos += 2;
        } else {
          tokens.push({ type: TokenType.LESS_THAN, value: '<', line: this.line });
          this.pos++;
        }
        continue;
      }

      if (char === '?') {
        if (this.source[this.pos + 1] === '?') {
          tokens.push({ type: TokenType.NULLISH_COALESCING, value: '??', line: this.line });
          this.pos += 2;
        } else {
          // We can choose to allow single '?' as valid token if we want optional chaining or ternary operators, but for now we will throw an error for unexpected characters.
          throw new Error(`Unexpected character '?' at line ${this.line}`);
        }
        continue;
      }

      if (char === '&') {
        if (this.source[this.pos + 1] === '&') {
          tokens.push({ type: TokenType.AND, value: '&&', line: this.line });
          this.pos += 2;
          continue;
        } else {
          throw new Error(`Unexpected character '&' at line ${this.line}`);
        }
      }

      if (char === '|') {
        if (this.source[this.pos + 1] === '|') {
          tokens.push({ type: TokenType.OR, value: '||', line: this.line });
          this.pos += 2;
          continue;
        } else {
          throw new Error(`Unexpected character '|' at line ${this.line}`);
        }
      }

      if (char === '+') {
        tokens.push({ type: TokenType.PLUS, value: '+', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '-') {
        tokens.push({ type: TokenType.MINUS, value: '-', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '*') {
        tokens.push({ type: TokenType.ASTERISK, value: '*', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '/') {
        tokens.push({ type: TokenType.SLASH, value: '/', line: this.line });
        this.pos++;
        continue;
      }

      // Handle punctuation
      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: ',', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '{') {
        tokens.push({ type: TokenType.LEFT_BRACE, value: '{', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '}') {
        tokens.push({ type: TokenType.RIGHT_BRACE, value: '}', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: TokenType.LEFT_PAREN, value: '(', line: this.line });
        this.pos++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.RIGHT_PAREN, value: ')', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '[') {
        tokens.push({ type: TokenType.LEFT_BRACKET, value: '[', line: this.line });
        this.pos++;
        continue;
      }

      if (char === ']') {
        tokens.push({ type: TokenType.RIGHT_BRACKET, value: ']', line: this.line });
        this.pos++;
        continue;
      }

      if (char === '"') {
        let value = '';
        this.pos++; // Skip opening quote
        while (this.lookahead() !== '"' && this.pos < this.source.length) {
          value += this.lookahead();
          this.pos++;
        }
        if (this.lookahead() === '"') {
          this.pos++;
          tokens.push({ type: TokenType.STRING, value, line: this.line });
        } else {
          throw new Error(`Unterminated string literal at line ${this.line}`);
        }
        continue;
      }

      // Handle newlines
      if (char === "\n") {
        this.line++;
        this.pos++;
        continue;
      }

      // Handle numbers
      if (/\d/.test(char)) {
        let value = '';

        while (/\d/.test(this.lookahead())) {
          value += this.lookahead();
          this.pos++;

          // Handle decimal point
          if (this.lookahead() === '.' && /\d/.test(this.source[this.pos + 1])) {
            value += '.';
            this.pos++;
          }
        }

        tokens.push({ type: TokenType.NUMBER, value, line: this.line });
        continue;
      }

      throw new Error(`Unexpected character '${char}' at line ${this.line}`);
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line });

    return tokens;
  }
}

export default Lexer;
