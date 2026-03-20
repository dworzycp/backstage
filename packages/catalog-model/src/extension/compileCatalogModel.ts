/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { InputError } from '@backstage/errors';
import { JsonObject } from '@backstage/types';
import lodash from 'lodash';
import { mergeJsonSchemas } from './jsonSchema/mergeJsonSchemas';
import { CatalogModelOp } from './operations';
import { ops } from './operations/util';
import { OpDeclareAnnotationV1 } from './operations/declareAnnotation';
import { OpDeclareKindV1 } from './operations/declareKind';
import { OpDeclareKindVersionV1 } from './operations/declareKindVersion';
import { OpDeclareLabelV1 } from './operations/declareLabel';
import { OpDeclareRelationV1 } from './operations/declareRelation';
import { OpDeclareTagV1 } from './operations/declareTag';
import { OpUpdateKindV1 } from './operations/updateKind';
import { OpUpdateKindVersionV1 } from './operations/updateKindVersion';
import { OpUpdateRelationV1 } from './operations/updateRelation';
import {
  CatalogModel,
  CatalogModelExtension,
  OpaqueCatalogModelExtension,
} from './types';

// #region Internal types
interface KindState {
  group: string;
  singular: string;
  plural: string;
  description: string;
  versions: Map<string, VersionState>;
}

interface VersionState {
  name: string;
  apiVersion: string;
  specTypes: Map<string | undefined, SpecTypeState>;
}

interface SpecTypeState {
  description?: string;
  relationFields?: OpDeclareKindVersionV1['properties']['relationFields'];
  jsonSchema: JsonObject;
}

interface RelationState {
  fromKinds: Set<string>;
  toKinds: Set<string>;
  comment: string;
  forward: { type: string; singular: string; plural: string };
  reverse: { type: string; singular: string; plural: string };
}

interface AnnotationState {
  title?: string;
  description: string;
  schema?: { jsonSchema: JsonObject };
}

interface LabelState {
  title?: string;
  description: string;
  schema?: { jsonSchema: JsonObject };
}

interface TagState {
  title?: string;
  description: string;
}

// #endregion

// #region Op sorting

/**
 * Sorts ops so that declarations come before updates, while preserving the
 * relative order of ops with the same priority (stable sort).
 */
function sortOps(input: CatalogModelOp[]): CatalogModelOp[] {
  return lodash.sortBy(input, op => ops[op.op].order);
}

// #endregion

// #region Op application

function applyDeclareKind(
  kinds: Map<string, KindState>,
  op: OpDeclareKindV1,
): void {
  if (kinds.has(op.kind)) {
    throw new InputError(`Kind "${op.kind}" is declared more than once`);
  }
  kinds.set(op.kind, {
    group: op.group,
    singular: op.properties.singular,
    plural: op.properties.plural,
    description: op.properties.description,
    versions: new Map(),
  });
}

function applyDeclareKindVersion(
  kinds: Map<string, KindState>,
  op: OpDeclareKindVersionV1,
): void {
  const kind = kinds.get(op.kind);
  if (!kind) {
    throw new InputError(
      `Cannot declare version "${op.name}" for unknown kind "${op.kind}"`,
    );
  }

  let version = kind.versions.get(op.name);
  if (!version) {
    version = {
      name: op.name,
      apiVersion: `${kind.group}/${op.name}`,
      specTypes: new Map(),
    };
    kind.versions.set(op.name, version);
  }

  if (version.specTypes.has(op.specType)) {
    const label = op.specType
      ? `spec type "${op.specType}"`
      : 'default spec type';
    throw new InputError(
      `Version "${op.name}" of kind "${op.kind}" already has ${label} declared`,
    );
  }

  version.specTypes.set(op.specType, {
    description: op.properties.description,
    relationFields: op.properties.relationFields,
    jsonSchema: op.properties.schema.jsonSchema as JsonObject,
  });
}

function applyDeclareRelation(
  relations: Map<string, RelationState>,
  op: OpDeclareRelationV1,
): void {
  const existing = relations.get(op.type);
  if (existing) {
    existing.fromKinds.add(op.fromKind);
    existing.toKinds.add(op.toKind);
  } else {
    relations.set(op.type, {
      fromKinds: new Set([op.fromKind]),
      toKinds: new Set([op.toKind]),
      comment: op.properties.comment,
      forward: {
        type: op.type,
        singular: op.properties.singular,
        plural: op.properties.plural,
      },
      reverse: {
        type: op.properties.reverseType,
        singular: op.properties.singular,
        plural: op.properties.plural,
      },
    });
  }
}

function applyUpdateKind(
  kinds: Map<string, KindState>,
  op: OpUpdateKindV1,
): void {
  const kind = kinds.get(op.kind);
  if (!kind) {
    throw new InputError(`Cannot update unknown kind "${op.kind}"`);
  }
  if (op.properties.singular !== undefined) {
    kind.singular = op.properties.singular;
  }
  if (op.properties.plural !== undefined) {
    kind.plural = op.properties.plural;
  }
  if (op.properties.description !== undefined) {
    kind.description = op.properties.description;
  }
}

function applyUpdateKindVersion(
  kinds: Map<string, KindState>,
  op: OpUpdateKindVersionV1,
): void {
  const kind = kinds.get(op.kind);
  if (!kind) {
    throw new InputError(
      `Cannot update version "${op.name}" for unknown kind "${op.kind}"`,
    );
  }

  const version = kind.versions.get(op.name);
  if (!version) {
    throw new InputError(
      `Cannot update unknown version "${op.name}" of kind "${op.kind}"`,
    );
  }

  const specType = version.specTypes.get(op.specType);
  if (!specType) {
    const label = op.specType
      ? `spec type "${op.specType}"`
      : 'default spec type';
    throw new InputError(
      `Cannot update undeclared ${label} on version "${op.name}" of kind "${op.kind}"`,
    );
  }

  if (op.properties.description !== undefined) {
    specType.description = op.properties.description;
  }
  if (op.properties.relationFields !== undefined) {
    specType.relationFields = op.properties.relationFields;
  }
  if (op.properties.schema !== undefined) {
    specType.jsonSchema = mergeJsonSchemas(
      specType.jsonSchema,
      op.properties.schema.jsonSchema as JsonObject,
    );
  }
}

function applyUpdateRelation(
  relations: Map<string, RelationState>,
  op: OpUpdateRelationV1,
): void {
  const relation = relations.get(op.type);
  if (!relation) {
    throw new InputError(`Cannot update undeclared relation "${op.type}"`);
  }
  relation.fromKinds.add(op.fromKind);
  relation.toKinds.add(op.toKind);
  if (op.properties.reverseType !== undefined) {
    relation.reverse.type = op.properties.reverseType;
  }
  if (op.properties.singular !== undefined) {
    relation.forward.singular = op.properties.singular;
    relation.reverse.singular = op.properties.singular;
  }
  if (op.properties.plural !== undefined) {
    relation.forward.plural = op.properties.plural;
    relation.reverse.plural = op.properties.plural;
  }
  if (op.properties.comment !== undefined) {
    relation.comment = op.properties.comment;
  }
}

function applyDeclareAnnotation(
  annotations: Map<string, AnnotationState>,
  op: OpDeclareAnnotationV1,
): void {
  if (annotations.has(op.name)) {
    throw new InputError(`Annotation "${op.name}" is declared more than once`);
  }
  annotations.set(op.name, {
    title: op.properties.title,
    description: op.properties.description,
    schema: op.properties.schema as AnnotationState['schema'],
  });
}

function applyDeclareLabel(
  labels: Map<string, LabelState>,
  op: OpDeclareLabelV1,
): void {
  if (labels.has(op.name)) {
    throw new InputError(`Label "${op.name}" is declared more than once`);
  }
  labels.set(op.name, {
    title: op.properties.title,
    description: op.properties.description,
    schema: op.properties.schema as LabelState['schema'],
  });
}

function applyDeclareTag(
  tags: Map<string, TagState>,
  op: OpDeclareTagV1,
): void {
  if (tags.has(op.name)) {
    throw new InputError(`Tag "${op.name}" is declared more than once`);
  }
  tags.set(op.name, {
    title: op.properties.title,
    description: op.properties.description,
  });
}

function buildFullSchema(options: {
  kind: string;
  apiVersion: string;
  kindSchema: JsonObject;
  annotations: Map<string, AnnotationState>;
  labels: Map<string, LabelState>;
  tags: Map<string, TagState>;
}): JsonObject {
  const annotationProperties: JsonObject = {};
  for (const [name, state] of options.annotations) {
    annotationProperties[name] = state.schema?.jsonSchema ?? { type: 'string' };
  }

  const labelProperties: JsonObject = {};
  for (const [name, state] of options.labels) {
    labelProperties[name] = state.schema?.jsonSchema ?? { type: 'string' };
  }

  const metadataSchema: JsonObject = {
    type: 'object',
    required: ['name'],
    additionalProperties: true,
    properties: {
      uid: {
        type: 'string',
        description: 'A globally unique ID for the entity.',
        minLength: 1,
      },
      etag: {
        type: 'string',
        description:
          'An opaque string that changes for each update operation to any part of the entity, including metadata.',
        minLength: 1,
      },
      name: {
        type: 'string',
        description:
          'The name of the entity. Must be unique within the catalog at any given point in time, for any given namespace + kind pair.',
        minLength: 1,
      },
      namespace: {
        type: 'string',
        description: 'The namespace that the entity belongs to.',
        default: 'default',
        minLength: 1,
      },
      title: {
        type: 'string',
        description:
          'A display name of the entity, to be presented in user interfaces instead of the name property, when available.',
        minLength: 1,
      },
      description: {
        type: 'string',
        description:
          'A short (typically relatively few words, on one line) description of the entity.',
      },
      annotations: {
        type: 'object',
        description:
          'Key/value pairs of non-identifying auxiliary information attached to the entity.',
        additionalProperties: { type: 'string' },
        ...(Object.keys(annotationProperties).length > 0
          ? { properties: annotationProperties }
          : {}),
      },
      labels: {
        type: 'object',
        description:
          'Key/value pairs of identifying information attached to the entity.',
        additionalProperties: { type: 'string' },
        ...(Object.keys(labelProperties).length > 0
          ? { properties: labelProperties }
          : {}),
      },
      tags: {
        type: 'array',
        description:
          'A list of single-valued strings, to for example classify catalog entities in various ways.',
        items: { type: 'string', minLength: 1 },
      },
      links: {
        type: 'array',
        description: 'A list of external hyperlinks related to the entity.',
        items: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', minLength: 1 },
            title: { type: 'string', minLength: 1 },
            icon: { type: 'string', minLength: 1 },
            type: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  };

  return {
    type: 'object',
    properties: {
      apiVersion: { const: options.apiVersion },
      kind: { const: options.kind },
      metadata: metadataSchema,
      ...((options.kindSchema as any).properties ?? {}),
    },
    required: [
      'apiVersion',
      'kind',
      'metadata',
      ...((options.kindSchema as any).required ?? []),
    ],
  };
}

// #region Main compilation

/**
 * Compiles a set of catalog models and/or extensions into a single unified
 * catalog model.
 *
 * @alpha
 * @param inputs - The extensions to compile.
 * @returns The compiled catalog model.
 */
export function compileCatalogModel(
  inputs: Iterable<CatalogModelExtension>,
): CatalogModel {
  // Collect all ops from all inputs
  let allOps: CatalogModelOp[] = [];
  for (const input of inputs) {
    const internal = OpaqueCatalogModelExtension.toInternal(input);
    allOps = allOps.concat(internal.ops);
  }

  const sortedOps = sortOps(allOps);

  // Apply ops in order
  const annotations = new Map<string, AnnotationState>();
  const labels = new Map<string, LabelState>();
  const tags = new Map<string, TagState>();
  const kinds = new Map<string, KindState>();
  const relations = new Map<string, RelationState>();

  for (const op of sortedOps) {
    switch (op.op) {
      case 'declareAnnotation.v1':
        applyDeclareAnnotation(annotations, op);
        break;
      case 'declareLabel.v1':
        applyDeclareLabel(labels, op);
        break;
      case 'declareTag.v1':
        applyDeclareTag(tags, op);
        break;
      case 'declareKind.v1':
        applyDeclareKind(kinds, op);
        break;
      case 'declareKindVersion.v1':
        applyDeclareKindVersion(kinds, op);
        break;
      case 'declareRelation.v1':
        applyDeclareRelation(relations, op);
        break;
      case 'updateKind.v1':
        applyUpdateKind(kinds, op);
        break;
      case 'updateKindVersion.v1':
        applyUpdateKindVersion(kinds, op);
        break;
      case 'updateRelation.v1':
        applyUpdateRelation(relations, op);
        break;
      default:
        throw new InputError(`Unknown op type "${(op as CatalogModelOp).op}"`);
    }
  }

  return {
    getKind(options) {
      const type = options.spec?.type;

      const kindState = kinds.get(options.kind);
      if (!kindState) {
        return undefined;
      }

      const version = [...kindState.versions.values()].find(
        v => v.apiVersion === options.apiVersion,
      );
      if (!version) {
        throw new TypeError(
          `Kind "${options.kind}" exists, but has no version matching apiVersion "${options.apiVersion}"`,
        );
      }

      // Look up the specific kind, falling back to the default (undefined key)
      let specificKind = version.specTypes.get(type);
      if (!specificKind && type !== undefined) {
        specificKind = version.specTypes.get(undefined);
      }
      if (!specificKind) {
        throw new TypeError(
          `Kind "${options.kind}" version "${version.name}" exists, but has no matching spec type`,
        );
      }

      return {
        apiVersions: [version.apiVersion],
        names: {
          kind: options.kind,
          singular: kindState.singular,
          plural: kindState.plural,
        },
        relationFields: (specificKind.relationFields ?? []).map(f => ({
          path: f.selector.path,
          relation: f.relation,
          defaultKind: f.defaultKind,
          defaultNamespace: f.defaultNamespace,
          allowedKinds: f.allowedKinds,
        })),
        jsonSchema: buildFullSchema({
          kind: options.kind,
          apiVersion: version.apiVersion,
          kindSchema: specificKind.jsonSchema,
          annotations,
          labels,
          tags,
        }),
      };
    },

    getRelations(options) {
      if (!kinds.has(options.kind)) {
        return undefined;
      }
      return [...relations.values()]
        .filter(r => r.fromKinds.has(options.kind))
        .map(r => ({
          fromKind: [...r.fromKinds],
          toKind: [...r.toKinds],
          comment: r.comment,
          forward: r.forward,
          reverse: r.reverse,
        }));
    },
  };
}

// #endregion
