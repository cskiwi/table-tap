# Migration Troubleshooting Guide

## Common Issues & Solutions

This guide documents common issues encountered during the PrimeNG and Tailwind CSS migration and their solutions.

## Build Errors

### Issue 1: Tailwind CSS not loading

**Error:**
```
Error: Cannot find module 'tailwindcss'
```

**Cause:** Tailwind CSS v4 not installed or incorrectly configured.

**Solution:**
```bash
# Install Tailwind v4
npm install -D @tailwindcss/postcss@^4.1.13

# Verify styles.scss configuration
# apps/app/src/styles.scss should contain:
@use 'tailwindcss';
@plugin 'tailwindcss-primeui';
```

**Verify Fix:**
```bash
npm run build
# Should compile without errors
```

---

### Issue 2: PrimeNG components not styled

**Error:**
Components render but have no styling.

**Cause:** PrimeNG theme not configured in `app.config.ts`.

**Solution:**

**apps/app/config/app.config.ts:**
```typescript
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-theme',
        },
      },
    }),
  ],
};
```

**Verify Fix:**
Buttons and cards should have proper PrimeNG styling.

---

### Issue 3: PrimeIcons not displaying

**Error:**
Icons show as empty squares or missing.

**Cause:** PrimeIcons CSS not imported.

**Solution:**

**apps/app/src/styles.scss:**
```scss
@use "primeicons/primeicons.css";
@use 'tailwindcss';
@plugin 'tailwindcss-primeui';
```

**Alternative:** Add to index.html:
```html
<link rel="stylesheet" href="node_modules/primeicons/primeicons.css">
```

**Verify Fix:**
```html
<i class="pi pi-check"></i>
<!-- Should show checkmark icon -->
```

---

### Issue 4: Layer ordering conflicts

**Error:**
```
@layer used in a stylesheet cannot be imported from a different file
```

**Cause:** Incorrect layer definition in Tailwind v4.

**Solution:**

**apps/app/src/styles.scss:**
```scss
@use "primeicons/primeicons.css";
@use 'tailwindcss';
@plugin 'tailwindcss-primeui';

@layer base, components, primeng, utilities;
```

Ensure layers are defined in the **main** `styles.scss` only, not in component SCSS files.

---

### Issue 5: TypeScript errors with PrimeNG imports

**Error:**
```
Cannot find module 'primeng/button' or its corresponding type declarations
```

**Cause:** PrimeNG not installed or incorrect version.

**Solution:**
```bash
# Install PrimeNG v20+
npm install primeng@^20.2.0 @primeuix/themes@^1.2.3

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Verify Fix:**
```typescript
import { ButtonModule } from 'primeng/button';
// Should compile without errors
```

---

## Runtime Errors

### Issue 6: Dark mode not switching

**Error:**
Theme doesn't change when toggling dark mode.

**Cause:** `.dark-theme` class not applied to document body.

**Solution:**

```typescript
// In theme toggle service
toggleDarkMode(isDark: boolean): void {
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}
```

**Verify Fix:**
Inspect `<body>` element - should have `dark-theme` class when dark mode is active.

---

### Issue 7: PrimeNG dialog not displaying

**Error:**
Dialog content renders but modal overlay is missing or doesn't show.

**Cause:** Missing `[(visible)]` binding or incorrect initialization.

**Solution:**

```typescript
// Component
displayDialog = false;

showDialog(): void {
  this.displayDialog = true;
}
```

```html
<p-dialog
  [(visible)]="displayDialog"
  [modal]="true"
  [draggable]="false"
  header="Dialog Title">
  Content
</p-dialog>
```

**Common Pitfall:** Forgetting two-way binding `[(visible)]`.

---

### Issue 8: Tailwind utilities not applying

**Error:**
Tailwind classes in templates have no effect.

**Cause:** Component using `ViewEncapsulation.Emulated` or shadow DOM.

**Solution:**

```typescript
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  // Remove ViewEncapsulation or use None
  encapsulation: ViewEncapsulation.None,
})
export class ComponentComponent {}
```

**Better Solution:** Use PrimeNG `styleClass` input:
```html
<p-card styleClass="mb-4 shadow-lg">
  <!-- Tailwind classes work here -->
</p-card>
```

---

### Issue 9: PrimeNG table pagination not working

**Error:**
Table shows all rows, pagination controls don't function.

**Cause:** Missing `[rows]` attribute or incorrect data binding.

**Solution:**

```html
<p-table
  [value]="items"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10, 25, 50]">
  <!-- Template -->
</p-table>
```

**Verify Fix:**
Should show 10 rows per page with working pagination controls.

---

## Styling Issues

### Issue 10: Custom SCSS not overriding PrimeNG

**Error:**
Custom styles have no effect on PrimeNG components.

**Cause:** CSS specificity or encapsulation issues.

**Solution:**

Use `::ng-deep` for PrimeNG component customization:

```scss
:host ::ng-deep .p-button {
  border-radius: 8px;
}

:host ::ng-deep .p-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**Warning:** Only use `::ng-deep` for PrimeNG components, not general styling.

---

### Issue 11: Tailwind classes conflicting with PrimeNG

**Error:**
PrimeNG components look broken when Tailwind utilities are applied.

**Cause:** Tailwind reset conflicting with PrimeNG base styles.

**Solution:**

Use `@layer` to control cascade order:

**styles.scss:**
```scss
@layer base, components, primeng, utilities;
```

This ensures PrimeNG styles take precedence over Tailwind base, but utilities still work.

---

### Issue 12: Responsive design not working

**Error:**
Tailwind responsive classes (md:, lg:) not applying.

**Cause:** Viewport meta tag missing.

**Solution:**

**index.html:**
```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
```

**Verify Fix:**
```html
<div class="hidden md:block">
  Shows on desktop only
</div>
```

---

### Issue 13: CSS variables not resolving

**Error:**
```scss
.element {
  color: var(--text-color); // Not working
}
```

**Cause:** PrimeNG theme variables not loaded or incorrect selector scope.

**Solution:**

Ensure theme is configured:
```typescript
providePrimeNG({
  theme: {
    preset: Aura,
  },
});
```

Use variables in correct scope:
```scss
:host ::ng-deep .custom-element {
  color: var(--text-color);
  background: var(--surface-card);
}
```

---

## Performance Issues

### Issue 14: Slow build times after Tailwind

**Error:**
Build takes significantly longer after adding Tailwind.

**Cause:** Tailwind scanning too many files.

**Solution:**

**Optimize Tailwind configuration** (not needed for v4, but good to know):

Tailwind v4 auto-optimizes, but ensure you're not importing Tailwind in multiple places:

- Should only be in **one** `styles.scss` file
- Not in individual component SCSS files

---

### Issue 15: Large bundle size

**Error:**
Production bundle is much larger than expected.

**Cause:** Unused PrimeNG components or Tailwind utilities being included.

**Solution:**

**For PrimeNG:**
Only import modules you use:
```typescript
// ❌ Don't import everything
import { PrimeNGModule } from 'primeng/primeng';

// ✅ Import specific modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
```

**For Tailwind:**
Tailwind v4 automatically purges unused CSS. Ensure you're not using dynamic class names:

```html
<!-- ❌ Bad: Dynamic classes won't be detected -->
<div [class]="'text-' + dynamicColor">Text</div>

<!-- ✅ Good: Full class names -->
<div [ngClass]="{
  'text-red-500': isError,
  'text-green-500': isSuccess
}">Text</div>
```

---

## Component-Specific Issues

### Issue 16: p-table sorting not working

**Error:**
Clicking table headers doesn't sort.

**Cause:** Missing `[sortable]` attribute or data not properly bound.

**Solution:**

```html
<p-table [value]="data" [sortMode]="'multiple'">
  <ng-template pTemplate="header">
    <tr>
      <th pSortableColumn="name">
        Name <p-sortIcon field="name"></p-sortIcon>
      </th>
      <th pSortableColumn="date">
        Date <p-sortIcon field="date"></p-sortIcon>
      </th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.date }}</td>
    </tr>
  </ng-template>
</p-table>
```

---

### Issue 17: p-dropdown not showing selected value

**Error:**
Dropdown shows placeholder even when value is set.

**Cause:** `optionValue` not matching model value.

**Solution:**

```typescript
options = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
];

selectedValue = 'opt1'; // Must match option.value
```

```html
<p-dropdown
  [options]="options"
  [(ngModel)]="selectedValue"
  optionLabel="label"
  optionValue="value"
  placeholder="Select option">
</p-dropdown>
```

---

### Issue 18: Shell component layout breaking on mobile

**Error:**
Mobile sidebar doesn't slide in, overlay not showing.

**Cause:** Fixed positioning conflicts or z-index issues.

**Solution:**

**Ensure proper z-index layering:**
```scss
.mobile-sidebar {
  position: fixed;
  z-index: 2000; // Above content
}

.sidebar-overlay {
  position: fixed;
  z-index: 1500; // Below sidebar, above content
}

.header {
  position: sticky;
  z-index: 1000; // Above content, below modals
}
```

**Verify transitions:**
```scss
.mobile-sidebar {
  transition: left 0.3s ease;
  left: -300px;

  &.visible {
    left: 0;
  }
}
```

---

## Testing Issues

### Issue 19: Unit tests failing after migration

**Error:**
```
NullInjectorError: No provider for PrimeNGConfig
```

**Cause:** PrimeNG modules not provided in tests.

**Solution:**

**component.spec.ts:**
```typescript
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ComponentUnderTest],
    providers: [
      providePrimeNG({
        theme: {
          preset: Aura,
        },
      }),
    ],
  }).compileComponents();
});
```

---

### Issue 20: E2E tests not finding PrimeNG elements

**Error:**
Playwright/Cypress can't find PrimeNG buttons or inputs.

**Cause:** PrimeNG components use shadow DOM or complex selectors.

**Solution:**

Use data-testid attributes:
```html
<p-button
  label="Submit"
  [attr.data-testid]="'submit-btn'">
</p-button>
```

Test with proper selectors:
```typescript
// Playwright
await page.getByTestId('submit-btn').click();

// Or use PrimeNG class selectors
await page.locator('.p-button').first().click();
```

---

## Migration-Specific Issues

### Issue 21: Conflicting styles from old SCSS

**Error:**
Components have mixed styling from old and new approaches.

**Cause:** Legacy SCSS files not removed or still being imported.

**Solution:**

1. **Identify legacy files:**
```bash
# Find old component SCSS files
find src -name "*.component.scss" -type f
```

2. **Review each file:**
   - If only contains Tailwind-replaceable code → delete
   - If contains complex animations → keep and refactor
   - If contains PrimeNG deep overrides → keep minimal version

3. **Remove imports:**
```typescript
// ❌ Remove if SCSS deleted
// styleUrls: ['./component.component.scss']

// ✅ Or keep minimal SCSS
styleUrls: ['./component.component.scss'] // Only if truly needed
```

---

### Issue 22: Inconsistent button styling

**Error:**
Some buttons use old styles, some use PrimeNG.

**Cause:** Gradual migration, inconsistent component usage.

**Solution:**

**Create reusable button component:**
```typescript
// libs/shared/ui/button.component.ts
@Component({
  selector: 'tabletap-button',
  template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [severity]="severity"
      [outlined]="outlined">
    </p-button>
  `
})
export class ButtonComponent {
  @Input() label!: string;
  @Input() icon?: string;
  @Input() severity = 'primary';
  @Input() outlined = false;
}
```

**Replace all buttons:**
```bash
# Find old button usage
grep -r "class=\".*btn.*\"" src/
```

---

### Issue 23: Card layouts not consistent

**Error:**
Cards have varying padding, shadows, and borders.

**Cause:** Mix of old custom cards and new PrimeNG cards.

**Solution:**

**Standardize on wrapped card component:**
```typescript
// libs/shared/ui/card.component.ts
@Component({
  selector: 'tabletap-card',
  template: `
    <p-card [styleClass]="cardClass">
      <ng-content></ng-content>
    </p-card>
  `
})
export class CardComponent {
  @Input() variant: 'default' | 'elevated' = 'default';

  get cardClass(): string {
    return this.variant === 'elevated' ? 'shadow-lg' : '';
  }
}
```

---

## Best Practices for Avoiding Issues

1. **Always use PrimeNG components first** - don't reinvent the wheel
2. **Test dark mode early** - add `.dark-theme` class during development
3. **Use Tailwind utilities** - avoid writing custom CSS for simple styling
4. **Keep SCSS minimal** - only for complex patterns
5. **Document custom patterns** - add to this troubleshooting guide
6. **Test responsive** - use browser dev tools to test all breakpoints
7. **Validate accessibility** - use axe DevTools or similar

## Getting Help

1. **Check this guide first** - common issues are documented here
2. **Review the migration guide** - ensure you followed all steps
3. **Check the component registry** - see migration status
4. **Review the style guide** - ensure you're following conventions
5. **Ask the team** - share issues in team chat
6. **Update this guide** - document new issues you encounter

## Resources

- [PrimeNG Troubleshooting](https://primeng.org/installation)
- [Tailwind CSS Troubleshooting](https://tailwindcss.com/docs/installation)
- [Angular Material Migration](https://material.angular.io/guide/mdc-migration)

## Last Updated

**Date**: 2025-10-03
**Maintained By**: TableTap Development Team

## Contributing

Found a new issue? Add it to this guide:

1. Document the error message
2. Explain the cause
3. Provide a clear solution
4. Include code examples
5. Add verification steps
