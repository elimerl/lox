import { LoxType } from "./Interpreter";

export class Environment {
  values = new Map<string, LoxType>();
  constructor(readonly enclosing?: Environment) {}
  define(name: string, value: LoxType) {
    this.values.set(name, value);
  }
  get(name: string) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.enclosing) return this.enclosing.get(name);

    throw new Error("Undefined variable '" + name + "'.");
  }
  getAt(distance: number, name: string) {
    return this.ancestor(distance).values.get(name);
  }
  ancestor(distance: number) {
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing;
    }

    return environment;
  }
  assign(name: string, value: LoxType) {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new Error("Undefined variable '" + name + "'.");
  }
}
