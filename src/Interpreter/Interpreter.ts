import {
  Assign,
  Binary,
  Expr,
  ExprVisitor,
  Grouping,
  Literal,
  LoxType,
  Variable,
} from "../Parser/Expr";
import {
  StmtVisitor,
  Expression,
  Print,
  Stmt,
  Var,
  Block,
} from "../Parser/Stmt";
import { pretty, stringify } from "../Util/util";
import { Environment } from "./Environment";
export interface IInterpreterOptions {
  pretty: boolean;
}
export class Interpreter implements ExprVisitor<LoxType>, StmtVisitor<LoxType> {
  environment: Environment = new Environment();
  constructor(readonly options: IInterpreterOptions = { pretty: false }) {}
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
    let returnValue = null;
    for (const statement of statements) {
      returnValue = this.execute(statement);
    }
    return returnValue;
  }
  static interpret(statements: Stmt[], options?: IInterpreterOptions) {
    return new Interpreter(options).interpret(statements);
  }
  private execute(stmt: Stmt) {
    return stmt.accept(this);
  }

  visitExpressionStmt(stmt: Expression) {
    const value = this.evaluate(stmt.expression);
    return value;
  }
  visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(this.options.pretty ? pretty(value) : stringify(value));
    return null;
  }
  visitVarStmt(stmt: Var) {
    let value = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.value, value);
    return null;
  }
  visitVariableExpr(expr: Variable) {
    return this.environment.get(expr.name.text);
  }
  visitAssignExpr(expr: Assign) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name.value, value);
    return value;
  }
  visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }
  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }
}
