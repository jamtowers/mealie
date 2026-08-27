import { Component, inject, signal } from "@angular/core";
import { FormField, email, form, required, submit, validate } from "@angular/forms/signals";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { UsersPasswordsService } from "@api/services/usersPasswords.service";
import { ValidationErrorDirective } from "@utils/validation-error.directive";

import AuthShellComponent from "../auth-shell/auth-shell.component";
import NewPasswordInputComponent from "../new-password-input/password-input.component";

/**
 * Consume a password reset link and set a new password.
 *
 * Port of the Nuxt `reset-password` page: the `token` query param arrives in
 * the email link; without it the form can't be submitted.
 */
@Component({
  selector: "mealie-reset-password",
  imports: [
    AuthShellComponent,
    NewPasswordInputComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormField,
    RouterModule,
    TranslatePipe,
    ValidationErrorDirective,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
})
export default class ResetPasswordComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usersPasswordsService = inject(UsersPasswordsService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  /** The reset token from the email link, e.g. `/reset-password?token=...` */
  protected readonly token = signal(this.route.snapshot.queryParamMap.get("token") ?? "");

  private resetModel = signal({ email: "", password: "", passwordConfirm: "" });

  protected resetForm = form(this.resetModel, (schemaPath) => {
    required(schemaPath.email);
    email(schemaPath.email);
    required(schemaPath.password);
    required(schemaPath.passwordConfirm);
    validate(schemaPath.passwordConfirm, (ctx) =>
      ctx.value() === ctx.valueOf(schemaPath.password) ? null : { kind: "match", message: "Passwords must match" },
    );
  });

  protected readonly loading = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // The action only runs when the form is valid, which also marks it touched
    await submit(this.resetForm, async () => {
      this.loading.set(true);
      try {
        const { email, password, passwordConfirm } = this.resetModel();
        const res = await firstValueFrom(
          this.usersPasswordsService.resetPasswordApiUsersResetPasswordPost(
            { token: this.token(), email, password, passwordConfirm },
            "response",
          ),
        );
        if (res.status === 200) {
          this.snackBar.open(this.translate.instant("user.password-updated"), "Close");
          await this.router.navigate(["/login"]);
        } else {
          this.snackBar.open(this.translate.instant("events.something-went-wrong"), "Close", {
            panelClass: "error",
          });
        }
      } catch {
        this.snackBar.open(this.translate.instant("events.something-went-wrong"), "Close", {
          panelClass: "error",
        });
      } finally {
        this.loading.set(false);
      }
    });
  }
}
