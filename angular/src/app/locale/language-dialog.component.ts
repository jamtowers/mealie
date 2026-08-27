import { Component, computed, inject, signal } from "@angular/core";

import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { TranslatePipe, translate } from "@ngx-translate/core";
import Fuse from "fuse.js";

import { LOCALES } from "./available-locales";
import { Locale, LocaleService } from "./locale.service";

const CONTRIBUTE_HREF = "https://docs.mealie.io/contributors/translating/";

const fuse = new Fuse(LOCALES, {
  keys: ["name"],
  threshold: 0.4,
  ignoreDiacritics: true,
});

@Component({
  selector: "mealie-language-dialog",
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: "./language-dialog.component.html",
  styleUrl: "./language-dialog.component.scss",
})
export default class LanguageDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LanguageDialogComponent>);
  private readonly localeService = inject(LocaleService);

  /** Search query, initialised with the name of the active locale */
  protected readonly query = signal(this.localeService.currentLocaleName());

  /** Tracks whether the panel has been opened at least once (after initial focus) */
  private hasOpened = signal(false);
  /** Tracks whether the user has interacted (typed or selected) with the autocomplete */
  private hasInteracted = signal(false);
  /** Tracks whether an option was selected during the current panel session */
  private hasSelected = signal(false);
  /**
   * Set while the dialog is closing (backdrop / cancel). The overlay teardown
   * natively refocuses the input, which would reopen the autocomplete panel
   * over the exiting dialog; disable the trigger and close the panel instead.
   */
  protected readonly isClosing = signal(false);

  protected readonly filteredLocales = computed(() => {
    if (!this.hasOpened()) {
      // First focus: show no options (panel will close immediately)
      return [];
    }
    if (!this.hasInteracted()) {
      // First real open: show all options
      return LOCALES;
    }
    const results = fuse.search(this.query());
    return results.map((result) => result.item);
  });

  constructor() {
    this.dialogRef.beforeClosed().subscribe(() => this.isClosing.set(true));
  }

  protected onPanelOpened(trigger: MatAutocompleteTrigger): void {
    if (!this.hasOpened()) {
      // First focus: close panel immediately (no options shown)
      this.hasOpened.set(true);
      trigger.closePanel();
      return;
    }

    if (this.isClosing()) {
      // The dialog is closing: don't let the teardown refocus reopen the panel
      trigger.closePanel();
      return;
    }

    this.hasSelected.set(false);
  }

  protected onPanelClosed(): void {
    // Reset query to current locale name if no option was selected
    if (!this.hasSelected()) {
      this.query.set(this.localeService.currentLocaleName());
    }
  }

  contributeLink = translate("language-dialog.read-the-docs");
  contributeHtml = translate("language-dialog.how-to-contribute-description", {
    "read-the-docs-link": `<a href="${CONTRIBUTE_HREF}" target="_blank" rel="noopener noreferrer">${this.contributeLink()}</a>`,
  });

  protected onQueryInput(event: Event): void {
    this.hasInteracted.set(true);
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onLocaleSelected(event: MatAutocompleteSelectedEvent): void {
    this.hasInteracted.set(true);
    this.hasSelected.set(true);
    const locale = event.option.value as Locale;

    // Re-selecting the active locale leaves the dialog open (matches the Vue dialog)
    if (locale.value === this.localeService.locale()) {
      return;
    }

    this.query.set(locale.name);
    this.localeService.setLocale(locale.value);
    this.dialogRef.close();
  }
}
