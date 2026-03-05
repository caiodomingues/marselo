# Lexer

De um jeito simplificado, é equivalente ao que o nosso cérebro faz quando lê um texto:

```plaintext
"Eu gosto de sorvete" -> ["Eu", "gosto", "de", "sorvete"]
```

Não lemos letra por letra, agrupamos automaticamente em palavras, um lexer faz o mesmo: recebe um texto bruto e o divide em sequências de caracteres com significado (chamados de tokens). Em um código, por exemplo:

```js
let x = 10 + 5
```

Res:

```plaintext
[ LET ] [ IDENTIFIER: "x"] [ EQUALS ] [ NUMBER: 10 ] [ PLUS ] [ NUMBER: 5 ] [ SEMICOLON ]
```

-> [Parser](./parser.md)
