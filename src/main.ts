import Interpreter from './interpreter';
import Lexer from './lexer';
import Parser from './parser';

const testingSource = `
fn soma(arr) {
  return arr[0] + arr[1];
}

var nums = [5, 7];
print(soma(nums));
`

const lexer = new Lexer(testingSource);
const tokens = lexer.tokenize();
// console.log(tokens);

const parser = new Parser(tokens);
const ast = parser.parse();
// console.log(JSON.stringify(ast, null, 2));

const interpreter = new Interpreter();
interpreter.run(ast);
