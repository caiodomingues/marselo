// Same as Scope
class Scope {
  private variables: Map<string, any> = new Map();
  private parent: Scope | null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  // Store a variable in the scope
  set(name: string, value: any): void {
    this.variables.set(name, value);
  }

  // Search an variable in the current scope and parent scopes
  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }

    if(this.parent) {
      return this.parent.get(name);
    }

    throw new Error(`Variable "${name}" not found`);
  }

  // Assign/update a variable in the current scope or parent scopes
  assign(name: string, value: any): void {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }

    throw new Error(`Variable "${name}" not found`);
  }
}

export default Scope;
