import { Component, computed, inject, input } from "@angular/core";
import { type Field } from "@angular/forms/signals";

import { MatProgressBarModule } from "@angular/material/progress-bar";

import { TranslateService } from "@ngx-translate/core";

import { HiddenInputComponent } from "@app/core/hidden-input.component";

import { PasswordStrengthService } from "./password-strength.service";

/**
 * A paired new-password / confirm-password input with a live strength bar.
 *
 * The two fields (and therefore their `Field`s) are owned by the parent form;
 * this component renders them (via `mealie-hidden-input`) and scores the new
 * password. The strength bar always scores `passwordField`.
 */
@Component({
  selector: "mealie-new-password-input",
  imports: [HiddenInputComponent, MatProgressBarModule],
  templateUrl: "./new-password-input.component.html",
  styleUrl: "./new-password-input.component.scss",
})
export default class NewPasswordInputComponent {
  private readonly strengthService = inject(PasswordStrengthService);
  private readonly translate = inject(TranslateService);

  /** The new-password field, owned by the parent form. */
  readonly passwordField = input.required<Field<string>>();
  /** The confirm-password field, owned by the parent form. */
  readonly confirmField = input.required<Field<string>>();

  // The bar scores the *new* password only
  private get passwordValue(): string {
    return this.passwordField()().value();
  }

  protected readonly score = computed(() => this.strengthService.score(this.passwordValue));
  protected readonly strengthClass = computed(() => `strength-${this.strengthService.strength(this.score())}`);
  protected readonly strengthText = computed(() =>
    this.translate.instant("user.password-strength", {
      strength: this.translate.instant(`user.password-strength-values.${this.strengthService.strength(this.score())}`),
    }),
  );
}
