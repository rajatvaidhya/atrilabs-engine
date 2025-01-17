#!/usr/bin/env node
import chalk from "chalk";
import yargs from "yargs";
import path from "path";
import fs from "fs";
import * as ts from "typescript";

process.on("unhandledRejection", (reason) => {
  console.log(chalk.red(`create-atri-app failed with reason\n ${reason}`));
});

function processArgs() {
  return yargs
    .option("name", {
      alias: "n",
      default: "my_app",
      description: "name of the app",
    })
    .option("author", { alias: "a", default: "", description: "name <email>" })
    .option("description", {
      alias: "d",
      default: "",
      description: "describe the app",
    })
    .boolean("typescript").argv as {
    name: string;
    author: string;
    description: string;
    typescript: boolean;
  };
}

function createAppDirectory(dest: string) {
  if (fs.existsSync(dest)) {
    console.log(chalk.red(`A directory at ${dest} already exists.`));
    process.exit(1);
  }
  fs.mkdirSync(dest);
}

function createPackageJSON(
  data: {
    name: string;
    author: string;
    description: string;
  },
  options: { dest: string }
) {
  const str = JSON.stringify(
    {
      name: data.name,
      author: data.author,
      description: data.description,
      scripts: { dev: "dev-atri-app" },
      // Update these versions on every release
      dependencies: {
        "@atrilabs/atri-app-core": "^0.0.90",
        "@atrilabs/canvas-zone": "^0.0.90",
        "@atrilabs/commands": "^0.0.90",
        "@atrilabs/commands-builder": "^0.0.90",
        "node-noop": "^1.0.0",
      },
    },
    null,
    2
  );
  const fullPath = path.resolve(options.dest, "package.json");
  if (fs.existsSync(fullPath)) {
    console.log(
      chalk.red(
        `A package.json file at ${path.resolve(options.dest)} already exists.`
      )
    );
    process.exit(1);
  }
  fs.writeFileSync(fullPath, str);
}

function createPageScaffold() {
  return [`export default function(){`, ``, `}`].join("\n");
}

function convertTsxToJsX(filepath: string) {
  if (!filepath.endsWith(".tsx")) {
    throw Error("Only files ending with .tsx can be converted to .jsx");
  }
  const code = fs.readFileSync(filepath).toString();
  return ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      jsx: ts.JsxEmit.Preserve,
    },
  }).outputText;
}

function copyAppWrapper(options: { dest: string; useTypescript: boolean }) {
  const moduleExtenstion = options.useTypescript ? ".tsx" : ".jsx";
  const appWrapperPath = require.resolve(
    "@atrilabs/atri-app-core/src/components/AppWrapper" + moduleExtenstion
  );
  const content =
    moduleExtenstion === ".tsx"
      ? fs.readFileSync(appWrapperPath)
      : convertTsxToJsX(appWrapperPath);
  fs.writeFileSync(
    path.resolve(options.dest, "pages", "_app" + moduleExtenstion),
    content
  );
}

function copyDocument(options: { dest: string; useTypescript: boolean }) {
  const moduleExtenstion = options.useTypescript ? ".tsx" : ".jsx";
  const documentPath = require.resolve(
    "@atrilabs/atri-app-core/src/components/Document" + moduleExtenstion
  );
  const content =
    moduleExtenstion === ".tsx"
      ? fs.readFileSync(documentPath)
      : convertTsxToJsX(documentPath);
  fs.writeFileSync(
    path.resolve(options.dest, "pages", "_document" + moduleExtenstion),
    content
  );
}

function createPagesDirectory(options: {
  dest: string;
  useTypescript: boolean;
}) {
  const { dest, useTypescript } = options;
  const fullPath = path.resolve(dest, "pages");
  if (fs.existsSync(fullPath)) {
    console.log(
      chalk.red(`A pages directory at ${path.resolve(dest)} already exists.`)
    );
    process.exit(1);
  }
  fs.mkdirSync(fullPath);

  const indexPagePath = `${path.resolve(
    fullPath,
    "index" + (useTypescript ? ".tsx" : ".jsx")
  )}`;
  fs.writeFileSync(indexPagePath, createPageScaffold());

  copyAppWrapper({ dest, useTypescript });
}

function createEslintRC(options: { dest: string }) {
  fs.writeFileSync(
    path.resolve(options.dest, ".eslintrc.json"),
    JSON.stringify(
      {
        env: {
          es6: true,
        },
        parserOptions: {
          sourceType: "module",
        },
        extends: ["plugin:import/react"],
      },
      null,
      2
    )
  );
}

function main() {
  const args = processArgs();
  const dirname = args.name.startsWith("@")
    ? args.name.split("/")[1]
    : args.name;
  if (dirname === undefined) {
    console.log(
      chalk.red(`The directory name must be a valid npm package name.`)
    );
    process.exit(1);
  }
  const dest = path.resolve(dirname);
  createAppDirectory(dest);
  createPackageJSON(args, { dest });
  createPagesDirectory({ dest, useTypescript: args.typescript });
  createEslintRC({ dest });
  copyDocument({ dest, useTypescript: args.typescript });
}

main();
