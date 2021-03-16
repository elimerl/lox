import chalk = require("chalk");
import type { Token } from "moo";
import {
  LoxClass,
  LoxFunction,
  LoxInstance,
  LoxType,
} from "../Interpreter/Interpreter";

export function stringify(value: LoxType) {
  if (typeof value === "string") return value;
  else if (typeof value === "number") return value.toString();
  else if (typeof value === "boolean") return value;
  else if (value instanceof LoxFunction)
    return "<function " + value.declaration.name.value + ">";
  else if (value instanceof LoxClass) return "<class " + value.name + ">";
  else if (value instanceof LoxInstance)
    return "<instance " + value.klass.name + ">";
  else if (value === null) return "nil";
  return (
    "Invalid print! This should never happen. Value: " + JSON.stringify(value)
  );
}
export function pretty(value: LoxType) {
  if (typeof value === "string") return value;
  else if (typeof value === "number") return chalk.yellow(value.toString());
  else if (typeof value === "boolean") return chalk.bold.green(value);
  else if (value instanceof LoxFunction)
    return "<function " + chalk.bold.green(value.declaration.name.value) + ">";
  else if (value instanceof LoxClass)
    return "<class " + chalk.bold.blue(value.name) + ">";
  else if (value instanceof LoxInstance)
    return "<instance " + chalk.bold.blue(value.klass.name) + ">";
  else if (value === null) return chalk.bold.white("nil");
  return chalk.bold.red(
    "Invalid print! This should never happen. Value: " + JSON.stringify(value)
  );
}
