import type { Token } from "moo";
import { Expr } from "./Expr";
export type LoxType = null | number | string | boolean;
export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}
export class Block extends Stmt {
  constructor(readonly statements: Stmt[]) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}
export class Expression extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}
export class If extends Stmt {
  constructor(
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch: Stmt
  ) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}
export class Print extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}
export class Var extends Stmt {
  constructor(readonly name: Token, readonly initializer: Expr) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
export class While extends Stmt {
  constructor(readonly condition: Expr, readonly body: Stmt) {
    super();
  }
  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
export interface StmtVisitor<R> {
  visitBlockStmt(stmt: Block): R;
  visitExpressionStmt(stmt: Expression): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
  visitWhileStmt(stmt: While): R;
}
