import type { Token } from "../Util/Token";
import type { LoxType } from "../Interpreter/Interpreter";
export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}
export class Assign extends Expr {
  constructor(readonly name: Token, readonly value: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
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
export class Call extends Expr {
  constructor(
    readonly callee: Expr,
    readonly paren: Token,
    readonly args: Expr[]
  ) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}
export class Get extends Expr {
  constructor(readonly object: Expr, readonly name: Token) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGetExpr(this);
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
export class Unary extends Expr {
  constructor(readonly operator: Token, readonly right: Expr) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}
export class Logical extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}
export class Variable extends Expr {
  constructor(readonly name: Token) {
    super();
  }
  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}
export interface ExprVisitor<R> {
  visitAssignExpr(expr: Assign): R;
  visitBinaryExpr(expr: Binary): R;
  visitCallExpr(expr: Call): R;
  visitGetExpr(expr: Get): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitLogicalExpr(expr: Logical): R;
  visitVariableExpr(expr: Variable): R;
}
