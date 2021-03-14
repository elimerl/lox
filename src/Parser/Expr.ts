import type { Token } from "moo";
export type LoxType = null | number | string | boolean;
export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}
export class Binary extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}
export class Grouping extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}
export class Literal extends Expr {
  constructor(readonly value: LoxType) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}
export interface ExprVisitor<R> {
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
}
