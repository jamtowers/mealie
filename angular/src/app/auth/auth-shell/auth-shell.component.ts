import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

import { TranslatePipe } from "@ngx-translate/core";

import LanguageButton from "@app/core/language-button.component";
import ThemeToggleButton from "@app/core/theme-toggle-button.component";

/**
 * Shared card for the public auth pages (login / forgot password / reset password, etc.).
 */
@Component({
  selector: "mealie-auth-shell",
  imports: [
    MatCardModule,
    ThemeToggleButton,
    LanguageButton,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: "./auth-shell.component.html",
  styleUrl: "./auth-shell.component.scss",
})
export default class AuthShellComponent {
  readonly backButton = input<boolean>();
}
