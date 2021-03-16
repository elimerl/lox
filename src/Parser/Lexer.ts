import * as moo from "moo";
export const lexerDef = {
  WS: /[ \t]+/,
  comment: /\/\/.*?$/,
  number: /\d*\.?\d+/,
  string: /"(?:\\["\\]|[^\n"\\])*"/,
  lparen: "(",
  rparen: ")",
  lbrack: "{",
  rbrack: "}",
  keyword: [
    "true",
    "false",
    "var",
    "if",
    "else",
    "while",
    "for",
    "fun",
    "nil",
    "return",
    "class",
  ],
  NL: { match: /\n/, lineBreaks: true },
  operator: [
    "+",
    "-",
    "*",
    "/",
    "<",
    "<=",
    ">=",
    ">",
    "==",
    "!=",
    "!",
    "and",
    "or",
    "=",
    "var",
  ],
  semi: ";",
  comma: ",",
  dot: ".",
  identifier: /\w+/,
  error: moo.error,
};
const lexer = moo.compile(lexerDef);
export function tokens(str: string) {
  lexer.reset(str);
  const tokens: moo.Token[] = [...lexer];
  if (tokens[tokens.length - 1] && tokens[tokens.length - 1].type === "error") {
    const errToken = tokens[tokens.length - 1];
    console.log(`error on line ${errToken.line} col ${errToken.col}:
${errToken.text}`);
    return 1;
  }
  return tokens.filter(
    (v) => v.type !== "WS" && v.type !== "comment" && v.type !== "NL"
  );
}
export function tokensErrorHandled(str: string): moo.Token[] {
  const _tokens = tokens(str);
  if (_tokens === 1) process.exit(1);
  else return _tokens;
}
