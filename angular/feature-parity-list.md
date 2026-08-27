# Feature Parity Checklist

User-facing features required for feature parity with the Vue app, plus new features/regressions and design choices made.
feature list itself is generated based on the old codebase so it might not be 100% complete or accurate, but it should have the broad stroke features in there so it's a convenient way for me to not miss anything

## New Features

This is a list of new features and regressions the Angular app has that the original vue one doesn't as I add/find them.
This list isn't isn't exhaustive (I'm not going to list every built in angular feature that the vue app doesn't have) but it should include every one that included extra work to make happen.

- Dark/light theme button has an "auto" mode which matches to the system mode, this is mainly to support those who have their theme change between light and dark modes depending on the time of day, which is rare but it is possible
- The login state is sync'd between tabs using a stored value listener, it's a bit of a hack but it works, a bit unnecessary but it's nice to have
- Unit tests on basically everything

### Regressions

- The original app uses an older material standard (or perhaps uses it's own coloring standard, I'm not familiar with the older standards), the Angular app uses a M3 theme which uses colors differently and due to the various tones used it's non trivial to port over the same custom theme colors from the API the old app was doing, so the Angular app doesn't even look at the custom theme colours
  - It's feasible to port this over by overriding the css variables with calculated tones, but it's non-trivial to make happen and isn't something I'm invested in making happen
  - There are various minor design changes based on my UX experience outside of just the theme changes, I'm not going to list these all (you can do your own side by side)
- The new app doesn't look at the language date time formats included in the original app, instead we rely on the built in date/time localisation built into browsers
  - Plan is to also allow the user to select a specific localisation to use
- RTL languages don't render the UI properly currently, Will fix this before calling this done
- I've got no pipelines setup for this, if this ever does go into upstream they should be setup for linting/testing and maybe code gen steps
- There are going to be meta things I've missed since they're scattered across the application, the ones I know of are: pwa settings, webmanifest (I have one defined but the backend is supplying one so I either need to align my app to work with that or align them)
- No "Invite Only" message on login page when signups are disabled, this is an opinionated choice from me and I could be convinced to add it back, though in my humble opinion it clutters the UI for little gain

### Design decisions

- The Angular app is using `@ngx-translate` for it's internationalization, the primary internationalization package for Angular is `@angular/localize` however it is built to compiling the app for a particular language (it is intended that you build a different app for each localisation and put them under different domains/subdomains) and it doesn't use the same format as the old system, so while porting over to that is possible it requires more high level design decisions than I'm comfortable making, so I'm using `@ngx-translate` instead, which supports the json format and changing languages in the same app though doesn't do the same date handling as `vue-i18n`
  - Language files are currently symbolically linked from the vue app to the angular app project files to keep them in sync and avoid duplicating
  - @angular/localize is setup to default to US English and the rest of the languages are fetched as they're required to keep the package size down
- The auth cookie has been replaced with local storage to simplify the code, cookies aren't any more secure than local storage in this case, You can get extra XSS protection by using HttpOnly cookies, though that requires backend changes which is beyond the scope of what I want to do here
- The theme change and language change buttons are now in the top right of the toolbar to give them more visibility (I can be convinced to put them back)
- The vue app is largely uses type based directory structure, components are under one directory, pages in another, etc, etc, The Angular app is area based, so code that is related is close to eachother, there is a more specific
- Local Storage is used over cookies, this means any user config, session info, etc stored in cookies won't carry over to the new front end and vice versa
- I have put the app name at the start of the page title (e.g. `Login | Mealie` rather than just `Login`)
  - This is important for those who are mainly reading their tabs for whatever reason (e.g. somebody who relies on a screenreader)
- Unauthed login adjacent pages now share a shell with the login of the card with a header that has a few app controls on it

### New translation keys needed

- `user.hide-password` - Used for aria label for hide password button
- `settings.theme.auto-mode` - used on the tooltip when the theme is on auto mode
- `user.no-login-method` - Used when the user has misconfigured their Mealie and all the login methods are disabled

### New features I'm yet to add

This is a list of features I want to add that didn't exist in the original vue app that I want to see but haven't added yet

- Translate and theme buttons on login page (faded in background so they're discrete but noticeable)

---

## 1. Authentication & Account Management

### Sign In / Sign Out

- [x] Email/password login with "Remember Me" (`pages/login.vue`)
- [x] OIDC (OpenID Connect) integration and callback handling
- [x] Session persistence and auto-redirect to default activity
- [x] First-time login detection (shows default credentials banner)
- [x] Token cookie management (`use-token-cookie.ts`)
  - Replaced with localStorage handling instead, see design decisions above
- [x] Sign out

### Password Recovery

- [x] Forgot password flow (`pages/forgot-password.vue`)
- [x] Reset password flow (`pages/reset-password.vue`)
- [x] Password strength validation (`use-passwords.ts`, `UserPasswordStrength.vue`)

### Registration & Group Joining

- [ ] Multi-step registration wizard (`UserRegistrationForm.vue`, `pages/register/`)
- [ ] Join an existing group via invitation token
- [ ] Create a new group with optional seed data and privacy settings
- [ ] Group name uniqueness validation (async)
- [ ] PWA share-target redirect — sharing a URL to the app opens the recipe importer (`middleware/pwa-share-target-redirect.global.ts`)
  - I've read the source middleware multiple times and I'm still not sure what this is achieving, so I skipped adding it along with the other guards for the moment
  - There is a chance my login page handling covers this case by happenstance, but I'll investigate further once I get to this feature section

### User Profile

- [ ] Edit profile details (name, email, full name) (`pages/user/profile/edit.vue`)
- [ ] Manage API tokens (generate, copy, delete) (`pages/user/profile/api-tokens.vue`)
- [ ] User preferences:
  - [x] Locale/language selection (`LanguageDialog.vue`)
  - [x] Dark mode toggle
  - [ ] Default activity route (Recipes / Meal Planner / Shopping List)
  - [ ] Advanced mode toggle (`AdvancedOnly.vue`)
- [ ] View other user profiles (`pages/user/[id]/`)
- [ ] View a user's favorite recipes (`pages/user/[id]/favorites.vue`)

---

## 2. Recipe Management

### Browse & Explore Recipes

- [ ] Recipe listing with grid/list view toggle (`RecipeExplorerPage/`)
- [ ] Full-text search via global search dialog (`RecipeDialogSearch.vue`)
- [ ] Filter by categories, tags, tools, labels, and keywords (`RecipeExplorerPageSearchFilters.vue`, `SearchFilter.vue`, `QueryFilterBuilder.vue`)
- [ ] Sort recipes
- [ ] Responsive card layout (desktop `RecipeCard.vue`, mobile `RecipeCardMobile.vue`)
- [ ] Card metadata:
  - [ ] Recipe chips display (`RecipeChips.vue`)
  - [ ] Rating badge (`RecipeCardRating.vue`)
  - [ ] Favorite badge (`RecipeFavoriteBadge.vue`)
  - [ ] Card sections (`RecipeCardSection.vue`)
- [ ] Recipe table view (`RecipeDataTable.vue`)
- [ ] Recipe suggestions (`RecipeSuggestion.vue`)

### View Recipe Details

- [ ] Full recipe display: ingredients, instructions, notes, nutrition (`RecipePage.vue`, `RecipePageParts/`)
- [ ] Recipe timeline (update history, "Made" events, comments) (`RecipeTimeline.vue`)
- [ ] Ingredient scaling and yield management (`RecipePageScale.vue`, `RecipeYield.vue`)
- [ ] Recipe info card with image (`RecipePageInfoCard.vue`)
- [ ] Markdown-rendered instructions (`RecipePageInstructions.vue`)
- [ ] Comments section (`RecipePageComments.vue`)
- [ ] "Last Made" display (`RecipeLastMade.vue`)
- [ ] Rating display (`RecipeRating.vue`)
- [ ] Time estimation cards (prep, cook, total) (`RecipeTimeCard.vue`)
- [ ] Recipe assets (`RecipeAssets.vue`)
- [ ] Nutrition display (`RecipeNutrition.vue`)
- [ ] Recipe notes (`RecipeNotes.vue`)
- [ ] Data alias manager (`RecipeDataAliasManagerDialog.vue`)
- [ ] Recipe action menu (contextual actions) (`RecipeActionMenu.vue`)
- [ ] Recipe settings (toggle comments, public sharing, etc.) (`RecipeSettingsMenu.vue`, `RecipeSettingsSwitches.vue`)
- [ ] Right-click context menu (`RecipeContextMenu/`)

### Create & Edit Recipes

- [ ] Full CRUD for recipe details (`RecipePageInfoEditor.vue`)
- [ ] Editor toolbar (`RecipePageEditorToolbar.vue`)
- [ ] Markdown editor for instructions/notes (`MarkdownEditor.vue`)
- [ ] Ingredient editor with fraction/scaling logic (`RecipeIngredientEditor.vue`, `RecipePageIngredientEditor.vue`)
- [ ] Image upload and cropping (`ImageCropper.vue`, `RecipeImageUploadBtn.vue`)
- [ ] Organizer assignment (categories, tags, labels) (`RecipeOrganizerDialog.vue`, `RecipeOrganizerSelector.vue`)
- [ ] Ingredient tools view (`RecipePageIngredientToolsView.vue`)
- [ ] Unsaved changes warning on navigation away (`use-navigation-warning.ts`)

### Import Recipes

- [ ] Import from URL (web scraper) (`pages/g/[groupSlug]/r/create/url.vue`)
- [ ] Import from image (AI parsing) (`pages/g/[groupSlug]/r/create/image.vue`)
- [ ] Import from HTML file (`pages/g/[groupSlug]/r/create/html.vue`)
- [ ] Import from ZIP archive (`pages/g/[groupSlug]/r/create/zip.vue`)
- [ ] Create recipe from scratch (`pages/g/[groupSlug]/r/create/new.vue`)
- [ ] Bulk import mode (`pages/g/[groupSlug]/r/create/bulk.vue`, `RecipeDialogBulkAdd.vue`)
- [ ] Parser debug/testing interface (`pages/g/[groupSlug]/r/create/debug.vue`)
- [ ] File upload handling (`lib/api/user/upload.ts`)

### Bulk Operations

- [ ] Add recipes to shopping list (`RecipeDialogAddToShoppingList.vue`)
- [ ] Print preferences dialog (`RecipeDialogPrintPreferences.vue`)
- [ ] Recipe list view for batch operations (`RecipeList.vue`)
- [ ] Organizer assignment page (`RecipeOrganizerPage.vue`)

### Print & Share

- [ ] Print-ready recipe layout (`RecipePrintContainer.vue`, `RecipePrintView.vue`)
- [ ] Generate public share link (`RecipeDialogShare.vue`)
- [ ] View shared recipe (unauthenticated, via token) (`pages/g/[groupSlug]/shared/r/[id].vue`, `SharedApi`)

---

## 3. Recipe Organization

### Categories, Tags & Labels

- [ ] CRUD for categories, tags, and labels (`pages/group/data/categories.vue`, `tags.vue`, `labels.vue`)
- [ ] Color and icon support for organizers
- [ ] Browse recipes by category (`pages/g/[groupSlug]/recipes/categories/`)
- [ ] Browse recipes by tag (`pages/g/[groupSlug]/recipes/tags/`)
- [ ] Browse recipes by tool (`pages/g/[groupSlug]/recipes/tools/`)

### Cookbooks

- [ ] Create and edit cookbooks (`CookbookEditor.vue`)
- [ ] View cookbook pages (`CookbookPage.vue`)
- [ ] Assign recipes to cookbooks
- [ ] Public/private cookbook visibility settings

### Favorites

- [ ] Mark/unmark recipes as favorites
- [ ] View user's favorites (`pages/user/[id]/favorites.vue`)

### Recipe Actions

- [ ] Create custom URL actions for recipes (e.g., open in external app) (`pages/group/data/recipe-actions.vue`)

---

## 4. Meal Planning

### Meal Planner

- [ ] Weekly calendar view with date range picker (`pages/household/mealplan/planner/`)
- [ ] Add, edit, and delete meal entries
- [ ] Meal types: Breakfast, Lunch, Dinner, Side, Snack, Drink, Dessert
- [ ] Move meals between days (`GroupMealPlanDayContextMenu.vue`)
- [ ] Context menu for meal plan day actions

### Meal Plan Rules

- [ ] Configure automatic meal planning rules (`pages/household/mealplan/settings.vue`, `GroupMealPlanRuleForm.vue`)

### Shopping List Integration

- [ ] Add all meals from a plan to a shopping list

---

## 5. Shopping Lists

### List Management

- [ ] Create, edit, and delete shopping lists (`pages/shopping-lists/index.vue`)
- [ ] Assign list ownership to household members
- [ ] "Show All Lists" toggle

### Item Management

- [ ] View list details (`pages/shopping-lists/[id].vue`)
- [ ] Add items individually or in bulk (`ShoppingListAddItemForm.vue`)
- [ ] Edit item details (name, quantity, note, position) (`ShoppingListItemEditor.vue`)
- [ ] Delete items
- [ ] Check/uncheck items (completion state) (`ShoppingListItem.vue`)
- [ ] Item details panel (`ShoppingListItemDetails.vue`)
- [ ] Multi-purpose label sections (`MultiPurposeLabel.vue`, `MultiPurposeLabelSection.vue`)

### Offline Support

- [ ] LocalStorage-based offline queue for create/update/delete operations (`use-shopping-list-item-actions.ts`)
- [ ] Queue merging with conflict resolution (last-write-wins by `updatedAt`)
- [ ] Automatic queue processing on reconnect
- [ ] Queue timeout invalidation (5-minute stale cutoff)
- [ ] Merge pending local changes with server state on fetch

---

## 6. Group & Household Management

### Group Preferences

- [ ] Edit group settings (locale, date formats, etc.) (`GroupPreferencesEditor.vue`)
- [ ] AI provider configuration (`GroupAIProviderDialog.vue`, `GroupAIProviderSettingsEditor.vue`)
- [ ] Export group data (`GroupExportData.vue`)

### Household Preferences

- [ ] Edit household settings (`HouseholdPreferencesEditor.vue`)

### Member Management

- [ ] View and manage household members (`pages/household/members.vue`)

### Notifications & Webhooks

- [ ] Manage event notifiers (Apprise-based: Discord, Gotify, Home Assistant, Matrix, Pushover, etc.) (`pages/household/notifiers.vue`)
  - [ ] Configure per-event notifications (recipe, user, meal plan, shopping list, cookbook, tag, category, label events)
  - [ ] Test notifier delivery
- [ ] Manage webhooks (CRUD + test) (`pages/household/webhooks.vue`, `GroupWebhookEditor.vue`)

---

## 7. Admin & System Management

### User Management

- [ ] List, create, edit, and delete users (`pages/admin/manage/users/`)
- [ ] Assign users to groups/households
- [ ] Invite users (`UserInviteDialog.vue`)

### Group & Household Management

- [ ] List and edit groups (`pages/admin/manage/groups/`)
- [ ] List and edit households (`pages/admin/manage/households/`)

### Site Settings & Health

- [ ] Application health checks (email, LDAP, OIDC readiness, HTTPS, up-to-date) (`pages/admin/site-settings.vue`)
- [ ] Admin statistics dashboard (total recipes, users, households, groups, uncategorized/untagged)
- [ ] Application info display (version, database, build info, changelog links)
- [ ] Test email functionality
- [ ] Bug report dialog (generates diagnostic text with sensitive fields redacted)

### Backups

- [ ] Create, view, restore, and delete database backups (`pages/admin/backups.vue`)

### Setup & Maintenance

- [ ] Initial application setup wizard (`pages/admin/setup.vue`)
- [ ] System maintenance operations (`pages/admin/maintenance/`)

### Debug Tools

- [ ] Parser debug/testing interface (`pages/admin/debug/parser.vue`)
- [ ] OpenAI debug interface (`pages/admin/debug/openai.vue`)

---

## 8. Data Management

### Organizer CRUD

- [ ] Categories (`pages/group/data/categories.vue`)
- [ ] Tags (`pages/group/data/tags.vue`)
- [ ] Labels (`pages/group/data/labels.vue`)
- [ ] Tools (`pages/group/data/tools.vue`)
- [ ] Foods (`pages/group/data/foods.vue`)
- [ ] Units (`pages/group/data/units.vue`)
- [ ] Recipe Actions (`pages/group/data/recipe-actions.vue`)
- [ ] Recipes overview (`pages/group/data/recipes.vue`)

### Data Migration

- [ ] Import data from external sources: Chowdown, CopyMeThat, MyRecipeBox, Nextcloud, Paprika, Plantoeat, RecipeKeeper, Tandoor, Cook'n, Legacy Mealie (`pages/group/migrations.vue`)
- [ ] Migration progress reports and logs
- [ ] Tag recipes with migration source

### Reports

- [ ] View system reports (audit/activity logs) (`pages/group/reports/[id].vue`)

---

## 9. Public-Facing Features

### Public Group Pages

- [ ] Browse recipes publicly by group slug (`pages/g/[groupSlug]/recipes/`)
- [ ] Browse cookbooks publicly (`pages/g/[groupSlug]/cookbooks/`)
- [ ] Browse by category, tag, or tool publicly
- [ ] Browse recipe timeline publicly (`pages/g/[groupSlug]/recipes/timeline.vue`)
- [ ] Public group landing page (`pages/g/[groupSlug]/index.vue`)

### Shared Recipes

- [ ] View shared recipe via token (unauthenticated) (`pages/g/[groupSlug]/shared/r/[id].vue`)

---

## 10. Cross-Cutting Concerns

### Internationalization (i18n)

- [x] Multi-language support with locale switching (`composables/use-global-i18n.ts`, `LanguageDialog.vue`)
- [x] Locale files (`app/lang/`, en-US primary, others via Crowdin)
  - Symlinked from vue app so they're kept in sync without extra effort

### Screen Wake Lock

- [ ] Toggle to keep screen awake (used on recipe viewer and shopping list detail) (`WakelockSwitch.vue`)

### Toast Notifications

- [x] In-app toast/snackbar system (`TheSnackbar.vue`, `use-toast.ts`)
  - Exists in practise but further styles need to be added for it to support every state and use case from the vue app

### Announcements

- [ ] Dismissible announcement dialog with per-user tracking (`AnnouncementDialog.vue`, `use-announcements.ts`)
- [ ] Date-based announcement keying and sorting
- [ ] Welcome announcement (first-time onboarding)
- [ ] "Mark all as read" functionality
- [ ] Enable/disable at user, household, and group levels

### Advanced Mode

- [x] Conditional UI gated by "advanced mode" preference (`AdvancedOnly.vue`, `middleware/advanced-only.ts`)
  - This is ticked off but no UI is gated as of writing, though a guard exists

### Route Guards

- [x] Authentication guard — redirects unauthenticated users (`middleware/`)
- [x] Admin-only guard (`middleware/admin-only.ts`)
- [x] Household management guard (`middleware/can-manage-household-only.ts`)
- [x] Group management guard (`middleware/can-manage-only.ts`)
- [x] Organizer access guard (`middleware/can-organize-only.ts`)
- [x] Group context guard (`middleware/group-only.ts`)

### Application Shell

- [ ] Main layout with header, sidebar navigation, and footer (`DefaultLayout.vue`, `AppToolbar.vue`, `AppHeader.vue`, `AppSidebar.vue`, `AppFooter.vue`)
  - _Partial_: Header (toolbar) and sidebar (sidenav) are implemented. Missing: footer, settings/announcements area
  - Note that there is a lot of conditional rendering vue is doing that we're not doing here yet either
- [ ] App loader (`AppLoader.vue`)
  - Reusable loading component

### Reusable UI Primitives

- [ ] Dynamic form generator from schema (`AutoForm.vue`)
- [ ] Generic CRUD table (`CrudTable.vue`)
- [ ] Modal dialog wrapper (`BaseDialog.vue`)
- [ ] Button primitives (`BaseButton.vue`, `BaseButtonGroup.vue`, `BaseOverflowButton.vue`)
- [ ] Layout primitives (`BaseDivider.vue`, `BaseExpansionPanels.vue`, `BasePageTitle.vue`)
- [ ] Right-click context menus (`ContextMenu.vue`)
- [ ] File drag-and-drop upload (`DropZone.vue`)
- [ ] Key-value pair editor (`BaseKeyValueEditor.vue`)
- [ ] Custom inputs (`InputColor.vue`, `InputLabelType.vue`)
- [ ] Sanitized markdown renderer (`SafeMarkdown.vue`)
- [ ] Statistics display cards (`StatsCards.vue`)
- [ ] Boolean toggle with persistence (`ToggleState.vue`)
- [ ] Utility buttons (copy to clipboard, upload) (`AppButtonCopy.vue`, `AppButtonUpload.vue`)
- [ ] Status banners (`BannerExperimental.vue`, `BannerWarning.vue`)
- [ ] Documentation helpers (`HelpIcon.vue`, `DocLink.vue`)
- [ ] Raw recipe JSON editor (`RecipeJsonEditor.vue`)
- [ ] Report data table (`ReportTable.vue`)

---

## Notes

- **API Layer:** The Angular app needs its own HTTP client layer mirroring the Vue app's `lib/api/` structure (base API client, user API, admin API, public API). This is infrastructure, not a user feature.
- **State Management:** Replace Vue composables (`composables/`) with Angular services/signals. Key state areas: recipe state, shopping list state (incl. offline queue), organizer stores, auth state, group/household state.
- **Code Generation:** TypeScript types in `frontend/app/lib/api/types/` are auto-generated from Pydantic schemas — the Angular app should consume the same backend types.
