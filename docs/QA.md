# QA Guide

## Runtime Loop
All Supabase clients perform a runtime check for required environment variables. Missing values throw explicit errors so the upload-to-order loop fails fast and runs reliably. Each stage verifies prerequisite data before continuing.

## Geometry Fallbacks
STEP and IGES uploads are converted to STL. If conversion fails, geometry metrics default to zero. Native STL files yield the most accurate automatic pricing.

## End-to-End Checks
1. Anonymous upload → email capture → abandoned_quotes row
2. Upload → geometry → instant price
3. Request → admin sees in realtime
4. Admin reprice → accept → order created
