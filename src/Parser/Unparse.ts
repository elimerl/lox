import { Token } from "moo";
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  ExprVisitor,
  Assign,
  Variable,
  Call,
} from "./Expr";
import { tokens } from "./Lexer";
import { Parser } from "./Parser";
import {
  Block,
  Expression,
  Function,
  If,
  Print,
  Return,
  Stmt,
  StmtVisitor,
  Var,
} from "./Stmt";
//@ts-expect-error
export class Unparser implements ExprVisitor<string>, StmtVisitor<string> {
  static print(statements: Stmt[]) {
    return new Unparser().print(statements);
  }
  print(statements: Stmt[]) {
    let out = "";
    statements.forEach((statement, i) => {
      //@ts-expect-error
      out += statement.accept(this) + (i === statements.length - 1 ? "" : "\n");
    });
    return out;
  }
  visitBlockStmt(stmt: Block) {
    return `{
  ${this.print(stmt.statements)}
}`;
  }
  visitVarStmt(stmt: Var) {
    //@ts-expect-error
    return `var ${stmt.name.value} = ${stmt.initializer.accept(this)};`;
  }
  visitExpressionStmt(stmt: Expression) {
    //@ts-expect-error
    return (stmt.expression.accept(this) as string) + ";";
  }
  visitAssignExpr(expr: Assign) {
    //@ts-expect-error
    return `${expr.name.value} = ${expr.value.accept(this)}`;
  }
  visitLiteralExpr(expr: Literal) {
    return JSON.stringify(expr.value.toString());
  }
  visitBinaryExpr(expr: Binary) {
    //@ts-expect-error
    return `${expr.left.accept(this)} ${
      expr.operator.value
      //@ts-expect-error
    } ${expr.right.accept(this)}`;
  }
  visitVariableExpr(expr: Variable) {
    return expr.name.value;
  }
  visitPrintStmt(stmt: Print) {
    //@ts-expect-error
    return `print ${stmt.expression.accept(this)};`;
  }
  visitIfStmt(stmt: If) {
    return `if (${
      //@ts-expect-error
      stmt.condition.accept(this)
    }) ${
      //@ts-expect-error
      stmt.thenBranch.accept(this)
    } ${
      //@ts-expect-error
      stmt.elseBranch ? `else ${stmt.elseBranch.accept(this)}` : ""
    }`;
  }
  visitReturnStmt(stmt: Return) {
    //@ts-expect-error
    return `return ${stmt.value.accept(this)};`;
  }
  visitGroupingExpr(expr: Grouping) {
    //@ts-expect-error
    return `(${expr.expression.accept(this)})`;
  }
  visitFunctionStmt(stmt: Function) {
    return `fun ${stmt.name.value}(${stmt.params
      .map((v) => v.value)
      .join(", ")}) {
  ${this.print(stmt.body)}
}`;
  }
  visitCallExpr(expr: Call) {
    //@ts-expect-error
    return `${expr.callee.accept(this)}(${expr.args
      //@ts-expect-error
      .map((v) => v.accept(this))
      .join(", ")})`;
  }
}

console.log(
  Unparser.print(
    new Parser(
      tokens(`
      fun print(str) {
        print str
      }
      moo()
    `) as Token[]
    ).parse()
  )
);
