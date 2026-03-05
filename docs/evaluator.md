# Evaluator

O avaliador (evaluator) é um tree-walking interpreter, ou seja, ele percorre a AST nó por nó e executa. Para cada tipo de nó, ele sabe o que fazer:

```plaintext
NumberLiteral -> retorna o valor do número
BinaryExpression -> avalia esquerda e direita, aplica o operador
VariableDeclaration -> avalia o valor e guarda no escopo
Identifier -> busca o valor no escopo
CallExpression -> executa a função
... etc
```

## Escopo (também chamado de Ambiente)

Pensa numa pilha de caixas: cada uma guarda variáveis. Quando você entra numa função, você empilha uma caixa nova; quando sai, descarta a caixa.

```plaintext
programa principal: [ x = 10, resultado = 15]
dentro de soma: [ a = 10, b = 5] <- caixa empilhada
```

Quando o avaliador precisa de uma variável, ele começa pela caixa do topo (escopo maior), se não encontrar, ele vai descendo a pilha até achar ou chegar no final (variável não definida). Isso resolve dois problemas de uma vez só:

1. `a` e `b` só existem dentro de `soma`, então elas somem quando a caixa é descartada
2. `soma` consegue acessar `x`

## Funções

- `set`: salva uma variável no escopo
- `get`: retorna uma variável
- `assign`: atualiza o valor de uma variável existente

O `get` e o `assign` são as partes mais importantes:

```plaintext
get:
  procura o nome no escopo atual
    se encontrou -> retorna o valor
    se não encontrou -> vai para o escopo pai
      se não tem pai -> erro

assign:
  procura o nome no escopo atual
    se encontrou -> atualiza o valor aqui mesmo
    se não encontrou -> vai para o escopo pai para atualizar
      se não tem pai -> erro (variável não foi declarada)
```

O `set` escreve no escopo atual, enquanto o `assign` sobe a pilha até achar onde a variável foi declarada, é usado para reatribuir/atualizar/modificar o valor de uma variável já existente.
