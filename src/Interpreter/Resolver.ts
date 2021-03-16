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
  Block,
  Class,
  Expression,
  Function,
  If,
  Print,
  Return,
  Stmt,
  StmtVisitor,
  Var,
  While,
} from "../Parser/Stmt";
import { Token } from "../Util/Token";
import { Interpreter } from "./Interpreter";
export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  interpreter: Interpreter;
  scopes: Map<string, boolean>[] = [];

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }
  public visitBlockStmt(stmt: Block) {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
    return null;
  }
  beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }
  resolve(statements: Stmt[]) {
    for (const statement of statements) {
      this._resolve(statement);
    }
  }

  _resolve(stmt: Stmt | Expr) {
    // @ts-ignore why do i have to ignore this? cryptic error "Each member of the union type '(<R>(visitor: ExprVisitor<R>) => R) | (<R>(visitor: StmtVisitor<R>) => R)' has signatures, but none of those signatures are compatible with each other."
    // but hey it builds now
    stmt.accept(this);
  }

  visitGetExpr(expr: Get) {
    this._resolve(expr.object);
    return null;
  }

  endScope() {
    this.scopes.pop();
  }
  declare(name: Token) {
    if (this.scopes.length === 0) return;

    const scope = this.scopes[this.scopes.length - 1];
    scope.set(name.value, false);
  }
  define(name: Token) {
    if (this.scopes.length === 0) return;
    this.scopes[this.scopes.length - 1].set(name.value, true);
  }

  visitVarStmt(stmt: Var) {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this._resolve(stmt.initializer);
    }
    this.define(stmt.name);
    return null;
  }
  visitVariableExpr(expr: Variable) {
    if (
      !(this.scopes.length === 0) &&
      this.scopes[this.scopes.length - 1].get(expr.name.value) == false
    ) {
      console.log(
        expr.name,
        "Can't read local variable in its own initializer."
      );
    }

    this.resolveLocal(expr, expr.name);
    return null;
  }
  resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.value)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
  visitFunctionStmt(stmt: Function) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt);
    return null;
  }
  resolveFunction(stmt: Function) {
    this.beginScope();
    for (const param of stmt.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(stmt.body);
    this.endScope();
  }
  visitAssignExpr(expr: Assign) {
    this._resolve(expr.value);
    this.resolveLocal(expr, expr.name);
    return null;
  }
  visitExpressionStmt(stmt: Expression) {
    this._resolve(stmt.expression);
    return null;
  }
  visitIfStmt(stmt: If) {
    this._resolve(stmt.condition);
    this._resolve(stmt.thenBranch);
    if (stmt.elseBranch != null) this._resolve(stmt.elseBranch);
    return null;
  }
  visitPrintStmt(stmt: Print) {
    this._resolve(stmt.expression);
    return null;
  }
  visitReturnStmt(stmt: Return) {
    if (stmt.value != null) {
      this._resolve(stmt.value);
    }

    return null;
  }
  visitWhileStmt(stmt: While) {
    this._resolve(stmt.condition);
    this._resolve(stmt.body);
    return null;
  }
  visitBinaryExpr(expr: Binary) {
    this._resolve(expr.left);
    this._resolve(expr.right);
    return null;
  }
  visitCallExpr(expr: Call) {
    this._resolve(expr.callee);

    for (const argument of expr.args) {
      this._resolve(argument);
    }

    return null;
  }
  visitGroupingExpr(expr: Grouping) {
    this._resolve(expr.expression);
    return null;
  }
  visitLiteralExpr(expr: Literal) {
    return null;
  }
  visitLogicalExpr(expr: Logical) {
    this._resolve(expr.left);
    this._resolve(expr.right);
    return null;
  }
  visitUnaryExpr(expr: Unary) {
    this._resolve(expr.right);
    return null;
  }
  visitClassStmt(stmt: Class) {
    this.declare(stmt.name);
    this.define(stmt.name);
    return null;
  }
}
