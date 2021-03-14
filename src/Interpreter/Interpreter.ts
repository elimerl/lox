import {
  Binary,
  Expr,
  ExprVisitor,
  Grouping,
  Literal,
  LoxType,
} from "../Parser/Expr";
import { tokens } from "../Parser/Lexer";
import { Parser } from "../Parser/Parser";
import { StmtVisitor, Expression, Print, Stmt } from "../Parser/Stmt";

export class Interpreter implements ExprVisitor<LoxType>, StmtVisitor<LoxType> {
  visitLiteralExpr(expr: Literal) {
    return expr.value;
  }
  visitGroupingExpr(expr: Grouping) {
    return this.evaluate(expr.expression);
  }
  evaluate(expr: Expr): LoxType {
    return expr.accept<LoxType>(this);
  }
  private isTruthy(object: LoxType) {
    if (object == null) return false;
    if (typeof object === "boolean") return object;
    return true;
  }
  visitBinaryExpr(expr: Binary) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.value) {
      case ">":
        return (left as number) > (right as number);
      case ">=":
        return (left as number) >= (right as number);
      case "<":
        return (left as number) < (right as number);
      case "<=":
        return (left as number) <= (right as number);
      case "-":
        return (left as number) - (right as number);
      case "/":
        return (left as number) / (right as number);
      case "*":
        return (left as number) * (right as number);
      case "+":
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }

        break;
      case "!=":
        return this.equals(left, right);
      case "==":
        return this.equals(left, right);

      default:
        break;
    }

    // Unreachable.
    return null;
  }
  equals(a: LoxType, b: LoxType): boolean {
    if (
      (typeof a === "number" && typeof b === "number") ||
      (typeof a === "string" && typeof b === "string")
    ) {
      return a === b;
    }
    if (a === null && b === null) return true;

    if (a === null) return false;
  }
  interpret(statements: Stmt[]) {
    for (const statement of statements) {
      this.execute(statement);
    }
  }
  static interpret(statements: Stmt[]) {
    new Interpreter().interpret(statements);
  }
  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
    return null;
  }
  visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(value);
    return null;
  }
}
