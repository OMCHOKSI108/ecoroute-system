const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const REPORTS = [
  {
    md: 'docs/reports/00_EXECUTIVE_SUMMARY_CONSOLIDATED_REPORT.md',
    pdf: 'docs/reports/00_EXECUTIVE_SUMMARY_CONSOLIDATED_REPORT.pdf',
    title: 'EcoRoute System - Executive QA & Performance Report'
  },
  {
    md: 'docs/reports/01_PERFORMANCE_SECURITY_ARCHITECTURE_AUDIT.md',
    pdf: 'docs/reports/01_PERFORMANCE_SECURITY_ARCHITECTURE_AUDIT.pdf',
    title: 'EcoRoute System - Performance, Security & Architecture Audit'
  },
  {
    md: 'docs/reports/02_BACKEND_QA_LOGIC_VERIFICATION_REPORT.md',
    pdf: 'docs/reports/02_BACKEND_QA_LOGIC_VERIFICATION_REPORT.pdf',
    title: 'EcoRoute System - Backend QA & Logic Verification Report'
  },
  {
    md: 'docs/reports/03_FULLSTACK_PLAYWRIGHT_E2E_REPORT.md',
    pdf: 'docs/reports/03_FULLSTACK_PLAYWRIGHT_E2E_REPORT.pdf',
    title: 'EcoRoute System - Full-Stack Playwright E2E QA Report'
  }
];

function markdownToHtml(mdPath) {
  const scriptPath = path.resolve(__dirname, 'md_to_html.py');
  return execSync(`python3 "${scriptPath}" "${mdPath}"`, {
    encoding: 'utf-8',
    maxBuffer: 25 * 1024 * 1024
  });
}

function buildHtmlTemplate(bodyContent, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .report-banner {
      border-bottom: 3px solid #10b981;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
      margin-top: 4px;
    }
    .report-meta {
      text-align: right;
      font-size: 8pt;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 8pt;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #0f172a;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    pre {
      background-color: #0f172a;
      color: #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 10px 0;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0;
    }
    blockquote, .callout {
      border-left: 4px solid #10b981;
      background-color: #f0fdf4;
      padding: 8px 12px;
      margin: 10px 0;
      border-radius: 0 4px 4px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    .callout-warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    .callout-danger {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    .callout-info {
      border-left-color: #3b82f6;
      background-color: #eff6ff;
    }
  </style>
</head>
<body>
  <div class="report-banner">
    <div>
      <div class="brand-title">🌱 EcoRoute Engine</div>
      <div class="brand-subtitle">Geospatial Fleet Routing & Circular Economy Logistics Optimization</div>
    </div>
    <div class="report-meta">
      <div><strong>Status:</strong> <span class="badge badge-success">Production Ready</span></div>
      <div><strong>Audited:</strong> November 2026</div>
      <div><strong>Engine:</strong> Next.js 16 + Express 5 + PostGIS</div>
    </div>
  </div>
  ${bodyContent}
</body>
</html>`;
}

async function generateAllPdfs() {
  console.log('🚀 Launching Playwright Chromium for PDF generation...');
  const browser = await chromium.launch({ headless: true });

  for (const report of REPORTS) {
    const mdFullPath = path.resolve(__dirname, '..', report.md);
    const pdfFullPath = path.resolve(__dirname, '..', report.pdf);

    if (!fs.existsSync(mdFullPath)) {
      console.warn(`⚠️ Markdown source not found: ${mdFullPath}`);
      continue;
    }

    console.log(`📄 Processing ${report.title}...`);
    const bodyHtml = markdownToHtml(mdFullPath);
    const fullHtml = buildHtmlTemplate(bodyHtml, report.title);

    const tempHtmlPath = pdfFullPath.replace(/\.pdf$/, '.temp.html');
    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    const page = await browser.newPage();
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });

    await page.pdf({
      path: pdfFullPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          <span>EcoRoute Engine | Engineering & QA Audit Documentation</span>
          <span>Confidential / Internal Engineering Review</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Circular Economy Geospatial Fleet System</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    await page.close();
    fs.unlinkSync(tempHtmlPath);

    const stats = fs.statSync(pdfFullPath);
    console.log(`✅ Generated: ${report.pdf} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('✨ All PDF reports successfully compiled!');
}

generateAllPdfs().catch((err) => {
  console.error('❌ PDF generation failed:', err);
  process.exit(1);
});
