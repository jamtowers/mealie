import { Directive, ElementRef, afterRenderEffect, computed, inject, input } from "@angular/core";
import { type Field } from "@angular/forms/signals";

import { TranslateService } from "@ngx-translate/core";

import { firstErrorMessage } from "@utils/validation-messages";

/**
 * Fills a `mat-error` with the translated validation message of a signal-forms `Field`.
 *
 * Must be placed on a `mat-error` that is a direct child of the `mat-form-field`
 * containing the field's input: Material only projects direct `mat-error` children
 * into the error subscript slot, and only shows them while the control's error state
 * (invalid & touched by default) matches.
 */
@Directive({ selector: "mat-error[mealieValidationError]" })
export class ValidationErrorDirective {
  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef);

  /** The `Field` to show validation errors for. */
  readonly field = input.required<Field<string>>();

  private readonly message = computed(() => firstErrorMessage(this.translate, this.field()().errors()));

  constructor() {
    // The `mat-error` element renders no template content of its own, so its text is
    // written imperatively.
    afterRenderEffect(() => {
      const text = this.message() ?? "";
      if (this.elementRef.nativeElement.textContent !== text) {
        this.elementRef.nativeElement.textContent = text;
      }
    });
  }
}
