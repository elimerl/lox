import type { Token } from "moo";
import { Expr } from "./Expr";
export type LoxType = null | number | string | boolean;
export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}
export class Block extends Stmt {
  constructor(readonly statements: List<Stmt>) {
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
export interface StmtVisitor<R> {
  visitBlockStmt(stmt: Block): R;
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
}
