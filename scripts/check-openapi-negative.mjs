import { createClient } from '@hey-api/openapi-ts'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = resolve(scriptDirectory, '..')
const typescriptCli = resolve(
  projectDirectory,
  'node_modules/typescript/bin/tsc',
)

function resolveSpecificationPath() {
  const candidates = [
    process.env.HBMS_OPENAPI_SPEC_PATH,
    resolve(
      projectDirectory,
      '../homestay-booking-management-system-api/openapi/openapi.json',
    ),
    resolve(projectDirectory, 'openapi/openapi.json'),
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
const temporaryDirectory = await mkdtemp(
  resolve(tmpdir(), 'hbms-openapi-negative-'),
)

try {
  const specification = JSON.parse(
    await readFile(specificationPath, 'utf8'),
  )
  const envelope = specification.components?.schemas?.SuccessEnvelopeDto

  if (!Array.isArray(envelope?.required)) {
    throw new Error('SuccessEnvelopeDto.required is missing.')
  }

  envelope.required = envelope.required.filter(
    (field) => field !== 'requestId',
  )

  const fixturePath = resolve(temporaryDirectory, 'openapi.json')
  const generatedDirectory = resolve(temporaryDirectory, 'generated')

  await writeFile(
    fixturePath,
    `${JSON.stringify(specification, null, 2)}\n`,
    'utf8',
  )
  await createClient({
    input: fixturePath,
    output: {
      clean: true,
      path: generatedDirectory,
    },
    plugins: [
      {
        comments: false,
        enums: false,
        name: '@hey-api/typescript',
      },
    ],
  })

  const assertionPath = resolve(temporaryDirectory, 'assert-required.ts')

  await mkdir(dirname(assertionPath), { recursive: true })
  await writeFile(
    assertionPath,
    [
      "import type { SuccessEnvelopeDto } from './generated/types.gen'",
      '',
      'type Assert<T extends true> = T',
      "type HasRequiredRequestId = {} extends Pick<SuccessEnvelopeDto, 'requestId'>",
      '  ? false',
      '  : true',
      'type ContractRequiresRequestId = Assert<HasRequiredRequestId>',
      'export type NegativeContractAssertion = ContractRequiresRequestId',
      '',
    ].join('\n'),
    'utf8',
  )

  const result = spawnSync(
    process.execPath,
    [
      typescriptCli,
      '--noEmit',
      '--skipLibCheck',
      '--strict',
      '--target',
      'ES2023',
      '--module',
      'ESNext',
      '--moduleResolution',
      'Bundler',
      assertionPath,
    ],
    {
      cwd: temporaryDirectory,
      encoding: 'utf8',
    },
  )

  if (result.status === 0) {
    throw new Error(
      'Negative contract fixture unexpectedly passed TypeScript validation.',
    )
  }

  console.log(
    'Negative contract test passed: removing required requestId breaks the type assertion.',
  )
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}
