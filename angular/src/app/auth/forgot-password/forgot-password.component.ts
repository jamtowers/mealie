import { Component, inject, signal } from "@angular/core";
import { FormField, email, form, required, submit } from "@angular/forms/signals";
import { Router, RouterModule } from "@angular/router";

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

@Component({
  selector: "mealie-forgot-password",
  imports: [
    AuthShellComponent,
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
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
})
export default class ForgotPasswordComponent {
  private readonly router = inject(Router);
  private readonly usersPasswordsService = inject(UsersPasswordsService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  private emailModel = signal({ email: "" });

  protected emailForm = form(this.emailModel, (schemaPath) => {
    required(schemaPath.email);
    email(schemaPath.email);
  });

  protected readonly loading = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // The action only runs when the form is valid, which also marks it touched
    await submit(this.emailForm, async () => {
      this.loading.set(true);
      try {
        const { email } = this.emailModel();
        const res = await firstValueFrom(
          this.usersPasswordsService.forgotPasswordApiUsersForgotPasswordPost({ email }, "response"),
        );
        if (res.status === 200) {
          this.snackBar.open(this.translate.instant("profile.email-sent"), "Close");
          await this.router.navigate(["/login"]);
        } else {
          this.snackBar.open(this.translate.instant("profile.error-sending-email"), "Close", {
            panelClass: "error",
          });
        }
      } catch {
        this.snackBar.open(this.translate.instant("profile.error-sending-email"), "Close", {
          panelClass: "error",
        });
      } finally {
        this.loading.set(false);
      }
    });
  }
}
