import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material/snack-bar";

// This provider is here to be used across the app in any component that uses a snackbar so it inherits
// the default values across the app
// We don't do this in main to avoid loading the snackbar module (and the button module by extension) in the
// main js package, this helps keep the first load time down

export const SnackbarProvider = {
  provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
  useValue: { duration: 2500, verticalPosition: "top" },
};
