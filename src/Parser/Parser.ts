import type { Token } from "moo";
import { Binary, Expr, Grouping, Literal, LoxType } from "./Expr";
import { lexerDef, tokens } from "./Lexer";
import { Expression, Print, Stmt } from "./Stmt";

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
    return this.equality();
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
      this.consume(")", "Expect ')' after expression.");
      return new Grouping(expr);
    }
    this.error(this.peek(), "Expect expression.");
  }
  private parseRaw(v: string) {
    if (v.match(/^\d/)) {
      return parseFloat(v);
    } else if (v.startsWith('"')) {
      return v.slice(1, -1);
    }
  }
  consume(type: TokenType | string, message: string) {
    if (tokens[type] ? this.check(type as TokenType) : this.checkValue(type))
      return this.advance();

    this.error(this.peek(), message);
  }
  error(token: Token, message: string) {
    if (token) {
      console.log("line " + token.line, "at end:", message);
    } else {
      console.log(message);
      //   console.log("line " + token.line, "at '" + token.value + "':", message);
    }
    process.exit(1);
  }
  parse() {
    const statements: Stmt[] = [];
    while (!(this.current >= this.tokens.length)) {
      statements.push(this.statement());
    }
    return statements;
  }
  statement() {
    if (this.matchValue("print")) return this.printStatement();

    return this.expressionStatement();
  }
  printStatement() {
    const value = this.expression();
    this.consume(";", "Expect ';' after value.");
    return new Print(value);
  }
  expressionStatement() {
    const expr = this.expression();
    console.log(expr);
    this.consume(";", "Expect ';' after expression.");
    return new Expression(expr);
  }
}
