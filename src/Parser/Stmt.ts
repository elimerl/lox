import type { Token } from "moo";
import { Expr } from "./Expr";
export type LoxType = null | number | string | boolean;
export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
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
export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
}
