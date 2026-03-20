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

import Ajv from 'ajv';
import { createCatalogModelExtension } from './createCatalogModelExtension';
import { compileCatalogModel } from './compileCatalogModel';

const extension = createCatalogModelExtension('Test', builder => {
  builder.addKind({
    group: 'example.com',
    names: { kind: 'Widget', singular: 'widget', plural: 'widgets' },
    description: 'A test widget kind',
    versions: [
      {
        name: 'v1alpha1',
        schema: {
          jsonSchema: {
            type: 'object',
            required: ['spec'],
            properties: {
              spec: {
                type: 'object',
                required: ['size'],
                properties: {
                  size: { type: 'number' },
                },
              },
            },
          },
        },
      },
    ],
  });
});

function compileAndValidate(entity: unknown): boolean {
  const model = compileCatalogModel([extension]);
  const kind = model.getKind({
    kind: 'Widget',
    apiVersion: 'example.com/v1alpha1',
  });
  if (!kind) {
    throw new Error('Kind not found');
  }
  const ajv = new Ajv({ allowUnionTypes: true, allErrors: true });
  const validate = ajv.compile(kind.jsonSchema);
  return validate(entity) as boolean;
}

describe('compileCatalogModel', () => {
  it('should validate a complete entity successfully', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1alpha1',
        kind: 'Widget',
        metadata: { name: 'my-widget' },
        spec: { size: 42 },
      }),
    ).toBe(true);
  });

  it('should fail when metadata.name is missing', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1alpha1',
        kind: 'Widget',
        metadata: {},
        spec: { size: 42 },
      }),
    ).toBe(false);
  });

  it('should fail when a required spec field is missing', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1alpha1',
        kind: 'Widget',
        metadata: { name: 'my-widget' },
        spec: {},
      }),
    ).toBe(false);
  });

  it('should fail when a spec field has the wrong type', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1alpha1',
        kind: 'Widget',
        metadata: { name: 'my-widget' },
        spec: { size: 'large' },
      }),
    ).toBe(false);
  });

  it('should fail when kind does not match', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1alpha1',
        kind: 'Other',
        metadata: { name: 'my-widget' },
        spec: { size: 42 },
      }),
    ).toBe(false);
  });

  it('should fail when apiVersion does not match', () => {
    expect(
      compileAndValidate({
        apiVersion: 'example.com/v1beta1',
        kind: 'Widget',
        metadata: { name: 'my-widget' },
        spec: { size: 42 },
      }),
    ).toBe(false);
  });

  it('should return undefined for an unknown kind', () => {
    const model = compileCatalogModel([extension]);
    expect(
      model.getKind({ kind: 'Unknown', apiVersion: 'example.com/v1alpha1' }),
    ).toBeUndefined();
  });
});
