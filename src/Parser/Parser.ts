import type { Token } from "moo";
import {
  Assign,
  Binary,
  Expr,
  Grouping,
  Literal,
  LoxType,
  Variable,
} from "./Expr";
import { lexerDef, tokens } from "./Lexer";
import { Block, Expression, Print, Stmt, Var } from "./Stmt";

type TokenType = keyof typeof lexerDef;
export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }
  matchValue(...values: string[]) {
    for (const value of values) {
      if (this.checkValue(value)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  advance() {
    if (!(this.current > this.tokens.length)) this.current++;
    return this.previous();
  }

  peek() {
    return this.tokens[this.current] || null;
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  check(type: TokenType) {
    if (this.current >= this.tokens.length) return false;
    return this.peek().type == type;
  }
  checkValue(value: string) {
    if (this.current >= this.tokens.length) return false;
    return this.peek().value == value;
  }
  expression() {
    return this.assignment();
  }
  equality() {
    let expr = this.comparison();
    while (this.matchValue("!=", "==")) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }
    return expr;
  }
  comparison(): Expr {
    let expr = this.term();

    while (this.matchValue(">", ">=", "<", "<=")) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  private term() {
    let expr = this.factor();

    while (this.matchValue("-", "+")) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  private factor() {
    let expr: Expr = this.primary();

    while (this.matchValue("/", "*")) {
      const operator = this.previous();
      const right = this.primary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private primary() {
    if (this.matchValue("false")) return new Literal(false);
    if (this.matchValue("true")) return new Literal(true);
    if (this.matchValue("nil")) return new Literal(null);

    if (this.match("number", "string")) {
      return new Literal(this.parseRaw(this.previous().value));
    }

    if (this.match("lparen")) {
      const expr = this.expression();
      this.consumeValue(")", "Expect ')' after expression.");
      return new Grouping(expr);
    }
    if (this.match("identifier")) return new Variable(this.previous());
    this.error(this.peek(), "Expect expression.");
    process.exit();
  }
  private parseRaw(v: string) {
    if (v.match(/^\d/)) {
      return parseFloat(v);
    } else if (v.startsWith('"')) {
      return v.slice(1, -1);
    }
  }
  consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    this.error(this.peek(), message);
  }
  consumeValue(value: string, message: string) {
    if (this.checkValue(value)) return this.advance();

    this.error(this.peek(), message);
  }
  error(token: Token, message: string) {
    if (token) {
      console.log("line " + token.line, "at end:", message);
    } else {
      console.log(message);
      //   console.log("line " + token.line, "at '" + token.value + "':", message);
    }
  }
  parse() {
    const statements: Stmt[] = [];
    while (!(this.current >= this.tokens.length)) {
      statements.push(this.declaration());
    }
    return statements;
  }
  declaration() {
    try {
      if (this.matchValue("var")) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }
  varDeclaration() {
    const name = this.consume("identifier", "Expect variable name.");

    let initializer = null;
    if (this.matchValue("=")) {
      initializer = this.expression();
    }

    if (this.peek() && this.peek().value === ";") this.advance();
    return new Var(name, initializer);
  }

  statement() {
    if (this.matchValue("print")) return this.printStatement();
    if (this.matchValue("{")) return new Block(this.block());

    return this.expressionStatement();
  }
  printStatement() {
    const value = this.expression();
    if (this.peek() && this.peek().value === ";") this.advance();
    return new Print(value);
  }
  expressionStatement() {
    const expr = this.expression();
    // this.consume(";", "Expect ';' after expression.");
    if (this.peek() && this.peek().value === ";") this.advance();
    return new Expression(expr);
  }
  block() {
    const statements: Stmt[] = [];

    while (!this.checkValue("}") && !(this.current >= this.tokens.length)) {
      statements.push(this.declaration());
    }

    this.consumeValue("}", "Expect '}' after block.");
    return statements;
  }

  private synchronize() {
    this.advance();

    while (!(this.current >= this.tokens.length)) {
      if (this.previous().type == "semi") return;

      switch (this.peek().value) {
        case "class":
        case "fun":
        case "var":
        case "for":
        case "if":
        case "while":
        case "print":
        case "return":
          return;
      }

      this.advance();
    }
  }
  assignment() {
    const expr = this.equality();

    if (this.matchValue("=")) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }
}
class ParseError extends Error {}
