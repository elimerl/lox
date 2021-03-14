import chalk = require("chalk");
import { LoxType } from "../Parser/Expr";

export function stringify(value: LoxType) {
  if (typeof value === "string") return value;
  else if (typeof value === "number") return value.toString();
  else if (typeof value === "boolean") return value;
  else if (value === null) return "nil";
}
export function pretty(value: LoxType) {
  if (typeof value === "string") return value;
  else if (typeof value === "number") return chalk.yellow(value.toString());
  else if (typeof value === "boolean") return chalk.bold.green(value);
  else if (value === null) return chalk.bold.white("nil");
}
