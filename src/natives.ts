import readLineSync from 'readline-sync';

export const NATIVES: Record<string, (...args: any[]) => any> = {
  // A simple print function to output messages from the interpreted code
  print: (...args: any[]) => {
    console.log(...args);
  },

  // Return length of an array, throw an error if the argument is not an array
  len: (array: any[]) => {
    if (!Array.isArray(array)) {
      throw new Error(`len() expects an array, got ${typeof array}`);
    }
    return array.length;
  },

  // Push a value to an array, return the new length. Throw an error if the first argument is not an array
  push: (array: any[], value: any) => {
    if (!Array.isArray(array)) {
      throw new Error(`push() expects an array as the first argument, got ${typeof array}`);
    }
    array.push(value);
    return array.length;
  },

  // Pop a value from an array, return the removed element. Throw an error if the argument is not an array
  pop: (array: any[]) => {
    if (!Array.isArray(array)) {
      throw new Error(`pop() expects an array, got ${typeof array}`);
    }
    return array.pop();
  },

  // A simple range function to generate an array of numbers from start to end (exclusive)
  range: (start: number, end: number) => {
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new Error(`range() expects two numbers, got ${typeof start} and ${typeof end}`);
    }
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  },

  // A simple map function to apply a function to each element of an array and return a new array with the results
  map: (array: any[], func: (x: any) => any) => {
    if (!Array.isArray(array)) {
      throw new Error(`map() expects an array as the first argument, got ${typeof array}`);
    }
    if (typeof func !== 'function') {
      throw new Error(`map() expects a function as the second argument, got ${typeof func}`);
    }
    return array.map(func);
  },

  split: (str: string, separator: string) => {
    return str.split(separator);
  },

  join: (array: any[], separator: string) => {
    return array.join(separator);
  },

  upper: (str: string) => {
    return str.toUpperCase();
  },

  lower: (str: string) => {
    return str.toLowerCase();
  },

  trim: (str: string) => {
    return str.trim();
  },

  substring: (str: string, start: number, end?: number) => {
    return str.substring(start, end);
  },

  input: (prompt: string) => {
    return readLineSync.question(prompt ?? '');
  },

  num: (value: any) => {
    const res = Number(value);
    if (isNaN(res)) {
      throw new Error(`num() could not convert "${value}" to a number`);
    }
    return res;
  },
};
