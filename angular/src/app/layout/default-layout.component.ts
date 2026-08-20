import { MediaMatcher } from "@angular/cdk/layout";
import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";

import { TranslatePipe } from "@ngx-translate/core";

import { ThemeService } from "@theme/theme.service";

import { AuthService } from "../auth/auth.service";
import LanguageDialogComponent from "../locale/language-dialog.component";

interface Link {
  icon: string;
  /** Translation key for this link's title */
  title: string;
  path: string;
}

interface CreateLink extends Link {
  /** Translation key for this link's subtitle */
  subtitle: string;
}

@Component({
  selector: "app-default-layout",
  imports: [
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: "./default-layout.component.html",
  styleUrl: "./default-layout.component.scss",
})
export default class DefaultLayout implements OnDestroy {
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly dialog = inject(MatDialog);
  protected readonly isMobile = signal(true);

  protected openLanguageDialog(): void {
    this.dialog.open(LanguageDialogComponent);
  }

  /** Current user's full name (or username as fallback) */
  protected userName = computed(() => {
    const user = this.auth.user$();
    return user?.fullName ?? user?.username ?? null;
  });

  /** User's favorites link */
  protected userFavoritesLink = computed(() => {
    const user = this.auth.user$();
    return user ? `/user/${user.id}/favorites` : null;
  });

  protected userAvatarURL = computed(() => {
    const user = this.auth.user$();
    if (!user) return null;
    return `/api/media/users/${user.id}/profile.webp?cacheKey=${user.cacheKey}`;
  });

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  constructor() {
    const media = inject(MediaMatcher);

    this._mobileQuery = media.matchMedia("(max-width: 600px)");
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
    this._mobileQuery.addEventListener("change", this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this._mobileQuery.removeEventListener("change", this._mobileQueryListener);
  }

  protected readonly topLinks: Link[] = [
    { icon: "silverware-fork-knife", title: "general.recipes", path: "/g/:groupSlug" },
    { icon: "magnify", title: "recipe-finder.recipe-finder", path: "/g/:groupSlug/recipes/finder" },
    { icon: "calendar-multiselect", title: "meal-plan.meal-planner", path: "/household/mealplan/planner/view" },
    { icon: "format-list-checks", title: "shopping-list.shopping-lists", path: "/shopping-lists" },
    { icon: "timeline-text", title: "recipe.timeline", path: "/g/:groupSlug/recipes/timeline" },
    { icon: "book-open-page-variant", title: "cookbook.cookbooks", path: "/g/:groupSlug/cookbooks" },
  ] as const;

  protected readonly organizerLinks: Link[] = [
    { icon: "shape-outline", title: "sidebar.categories", path: "/g/:groupSlug/recipes/categories" },
    { icon: "tag-multiple-outline", title: "sidebar.tags", path: "/g/:groupSlug/recipes/tags" },
    { icon: "pot-steam-outline", title: "tool.tools", path: "/g/:groupSlug/recipes/tools" },
  ] as const;

  protected readonly createLinks: CreateLink[] = [
    { icon: "link", title: "general.import", subtitle: "new-recipe.import-by-url", path: "/g/:groupSlug/r/create/url" },
    {
      icon: "square-edit-outline",
      title: "general.create",
      subtitle: "new-recipe.create-manually",
      path: "/g/:groupSlug/r/create/new",
    },
  ] as const;
}
