export enum TokenType {
  COMMA = 'COMMA',                    // ,
  SEMICOLON = 'SEMICOLON',            // ;
  LEFT_BRACE = 'LEFT_BRACE',          // {
  RIGHT_BRACE = 'RIGHT_BRACE',        // }
  LEFT_PAREN = 'LEFT_PAREN',          // (
  RIGHT_PAREN = 'RIGHT_PAREN',        // )
  LEFT_BRACKET = 'LEFT_BRACKET',      // [
  RIGHT_BRACKET = 'RIGHT_BRACKET',    // ]
  ASSIGN = 'ASSIGN',                  // =
  EQUALS = 'EQUALS',                  // ==
  NOT_EQUALS = 'NOT_EQUALS',          // !=
  GREATER_THAN = 'GREATER_THAN',      // >
  LESS_THAN = 'LESS_THAN',            // <
  GREATER_EQUAL = 'GREATER_EQUAL',    // >=
  LESS_EQUAL = 'LESS_EQUAL',          // <=
  IDENTIFIER = 'IDENTIFIER',          // variable names, function names, etc.
  NUMBER = 'NUMBER',                  // numeric literals
  STRING = 'STRING',                  // string literals
  IF = 'IF',                          // if keyword
  ELSE = 'ELSE',                      // else keyword
  FOR = 'FOR',                        // for keyword
  WHILE = 'WHILE',                    // while keyword
  FN = 'FN',                          // fn keyword for function definitions
  PLUS = 'PLUS',                      // +
  MINUS = 'MINUS',                    // -
  ASTERISK = 'ASTERISK',              // *
  SLASH = 'SLASH',                    // /
  VAR = 'VAR',                        // var keyword for variable declarations
  RETURN = 'RETURN',                  // return keyword for returning values from functions
  TRUE = 'TRUE',                      // true boolean literal
  FALSE = 'FALSE',                    // false boolean literal
  EOF = 'EOF',                        // end of file/input
}

export interface Token {
  type: TokenType;
  value: string;
  line: number; // line number for error reporting and debugging
}

export const KEYWORDS: Record<string, TokenType> = {
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'while': TokenType.WHILE,
  'fn': TokenType.FN,
  'var': TokenType.VAR,
  'return': TokenType.RETURN,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
}
