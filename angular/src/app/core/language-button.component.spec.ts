import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";

import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";

import { TranslateService } from "@ngx-translate/core";

import LanguageDialogComponent from "@app/locale/language-dialog.component";
import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import LanguageButton from "./language-button.component";

class MatDialogStub {
  open = vi.fn();
}

describe("LanguageButton", () => {
  let fixture: ComponentFixture<LanguageButton>;
  let dialog: MatDialogStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageButton],
      providers: [
        { provide: MatDialog, useClass: MatDialogStub },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
      ],
    }).compileComponents();

    dialog = TestBed.inject(MatDialog) as unknown as MatDialogStub;

    // Register mock SVG icons so MatIcon doesn't error
    mockSvgIcons(TestBed.inject(MatIconRegistry), ["translate"]);

    fixture = TestBed.createComponent(LanguageButton);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should open language dialog when language button is clicked", async () => {
    const button = fixture.nativeElement.querySelector("button");
    await button.click();
    await fixture.whenStable();
    expect(dialog.open).toHaveBeenCalledWith(LanguageDialogComponent);
  });
});
