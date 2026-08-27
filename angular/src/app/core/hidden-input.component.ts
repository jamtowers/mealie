import { Component, input, signal } from "@angular/core";
import { type Field, FormField } from "@angular/forms/signals";

import { MatIconButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { TranslatePipe } from "@ngx-translate/core";

import { ValidationErrorDirective } from "@utils/validation-error.directive";

/**
 * A password `mat-form-field` with a visibility toggle, shared by every
 * password input in the app.
 */
@Component({
  selector: "mealie-hidden-input",
  imports: [
    MatIconButton,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormField,
    TranslatePipe,
    ValidationErrorDirective,
  ],
  template: `
    <mat-form-field>
      <mat-label>{{ label() | translate }}</mat-label>
      <input matInput [formField]="formField()" [type]="hidden() ? 'password' : 'text'" />
      <mat-icon matTextPrefix svgIcon="lock" />
      <button
        matIconButton
        matSuffix
        type="button"
        (click)="toggle()"
        [attr.aria-label]="'user.hide-password' | translate"
        [attr.aria-pressed]="hidden()"
      >
        <mat-icon [svgIcon]="hidden() ? 'eye-off' : 'eye'"></mat-icon>
      </button>
      <mat-error mealieValidationError [field]="formField()" />
    </mat-form-field>
  `,
  styles: `
    :host {
      /* component itself doesn't render, only it's components, this way this behaves the same as other form fields */
      display: contents;
    }
  `,
})
export class HiddenInputComponent {
  /** The password `Field`, owned by the parent form. */
  readonly formField = input.required<Field<string>>();
  readonly label = input.required<string>();

  protected readonly hidden = signal(true);

  protected toggle(): void {
    this.hidden.update((value) => !value);
  }
}
