/**
/**
 * Official Client Booking Confirmation PDF / HTML Generator for CÉLÈBRE CATERING
 * Specifications:
 * - Single-page A4 layout strictly bounded with no multi-page spillover.
 * - Formal, luxury Egyptian catering branding (Gold & Deep Burgundy & Ivory).
 * - Full unmasked customer phone (e.g. 01158855911) for direct courier & client contact.
 * - Detailed breakdown of items, quantities, drink choices, and oriental sweet additions.
 * - Total distributor price, paid deposit, remaining balance.
 * - Strictly zero exposure of factory prices, factory payments, or distributor margins.
 * - Print-ready RTL Arabic typography.
 */

import { Booking } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';

export function generateBookingPdfHtml(booking: Booking, autoPrint: boolean = false): string {
  const verifiedPaid = booking.paidAmount || 0;
  const total = booking.totalDistributorPrice || 0;
  const remaining = Math.max(0, total - verifiedPaid);

  const itemsRows = (booking.items || []).map((it, idx) => {
    // Drink label
    let drinkText = 'عصير بخيرة القياسي';
    if (it.orientalSweetOption === 'replace_juice') {
      drinkText = 'العصير مستبدل بقطعة شرقي';
    } else if (it.drinkOption === 'pepsi') {
      drinkText = 'كانز بيبسي (+10 ج)';
    } else if (it.drinkOption === 'no_juice') {
      drinkText = 'بدون عصير (-5 ج)';
    }

    // Oriental sweet label
    let sweetText = '—';
    if (it.orientalSweetOption === 'add_with_juice') {
      sweetText = 'إضافة قطعة شرقي مع العصير (+20 ج)';
    } else if (it.orientalSweetOption === 'replace_juice') {
      sweetText = 'استبدال العصير بقطعة شرقي (+15 ج)';
    }

    const unitPrice = it.unitDistributorPrice || Math.round(it.totalDistributorPrice / (it.quantity || 1));

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #7A0C2E;">${idx + 1}</td>
        <td>
          <div style="font-weight: 800; color: #1e293b; font-size: 11.5px;">${it.mealName}</div>
          <div style="font-size: 9.5px; color: #64748b; line-height: 1.3; margin-top: 2px;">${it.ingredients}</div>
        </td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; background: #FAF8F5; border: 1px solid #E2D5BA; border-radius: 6px; font-weight: 800; font-size: 11px; color: #7A0C2E;">
            ${it.quantity} بوكس
          </span>
        </td>
        <td style="font-size: 10px; color: #334155;">${drinkText}</td>
        <td style="font-size: 10px; color: ${it.orientalSweetOption && it.orientalSweetOption !== 'none' ? '#7A0C2E; font-weight: bold;' : '#94a3b8;'}">${sweetText}</td>
        <td style="text-align: center; font-size: 11px; font-weight: 700; color: #334155;">${unitPrice.toLocaleString('en-US')} ج</td>
        <td style="text-align: center; font-size: 11.5px; font-weight: 900; color: #7A0C2E;">${it.totalDistributorPrice.toLocaleString('en-US')} ج</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إشعار حجز معتمد ومسدد العربون | ${booking.bookingCode} | CÉLÈBRE CATERING</title>
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
      --border: #E8DCC0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      direction: rtl;
      text-align: right;
      padding: 16px;
      font-size: 11px;
    }
    .page-a4 {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 12px;
      padding: 10mm 12mm;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .no-print {
      max-width: 210mm;
      margin: 0 auto 12px auto;
      background: white;
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-family: 'Cairo', sans-serif;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-gold {
      background: var(--gold);
      color: white;
      border: none;
    }
    .btn-gold:hover {
      background: var(--gold-dark);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: #475569;
    }
    .btn-outline:hover {
      background: #f8fafc;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 19px;
      font-weight: 900;
      color: var(--burgundy-dark);
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold-dark);
    }
    .badge-confirmed {
      background: #ecfdf5;
      color: #047857;
      border: 1.5px solid #10b981;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 11px;
      text-align: center;
    }
    .booking-number {
      font-family: monospace;
      font-size: 13px;
      font-weight: 900;
      color: var(--burgundy);
      display: block;
      margin-top: 2px;
    }

    /* Client & Event Info Grid */
    .info-card {
      background: var(--cream);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 14px;
      font-size: 10.5px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
      min-width: 90px;
    }
    .info-value {
      color: #0f172a;
      font-weight: 800;
    }
    .phone-highlight {
      font-family: monospace;
      font-size: 12px;
      color: var(--burgundy);
      font-weight: 900;
      letter-spacing: 0.5px;
      direction: ltr;
      display: inline-block;
    }

    /* Table */
    .table-container {
      margin-bottom: 8px;
      flex-grow: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: var(--burgundy);
      color: white;
      padding: 6px 8px;
      font-weight: 800;
      font-size: 10.5px;
      border: 1px solid #560820;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Financial Summary Box */
    .finance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }
    .finance-box {
      border: 1.5px solid var(--gold);
      border-radius: 8px;
      padding: 6px 10px;
      text-align: center;
      background: #ffffff;
    }
    .finance-box.highlight {
      background: #fefce8;
      border-color: #ca8a04;
    }
    .finance-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
    }
    .finance-val {
      font-size: 13.5px;
      font-weight: 900;
      color: var(--burgundy-dark);
      margin-top: 1px;
    }
    .finance-val.green {
      color: #059669;
    }

    /* Notes */
    .notes-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 9.5px;
      margin-bottom: 8px;
      color: #475569;
    }

    /* Footer */
    .footer {
      border-top: 1.5px solid var(--gold);
      padding-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
    .footer-hotline {
      font-weight: 900;
      font-size: 11px;
      color: var(--burgundy);
      direction: ltr;
      display: inline-block;
    }

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-a4 {
        border: 1.5px solid var(--gold) !important;
        box-shadow: none !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 285mm !important;
        border-radius: 0 !important;
        padding: 8mm 10mm !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Controls for browser preview -->
  <div class="no-print">
    <div>
      <span style="font-weight: 800; color: #7A0C2E;">إيصال حجز معتمد ومسدد العربون (A4 صفحة واحدة)</span>
      <span style="font-size: 10px; color: #64748b; margin-right: 8px;">مخصص للعميل ومندوب التسليم</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" class="btn btn-gold">
        🖨️ طباعة أو حفظ كملف PDF
      </button>
      <a href="https://wa.me/2${booking.customerPhone}?text=${encodeURIComponent(`أهلاً بحضرتك أستاذ ${booking.customerName}، مرفق إشعار حجزك المعتمد برقم ${booking.bookingCode} مع سيليبري كاترينج.`)}" target="_blank" class="btn btn-outline">
        💬 مشاركة بالواتساب
      </a>
    </div>
  </div>

  <div class="page-a4">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${CELEBRE_CONFIG.logoUrl}" alt="Celebre Catering Logo" style="height: 48px; width: auto; object-fit: contain;" />
        <div>
          <div class="brand-title">CÉLÈBRE CATERING</div>
          <div class="brand-sub">كل مناسبة.. أحلى مع سيليبري | كاترينج المناسبات والأفراح</div>
        </div>
      </div>
      <div style="text-align: left;">
        <div class="badge-confirmed">
          ✓ إشعار حجز معتمد ومسدد العربون
          <span class="booking-number">${booking.bookingCode}</span>
        </div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
          إصدار v${booking.version || 1} • ${new Date().toLocaleDateString('ar-EG')}
        </div>
      </div>
    </div>

    <!-- Client & Event Info Card -->
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">اسم العميل:</span>
        <span class="info-value">${booking.customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">المناسبة:</span>
        <span class="info-value">${booking.eventName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">رقم الموبايل:</span>
        <span class="info-value phone-highlight">${booking.customerPhone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">تاريخ وموعد التسليم:</span>
        <span class="info-value">${booking.eventDate} الساعة ${booking.deliveryTime}</span>
      </div>
      <div class="info-row" style="grid-column: span 2;">
        <span class="info-label">مكان وعنوان التسليم:</span>
        <span class="info-value">${booking.deliveryGovernorate} – ${booking.deliveryAddress}</span>
      </div>
    </div>

    <!-- Meals Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th>الوجبة والمكونات</th>
            <th style="width: 75px; text-align: center;">الكمية</th>
            <th style="width: 120px;">المشروب</th>
            <th style="width: 135px;">قطعة شرقي</th>
            <th style="width: 70px; text-align: center;">سعر الوجبة</th>
            <th style="width: 80px; text-align: center;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Financial Breakdown -->
    <div class="finance-grid">
      <div class="finance-box">
        <div class="finance-label">إجمالي قيمة الطلب</div>
        <div class="finance-val">${total.toLocaleString('en-US')} ج.م</div>
      </div>
      <div class="finance-box highlight">
        <div class="finance-label">العربون المسدد فعلياً</div>
        <div class="finance-val green">${verifiedPaid.toLocaleString('en-US')} ج.م</div>
      </div>
      <div class="finance-box">
        <div class="finance-label">المتبقي المستحق عند الاستلام</div>
        <div class="finance-val">${remaining.toLocaleString('en-US')} ج.م</div>
      </div>
    </div>

    <!-- Customer Notes -->
    <div class="notes-box">
      <strong>ملاحظات وتعليمات العميل:</strong>
      <span>${booking.notes && booking.notes.trim() ? booking.notes.trim() : 'لا توجد ملاحظات إضافية. التعبئة في علبة سيليبري البيضاء الرسمية مع شوكة ومنديل معطر.'}</span>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <span>التعبئة الرسمية المعتمدة: <strong>العلبة البيضاء الفاخرة لـ Celebre Catering</strong></span>
        <span style="margin: 0 6px;">•</span>
        <span>الفرع الرئيسي: القاهرة والجيزة</span>
      </div>
      <div>
        <span>الخط الساخن والحجوزات: </span>
        <span class="footer-hotline">01284484868</span>
        <span style="margin: 0 6px;">•</span>
        <span>celebre-eg.com</span>
      </div>
    </div>
  </div>

  ${autoPrint ? '<script>window.addEventListener("DOMContentLoaded", () => window.print());</script>' : ''}
</body>
</html>`;
}

export const generateClientConfirmationPdfHtml = generateBookingPdfHtml;

