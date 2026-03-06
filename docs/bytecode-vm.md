# Bytecode e VM

> Eu não sei se estou indo além do que planejei inicialmente, mas ainda to me divertindo :D

Até agora (2026-03-06), Marselo tem funcionado como um tree-walking interpreter: o avaliador (`evaluate`) percorre a AST nó por nó e executa diretamente. Isso funciona bem, mas tem um custo de performance: percorrer uma árvore tem overhead de ponteiros* e chamadas recursivas.

*Overhead de ponteiros: custo adicional de memória e tempo de CPU para gerenciar endereços em vez de valores diretos.

A próxima evolução significativa é compilar a AST para **bytecode** e executar em uma máquina virtual (VM), da mesma forma que Python, Lua e Ruby fazem, continuam sendo linguagens interpretadas (de script), mas com uma camada de compilação que melhoram drasticamente a performance.

O pipeline original do README.md muda de:

```plaintext
file .mrs -> lexer -> parser -> AST -> interpreter
```

Para:

```plaintext
file .mrs -> lexer -> parser -> ast -> compiler -> bytecode -> VM
```

A AST continua existindo, mas se torna um intermediário e não o destino final.

## Mas o que é bytecode?

Bytecode é uma sequência de instruçÕes simples: um formato intermediário entre o código-fonte e o código de máquina, cada instrução faz uma coisa só e a VM executa uma instrução por vez num loop simples.

Pense que, em vez de o avaliador navegar pela árvore com diversos galhos e folhas (a AST), ele lê uma lista linear de instruções (que é uma pilha LIFO) como um roteiro de passos:

```plaintext
PUSH 2
PUSH 3
ADD
STORE x
```

> Isso é equivalente a `var x = 2 + 3;`

Isso é MUITO mais rápido de executar e mais fácil de otimizar.

## A pilha

A VM do Marselo é basicamente uma máquina de pilha (stack machine): toda computação acontece sobre uma pilha de valores (que nem uma pilha de pratos).

Cada instrução ou empurra um valor na pilha, ou consome valores do topo e empurra o resultado. Outro exemplo pra facilitar a visualização:

```plaintext
PUSH 2                       // pilha: [2]
PUSH 3                       // pilha: [2, 3]
ADD                          // consome 2 e 3, empurra 5 -> pilha: [5]
```

Não há variáveis temporárias explícitas, a pilha é a própria memória temporária, onde cada operação deixa o seu resultado para a próxima instrução consumir.

## Instruções (opcodes)

Cada instrução tem um código de operação (opcode) e um operando adicional (se necessário). Por exemplo:

**Pilha**:

```plaintext
PUSH                         // Empurra um valor literal
POP                          // Remove o valor do topo da pilha
```

**Variáveis**:

```plaintext
LOAD                         // Lê uma var e empurra na pilha
STORE                        // Tira o topo e guarda na var
```

**Aritmética** (consomem dois valores, empurram o resultado):

```plaintext
ADD, SUB, MUL, DIV, MOD
```

**Comparação** (consomem dois valores, empurram true/false):

```plaintext
EQ, NEQ, LT, GT, LTE, GTE
```

Pra facilitar a associação:

- EQ = Equals
- NEQ = Not Equals
- LT = Less Than
- GT = Greater Than
- LTE = Less Than or Equal
- GTE = Greater Than or Equal

**Lógica:**

```plaintext
AND, OR, NOT
```

**Controle de fluxo:**

```plaintext
JUMP                         // pula para uma posição na lista de instruções
JUMP_IF_FALSE                // pula se o topo da pilha for falso
```

O `JUMP_IF_FALSE`'é fundamental para implementar estruturas de controle como `if` e `while`, onde a execução depende de uma condição. Por exemplo, para um `if` simples:

```plaintext
LOAD condition               // empurra a condição na pilha

JUMP_IF_FALSE else_label     // se a condição for falsa, pula para o bloco "else"
// bloco "then"
JUMP end_label               // pula para o final do "if"

else_label:
// bloco "else"
end_label:
```

A gente vai chegar lá, mas o importante é entender que o `JUMP` e `JUMP_IF_FALSE` são as ferramentas básicas para controlar o fluxo de execução.

**Funções:**

```plaintext
CALL                         // chama uma função com N args do topo da pilha
RETURN                       // retorna o topo da pilha
```

## Traduzindo de AST -> Bytecode

O compilador percorre a AST da mesma forma que o avaliador faz, mas em vez de executar, ele emite instruções:

```plaintext
LOAD x                       // lê e empurra X
PUSH 2                       // empurra 2
MUL                          // consome x e 2, empurra x * 2
PUSH 1                       // empurra 1
ADD                          // consome x * 2 e 1, empurra x * 2 + 1
STORE y                      // guarda em Y
```

Note que:

- `LOAD` -> variáveis
- `PUSH` -> literais

Já que `PUSH` sabe o valor em compile-time, enquanto `LOAD` só sabe em runtime.

## Expandindo o conhecimento em controle de fluxo

A parte mais interessante é como `if` e `while` viram instruções lineares, afinal, não há mais uma árvore para representar a estrutura. A resposta são os jumps (apresentados previamente): instruções que desviam o fluxo de execução para um ponto diferente na lista.

Por exemplo, um `if` simples de `if (x > 0) { print(x); }` vira algo como:

```plaintext
LOAD x
PUSH 0
GT                           // compara x > 0, empurra true/false
JUMP_IF_FALSE <fim>          // se falso, pula para o bloco "else", como não tem "else", pula para o final do "if"
LOAD x
CALL print 1                 // chama print com 1 argumento
<fim>:
```

Para `while (x > 0) { x = x - 1; }`:

```plaintext
<inicio>:
LOAD x
PUSH 0
GT
JUMP_IF_FALSE <fim>
LOAD x
PUSH 1
SUB
STORE x
JUMP <inicio>
<fim>:
```

O `JUMP` incondicional no final é o que cria o loop, voltando para o início da condição. O `JUMP_IF_FALSE` é a condição de saída;

## A VM

É surpreendentemente mais simples (do que eu esperava). É um loop com switch:

```plaintext
enquanto houver instruções:
  lê a próxima instrução
  switch(opcode):
    PUSH   -> empurra o operando na pilha
    LOAD   -> busca variável, empurra na pilha
    STORE  -> consome o topo, guarda na variável
    ADD    -> consome dois valores, empurra a soma
    JUMP   -> move o ponteiro de instrução
    ...
```

O ponteiro de instrução (instruction pointer, IP) é basicamente um índice que aponta para a instrução atual na lista, `JUMP` muda esse índice diretamente, é assim que loops e condicionais funcionam.

> Acho que vou criar um visualizador de bytecode, parece simples e útil :D

## A implementação no Marselo

Precisamos de 3 arquivos:

```plaintext
src/
  opcode.ts     -> define os opcodes e a interface Instruction
  compiler.ts   -> percorre a AST e emite instruções
  vm.ts         -> executa as instruções
```

O interpreter atual continua funcionando, ambos os modos vão coexistir :D

### Ganhos reais (mas sem benchmark numérico, calma)

| | Tree-walking | Bytecode + VM |
| --- | --- | --- |
| Velocidade | Mais lento (navega árvore) | Mais rápido (lista linear) |
| Memória | AST em memória durante execução | Só as instruções |
| Otimizações | Difícil | Muito mais fácil |
| Portabilidade | Não | Bytecode pode ser salvo em disco |
