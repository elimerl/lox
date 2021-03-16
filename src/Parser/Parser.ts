import type { Token } from "moo";
import {
  Assign,
  Binary,
  Call,
  Expr,
  Get,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from "./Expr";
import { lexerDef, tokens } from "./Lexer";
import {
  Block,
  Class,
  Expression,
  Function,
  If,
  Print,
  Return,
  Stmt,
  Var,
  While,
} from "./Stmt";

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
    let expr: Expr = this.unary();

    while (this.matchValue("/", "*")) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  private call() {
    let expr: Expr = this.primary();
    while (true) {
      if (this.match("lparen")) {
        expr = this.finishCall(expr);
      } else if (this.match("dot")) {
        const name = this.consume(
          "identifier",
          "Expect property name after '.'."
        );
        expr = new Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }
  finishCall(callee: Expr) {
    const args: Expr[] = [];
    if (!this.check("rparen")) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }

        args.push(this.expression());
      } while (this.match("comma"));
    }

    const paren = this.consume("rparen", "Expect ')' after arguments.");

    return new Call(callee, paren, args);
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
  unary() {
    if (this.matchValue("!", "-")) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
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
      if (this.matchValue("fun")) return this.function("function");
      if (this.matchValue("var")) return this.varDeclaration();
      if (this.matchValue("class")) return this.classDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }
  classDeclaration() {
    const name = this.consume("identifier", "Expect class name.");
    this.consume("lbrack", "Expect '{' before class body.");

    const methods: Function[] = [];
    while (!this.check("rbrack") && !(this.current >= this.tokens.length)) {
      methods.push(this.function("method"));
    }

    this.consume("rbrack", "Expect '}' after class body.");

    return new Class(name, methods);
  }
  function(kind: string) {
    const name = this.consume("identifier", "Expect " + kind + " name.");
    this.consume("lparen", "Expect '(' after " + kind + " name.");
    const parameters: Token[] = [];
    if (!this.check("rparen")) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }

        parameters.push(this.consume("identifier", "Expect parameter name."));
      } while (this.match("comma"));
    }
    this.consume("rparen", "Expect ')' after parameters.");
    this.consume("lbrack", "Expect '{' before " + kind + " body.");
    const body = this.block();
    return new Function(name, parameters, body);
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
    if (this.matchValue("if")) return this.ifStatement();
    if (this.matchValue("while")) return this.whileStatement();
    if (this.matchValue("for")) return this.forStatement();
    if (this.matchValue("return")) return this.returnStatement();

    return this.expressionStatement();
  }
  returnStatement() {
    const keyword = this.previous();
    let value = null;
    if (!this.check("semi")) {
      value = this.expression();
    }

    this.consume("semi", "Expect ';' after return value.");
    return new Return(keyword, value);
  }
  forStatement() {
    this.consume("lparen", "Expect '(' after 'for'.");
    let initializer: Stmt;
    if (this.match("semi")) {
      initializer = null;
    } else if (this.matchValue("var")) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }
    let condition = null;
    if (!this.check("semi")) {
      condition = this.expression();
    }
    this.consume("semi", "Expect ';' after loop condition.");
    let increment: Expr = null;
    if (!this.check("rparen")) {
      increment = this.expression();
    }
    this.consume("rparen", "Expect ')' after for clauses.");
    let body = this.statement();
    if (increment) {
      body = new Block([body, new Expression(increment)]);
    }
    if (condition == null) condition = new Literal(true);
    body = new While(condition, body);
    if (initializer) {
      body = new Block([initializer, body]);
    }

    return body;
  }
  whileStatement() {
    this.consume("lparen", "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume("rparen", "Expect ')' after condition.");
    const body = this.statement();

    return new While(condition, body);
  }
  ifStatement() {
    this.consume("lparen", "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume("rparen", "Expect ')' after if condition.");
    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.matchValue("else")) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch);
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
    const expr = this.or();

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
  or() {
    let expr = this.and();

    while (this.matchValue("or")) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }
  and() {
    let expr = this.equality();
    while (this.matchValue("and")) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }
}
class ParseError extends Error {}
