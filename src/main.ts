import * as fs from 'fs';
import * as path from 'path';

import Interpreter from './interpreter';
import Lexer from './lexer';
import Parser from './parser';

const filepath = process.argv[2];

if (!filepath) {
  console.error('Usage: marselo <file.mrs>');
  process.exit(1);
}

const source = fs.readFileSync(path.resolve(filepath), 'utf-8');
const lexer = new Lexer(source);

const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

const interpreter = new Interpreter();
interpreter.setBaseDir(path.dirname(filepath));
interpreter.run(ast);
