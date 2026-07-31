import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const sourceRoot = join(projectRoot, 'src')
const sourceExtensions = new Set(['.ts', '.tsx'])
const codeExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx'])
const ignoredDirectoryNames = new Set([
  '.agents',
  '.codex',
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
])
const generatedSourcePrefix = normalizePath(
  join(sourceRoot, 'api', 'generated'),
)
const entryPoints = [normalizePath(join(sourceRoot, 'main.tsx'))]
const trackedArtifactPatterns = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)coverage\//,
  /(^|\/)debug(?:\.|\/)/i,
  /(^|\/)dist\//,
  /(^|\/)node_modules\//,
  /(^|\/)playwright-report\//,
  /(^|\/)test-results\//,
  /\.(?:log|tmp)$/i,
]
const packageUsageAllowlist = new Set([
  'jsdom',
  'oxlint',
  'tailwindcss',
  'typescript',
])

function normalizePath(path) {
  return resolve(path).replaceAll('\\', '/')
}

function projectPath(path) {
  return relative(projectRoot, path).replaceAll('\\', '/')
}

function collectFiles(directory, extensions) {
  const result = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectoryNames.has(entry.name)) {
      continue
    }

    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      result.push(...collectFiles(path, extensions))
    } else if (extensions.has(extname(entry.name))) {
      result.push(normalizePath(path))
    }
  }

  return result
}

function isTestFile(path) {
  return (
    /(?:^|\/)(?:e2e|e2e-live|test)\//.test(projectPath(path)) ||
    /\.(?:component\.)?test\.[jt]sx?$/.test(path)
  )
}

function packageNameFromSpecifier(specifier) {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('@/') ||
    specifier.startsWith('node:')
  ) {
    return null
  }

  const parts = specifier.split('/')
  return specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0]
}

function resolveInternalImport(importer, specifier, sourceFiles) {
  let base

  if (specifier.startsWith('@/')) {
    base = join(sourceRoot, specifier.slice(2))
  } else if (specifier.startsWith('.')) {
    base = resolve(dirname(importer), specifier)
  } else {
    return null
  }

  const extension = extname(base)
  const withoutJavaScriptExtension =
    extension === '.js' || extension === '.jsx'
      ? base.slice(0, -extension.length)
      : base
  const candidates = [
    base,
    withoutJavaScriptExtension,
    `${withoutJavaScriptExtension}.ts`,
    `${withoutJavaScriptExtension}.tsx`,
    join(withoutJavaScriptExtension, 'index.ts'),
    join(withoutJavaScriptExtension, 'index.tsx'),
  ].map(normalizePath)

  return candidates.find((candidate) => sourceFiles.has(candidate)) ?? null
}

function hasRuntimeImport(node) {
  if (!node.importClause) {
    return true
  }

  if (node.importClause.isTypeOnly) {
    return false
  }

  if (node.importClause.name) {
    return true
  }

  const bindings = node.importClause.namedBindings

  if (!bindings || ts.isNamespaceImport(bindings)) {
    return bindings !== undefined
  }

  return bindings.elements.some((element) => !element.isTypeOnly)
}

function hasRuntimeExport(node) {
  if (node.isTypeOnly) {
    return false
  }

  return (
    !node.exportClause ||
    !ts.isNamedExports(node.exportClause) ||
    node.exportClause.elements.some((element) => !element.isTypeOnly)
  )
}

function readModuleInfo(path, sourceFiles) {
  const sourceText = readFileSync(path, 'utf8')
  const sourceFile = ts.createSourceFile(
    path,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const allEdges = new Set()
  const runtimeEdges = new Set()
  const packages = new Set()
  const rawQueryKeyLines = []

  function addSpecifier(specifier, runtime) {
    const internalTarget = resolveInternalImport(path, specifier, sourceFiles)

    if (internalTarget) {
      allEdges.add(internalTarget)

      if (runtime) {
        runtimeEdges.add(internalTarget)
      }

      return
    }

    const packageName = packageNameFromSpecifier(specifier)

    if (packageName) {
      packages.add(packageName)
    }
  }

  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      addSpecifier(node.moduleSpecifier.text, hasRuntimeImport(node))
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      addSpecifier(node.moduleSpecifier.text, hasRuntimeExport(node))
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      addSpecifier(node.arguments[0].text, true)
    }

    if (
      !isTestFile(path) &&
      ts.isPropertyAssignment(node) &&
      ((ts.isIdentifier(node.name) && node.name.text === 'queryKey') ||
        (ts.isStringLiteral(node.name) && node.name.text === 'queryKey')) &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      rawQueryKeyLines.push(
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      )
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return { allEdges, packages, rawQueryKeyLines, runtimeEdges }
}

function reachableFrom(roots, graph) {
  const visited = new Set()
  const stack = [...roots]

  while (stack.length > 0) {
    const current = stack.pop()

    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)

    for (const dependency of graph.get(current) ?? []) {
      stack.push(dependency)
    }
  }

  return visited
}

function findCycles(nodes, graph) {
  let nextIndex = 0
  const stack = []
  const onStack = new Set()
  const indexes = new Map()
  const lowLinks = new Map()
  const cycles = []

  function visit(node) {
    indexes.set(node, nextIndex)
    lowLinks.set(node, nextIndex)
    nextIndex += 1
    stack.push(node)
    onStack.add(node)

    for (const dependency of graph.get(node) ?? []) {
      if (!nodes.has(dependency)) {
        continue
      }

      if (!indexes.has(dependency)) {
        visit(dependency)
        lowLinks.set(
          node,
          Math.min(lowLinks.get(node), lowLinks.get(dependency)),
        )
      } else if (onStack.has(dependency)) {
        lowLinks.set(
          node,
          Math.min(lowLinks.get(node), indexes.get(dependency)),
        )
      }
    }

    if (lowLinks.get(node) !== indexes.get(node)) {
      return
    }

    const component = []
    let member

    do {
      member = stack.pop()

      if (!member) {
        break
      }

      onStack.delete(member)
      component.push(member)
    } while (member !== node)

    if (
      component.length > 1 ||
      (component.length === 1 &&
        (graph.get(component[0]) ?? new Set()).has(component[0]))
    ) {
      cycles.push(component)
    }
  }

  for (const node of nodes) {
    if (!indexes.has(node)) {
      visit(node)
    }
  }

  return cycles
}

function gitTrackedArtifacts() {
  const result = spawnSync('git', ['ls-files'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || 'git ls-files failed.')
  }

  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((path) =>
      trackedArtifactPatterns.some((pattern) => pattern.test(path)),
    )
}

const sourceFileList = collectFiles(sourceRoot, sourceExtensions)
const sourceFiles = new Set(sourceFileList)
const allGraph = new Map()
const runtimeGraph = new Map()
const packageImports = new Set()
const rawQueryKeyFindings = []

for (const path of sourceFileList) {
  const info = readModuleInfo(path, sourceFiles)
  allGraph.set(path, info.allEdges)
  runtimeGraph.set(path, info.runtimeEdges)

  for (const packageName of info.packages) {
    packageImports.add(packageName)
  }

  for (const line of info.rawQueryKeyLines) {
    rawQueryKeyFindings.push(`${projectPath(path)}:${line}`)
  }
}

const analysisFiles = collectFiles(projectRoot, codeExtensions)

for (const path of analysisFiles) {
  if (sourceFiles.has(path)) {
    continue
  }

  const info = readModuleInfo(path, sourceFiles)

  for (const packageName of info.packages) {
    packageImports.add(packageName)
  }
}

const testRoots = sourceFileList.filter(isTestFile)
const reachableSource = reachableFrom([...entryPoints, ...testRoots], allGraph)
const unreachableSource = sourceFileList.filter(
  (path) =>
    !reachableSource.has(path) &&
    !path.startsWith(generatedSourcePrefix) &&
    !path.endsWith('/vite-env.d.ts'),
)
const runtimeReachable = reachableFrom(entryPoints, runtimeGraph)
const runtimeCycles = findCycles(runtimeReachable, runtimeGraph)
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8'),
)
const declaredPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
])
const unusedPackages = [...declaredPackages].filter(
  (packageName) =>
    !packageImports.has(packageName) &&
    !packageUsageAllowlist.has(packageName) &&
    !packageName.startsWith('@types/'),
)
const undeclaredPackages = [...packageImports].filter(
  (packageName) => !declaredPackages.has(packageName),
)
const trackedArtifacts = gitTrackedArtifacts()
const failures = []

if (unreachableSource.length > 0) {
  failures.push(
    `Unreachable source:\n${unreachableSource
      .map((path) => `  - ${projectPath(path)}`)
      .join('\n')}`,
  )
}

if (runtimeCycles.length > 0) {
  failures.push(
    `Runtime import cycles:\n${runtimeCycles
      .map((cycle) => `  - ${cycle.map(projectPath).join(' -> ')}`)
      .join('\n')}`,
  )
}

if (unusedPackages.length > 0) {
  failures.push(
    `Declared dependencies without an import or explicit tool allowlist:\n${unusedPackages
      .sort()
      .map((packageName) => `  - ${packageName}`)
      .join('\n')}`,
  )
}

if (undeclaredPackages.length > 0) {
  failures.push(
    `Imported packages missing from package.json:\n${undeclaredPackages
      .sort()
      .map((packageName) => `  - ${packageName}`)
      .join('\n')}`,
  )
}

if (rawQueryKeyFindings.length > 0) {
  failures.push(
    `Raw production query keys:\n${rawQueryKeyFindings
      .sort()
      .map((finding) => `  - ${finding}`)
      .join('\n')}`,
  )
}

if (trackedArtifacts.length > 0) {
  failures.push(
    `Tracked runtime/test artifacts:\n${trackedArtifacts
      .sort()
      .map((path) => `  - ${path}`)
      .join('\n')}`,
  )
}

if (failures.length > 0) {
  console.error(failures.join('\n\n'))
  process.exitCode = 1
} else {
  console.log(
    [
      'Architecture check passed.',
      `Runtime modules reachable: ${runtimeReachable.size}.`,
      `Source/test modules covered: ${reachableSource.size}.`,
      `Declared packages checked: ${declaredPackages.size}.`,
      'No unreachable source, runtime import cycle, raw production query key,',
      'unused dependency, undeclared import, or tracked runtime/test artifact found.',
    ].join(' '),
  )
}
