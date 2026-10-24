/**
 * Official Central Menu PDF / HTML Exporter for CÉLÈBRE CATERING
 * Generates an RTL, printable, official document from central database meals.
 */

import { Meal } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';

export function generateMenuPdfHtml(meals: Meal[], autoPrint: boolean = false): string {
  const mixBoxMeals = meals
    .filter((m) => m.category === 'mix_box' && m.isActive)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const sandwichBoxMeals = meals
    .filter((m) => m.category === 'sandwich_box' && m.isActive)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>منيو سيليبري كاترينج الرسمي المعتمد | CÉLÈBRE CATERING</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --burgundy: #7A0C2E;
      --burgundy-dark: #560820;
      --gold: #C59B27;
      --gold-dark: #9A7718;
      --gold-light: #DFC066;
      --cream: #FAF8F5;
      --border-color: #E2D5BA;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--cream);
      color: #1e293b;
      line-height: 1.5;
      direction: rtl;
      text-align: right;
      padding: 24px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 24px;
      padding: 36px 40px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .no-print-toolbar {
      position: sticky;
      top: 10px;
      z-index: 100;
      background: var(--burgundy);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(122, 12, 46, 0.3);
    }
    .print-btn {
      background: var(--gold);
      color: #1e293b;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #dfc066;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 24px;
      margin-bottom: 28px;
      position: relative;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 12px auto;
      object-fit: contain;
      display: block;
    }
    .title {
      font-family: 'Playfair Display', 'Cairo', serif;
      font-size: 32px;
      font-weight: 900;
      color: var(--burgundy);
      letter-spacing: 0.5px;
    }
    .slogan {
      font-size: 18px;
      font-weight: 800;
      color: var(--gold);
      margin-top: 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 6px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      background: var(--cream);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 10px 16px;
      margin-top: 16px;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .contact-item span {
      color: var(--burgundy);
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
    }
    .section-header {
      background: linear-gradient(90deg, var(--burgundy), #94133A);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 12px;
      margin-top: 24px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 18px;
      font-weight: 800;
    }
    .badge {
      background: var(--gold);
      color: #1e293b;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
    }
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .meal-card {
      background: var(--cream);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      break-inside: avoid;
    }
    .meal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ebdcc3;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .meal-code {
      font-family: monospace;
      font-weight: 900;
      font-size: 13px;
      color: var(--burgundy);
      background: #ffffff;
      border: 1px solid #e0d0b0;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .meal-price {
      font-weight: 900;
      font-size: 15px;
      color: var(--burgundy);
    }
    .meal-desc {
      font-size: 12px;
      color: #1e293b;
      line-height: 1.6;
      font-weight: 600;
    }
    .meal-footer {
      font-size: 10px;
      color: #64748b;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #d5c5a0;
    }
    .policy-box {
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 24px;
      margin-bottom: 24px;
      break-inside: avoid;
    }
    .policy-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--burgundy);
      margin-bottom: 8px;
    }
    .policy-list {
      padding-right: 20px;
      font-size: 12px;
      color: #334155;
      line-height: 1.7;
    }
    .policy-list li {
      margin-bottom: 4px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .social-links {
      font-family: monospace;
      font-weight: 700;
      color: var(--burgundy);
      margin-top: 4px;
      direction: ltr;
    }
    @media (max-width: 640px) {
      .meals-grid {
        grid-template-columns: 1fr;
      }
      .container {
        padding: 20px;
      }
      .title {
        font-size: 24px;
      }
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .container {
        border: none !important;
        box-shadow: none !important;
        padding: 10px !important;
        max-width: 100% !important;
      }
      .no-print, .no-print-toolbar {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .meal-card {
        border: 1px solid #bbb !important;
        background: #fafafa !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-toolbar">
    <div>
      <strong>القائمة الرسمية لـ CÉLÈBRE CATERING (نسخة PDF)</strong>
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ طباعة / حفظ بتنسيق PDF
    </button>
  </div>

  <div class="container">
    
    <!-- Header -->
    <div class="header">
      <img src="${CELEBRE_CONFIG.logoUrl}" alt="Celebre Catering Logo" class="logo" />
      <h1 class="title">CÉLÈBRE CATERING</h1>
      <p class="slogan">«كل مناسبة.. أحلى مع سيليبري»</p>
      <p class="subtitle">القائمة الرسمية المعتمدة لخدمات الكاترينج وتجهيز وجبات المناسبات في جمهورية مصر العربية</p>

      <div class="contact-bar">
        <div class="contact-item">الخط الساخن والحجوزات: <span dir="ltr">01284484868</span></div>
        <div class="contact-item">الموقع الرسمي: <span dir="ltr">https://celebre-eg.com</span></div>
        <div class="contact-item">واتساب: <span dir="ltr">+20 128 448 4868</span></div>
      </div>
    </div>

    <!-- Section 1: Mix Box -->
    <div class="section-header">
      <span class="section-title">أولاً: ميكس بوكس (Mix Box)</span>
      <span class="badge">12 وجبة معتمدة</span>
    </div>

    <div class="meals-grid">
      ${mixBoxMeals
        .map(
          (m) => `
        <div class="meal-card">
          <div>
            <div class="meal-top">
              <span class="meal-code">${m.code}</span>
              <span class="meal-price">${m.distributorPrice} ج.م</span>
            </div>
            <p class="meal-desc">${m.ingredients}</p>
          </div>
          <div class="meal-footer">
            ✓ التعبئة: العلبة البيضاء الرسمية + شوكة ومنديل معطر
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Section 2: Sandwich Box -->
    <div class="section-header page-break">
      <span class="section-title">ثانياً: سندوتش بوكس (Sandwich Box)</span>
      <span class="badge">6 وجبات معتمدة</span>
    </div>

    <div class="meals-grid">
      ${sandwichBoxMeals
        .map(
          (m) => `
        <div class="meal-card">
          <div>
            <div class="meal-top">
              <span class="meal-code">${m.code}</span>
              <span class="meal-price">${m.distributorPrice} ج.م</span>
            </div>
            <p class="meal-desc">${m.ingredients}</p>
          </div>
          <div class="meal-footer">
            ✓ التعبئة: العلبة البيضاء الرسمية + شوكة ومنديل معطر
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Policy & Drink Adjustment Terms -->
    <div class="policy-box">
      <h3 class="policy-title">شروط المنيو وتعديل المشروبات والتعبئة الرسمية:</h3>
      <ul class="policy-list">
        <li><strong>تعديل المشروبات:</strong> استبعاد العصير يخصم <strong>5 جنيه</strong> من سعر الموزع لكل وجبة، واستبدال العصير ببيبسي يضيف <strong>10 جنيه</strong> لكل وجبة (المشروب الافتراضي عصير بخيرة).</li>
        <li><strong>العلبة الخارجية المعتمدة:</strong> تُعبأ جميع الوجبات في العلبة البيضاء الرسمية لـ Celebre بشوكة ومنديل معطر مع الالتزام بأعلى معايير سلامة الغذاء.</li>
        <li><strong>الالتزام بالمكونات:</strong> يتم إعداد الوجبات طبقاً للمكونات المحددة حرفياً لكل كود دون تغيير في الأوزان أو الأصناف.</li>
        <li><strong>الحجز والتأكيد:</strong> الأسعار الموضحة هي أسعار الموزع الرسمية بجمهورية مصر العربية لعام 2026.</li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>CÉLÈBRE CATERING MANAGEMENT PLATFORM</strong></p>
      <p class="social-links">
        FB: ${CELEBRE_CONFIG.socials.facebook} | TT: ${CELEBRE_CONFIG.socials.tiktok} | IG: ${CELEBRE_CONFIG.socials.instagram}
      </p>
      <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">
        تم استخراج هذا المنيو تلقائياً من قاعدة بيانات سيليبري المركزية بتاريخ ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>

  </div>

  ${autoPrint ? '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 300); });</script>' : ''}
</body>
</html>`;
}
