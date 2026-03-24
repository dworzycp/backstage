---
id: http-client
sidebar_label: 004 - HTTP Client
title: 004 - HTTP Client
description: How to build an HTTP client for your frontend plugin to fetch backend data
---

The scaffolded `TodoPage` already fetches data from the backend. Let's look at
how that works and how you can extend it.

## How the scaffolded code works

Open `plugins/todo/src/components/TodoPage/TodoPage.tsx` and look at the
`useTodos` hook:

```tsx
function useTodos() {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);

  return useAsync(async (): Promise<TodoItem[]> => {
    const baseUrl = await discoveryApi.getBaseUrl('todo');
    const response = await fetch(`${baseUrl}/todos`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch todos: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.items;
  }, []);
}
```

Two Backstage APIs work together here:

- **`discoveryApiRef`** resolves the base URL for a given backend plugin.
  For example, `discoveryApi.getBaseUrl('todo')` returns something like
  `http://localhost:7007/api/todo`.
- **`fetchApiRef`** wraps the browser `fetch` and automatically injects
  authentication credentials. You do not need to manually attach
  `Authorization` headers.

The `useAsync` hook from `react-use` runs the async function on mount and
returns `{ value, loading, error }`, which the component uses to show a
loading spinner, an error panel, or the todo list.

## Trying it out

Make sure both the frontend and backend are running (`yarn start` from the
repository root starts both). Navigate to `http://localhost:3000/todo` and
you should see todos fetched from your backend.

:::tip
You can create todos using `curl` as described in the
[backend golden path](../backend/002-poking-around.md), then refresh the
frontend page to see them appear.
:::

## Extracting a client class

For plugins with several endpoints, extracting a dedicated client class
keeps your components focused on rendering. Create
`plugins/todo/src/api/TodoClient.ts`:

```ts
import { DiscoveryApi, FetchApi } from '@backstage/frontend-plugin-api';
import type { TodoItem } from '../components/TodoList';

export class TodoClient {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async listTodos(): Promise<TodoItem[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('todo');
    const response = await this.fetchApi.fetch(`${baseUrl}/todos`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch todos: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.items;
  }

  async createTodo(title: string): Promise<TodoItem> {
    const baseUrl = await this.discoveryApi.getBaseUrl('todo');
    const response = await this.fetchApi.fetch(`${baseUrl}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create todo: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }
}
```

This is optional for the scaffolded example, but becomes valuable as
your plugin grows.

## OpenAPI generated clients

You can also keep your frontend and backend in sync by generating the
client from an OpenAPI schema. If your backend plugin exposes an OpenAPI
spec (see the
[backend golden path](../backend/001-first-steps.md) for details),
you can generate a type-safe client that updates automatically whenever the
API changes. This approach reduces the risk of the frontend and backend
drifting apart over time.
