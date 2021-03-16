import {
  Assign,
  Binary,
  Call,
  Expr,
  ExprVisitor,
  Get,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from "../Parser/Expr";
import {
  StmtVisitor,
  Expression,
  Print,
  Stmt,
  Var,
  Block,
  If,
  While,
  Function,
  Return,
  Class,
} from "../Parser/Stmt";
import { Token } from "../Util/Token";
import { pretty, stringify } from "../Util/util";
import { Environment } from "./Environment";
import { Resolver } from "./Resolver";
const nil = null;
export interface IInterpreterOptions {
  pretty: boolean;
}
export type LoxType =
  | null
  | number
  | string
  | boolean
  | LoxCallable
  | LoxClass
  | LoxInstance;
export class Interpreter implements ExprVisitor<LoxType>, StmtVisitor<LoxType> {
  globals: Environment = new Environment();
  locals: Map<Expr, number> = new Map();

  private environment = this.globals;
  constructor(readonly options: IInterpreterOptions = { pretty: false }) {
    this.globals.define(
      "clock",
      new ForeignFunction(() => {
        return Date.now() / 1000;
      }, 0)
    );
  }
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
    if (object == nil) return false;
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
    return nil;
  }
  equals(a: LoxType, b: LoxType): boolean {
    if (
      (typeof a === "number" && typeof b === "number") ||
      (typeof a === "string" && typeof b === "string")
    ) {
      return a === b;
    }
    if (a === nil && b === nil) return true;

    if (a === nil) return false;
  }
  visitUnaryExpr(expr: Unary) {
    const right = this.evaluate(expr.right);
    switch (expr.operator.value) {
      case "-":
        return -right;
      case "!":
        return !right;
    }
    // Unreachable.
    return nil;
  }

  interpret(statements: Stmt[]) {
    let returnValue = nil;
    const resolver = new Resolver(this);
    resolver.resolve(statements);

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
  visitReturnStmt(stmt: Return) {
    throw new ReturnErr(this.evaluate(stmt.value));
    // Unreachable.
    return nil;
  }
  visitExpressionStmt(stmt: Expression) {
    const value = this.evaluate(stmt.expression);
    return value;
  }
  visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(this.options.pretty ? pretty(value) : stringify(value));
    return nil;
  }
  visitVarStmt(stmt: Var) {
    let value = nil;
    if (stmt.initializer != nil) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.value, value);
    return nil;
  }
  visitWhileStmt(stmt: While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return nil;
  }
  visitVariableExpr(expr: Variable) {
    return this.lookUpVariable(expr.name, expr);
  }
  lookUpVariable(name: Token, expr: Variable) {
    const distance = this.locals.get(expr);
    if (distance != null) {
      return this.environment.getAt(distance, name.value);
    } else {
      return this.globals.get(name.value);
    }
  }
  visitAssignExpr(expr: Assign) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name.value, value);
    return value;
  }
  visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return nil;
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
  visitIfStmt(stmt: If) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != nil) {
      this.execute(stmt.elseBranch);
    }
    return nil;
  }
  visitLogicalExpr(expr: Logical) {
    const left = this.evaluate(expr.left);

    if (expr.operator.value === "or") {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }
  visitCallExpr(expr: Call) {
    const callee = this.evaluate(expr.callee);

    const args: LoxType[] = [];
    for (const argument of expr.args) {
      args.push(this.evaluate(argument));
    }
    if (
      !(
        callee instanceof LoxFunction ||
        callee instanceof ForeignFunction ||
        callee instanceof LoxClass
      )
    ) {
      throw new Error("Can only call functions and classes.");
    }

    const fn = callee as LoxCallable;

    if (args.length != fn.arity) {
      throw new Error(
        "Expected " + fn.arity + " arguments but got " + args.length + "."
      );
    }

    return fn.call(this, args);
  }
  visitFunctionStmt(stmt: Function) {
    const fn = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.value, fn);
    return null;
  }
  visitClassStmt(stmt: Class) {
    this.environment.define(stmt.name.value, null);
    const klass = new LoxClass(stmt.name.value);
    this.environment.assign(stmt.name.value, klass);
    return null;
  }
  visitGetExpr(expr: Get) {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return (<LoxInstance>object).fields.get(expr.name.value) || nil;
    }

    throw new Error("Only instances have properties.");
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }
}

export interface LoxCallable {
  arity: number;

  call(interpreter: Interpreter, args: LoxType[]): LoxType;
}
export class LoxFunction implements LoxCallable {
  arity: number;
  closure: Environment;

  constructor(readonly declaration: Function, closure: Environment) {
    this.arity = declaration.params.length;
    this.closure = closure;
  }
  call(interpreter: Interpreter, args: LoxType[]) {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].value, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      return (returnValue as ReturnErr).value;
    }
    return null;
  }
}
export class LoxClass implements LoxCallable {
  arity = 0;
  constructor(readonly name: string) {}
  call(interpreter: Interpreter, args: LoxType[]) {
    const instance = new LoxInstance(this);
    return instance;
  }
}
export class LoxInstance {
  klass: LoxClass;
  fields = new Map<String, LoxType>();

  constructor(klass: LoxClass) {
    this.klass = klass;
  }
}
export class ForeignFunction implements LoxCallable {
  constructor(
    readonly fn: (interpreter: Interpreter, args: LoxType[]) => void | LoxType,
    public arity: number
  ) {}
  call(interpreter: Interpreter, args: LoxType[]) {
    const val = this.fn(interpreter, args);
    if (!val) return null;
    return val;
  }
}
class ReturnErr {
  constructor(readonly value: LoxType) {}
}
