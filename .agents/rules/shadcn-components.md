# shadcn/ui Component Usage & Styling Rules

## 1. Strictly Use shadcn/ui Components Only
- **Exclusive Source**: All UI elements (buttons, inputs, cards, dialogs, dropdowns, forms, badges, tabs, sheets, tables, avatars, etc.) MUST be imported from `@/components/ui/*`.
- **No Custom UI Primitives**: Never create custom implementations from scratch if a corresponding shadcn/ui component exists or can be added.
- **Search & Fetch from Registry if Not Present**: If a component, block, or pattern is not yet installed in the project, NEVER write a custom fallback or raw HTML. You MUST search the shadcn library/registry and fetch/add it:
  1. **Search Registry**: Find available components, blocks, or hooks:
     ```bash
     npx shadcn@latest search -q <query>
     # Example: npx shadcn@latest search -q dialog
     # Filter by type (ui, block, hook): npx shadcn@latest search -t block -q form
     ```
  2. **Fetch & Add Component**: Install it directly from the registry:
     ```bash
     npx shadcn@latest add <component-name>
     # Example: npx shadcn@latest add dialog
     # Add from community/custom registry: npx shadcn@latest add <registry-url-or-name>
     ```
  3. **Check Docs & Usage**: Inspect official component API and props:
     ```bash
     npx shadcn@latest docs <component-name>
     ```
- **Strictly No Raw HTML Primitives (Exhaustive Replacement)**: Never use raw HTML elements whenever a shadcn/ui equivalent exists. You MUST use the official shadcn component for all UI primitives:

| HTML Primitive / Concept | Required shadcn/ui Component (`@/components/ui/*`) |
| :--- | :--- |
| `<button>` | `<Button>` / `<LinkButton>` |
| `<input type="text\|email\|password\|number\|...">` | `<Input>` |
| `<textarea>` | `<Textarea>` |
| `<select>`, `<option>` | `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>` |
| `<label>` | `<Label>` |
| `<input type="checkbox">` | `<Checkbox>` |
| `<input type="radio">` | `<RadioGroup>`, `<RadioGroupItem>` |
| `<input type="range">` | `<Slider>` |
| Toggle / Switch | `<Switch>` |
| `<hr>`, divider lines | `<Separator>` |
| `<article>`, card containers | `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>` |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableHead>`, `<TableRow>`, `<TableCell>` |
| `<dialog>`, modal popups | `<Dialog>`, `<AlertDialog>` |
| Side drawers, slide-overs | `<Sheet>`, `<Drawer>` |
| Dropdown menus | `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>` |
| Tooltips (`title="..."`) | `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>` |
| Popovers | `<Popover>`, `<PopoverTrigger>`, `<PopoverContent>` |
| Context menus (right click) | `<ContextMenu>` |
| `<details>`, `<summary>`, accordions | `<Accordion>`, `<Collapsible>` |
| Navigation bars, menus | `<NavigationMenu>`, `<Menubar>` |
| Breadcrumbs (`<nav>`, `<ol>`) | `<Breadcrumb>`, `<BreadcrumbList>`, `<BreadcrumbItem>`, `<BreadcrumbLink>`, `<BreadcrumbPage>` |
| Tabs | `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` |
| Tags, chips, status pills (`<span>`) | `<Badge>` |
| User avatars, profile images (`<img>`) | `<Avatar>`, `<AvatarImage>`, `<AvatarFallback>` |
| `<progress>`, progress bars | `<Progress>` |
| Loading placeholders, skeleton boxes | `<Skeleton>` |
| Alert banners, notice callouts | `<Alert>`, `<AlertTitle>`, `<AlertDescription>` |
| Scroll containers (`overflow-auto`) | `<ScrollArea>` |

## 2. No Extra CSS or Style Overrides on Components
- **Zero Style Overrides on Components**: When consuming and rendering shadcn/ui components, do NOT add extra CSS, custom utility classes, or inline styles to change the component's internal design:
  - ❌ **Do NOT override component styling with custom classes**:
    ```tsx
    // BAD: Adding custom background, padding, border, or text color
    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg px-8 py-3">
      Submit
    </Button>
    ```
  - ✅ **Use built-in variant and size props**:
    ```tsx
    // GOOD: Rely exclusively on component props
    <Button variant="default" size="default">
      Submit
    </Button>
    ```
- **Use Built-in Props & Variants Only**:
  - Control component appearance strictly through their supported props:
    - `variant`: e.g. `"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"`
    - `size`: e.g. `"default" | "sm" | "lg" | "xs" | "icon"`
- **Strictly No Inline Styles or CSS Modules**:
  - Do NOT pass `style={{ ... }}` to shadcn components.
  - Do NOT create `.module.css` or write custom external CSS rules targeting shadcn components.

## 3. Layout and Spacing Separation
- **Parent Containers Handle Layout**: Positioning, margins, grid layouts, and flex spacing must be handled strictly by parent container elements (`<div>`, `<section>`, `<main>`), NEVER by adding custom styling classes directly to shadcn components:
  - ❌ **Bad**:
    ```tsx
    <Button className="mt-4 mb-2 ml-auto w-full">Save</Button>
    ```
  - ✅ **Good**:
    ```tsx
    <div className="mt-4 mb-2 flex justify-end">
      <Button>Save</Button>
    </div>
    ```

## 4. Design System & Theme Integrity
- All colors, radii, typography, and borders must adhere to the design system tokens configured in `app/globals.css` and `components.json`.
- Do not introduce arbitrary hardcoded CSS colors or styling that deviates from the theme variables or breaks dark/light mode compatibility.
