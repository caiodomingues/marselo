import * as fs from 'fs';

import Lexer from './lexer';
import Parser from './parser';
import Compiler from './compiler';
import VM from './vm';
import { NATIVES } from './natives';

const filepath = process.argv[2];

if (!filepath) {
  console.error('Usage: marselo <file.mrs>');
  process.exit(1);
}

const source = fs.readFileSync(filepath, 'utf-8');
const tokens = new Lexer(source).tokenize();
const ast = new Parser(tokens).parse();

const { instructions, chunks } = new Compiler().compile(ast);
const vm = new VM(instructions, chunks);

vm.registerNatives(NATIVES)

vm.run();
