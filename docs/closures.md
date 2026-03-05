# Closures - lembrando de onde viemos

No exemplo abaixo (em .mrs):

```ts
fn criarContador() {
  var total = 0;

  fn incrementar() {
    total = total + 1;
    return total;
  }

  return incrementar;
}

var contador = criarContador();
print(contador());
print(contador());
print(contador());
```

Esperamos ver `1`, `2` e `3`, mas quando o `contador()` é chamado, `criarContador()` já terminou de executar, o escopo deveria ter sido descartado, logo `total` deveria ter sumido.

Mas o que acontece é que `total` continua vivo e sendo atualizado a cada chamada, isso é uma closure; a função `incrementar` fechou sobre o escopo onde foi criada, capturando `total` mesmo depois de `criarContador` retornar, esse escopo continua vivo enquanto `incrementar` existir.

Na nossa implementação atual (2026-03-05), Marselo ainda não suporta closures:

```ts
case 'FunctionDeclaration': {
  const func = (...args: any[]) => {
    const funcScope = new Scope(scope); // ← scope aqui é o escopo atual
    // ...
  }
  scope.set(node.name, func);
}
```

O `scope` capturado é o escopo correto, mas isso só funciona porque é uma arrow function JavaScript, que captura o `scope` do momento da declaração. Marselo se apoia no sistema de closures do JavaScript. O que não é um PROBLEMA, mas se estamos aqui pra aprender e implementar algo, melhor não depender do JS.

Atualmente temos apenas funções nomeadas (com `FunctionDeclaration`, declaradas por `fn`), mas Closures úteis geralmente envolvem funções como valores (funções que podem ser retornadas, passadas como argumento, guardadas em variáveis).

## Implementando closures

Quando chamarmos `criarContador()` pela primeira vez, um escopo é criado com `total = 0`, e a função `incrementar` é definida dentro desse escopo:

```plaintext
chamada 1 de criarContador:
  escopo A: [ total = 0 ]
                ^
          incrementar A <- aponta para o escopo A
```

Quando chamamos o `criarContador()` pela segunda vez, um novo escopo é criado (completamente independente):

```plainText
chamada 1 de criarContador:
  escopo B: [ total = 0 ]
                ^
          incrementar A <- aponta para o escopo A

chamada 2 de criarContador:
  escopo B: [ total = 0 ]
                ^
          incrementar B <- aponta para o escopo B
```

Sendo assim, ambos os contadores deveriam ter um `total` independentes:

```plaintext
contadorA() -> 1 (total do escopo A = 1)
contadorA() -> 2 (total do escopo A = 2)
contadorB() -> 1 (total do escopo B [independente, ainda era 0] = 1)
```

### O problema

A implementação atual funciona porque a arrow function do JS captura o scope corretamente, mas existe um caso que quebra. Como hoje temos apenas `FunctionDeclaration`, se tentarmos executar o código abaixo, ele quebra:

```plaintext
fn criarContador() {
  var total = 0;
  fn incrementar() {
    total = total + 1;
    return total;
  }
  return incrementar;
}

var contador = criarContador();
print(contador());
```

O problema é que `return incrementar` retorna o valor que `incrementar` tem no escopo (no momento da execução), mas foi declarada com `FunctionDeclaration` que chama o `scope.set()` e não retorna nada útil como valor.

### Closures em Marselo

Precisamos de um `FunctionExpression` -> o equivalente a uma função anônima que é um VALOR, e não uma declaração:

```plaintext
var incrementar = fn() {
  total = total + 1;
  return total;
}
```

> Inclusive, lendo isso, notei que não temos operadores +=, -=, etc, hahaha, melhor adicionar depois.

A diferença para a `FunctionDeclaration` é simples:

> Será q eu ainda sei fazer uma table de cabeça no markdown?

| | FunctionDeclaration | FunctionExpression |
| --- | --- | --- |
| Tem nome? | Sim | Opcional |
| É instrução? | Sim | Não (valor) |
| Retornável? | Não diretamente | Sim |

No fim, para implementar:

- `FunctionDeclaration` -> tem name obrigatório, é um Statement
- `FunctionExpression` -> tem name opcional, é uma Expression
