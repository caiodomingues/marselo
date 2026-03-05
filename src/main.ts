import Interpreter from './interpreter';
import Lexer from './lexer';
import Parser from './parser';

const source = `
fn soma(a, b) {
  return a + b;
}

var resultado = soma(10, 5);
print(resultado);
`

const lexer = new Lexer(source);
const tokens = lexer.tokenize();
console.log(tokens);

const parser = new Parser(tokens);
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));

const interpreter = new Interpreter();
interpreter.run(ast);
