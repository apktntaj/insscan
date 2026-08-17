import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const coreRoot = path.join(root, "core");
const forbiddenGlobals = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "indexedDB",
]);
const violations: string[] = [];

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

for (const filePath of walk(coreRoot).filter((file) => file.endsWith(".ts"))) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  function report(node: ts.Node, message: string): void {
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push(
      `${path.relative(root, filePath)}:${position.line + 1}:${position.character + 1} ${message}`,
    );
  }

  function inspect(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node)
      && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith(".")) {
        const resolved = path.resolve(path.dirname(filePath), specifier);
        if (!resolved.startsWith(`${coreRoot}${path.sep}`)) {
          report(node, `core import escapes core: "${specifier}"`);
        }
      } else if (!specifier.startsWith("@core/")) {
        report(node, `core depends on external/framework module: "${specifier}"`);
      }
    }

    if (ts.isIdentifier(node) && forbiddenGlobals.has(node.text)) {
      report(node, `core uses platform global: "${node.text}"`);
    }

    if (
      ts.isPropertyAccessExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "process"
      && node.name.text === "env"
    ) {
      report(node, "core reads process.env; inject configuration through a port or factory");
    }

    ts.forEachChild(node, inspect);
  }

  inspect(sourceFile);
}

const sharedRoot = path.join(root, "app", "shared");
const featuresRoot = path.join(root, "app", "features");

for (const filePath of walk(sharedRoot).filter((file) => /\.[jt]sx?$/.test(file))) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function inspectShared(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      const importsFeature = specifier.startsWith("@/app/features/")
        || (
          specifier.startsWith(".")
          && path.resolve(path.dirname(filePath), specifier).startsWith(
            `${featuresRoot}${path.sep}`,
          )
        );
      if (importsFeature) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push(
          `${path.relative(root, filePath)}:${position.line + 1}:${position.character + 1} shared application code depends on a feature: "${specifier}"`,
        );
      }
    }
    ts.forEachChild(node, inspectShared);
  }

  inspectShared(sourceFile);
}

if (violations.length > 0) {
  console.error("Architecture boundary violations:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Architecture boundaries are valid: core is independent and shared does not depend on features.");
}
