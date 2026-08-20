import { Component, inject } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

import { TranslatePipe } from "@ngx-translate/core";

import { ThemeService } from "@theme/theme.service";

@Component({
  selector: "app-theme-toggle-button",
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  template: `
    <!--We use tooltip.show() on click here just so the tooltip doesn't close on click (looks bad)-->
    <button
      matIconButton
      #tooltip="matTooltip"
      (click)="cycle(); tooltip.show()"
      [matTooltip]="theme.currentModeTranslateKey() | translate"
    >
      <mat-icon [svgIcon]="theme.currentModeIcon()"></mat-icon>
    </button>
  `,
})
export default class ThemeToggleButton {
  protected readonly theme = inject(ThemeService);

  protected cycle(): void {
    this.theme.cycle();
  }
}
