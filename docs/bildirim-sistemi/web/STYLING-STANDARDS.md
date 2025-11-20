# Web Ops - UI/UX Styling Standards

**Scope:** `/apps/web/app/ops/(private)/` directory only  
**Tarih:** Nov 20, 2025

## 📋 İçindekiler

1. [Genel Prensipler](#genel-prensipler)
2. [CSS Variables](#css-variables)
3. [Bileşen Stilleri](#bileşen-stilleri)
4. [Dark Mode](#dark-mode)
5. [Örnekler](#örnekler)
6. [DO's & DON'Ts](#dos--donts)

---

## Genel Prensipler

### 1. CSS Variables Kullan

**Neden?**
- ✅ Otomatik dark mode desteği
- ✅ Tutarlı tasarım dili
- ✅ Kolay tema değişikliği
- ✅ Maintenance kolaylığı

### 2. shadcn/ui Bileşenleri Kullan

- ✅ `<Card>`, `<Button>`, `<Badge>`
- ✅ `<Table>`, `<Dialog>`, `<Popover>`
- ✅ Built-in dark mode support

### 3. Tailwind CSS Utility Classes

- ✅ Responsive design
- ✅ Hover/focus states
- ✅ Dark mode variants

---

## CSS Variables

### Primary Variables

| Variable                | Kullanım              |
| ----------------------- | --------------------- |
| `bg-background`         | Page background       |
| `text-foreground`       | Main text             |
| `bg-card`               | Card backgrounds      |
| `bg-muted`              | Secondary backgrounds |
| `text-muted-foreground` | Secondary text        |
| `text-primary`          | Accent text, titles   |
| `border-border`         | All borders           |

---

## Bileşen Stilleri

### Cards

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Label
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-2">Description</p>
  </CardContent>
</Card>
```

### Text Colors

```tsx
<h1 className="text-foreground">Main title</h1>
<p className="text-muted-foreground">Secondary text</p>
<span className="text-primary">Accent text</span>
```

### Borders

```tsx
<div className="border border-border rounded-lg">Content</div>
```

### Status Cards (Exception - Semantic Colors)

```tsx
// Warning
<Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
  <CardContent className="text-orange-800 dark:text-orange-200">
    Warning message
  </CardContent>
</Card>

// Error
<Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
  <CardContent className="text-red-800 dark:text-red-200">
    Error message
  </CardContent>
</Card>

// Success
<Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
  <CardContent className="text-green-800 dark:text-green-200">
    Success message
  </CardContent>
</Card>
```

### Tables

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-accent">
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Dark Mode

### Otomatik Desteği

CSS variables otomatik olarak `.dark` class'ında switch olur.

### Theme Switcher

**Dosya:** `/apps/web/app/ops/(private)/account/theme-switcher-toggle.tsx`

- Light/Dark toggle
- System preference respekt
- localStorage persistence
- No flash on page load

---

## DO's & DON'Ts

### ✅ DO

- ✅ Use CSS variables
- ✅ Use `text-muted-foreground` for secondary text
- ✅ Use `bg-muted` for secondary backgrounds
- ✅ Use `border-border` for all borders
- ✅ Use semantic colors for status
- ✅ Use `dark:` prefix only for semantic colors
- ✅ Use shadcn/ui components
- ✅ Use Tailwind utility classes

### ❌ DON'T

- ❌ Hardcode colors (text-gray-600, bg-blue-50)
- ❌ Use `text-gray-500` (use `text-muted-foreground`)
- ❌ Use `border-gray-200` (use `border-border`)
- ❌ Mix hardcoded and CSS variable colors
- ❌ Create custom color classes

---

**Dokümantasyon Tarihi:** Nov 20, 2025
