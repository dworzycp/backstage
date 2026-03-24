---
id: poking-around
sidebar_label: 002 - Poking around
title: 002 - Poking around
description: Exploring the default frontend plugin structure and components
---

Let's walk through the code that `yarn new` generated for us.

## Plugin definition

Open `plugins/todo/src/plugin.tsx`. This is the entry point for the plugin:

```tsx
import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { rootRouteRef } from './routes';

export const page = PageBlueprint.make({
  params: {
    path: '/todo',
    routeRef: rootRouteRef,
    loader: () => import('./components/TodoPage').then(m => <m.TodoPage />),
  },
});

export const todoPlugin = createFrontendPlugin({
  pluginId: 'todo',
  extensions: [page],
  routes: {
    root: rootRouteRef,
  },
});
```

- `createFrontendPlugin` registers the plugin with Backstage.
- `PageBlueprint.make` defines a page extension — a route in the app that
  lazy-loads the `TodoPage` component.
- `rootRouteRef` is a route reference that other plugins can use to link to
  your plugin's page.

## The TodoPage component

Open `plugins/todo/src/components/TodoPage/TodoPage.tsx`. This component
fetches data from the backend and renders it:

```tsx
const { value: todos, loading, error } = useTodos();
```

The `useTodos` hook uses two Backstage APIs:

- **`discoveryApiRef`** resolves the base URL of the backend plugin
  (for example, `http://localhost:7007/api/todo`).
- **`fetchApiRef`** wraps the browser `fetch` and automatically injects
  authentication credentials.

If the backend is not running, the page shows a `ResponseErrorPanel` with
the error details.

## The TodoList component

Open `plugins/todo/src/components/TodoList/TodoList.tsx`. This is a
presentational component that receives a list of todos as props and renders
them in a `Table` from `@backstage/core-components`.

The `TodoItem` type matches the shape returned by the backend plugin:

```ts
export type TodoItem = {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
};
```

## Understanding the page structure

The components from `@backstage/core-components` give the page a consistent
look and feel across all Backstage plugins:

- `Page` wraps the entire page and provides a theme context.
- `Header` renders the top bar with a title and subtitle.
- `Content` is the main scrollable area below the header.
- `ContentHeader` adds a section title inside the content area.
- `Table` renders a sortable, searchable data table.
- `Progress` shows a loading indicator.
- `ResponseErrorPanel` displays errors in a user-friendly way.

Keeping your plugin visually consistent with the rest of Backstage is important
— users should feel at home regardless of which plugin they are interacting
with.
