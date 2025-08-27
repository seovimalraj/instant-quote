/* eslint-env node */
/* eslint-disable no-useless-escape */
import fs from 'node:fs';
import path from 'node:path';

function ensureFile(p) {
  if (!fs.existsSync(p)) {
    console.error('File not found:', p);
    process.exit(1);
  }
}

// 1) Fix <a href="/admin/..."> usage in admin layout to use <Link />
(function fixAdminLayout() {
  const file = 'src/app/admin/layout.tsx';
  if (!fs.existsSync(file)) return; // skip if project variant lacks admin layout
  let s = fs.readFileSync(file, 'utf8');

  // Add import Link from 'next/link' if missing
  if (!/from[\s\n]+['\"]next\/link['\"]/.test(s)) {
    if (/^'use client'/.test(s) || /^"use client"/.test(s)) {
      s = s.replace(/^(?:'use client'|"use client")[^\n]*\n?/, m => m + "import Link from 'next/link'\n");
    } else if (/^import\s/m.test(s)) {
      // insert after last import
      const idx = s.lastIndexOf('\nimport ');
      const insertAt = idx >= 0 ? s.indexOf('\n', idx) + 1 : 0;
      s = s.slice(0, insertAt) + "import Link from 'next/link'\n" + s.slice(insertAt);
    } else {
      s = "import Link from 'next/link'\n" + s;
    }
  }

  // Transform specific internal anchors to Link while preserving attributes
  const toLink = (route) => {
    const hrefRe = new RegExp(`<a\\s+([^>]*?)href=[\"\']${route}[\"\']([^>]*)>`, 'gi');
    s = s.replace(hrefRe, (_m, pre, post) => `<Link href="${route}" ${pre}${post}>`);
  };

  toLink('/admin/machines/');
  toLink('/admin/machines');
  toLink('/admin/quotes/');
  toLink('/admin/quotes');

  // Cautiously switch closing tags where appropriate.
  // If file contains Link import, it's likely safe in this layout to replace </a> with </Link>
  s = s.replace(/<\/a>/g, '</Link>');

  fs.writeFileSync(file, s);
  console.log('Patched', file);
})();

// 2) Remove unused eslint-disable for no-img-element in instant-quote page
(function fixUnusedDisable() {
  const file = 'src/app/(customer)/instant-quote/page.tsx';
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  s = s.replace(/\/\*\s*eslint-disable\s+@next\/next\/no-img-element\s*\*\//g, '');
  s = s.replace(/\/\/\s*eslint-disable-next-line\s+@next\/next\/no-img-element.*\n/g, '');
  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log('Removed unused eslint-disable in', file);
  }
})();
