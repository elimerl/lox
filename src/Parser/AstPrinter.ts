import { Binary, Expr, Grouping, Literal, ExprVisitor } from "./Expr";

export class AstPrinter implements ExprVisitor<string> {
  static print(expr: Expr) {
    return new AstPrinter().print(expr);
  }
  print(expr: Expr) {
    return expr.accept(this);
  }
  public visitBinaryExpr(expr: Binary) {
    return this.parenthesize(expr.operator.text, expr.left, expr.right);
  }

  public visitGroupingExpr(expr: Grouping) {
    return this.parenthesize("group", expr.expression);
  }

  public visitLiteralExpr(expr: Literal) {
    if (expr.value == null) return "nil";
    return expr.value.toString();
  }

  parenthesize(name: string, ...exprs: Expr[]) {
    let str = "(" + name;
    for (const expr of exprs) {
      str += " ";
      str += expr.accept(this);
    }
    str += ")";

    return str;
  }
}
