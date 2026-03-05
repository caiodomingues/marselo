import Interpreter from './interpreter';
import Lexer from './lexer';
import Parser from './parser';

const testingSource = `
print(!true);
print(!false);
print(-10);
print(-(5 + 3));
`

const lexer = new Lexer(testingSource);
const tokens = lexer.tokenize();
// console.log(tokens);

const parser = new Parser(tokens);
const ast = parser.parse();
// console.log(JSON.stringify(ast, null, 2));

const interpreter = new Interpreter();
interpreter.run(ast);
