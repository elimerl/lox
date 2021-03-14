import * as moo from "moo";
const lexer = moo.compile({
  WS: /[ \t]+/,
  comment: /\/\/.*?$/,
  number: /\d+(?:\\.\d+)?/,
  string: /"(?:\\["\\]|[^\n"\\])*"/,
  lparen: "(",
  rparen: ")",
  lbrack: "{",
  rbrack: "}",
  keyword: ["true", "false", "var", "if", "else", "while", "for", "fun"],
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
    "return",
    "class",
  ],
  semi: ";",
  comma: ",",
  identifier: /\w+/,
  error: moo.error,
});
export function tokens(str: string) {
  lexer.reset(str);
  const tokens: moo.Token[] = [...lexer];
  if (tokens[tokens.length - 1].type === "error") {
    const errToken = tokens[tokens.length - 1];
    console.log(`error on line ${errToken.line} col ${errToken.col}:
${errToken.text}`);
    process.exit(1);
  }
  return tokens;
}

console.log(
  tokens(`class Breakfast {
	cook() {
	  print "Eggs a-fryin'!";
	}
  
	serve(who) {
	  print "Enjoy your breakfast, " + who + ".";
	}
  }
  `)
);
