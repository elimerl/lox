#!/usr/bin/env node
import { readFileSync } from "fs";
import * as repl from "repl";
import { Interpreter } from "./Interpreter/Interpreter";
import { tokens as _tokens, tokensErrorHandled } from "./Parser/Lexer";
import { Parser } from "./Parser/Parser";
import { pretty } from "./Util/util";
import { Token } from "moo";
if (process.argv[2]) {
  const prog = readFileSync(process.argv[2]).toString();
  const tokens = tokensErrorHandled(prog);
  Interpreter.interpret(new Parser(tokens as Token[]).parse(), {
    pretty: true,
  });
} else {
  const interpreter = new Interpreter({
    pretty: true,
  });
  repl.start({
    eval(cmd, context, filename, cb) {
      const tokens = _tokens(cmd);
      if (typeof tokens === "number") cb(new Error(""), null);
      try {
        cb(null, interpreter.interpret(new Parser(tokens as Token[]).parse()));
      } catch (error) {
        cb(new Error(""), null);
      }
    },
    writer: pretty,
  });
}
