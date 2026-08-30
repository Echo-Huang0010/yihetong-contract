import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { defaultSchemaPath, readJson, YhtError } from './common.mjs'

const metadataKeywords = [
  'x-yht-priority',
  'x-yht-authority',
  'x-yht-requiredIf',
  'x-yht-dependsOn',
  'x-yht-notApplicable',
]

export function buildValidator(schemaPath = defaultSchemaPath) {
  const schema = readJson(schemaPath)
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: false,
  })
  addFormats(ajv)
  for (const keyword of metadataKeywords) {
    ajv.addKeyword({ keyword, validate: () => true, errors: false })
  }
  return { schema, validate: ajv.compile(schema) }
}

export function validateSchema(profile, schemaPath = defaultSchemaPath) {
  const { validate } = buildValidator(schemaPath)
  if (validate(profile)) return []
  return (validate.errors || []).map((error) => ({
    path: error.instancePath || '/',
    keyword: error.keyword,
    message: error.message,
    params: error.params,
  }))
}

export function assertSchema(profile, schemaPath = defaultSchemaPath) {
  const errors = validateSchema(profile, schemaPath)
  if (errors.length) {
    throw new YhtError('CustomerDeploymentProfile schema validation failed', {
      code: 'PROFILE_SCHEMA_INVALID',
      details: errors,
    })
  }
}
