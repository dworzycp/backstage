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

import {
  type CatalogModelAnnotationDefinition,
  opsFromCatalogModelAnnotation,
} from './modelActions/addAnnotation';
import {
  type CatalogModelKindDefinition,
  opsFromCatalogModelKind,
} from './modelActions/addKind';
import {
  type CatalogModelLabelDefinition,
  opsFromCatalogModelLabel,
} from './modelActions/addLabel';
import {
  type CatalogModelRelationPairDefinition,
  opsFromCatalogModelRelationPair,
} from './modelActions/addRelationPair';
import {
  type CatalogModelRemoveKindDefinition,
  opsFromCatalogModelRemoveKind,
} from './modelActions/removeKind';
import {
  type CatalogModelTagDefinition,
  opsFromCatalogModelTag,
} from './modelActions/addTag';
import {
  CatalogModelUpdateKindDefinition,
  opsFromCatalogModelUpdateKind,
} from './modelActions/updateKind';
import {
  CatalogModelUpdateRelationPairDefinition,
  opsFromCatalogModelUpdateRelationPair,
} from './modelActions/updateRelationPair';
import { CatalogModelOp } from './operations';
import { CatalogModelExtension, OpaqueCatalogModelExtension } from './types';

/**
 * A builder for catalog model extensions.
 *
 * @alpha
 *
 * Plugins can use this builder to declare various contributions to the overall
 * catalog model, and registering the outcome with the catalog which then forms
 * a complete picture out of them.
 */
export interface CatalogModelExtensionBuilder {
  /**
   * Adds a new annotation to the model.
   */
  addAnnotation(annotation: CatalogModelAnnotationDefinition): void;

  /**
   * Adds a new kind to the model.
   */
  addKind(kind: CatalogModelKindDefinition): void;

  /**
   * Adds a new label to the model.
   */
  addLabel(label: CatalogModelLabelDefinition): void;

  /**
   * Updates an existing kind in the model.
   */
  updateKind(kind: CatalogModelUpdateKindDefinition): void;

  /**
   * Removes a kind entirely from the model.
   */
  removeKind(kind: CatalogModelRemoveKindDefinition): void;

  /**
   * Adds a new relation pair to the model.
   */
  addRelationPair(relation: CatalogModelRelationPairDefinition): void;

  /**
   * Adds a new tag to the model.
   */
  addTag(tag: CatalogModelTagDefinition): void;

  /**
   * Updates an existing relation pair in the model.
   */
  updateRelationPair(relation: CatalogModelUpdateRelationPairDefinition): void;

  /**
   * Imports all operations from another catalog model extension into this one.
   */
  import(extension: CatalogModelExtension): void;
}

/**
 * The default implementation of the catalog model extension builder.
 */
export class DefaultCatalogModelExtensionBuilder
  implements CatalogModelExtensionBuilder
{
  readonly #modelName: string;
  readonly #ops: CatalogModelOp[];

  constructor(options: { modelName: string }) {
    this.#modelName = options.modelName;
    this.#ops = [];
  }

  addAnnotation(annotation: CatalogModelAnnotationDefinition): void {
    const ops = opsFromCatalogModelAnnotation(annotation);
    this.#ops.push(...ops);
  }

  addKind(kind: CatalogModelKindDefinition): void {
    const ops = opsFromCatalogModelKind(kind);
    this.#ops.push(...ops);
  }

  addLabel(label: CatalogModelLabelDefinition): void {
    const ops = opsFromCatalogModelLabel(label);
    this.#ops.push(...ops);
  }

  updateKind(kind: CatalogModelUpdateKindDefinition): void {
    const ops = opsFromCatalogModelUpdateKind(kind);
    this.#ops.push(...ops);
  }

  removeKind(kind: CatalogModelRemoveKindDefinition): void {
    const ops = opsFromCatalogModelRemoveKind(kind);
    this.#ops.push(...ops);
  }

  addRelationPair(relation: CatalogModelRelationPairDefinition): void {
    const ops = opsFromCatalogModelRelationPair(relation);
    this.#ops.push(...ops);
  }

  addTag(tag: CatalogModelTagDefinition): void {
    const ops = opsFromCatalogModelTag(tag);
    this.#ops.push(...ops);
  }

  updateRelationPair(relation: CatalogModelUpdateRelationPairDefinition): void {
    const ops = opsFromCatalogModelUpdateRelationPair(relation);
    this.#ops.push(...ops);
  }

  import(extension: CatalogModelExtension): void {
    const internal = OpaqueCatalogModelExtension.toInternal(extension);
    this.#ops.push(...internal.ops);
  }

  build(): CatalogModelExtension {
    return OpaqueCatalogModelExtension.createInstance('v1', {
      modelName: this.#modelName,
      ops: this.#ops.slice(),
    });
  }
}

/**
 * Creates a builder for a catalog model extension.
 *
 * @alpha
 * @remarks
 *
 * Plugins can use the resulting builder to declare various contributions to the
 * overall catalog model, and registering it with the catalog which then forms a
 * complete picture out of them.
 */
export function createCatalogModelExtensionBuilder(options: {
  modelName: string;
}): CatalogModelExtensionBuilder & { build(): CatalogModelExtension } {
  return new DefaultCatalogModelExtensionBuilder(options);
}
