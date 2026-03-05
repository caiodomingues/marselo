# Parser

<- [Lexer](./lexer.md)

Agora temos uma lista de tokens, mas ainda plana; não há relações entre eles.

```js
10 + 5 * 2
```

Se resolvermos da esquerda para a direita (ingenuamente), resultará em `30`, mas a resposta correta é `20` porque a `*` tem precedência sobre a `+`. Uma lista de tokens não captura isso, mas uma árvore sim: o parser pega a lista de tokens e monta uma árvore que representa a estrutura lógica do programa, chamada Abstract Syntax Tree (AST).

## Abstract Syntax Tree (AST)

Para `10 + 5 * 2`, a AST seria algo assim:

```plaintext
      +
     / \
   10   *
       / \
      5   2
```

Lendo a estrutura de uma árvore, agora sabemos que `5 * 2` deve ser avaliado antes de somar com `10`, o que nos dá o resultado correto de `20`.

- Lexer resolve quais são as palavras
- Parser resolve a estrutura gramatical (lógica) do programa

## Pratt Parsing

Esse algoritmo é bem mais profundo do que o explicado abaixo, mas a ideia básica é:

Cada operador tem um número de precedência. O parser usa esse n° pra decidir se continua para o próximo operador ou se volta para o operador anterior dentro da árvore. Algo como:

```plaintext
==, !=       -> 1 (menor precedência)
<, >, <=, >= -> 2
+, -         -> 3
*, /         -> 4 (maior precedência)
```

algo como:

```plaintext
parsear uma exp com precedência mínima P:
  lê o lado esquerdo (um literal ou identificador)
  enquanto o próximo operador tiver precedência >= P:
    consome o operador
    lê o lado direito (com a precedência P+1)
    combina esquerdo + operador + direito em uma BinaryExpression
    resultado se torna o novo lado esquerdo
```

por exemplo, para 2 + 3 * 4:

- esquerdo = `2`
- próximo é `+` (P 3 >= 0) -> consome
- direito = parse(P = 4)
  - esquerdo = `3`
  - próximo é `*` (P 4 >= 4) -> consome
  - direito é `4`
  - retorna `BinaryExpression('*', 3, 4)`
- retorna `BinaryExpression('+', 2, BinaryExpression('*', 3, 4))`

```plaintext
    +
   / \
  2   *
     / \
    3   4
```
