# Marselo

Creating a programming language sounds fun and challenging, so I decided to try it out. :D

(This repo is just a study, so don't expect it to be a complete programming language)

- Little to no AI involvement, I want to do most of the work myself to learn as much as possible.
- It's interpreted (tree-walking interpreter) **and compiled** (bytecode + VM): both modes coexist.
- It's named Marselo because my friend suggested it and I liked it. (It's just a name, no special meaning)
- You may find random PT-BR comments/code, because it's my native language and sometimes I write comments in Portuguese to express my thoughts more naturally. (But I'll try to keep it mostly in English for better readability)
- Files use the `.mrs` extension.
- REPL (Read-Eval-Print Loop) for interactive coding and testing snippets.
- Bytecode serialization for saving compiled code to disk and loading it later, improving startup time, with `--compile`
- Tracer for debugging: `--trace` flag to print executed instructions and their operands during runtime, helping to understand the execution flow and identify issues. (Tiny and basic UI at `/tools/inspection/index.html`)
--

Also, simple tooling and w/e:

- Inside `/editors`, you may find a basic syntax highlighting extension for VSCode that I made for learning as well (never done that before).
- Formatter (kinda basic, like prettier but for Marselo).
- `--watch` flag for auto-reloading on file changes.

## What can I still improve/implement?

- Tail call optimization (TCO) -> improves performance of recursive functions and prevents stack overflow
- Better error handling -> more informative error messages with line numbers and context
- Try/catch -> exception handling for better error management
- Standard library -> useful built-in functions and modules for common tasks

> When will you implement these features?
> Idk, maybe never? I'm just doing this for fun and learning, so no promises :D

## Pipeline

```plaintext
Source Code (.mrs)
     ↓
  Lexer (Tokenizer)       → characters → tokens
     ↓
  Parser (Pratt Parsing)  → tokens → AST
     ↓
  ┌─────────────────────────────────────┐
  │ Interpreter           → AST → execution (tree-walking)
  │ Compiler              → AST → bytecode
  │   └── VM              → bytecode → execution
  └─────────────────────────────────────┘
```

## Embedding

Marselo can be used as an embedded scripting library:

```typescript
import Marselo from './marselo';

const mrs = new Marselo({ mode: 'vm' }); // or 'interpret'

// Expose host functions to Marselo scripts
mrs.register('double', (n: number) => n * 2);

// Execute code: state persists between calls
mrs.run(`var x = 10;`);
mrs.run(`print(double(x));`); // 20

// Evaluate an expression and get the result back
const result = mrs.eval(`x * 3`); // 30
```

## Language Features

### Types

- Numbers (`42`, `3.14`)
- Strings (`"hello"`)
- Booleans (`true`, `false`)
- Null (`null`)
- Arrays (`[1, 2, 3]`)
- Objects / Maps (`{ key: value }`)

### Operators

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`
- Nullish coalescing: `??`
- Unary: `-x`, `!x`

### Variables

```plaintext
var x = 10;
var name = "Marselo";
```

### Functions

```plaintext
fn add(a, b) {
  return a + b;
}

// Functions as values (closures!)
var greet = fn(name) {
  return "Hello, " + name;
};
```

### Closures

```plaintext
var createCounter = fn() {
  var total = 0;
  return fn() {
    total = total + 1;
    return total;
  };
};

var counter = createCounter();
print(counter()); // 1
print(counter()); // 2
```

### Control Flow

```plaintext
if (x > 10) {
  print("big");
} else {
  print("small");
}

while (x > 0) {
  x = x - 1;
}

for (var i = 0; i < 10; i = i + 1) {
  print(i);
}
```

### Arrays

```plaintext
var nums = [1, 2, 3];
print(nums[0]);      // 1
nums[0] = 99;
print(nums[0]);      // 99

var matrix = [[1, 2], [3, 4]];
print(matrix[0][1]); // 2
```

### Objects

```plaintext
var person = { name: "Marselo", age: 42 };
print(person["name"]); // Marselo
person["age"] = 43;
```

### Modules

```plaintext
import "lib.mrs";

// everything declared in lib.mrs is available here
// imports are hoisted, so order doesn't matter
```

### Native Functions

| Function | Description |
| --- | --- |
| `print(...)` | Print values to stdout |
| `len(arr)` | Return the length of an array or string |
| `push(arr, val)` | Append a value to an array, return new length |
| `pop(arr)` | Remove and return the last element of an array |
| `range(start, end)` | Generate an array of numbers from start to end (exclusive) |
| `map(arr, fn)` | Apply a function to each element, return new array |
| `split(str, sep)` | Split a string into an array |
| `join(arr, sep)` | Join an array into a string |
| `upper(str)` | Uppercase a string |
| `lower(str)` | Lowercase a string |
| `trim(str)` | Trim whitespace from a string |
| `substring(str, start, end)` | Extract a substring |
| `input(prompt)` | Read a line from stdin |
| `num(str)` | Parse a string as a number |

### Statements end with `;`

```plaintext
var x = 10;
print(x);
```

## Docs (pt-BR, kinda journallying what I was learning)

- [Lexer](docs/lexer.md)
- [Parser](docs/parser.md)
- [Evaluator](docs/evaluator.md)
- [Arrays](docs/arrays.md)
- [Closures](docs/closures.md)
- [Bytecode & VM](docs/bytecode-vm.md)

## Why TypeScript?

I'm familiar with it :D

## Why another language?

Go back to the first section and read it again :D
