/*
 * Copyright 2023 The Backstage Authors
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

import { createCatalogModelExtension } from './extension/createCatalogModelExtension';
import { apiEntityModel } from './kinds/ApiEntityV1alpha1';
import { componentEntityModel } from './kinds/ComponentEntityV1alpha1';
import { domainEntityModel } from './kinds/DomainEntityV1alpha1';
import { groupEntityModel } from './kinds/GroupEntityV1alpha1';
import { locationEntityModel } from './kinds/LocationEntityV1alpha1';
import { resourceEntityModel } from './kinds/ResourceEntityV1alpha1';
import { systemEntityModel } from './kinds/SystemEntityV1alpha1';
import { userEntityModel } from './kinds/UserEntityV1alpha1';
import { wellKnownRelationsModel } from './kinds/relations';

export type { AlphaEntity } from './entity/AlphaEntity';
export type {
  EntityStatus,
  EntityStatusItem,
  EntityStatusLevel,
} from './entity/EntityStatus';
export * from './extension';

/**
 * @alpha
 */
export const defaultCatalogEntityModel = createCatalogModelExtension(
  'Backstage Default Entity Model',
  builder => {
    builder.import(apiEntityModel);
    builder.import(componentEntityModel);
    builder.import(domainEntityModel);
    builder.import(groupEntityModel);
    builder.import(locationEntityModel);
    builder.import(resourceEntityModel);
    builder.import(systemEntityModel);
    builder.import(userEntityModel);
    builder.import(wellKnownRelationsModel);
  },
);
