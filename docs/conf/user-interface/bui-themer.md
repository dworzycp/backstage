---
id: bui-themer
title: BUI Theme Converter
sidebar_label: BUI Theme Converter
description: Use the BUI Theme Converter plugin to generate Backstage UI CSS variables from your existing MUI theme.
---

If you already have a custom MUI theme and want to adopt Backstage UI (BUI), the **BUI Theme Converter** plugin can help bridge the gap. It reads the MUI themes installed in your app, maps palette colors, typography, spacing, and border-radius values to the corresponding BUI CSS variables, and lets you preview the result—all without requiring a backend.

## What it does

The plugin detects every theme registered in your app through the `AppThemeApi` and, for each one, generates a complete set of BUI CSS custom properties derived from the MUI theme object. The generated output includes:

- **Colors** – background, foreground, border, and status colors mapped from the MUI palette.
- **Typography** – font family and font weights.
- **Spacing** – base spacing unit, when the theme uses a non-default value.
- **Border radius** – radius tokens, when the theme sets border-radius to `0`.

You can view the generated CSS, copy it to the clipboard, or download it as a `.css` file. A live preview tab shows common BUI components—buttons, form inputs, tags, and text—rendered with your converted theme so you can verify the result before adding it to your app.

## Installation

Add the plugin to your app:

```bash
yarn --cwd packages/app add @backstage/plugin-mui-to-bui
```

If you are using the **new frontend system**, the plugin is automatically discovered and no additional wiring is needed. For more details and alternative installation methods, see [installing plugins](../../frontend-system/building-apps/04-installing-plugins.md).

If your app uses the **old frontend system**, add a route manually:

```tsx title="packages/app/src/App.tsx"
import { BuiThemerPage } from '@backstage/plugin-mui-to-bui';

// Inside your FlatRoutes:
<Route path="/mui-to-bui" element={<BuiThemerPage />} />;
```

## Using the converter

1. Start your Backstage app locally with `yarn start`.
2. Navigate to `/mui-to-bui` (for example `http://localhost:3000/mui-to-bui`).
3. The page lists every theme installed in your app. For each theme you can:
   - Switch to the **Generated CSS** tab to inspect the output.
   - Switch to the **Live Preview** tab to see BUI components rendered with the converted variables.
   - Click **Copy CSS** to copy the output to the clipboard.
   - Click **Download CSS** to save it as `bui-theme-<id>.css`.
4. Paste or import the CSS file into your app (for example as `packages/app/src/styles.css`) and import it in `packages/app/src/App.tsx`:

```tsx title="packages/app/src/App.tsx"
import './styles.css';
```

Light-theme variables are placed under `:root` while dark-theme variables use the `[data-theme-mode='dark']` selector, matching the convention described in [Customizing Your App's UI](./index.md#create-a-theme-for-backstage-ui-new).

## What to expect from the output

The converter produces a best-effort mapping. Because MUI and BUI have different design foundations, not every MUI token has a direct BUI equivalent. After generating the CSS you should:

- Review the output and adjust values that don't look right, especially neutral background layers and hover/pressed states that MUI doesn't expose directly.
- Use the live preview as a starting point—it covers common component variants but doesn't exhaustively test every BUI component.
- Refer to the full list of [CSS variables](./index.md#css-variables) to see which tokens are available for further tweaking.
