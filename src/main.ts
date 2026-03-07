import * as fs from 'fs';
import * as path from 'path';

import Lexer from './lexer';
import Parser from './parser';
import Compiler from './compiler';
import VM from './vm';
import { NATIVES } from './natives';
import { SerializedBytecode } from './opcode';
import { inspect } from './inspect';

// Get the file path from command line arguments
const filepath = process.argv[2];

// Compile flag, generates .mbc (bytecode) file instead of running the source code
const compileFlag = process.argv.includes('--compile');

// Inspect flag, stores OpCode execution details for debugging (and fun - i was trying to see how the stack is changing :D)
const inspectFlag = process.argv.includes('--inspect');

// Trace for debugging (looks like .mbc but we can inspect step by step of the stack)
const traceFlag = process.argv.includes('--trace');

if (!filepath) {
  console.error('Usage: marselo <file.mrs/.mbc> [--] [--compile]');
  process.exit(1);
}

if (filepath.endsWith('.mbc')) {
  const bytecode: SerializedBytecode = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  const vm = new VM(bytecode.instructions, new Map(Object.entries(bytecode.chunks)));

  vm.registerNatives(NATIVES);
  vm.run();

  process.exit(0);
} else {
  const source = fs.readFileSync(filepath, 'utf-8');
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();

  const { instructions, chunks } = new Compiler(path.dirname(filepath)).compile(ast);
  const vm = new VM(instructions, chunks);

  if (traceFlag) vm.enableTracing();

  vm.registerNatives(NATIVES);

  if (inspectFlag) {
    // The idea here is "useless" but fun: while studying the Bytecode and VM implementation, I had fun understanding how the stack works with OpCodes, so I thought it would be interesting
    // to SEE the stack changes in real time (controllable via some interface with steps and w/e) as we execute the code, to better understand how the OpCodes interact with the stack and
    // how the execution flow works. So this is just a fun experiment to visualize the stack changes as we run the code.

    const output = inspect(instructions, chunks);
    fs.writeFileSync(filepath.replace(/\.mrs$/, '.moc'), output, 'utf-8');
    console.log(`Generated inspection file at ${filepath.replace(/\.mrs$/, '.moc')}`);

    // Stop execution here since we're just generating the inspection file, not actually running the code
    process.exit(0);
  }

  if (traceFlag) {
    vm.run();
    const tracingData = vm.getTrace();
    fs.writeFileSync(filepath.replace(/\.mrs$/, '.trace.json'), JSON.stringify(tracingData, null, 2), 'utf-8');
    console.log(`Generated trace file at ${filepath.replace(/\.mrs$/, '.trace.json')}`);

    process.exit(0);
  }

  if (compileFlag) {
    const bytecode: SerializedBytecode = {
      version: 1,
      instructions,
      chunks: Object.fromEntries(chunks), // convert Map to Object for serialization
    };

    fs.writeFileSync(filepath.replace(/\.mrs$/, '.mbc'), JSON.stringify(bytecode, null, 2), 'utf-8');

    console.log(`Compiled ${filepath} to ${filepath.replace(/\.mrs$/, '.mbc')}`);

    process.exit(0);
  } else {
    vm.run();
  }
}
