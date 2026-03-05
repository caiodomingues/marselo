import Interpreter from './interpreter';
import Lexer from './lexer';
import Parser from './parser';

const source = `
var criarContador = fn() {
  var total = 0;
  var incrementar = fn() {
    total = total + 1;
    return total;
  };
  return incrementar;
};

var contadorA = criarContador();
var contadorB = criarContador();
print(contadorA());
print(contadorA());
print(contadorB());
print(contadorA());
`

const lexer = new Lexer(source);
const tokens = lexer.tokenize();
console.log(tokens);

const parser = new Parser(tokens);
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));

const interpreter = new Interpreter();
interpreter.run(ast);
