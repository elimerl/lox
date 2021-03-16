import { writeFileSync } from "fs";
import { join } from "path";
import { format } from "prettier";

let str = "";
const prtStr = (s = "") => {
  str += s;
};
class GenerateAst {
  static main(args: string[]) {
    if (args.length !== 1) {
      console.log("Usage: generate_ast <output directory>");
      process.exit(64);
    }
    const outputDir = args[0];
    this.defineAst(outputDir, "Expr", [
      "Assign   : Token name, Expr value",
      "Binary   : Expr left, Token operator, Expr right",
      "Call     : Expr callee, Token paren, Expr[] args",
      "Get      : Expr object, Token name",
      "Grouping : Expr expression",
      "Literal  : LoxType value",
      "Unary    : Token operator, Expr right",
      "Logical  : Expr left, Token operator, Expr right",
      "Variable : Token name",
    ]);
    this.defineAst(outputDir, "Stmt", [
      "Block      : Stmt[] statements",
      "Class      : Token name, Function[] methods",
      "Expression : Expr expression",
      "Function   : Token name, Token[] params," + " Stmt[] body",
      "If         : Expr condition, Stmt thenBranch," + " Stmt elseBranch",
      "Print      : Expr expression",
      "Return     : Token keyword, Expr value",
      "Var        : Token name, Expr initializer",
      "While      : Expr condition, Stmt body",
    ]);
  }
  static defineAst(outputDir: string, baseName: string, types: string[]) {
    const path = outputDir + "/" + baseName + ".ts";
    str = "";
    prtStr(
      `import type {Token} from '../Util/Token';import type {LoxType} from '../Interpreter/Interpreter';${
        baseName !== "Expr" ? "import {Expr} from './Expr'" : ""
      };    `
    );
    prtStr("export abstract class " + baseName + " {");

    prtStr("  abstract accept<R>(visitor:" + baseName + "Visitor<R>):R;");
    prtStr("}");
    for (const type of types) {
      const className = type.split(":")[0].trim();
      const fields = type.split(":")[1].trim();
      this.defineType(baseName, className, fields);
    }
    this.defineVisitor(baseName, types);
    writeFileSync(
      path,
      format(str, {
        filepath: path,
        parser: "babel-ts",
      })
    );
  }
  private static defineVisitor(baseName: string, types: string[]) {
    prtStr("export interface " + baseName + "Visitor<R> {");
    for (const type of types) {
      const typeName = type.split(":")[0].trim();
      prtStr(
        "    visit" +
          typeName +
          baseName +
          "(" +
          baseName.toLowerCase() +
          ":" +
          typeName +
          "):R;"
      );
    }
    prtStr("}");
  }
  private static defineType(
    baseName: string,
    className: string,
    fieldList: string
  ) {
    prtStr("   export class " + className + " extends " + baseName + " {");
    const fields = fieldList
      .split(", ")
      .map((v) => v.split(" ")[1] + ":" + v.split(" ")[0]);
    // Constructor.
    prtStr(
      "    constructor(" +
        fields.map((v) => "readonly " + v).join(",") +
        ") {super();}"
    );

    prtStr();
    prtStr("    ");
    prtStr("     accept<R>(visitor:" + baseName + "Visitor<R>):R {");
    prtStr("      return visitor.visit" + className + baseName + "(this);");
    prtStr("    }");

    prtStr("  }");
  }
}
GenerateAst.main([join(__dirname, "../Parser")]);
