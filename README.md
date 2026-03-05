# Marselo

Creating a programming language sounds fun and challenging, so I decided to try it out. :D

(This repo is just a study, so don't expect it to be a complete programming language)

- Little to no AI involvement, I want to do most of the work myself to learn as much as possible.
- It's interpreted (tree-walking interpreter), but I might add a compiler or VM later, who knows?
- It's named Marselo because my friend suggested it and I liked it. (It's just a name, no special meaning)
- You may find random PT-BR comments/code, because it's my native language and sometimes I write comments in Portuguese to express my thoughts more naturally. (But I'll try to keep it mostly in English for better readability)
- Files use the `.mrs` extension.

## Pipeline

```plaintext
Source Code (.mrs)
     ↓
  Lexer (Tokenizer)       → characters → tokens
     ↓
  Parser (Pratt Parsing)  → tokens → AST
     ↓
  Interpreter             → AST → execution
```

## Language Features

### Types
- Numbers (`42`, `3.14`)
- Strings (`"hello"`)
- Booleans (`true`, `false`)
- Null (`null`)
- Arrays (`[1, 2, 3]`)

### Operators
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`
- Nullish coalescing: `??`
- Unary: `-x`, `!x`

### Variables
```
var x = 10;
var name = "Marselo";
```

### Functions
```
fn add(a, b) {
  return a + b;
}

// Functions as values (closures!)
var greet = fn(name) {
  return "Hello, " + name;
};
```

### Closures
```
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
```
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
```
var nums = [1, 2, 3];
print(nums[0]);      // 1
nums[0] = 99;
print(nums[0]);      // 99

var matrix = [[1, 2], [3, 4]];
print(matrix[0][1]); // 2
```

### Native Functions
| Function | Description |
|---|---|
| `print(...)` | Print values to stdout |
| `len(arr)` | Return the length of an array |
| `push(arr, val)` | Append a value to an array, return new length |
| `pop(arr)` | Remove and return the last element of an array |
| `range(start, end)` | Generate an array of numbers from start to end (exclusive) |
| `map(arr, fn)` | Apply a function to each element, return new array |

### Statements end with `;`
```
var x = 10;
print(x);
```

## Why TypeScript?

I'm familiar with it :D

## Why another language?

Go back to the first section and read it again :D
