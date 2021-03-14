import getStdin = require("get-stdin");
import { Interpreter } from "./Interpreter/Interpreter";
import { tokens, tokensErrorHandled } from "./Parser/Lexer";
import { Parser } from "./Parser/Parser";
(async () => {
  const prog = await getStdin();
  const parser = new Parser(tokensErrorHandled(prog));
  const node = parser.parse();
  Interpreter.interpret(node);
})();
