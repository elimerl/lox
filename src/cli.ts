import getStdin = require("get-stdin");
import { Interpreter } from "./Interpreter/Interpreter";
import { tokens } from "./Parser/Lexer";
import { Parser } from "./Parser/Parser";
(async () => {
  const prog = await getStdin();
  const parser = new Parser(tokens(prog));
  const node = parser.parse();
  Interpreter.interpret(node);
})();
