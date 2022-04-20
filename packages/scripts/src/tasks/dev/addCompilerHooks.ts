import { Compiler } from "webpack";
import { clearConsole, isInteractive } from "../../shared/terminal";

export default function addCompilerHooks(compiler: Compiler) {
  compiler.hooks.invalid.tap("invalid", () => {
    if (isInteractive) {
      clearConsole();
    }
    console.log("Compiling...");
  });
}
