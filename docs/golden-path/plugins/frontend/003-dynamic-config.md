---
id: dynamic-config
sidebar_label: 003 - Dynamic Config
title: 003 - Dynamic Config
description: How to use dynamic configuration to control frontend plugin components
---

Your plugin was generated for the new frontend system, which is config-first.
That means you can control frontend components through `app-config.yaml`
without changing any code.

## Disabling an extension

Every extension in the new frontend system can be toggled on or off through
configuration. To disable the todo page entirely, add the following to your
`app-config.yaml`:

```yaml title="app-config.yaml"
app:
  extensions:
    - page:todo: false
```

Start the app and try navigating to `/todo` — you get a "page not found"
response. Remove the line (or set it to `true`) to bring it back.

## Reading configuration in a component

You can also read arbitrary configuration values from within your components
using `configApiRef`. This is useful for controlling behavior without
redeploying code.

For example, let's make the page title configurable. Add the following to
`app-config.yaml`:

```yaml title="app-config.yaml"
todo:
  pageTitle: My Custom Todo List
```

Then update the `Header` in `TodoPage.tsx` to read from config. Add
`configApiRef` to the existing imports from `@backstage/frontend-plugin-api`
and use it at the top of the component:

```tsx
const config = useApi(configApiRef);
const pageTitle = config.getOptionalString('todo.pageTitle') ?? 'Todo List';
```

Then pass `pageTitle` to the `Header`:

```tsx
<Header title={pageTitle} subtitle="Your plugin for managing todos" />
```

Restart the app and you should see "My Custom Todo List" as the page title.
Change the value in `app-config.yaml` and restart to see it update.

## Why does this work?

The new frontend system treats configuration as a first-class concept.
Each extension is registered with the app under a unique ID (for example,
`page:todo`). The app reads the `app.extensions` section of the configuration
to decide which extensions to enable, disable, or reconfigure.

Meanwhile, `configApiRef` provides access to the full merged configuration
from all `app-config.yaml` files. Calling `useApi(configApiRef)` in any
component gives you a `Config` object with methods like `getString`,
`getOptionalString`, `getNumber`, and more.

This config-first approach means that adopters of your plugin can customize
its behavior without forking the code — they only need to adjust their
configuration files.
