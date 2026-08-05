import { createClient } from '@hey-api/openapi-ts'
import { existsSync } from 'node:fs'
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = resolve(scriptDirectory, '..')
const outputDirectory = resolve(projectDirectory, 'src/api/generated')

function resolveSpecificationPath() {
  const candidates = [
    process.env.HBMS_OPENAPI_SPEC_PATH,
    resolve(
      projectDirectory,
      '../homestay-booking-management-system-api/docs/openapi.json',
    ),
    resolve(projectDirectory, 'docs/openapi.json'),
  ].filter(Boolean)

  const specificationPath = candidates.find((candidate) =>
    existsSync(candidate),
  )

  if (!specificationPath) {
    throw new Error(
      'OpenAPI specification not found. Set HBMS_OPENAPI_SPEC_PATH or provide the Backend repository next to the frontend.',
    )
  }

  return specificationPath
}

const specificationPath = resolveSpecificationPath()

async function generateContract(outputPath) {
  await createClient({
    input: specificationPath,
    output: {
      clean: true,
      path: outputPath,
    },
    plugins: [
      {
        comments: true,
        enums: false,
        name: '@hey-api/typescript',
      },
    ],
  })
}

async function listFiles(directory, relativeDirectory = '') {
  const currentDirectory = resolve(directory, relativeDirectory)
  const entries = await readdir(currentDirectory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)))
    } else if (entry.isFile()) {
      files.push(relativePath)
    }
  }

  return files.sort()
}

async function assertDirectoriesMatch(actualDirectory, expectedDirectory) {
  const actualFiles = await listFiles(actualDirectory)
  const expectedFiles = await listFiles(expectedDirectory)

  if (actualFiles.join('\n') !== expectedFiles.join('\n')) {
    throw new Error(
      'Generated OpenAPI file set is stale. Run npm run contract:generate.',
    )
  }

  for (const relativePath of actualFiles) {
    const [actual, expected] = await Promise.all([
      readFile(resolve(actualDirectory, relativePath)),
      readFile(resolve(expectedDirectory, relativePath)),
    ])

    if (!actual.equals(expected)) {
      throw new Error(
        `Generated OpenAPI file is stale: ${relativePath}. Run npm run contract:generate.`,
      )
    }
  }
}

if (process.argv.includes('--check')) {
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), 'hbms-openapi-check-'),
  )

  try {
    await generateContract(temporaryDirectory)
    await assertDirectoriesMatch(temporaryDirectory, outputDirectory)
    console.log('Generated OpenAPI contract is current.')
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
} else {
  await generateContract(outputDirectory)
}
