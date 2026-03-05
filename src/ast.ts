export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | Identifier
  | BinaryExpression
  | AssignmentExpression
  | FunctionExpression
  | CallExpression;

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | ForStatement
  | ReturnStatement
  | ExpressionStatement;

// Expression -> Literals, Identifiers, Binary Expressions, Function Calls
// Statements -> Variable Declarations, Function Declarations, If Statements, Return Statements, Expression Statements (like function calls)

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NullLiteral {
  type: 'NullLiteral';
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

// Both 10 + 5 and X > 3 are BinaryExpressions, so we can use the same interface for both.
export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;                 // e.g., '+', '-', '*', '/'
  left: Expression;                 // Left-hand side expression
  right: Expression;                // Right-hand side expression
}

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  name: string;                     // The variable name
  value: Expression;                // The expression that initializes the variable
}

// This is for assignment expressions, e.g., x = 10 + 5; or x = y > 3, which is different from variable declaration because it doesn't declare a new variable,
// it just assigns a value to an existing variable, useful in for loops, e.g., i = i + 1;
export interface AssignmentExpression {
  type: 'AssignmentExpression';
  name: string;                     // The variable name being assigned to
  value: Expression;                // The expression that is being assigned to the variable
}

// Function calls, e.g., print("maior")
export interface CallExpression {
  type: 'CallExpression';
  name: string;                     // The function name, e.g., 'print'
  arguments: Expression[];          // The arguments passed to the function
}

// This allows us to have function calls as statements, e.g., print("maior");
export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

// Function declaration, e.g., function greet(name) { print("Hello, " + name); }
export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;                     // The function name
  parameters: string[];             // The parameter names (there's no)
  body: Statement[];                // The function body, which is an array of statements
}

// This allows us to have function expressions and closures, read (./docs/closures.md [pt-br])
export interface FunctionExpression {
  type: 'FunctionExpression';
  parameters: string[];             // The parameter names
  body: Statement[];                // The function body, which is an array of statements
}

// if ([condition]) { [then] } else { [else] }
export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;            // The condition expression
  then: Statement[];                // The statements to execute if the condition is true
  else?: Statement[];               // The statements to execute if the condition is false (optional)
}

// while ([condition]) { [body] }
export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;            // The condition expression for the while loop
  body: Statement[];                // The statements to execute in the loop body
}

// for ([initializer]; [condition]; [increment]) { [body] }
export interface ForStatement {
  type: 'ForStatement';
  initializer: Statement;          // The initialization statement (e.g., variable declaration)
  condition: Expression;           // The condition expression for the loop
  increment: Statement;            // The increment statement (e.g., variable update)
  body: Statement[];               // The statements to execute in the loop body
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value?: Expression;                // The expression to return (optional, it can be just 'return;' with no value)
}

// Root node, every .mrs file is a Program
export type Program = {
  type: 'Program';
  body: Statement[];                // The top-level statements in the program
}
