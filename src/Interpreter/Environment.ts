import { LoxType } from "../Parser/Expr";

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
