/*
 * When the evaluator reaches a return statement, it needs to stop the loop and return the value to the caller.
 * Since `execute()` returns `void`, we can use an exception-like mechanism to signal that a return statement has been encountered.
 */

class ReturnSignal {
  constructor(public value: any) { }
}

export default ReturnSignal;
