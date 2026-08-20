import { Component, OnInit, inject } from "@angular/core";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from "@angular/router";

import { MatIconRegistry } from "@angular/material/icon";

import { TranslateService } from "@ngx-translate/core";
import { filter, map, tap } from "rxjs";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App implements OnInit {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);
  private router = inject(Router);
  private translate = inject(TranslateService);

  constructor() {
    this.iconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl("./assets/mdi.svg"));
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => {
          // Traverse to the deepest child, then check titles bottom-up
          const stack: ActivatedRoute[] = [this.router.routerState.root];
          let current: ActivatedRoute | null = this.router.routerState.root;
          while (current.firstChild) {
            current = current.firstChild;
            stack.push(current);
          }

          while (stack.length) {
            const route = stack.pop()!;
            const titleKey = route.snapshot.data?.["title"] as string | undefined;
            if (titleKey) return titleKey;
          }
          return "Mealie";
        }),
        tap((key) => {
          if (key === "Mealie") {
            this.title.setTitle(key);
          } else {
            this.translate.get(key).subscribe((translated) => this.title.setTitle(`Mealie - ${translated}`));
          }
        }),
      )
      .subscribe();
  }
}
