import Marselo from "../src/marselo";

const mrs = new Marselo();

// Trying to use .mrs with embedded code
mrs.run(`
fn factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
print(factorial(5)); // Should print 120
`);

export default mrs;
