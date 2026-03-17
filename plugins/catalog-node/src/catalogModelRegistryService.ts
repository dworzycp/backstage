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
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { type CatalogModelExtension } from '@backstage/catalog-model/alpha';
import express, { type Router } from 'express';
import PromiseRouter from 'express-promise-router';

/**
 * Service for registering and managing distributed catalog model extensions.
 *
 * @alpha
 * @remarks
 *
 * The data registered with this service will be available for the catalog
 * backend service to consume.
 */
export interface CatalogModelRegistryService {
  register(extension: CatalogModelExtension): void;
}

/**
 * The default implementation of {@link CatalogModelRegistryService}.
 *
 * @internal
 */
export class DefaultCatalogModelRegistryService
  implements CatalogModelRegistryService
{
  readonly #pluginId: string;
  readonly #extensions: CatalogModelExtension[];

  constructor(pluginId: string) {
    this.#pluginId = pluginId;
    this.#extensions = [];
  }

  register(extension: CatalogModelExtension): void {
    this.#extensions.push(extension);
  }

  getRouter(): Router {
    const router = PromiseRouter();
    router.get(
      '/.backstage/catalog-model/v1/extensions',
      express.json(),
      (_req, res) => {
        res.json({
          pluginId: this.#pluginId,
          extensions: this.#extensions,
        });
      },
    );
    return router;
  }
}

/**
 * Service for registering and managing distributed catalog model extensions.
 *
 * See {@link CatalogModelRegistryService}
 * and {@link https://backstage.io/docs/features/software-catalog/extending-the-model | the model extension docs}
 * for more information.
 *
 * @alpha
 */
export const catalogModelRegistryServiceRef =
  createServiceRef<CatalogModelRegistryService>({
    id: 'catalog-modelRegistry',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          httpRouter: coreServices.httpRouter,
          rootLifecycle: coreServices.rootLifecycle,
          pluginMetadata: coreServices.pluginMetadata,
        },
        async factory({ httpRouter, rootLifecycle, pluginMetadata }) {
          const registry = new DefaultCatalogModelRegistryService(
            pluginMetadata.getId(),
          );
          rootLifecycle.addStartupHook(() => {
            httpRouter.use(registry.getRouter());
          });
          return registry;
        },
      }),
  });
