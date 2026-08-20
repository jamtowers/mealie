import { Component, inject, signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";
import { Router } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslatePipe } from "@ngx-translate/core";

import { SnackbarProvider } from "@theme/snackbar.provider";

import { AuthService, SignInCredentials } from "../auth.service";

@Component({
  selector: "mealie-login",
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormField,
    TranslatePipe,
  ],
  providers: [SnackbarProvider],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly footerLinks = [
    {
      text: "Sponsor",
      icon: "heart",
      href: "https://github.com/sponsors/hay-kot",
    },
    {
      text: "GitHub",
      icon: "github",
      href: "https://github.com/mealie-recipes/mealie",
    },
    {
      text: "Docs",
      icon: "folder-outline",
      href: "https://docs.mealie.io/",
    },
  ];

  private loginModel = signal<SignInCredentials>({
    username: "",
    password: "",
    rememberMe: false,
  });

  protected loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.username);
    required(schemaPath.password);
  });

  protected readonly hidePassword = signal(true);
  protected readonly loading = signal(false);

  handlePasswordToggle(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    try {
      await this.authService.signIn(this.loginModel());

      // If we're on the login page navigate to the root page
      // If we're not it means we got here from the auth guard which keeps the original path in the browser url
      // So we can just re-navigate to get to where the user originally intended
      const browserPath = new URL(window.location.href).pathname;
      if (browserPath === "/login") {
        await this.router.navigate(["/"]);
      } else {
        await this.router.navigateByUrl(browserPath, {
          skipLocationChange: true, // Skip adding location to history, makes for clean forward/back navigation
        });
      }
    } catch {
      this.snackBar.open("Invalid Credentials", "Close", {
        panelClass: "error",
      });
    }
  }
}
