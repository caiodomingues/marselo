import Lexer from './lexer';

const source = `
var x = 10 + 5;
if (x > 3) {
  print("maior")
}
`

// Should output:
// [
//   { type: 'VAR', value: 'var', line: 2 },
//   { type: 'IDENTIFIER', value: 'x', line: 2 },
//   { type: 'ASSIGN', value: '=', line: 2 },
//   { type: 'NUMBER', value: '10', line: 2 },
//   { type: 'PLUS', value: '+', line: 2 },
//   { type: 'NUMBER', value: '5', line: 2 },
//   { type: 'SEMICOLON', value: ';', line: 2 },
//   { type: 'IF', value: 'if', line: 3 },
//   { type: 'LEFT_PAREN', value: '(', line: 3 },
//   { type: 'IDENTIFIER', value: 'x', line: 3 },
//   { type: 'GREATER_THAN', value: '>', line: 3 },
//   { type: 'NUMBER', value: '3', line: 3 },
//   { type: 'RIGHT_PAREN', value: ')', line: 3 },
//   { type: 'LEFT_BRACE', value: '{', line: 3 },
//   { type: 'PRINT', value: 'print', line: 4 },
//   { type: 'LEFT_PAREN', value: '(', line: 4 },
//   { type: 'STRING', value: 'maior', line: 4 },
//   { type: 'RIGHT_PAREN', value: ')', line: 4 },
//   { type: 'RIGHT_BRACE', value: '}', line: 5 },
//   { type: 'EOF', value: '', line: 6 }
// ]

const lexer = new Lexer(source);
const tokens = lexer.tokenize();
console.log(tokens);
