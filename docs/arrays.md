# Arrays

Adicionar arrays vão exigir modificações em todos os níveis do que temos atualmente (2026-05-03);

- Criação:

```plaintext
var nums = [1, 2, 3];
var vazio = [];
```

- Acesso via index:

```plaintext
print(nums[0]);
```

- Atribuição via index:

```plaintext
nums[0] = 99;
```


## AST

A primeira coisa que precisamos fazer é adicionar um novo `ArrayLiteral` na nossa AST:

```typescript
export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: Expression[]; // Os elementos do array, que podem ser de qualquer tipo de expressão, inclusive vazios ou outros arrays (matrizes)
}
```

Não precisamos de nullable, um array vazio é simplesmente um `elements: []`.

## Lexer

Nós já temos as definições para `[` e `]`, o padrão de parsing nesse caso é idêntico aos argumentos de uma função: expressões separadas por vírgula até encontrar o `]`. Fazemos assim nas funções:

```typescript
if (this.peek().type !== TokenType.RIGHT_PAREN) {
  do {
    const paramToken = this.expect(TokenType.IDENTIFIER);
    parameters.push(paramToken.value);
  } while (this.peek().type === TokenType.COMMA && this.consume());
}
```

Enquanto o token atual não for `]`, nós continuamos consumindo expressões e adicionando elas no array de elementos.

## Acesso encadeado (matrix)

Falando um pouco mais sobre matrizes, especificamente, precisamos pensar que:

`nums[0]`:

- O objeto sendo acessado é `nums` (Identifier)
- O índice sendo acessado é `0` (Literal)

Então temos que adicionar uma expressão de índice:

```typescript
export interface IndexExpression {
  type: 'IndexExpression';
  object: Expression;     // o que está sendo acessado
  index: Expression;      // o índice
}
```

O "segredo" está no tipo do `object`: é uma `Expression` e não uma string, significando que o próprio resultado pode ser acessado novamente:

```plaintext
matriz[0][1]
-> IndexExpression (
     object: IndexExpression(object: Identifier("matriz"), index: 0),
     index: 1
   )
```

Isso funciona inclusive para situações tipo `func[0]()` -> Retorna uma função na posição 0 do resultado de `func` e a chama.

## Parser

Como diferenciar um IndexAssignment de um IndexExpression? É simples: assignment quando depois de acessar um array há ASSIGN (=), senão é um acesso (no caso, um Expression):

```plaintext
parseia a expressão primária (identifier, array literal, etc)
enquanto o próximo token for '[':
  consome '['
  parseia a expressão do índice
  consome ']'
  se o próximo token for '=':
    consome '='
    parseia o valor
    resultado = IndexAssignment(objeto_atual, índice, valor)
  senão:
    resultado = IndexExpression(objeto_atual, índice)
  objeto_atual = resultado  ← permite encadeamento
```

O loop é o que permite o encadeamento/matrizes, usando o resultado anterior como o objeto para o próximo acesso. Adicionamos isso ao `parseExpression` (depois de chamar o `parsePrimary`) e deve funcionar como o esperado :D
