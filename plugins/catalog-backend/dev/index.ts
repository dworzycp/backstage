/*
 * Copyright 2024 The Backstage Authors
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

import { createBackend } from '@backstage/backend-defaults';
import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  compileCatalogModel,
  defaultCatalogEntityModel,
} from '@backstage/catalog-model/alpha';
import { catalogModelExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { templateModelExtension } from '@backstage/plugin-scaffolder-common/alpha';

const backend = createBackend();
backend.add(import('../src'));
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

backend.add(
  createBackendModule({
    pluginId: 'catalog',
    moduleId: 'my-model',
    register(reg) {
      reg.registerInit({
        deps: {
          catalog: catalogModelExtensionPoint,
        },
        async init({ catalog }) {
          const model = compileCatalogModel([
            defaultCatalogEntityModel,
            templateModelExtension,
          ]);
          catalog.setModel(model);
        },
      });
    },
  }),
);

backend.start();
