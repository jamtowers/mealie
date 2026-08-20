import { Component, inject } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

import { TranslatePipe } from "@ngx-translate/core";

import LanguageDialogComponent from "../locale/language-dialog.component";

@Component({
  selector: "mealie-language-button",
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  template: `
    <button matIconButton [matTooltip]="'settings.language' | translate" (click)="openLanguageDialog()">
      <mat-icon svgIcon="translate"></mat-icon>
    </button>
  `,
})
export default class LanguageButton {
  private readonly dialog = inject(MatDialog);

  protected openLanguageDialog(): void {
    this.dialog.open(LanguageDialogComponent);
  }
}
