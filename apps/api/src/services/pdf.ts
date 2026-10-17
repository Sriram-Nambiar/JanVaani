import { DraftPdfInput } from '../schemas/draft-pdf.js';
import { SUPPORTED_SCHEMES } from './schemes.js';

export class DraftPdfService {
  /**
   * Generates a clean, print-ready HTML document representation of an Application Draft.
   * Prominently marked with "DRAFT / ಮಾದರಿ ಅರ್ಜಿ" to adhere to civic AI safety principles.
   */
  generateDraftHtml(data: DraftPdfInput): string {
    const scheme = SUPPORTED_SCHEMES[data.schemeId] || {
      nameKn: 'ಸರ್ಕಾರಿ ಸೇವಾ ಅರ್ಜಿ',
      nameEn: 'Government Service Application',
      departmentKn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
      departmentEn: 'Government of Karnataka',
    };

    const generatedDate = new Date().toLocaleDateString('kn-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const auditItems = (data.auditFindings || [])
      .map(
        (finding) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 12px; font-weight: 600;">${this.escapeHtml(finding.field)}</td>
          <td style="padding: 8px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background-color: ${
              finding.status === 'PASSED' ? '#dcfce7; color: #166534' : '#fee2e2; color: #991b1b'
            };">
              ${finding.status}
            </span>
          </td>
          <td style="padding: 8px 12px; font-size: 12px; color: #374151;">
            <div>${this.escapeHtml(finding.noteKn)}</div>
            <div style="color: #6b7280; font-size: 11px;">${this.escapeHtml(finding.noteEn)}</div>
          </td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="kn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JanVaani Application Draft - ${this.escapeHtml(data.ackNumber)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;600;700&display=swap');
    body {
      font-family: 'Noto Sans Kannada', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .draft-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 48px;
      border: 2px solid #94a3b8;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 40%;
      left: 10%;
      transform: rotate(-30deg);
      font-size: 56px;
      font-weight: 900;
      color: rgba(220, 38, 38, 0.08);
      pointer-events: none;
      user-select: none;
      text-transform: uppercase;
      line-height: 1.2;
      text-align: center;
      width: 80%;
      z-index: 1;
    }
    .header {
      border-bottom: 3px double #b91c1c;
      padding-bottom: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .state-title {
      font-size: 20px;
      font-weight: 700;
      color: #7f1d1d;
      margin: 0 0 4px 0;
    }
    .dept-title {
      font-size: 14px;
      color: #4b5563;
      margin: 0 0 12px 0;
    }
    .scheme-badge {
      display: inline-block;
      background-color: #fef2f2;
      border: 1px solid #f87171;
      color: #991b1b;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 700;
    }
    .notice-box {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin: 24px 0 12px 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.data-table th, table.data-table td {
      padding: 8px 12px;
      text-align: left;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .ack-box {
      border: 2px dashed #0284c7;
      background-color: #f0f9ff;
      border-radius: 6px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .draft-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="padding: 8px 16px; background-color: #1e40af; color: #ffffff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
      🖨️ ಮುದ್ರಿಸಿ (Print / Save as PDF)
    </button>
  </div>

  <div class="draft-container">
    <div class="watermark">
      ಮಾದರಿ ಅರ್ಜಿ ನಮೂನೆ<br>
      JANVAANI APPLICATION DRAFT
    </div>

    <div class="header">
      <div class="state-title">ಕರ್ನಾಟಕ ಸರ್ಕಾರ | Government of Karnataka</div>
      <div class="dept-title">${this.escapeHtml(scheme.department || 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ / Government of Karnataka')}</div>
      <div class="scheme-badge">${this.escapeHtml(scheme.nameKn)} (${this.escapeHtml(scheme.nameEn)})</div>
    </div>

    <div class="notice-box">
      <strong>⚠️ ಗಮನಿಸಿ (Civic Notice):</strong> ಇದು ಜನವಾಣಿ (JanVaani) ಧ್ವನಿ-ಸಹಾಯಕದ ಮೂಲಕ ತಯಾರಿಸಲಾದ <strong>ಮಾದರಿ ಅರ್ಜಿ ನಮೂನೆ (Draft Application)</strong> ಮಾತ್ರ. ಇದು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪ್ರಮಾಣಪತ್ರವಲ್ಲ. ಈ ಅರ್ಜಿಯನ್ನು ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸೇವಾ ಸಿಂಧು ಕೇಂದ್ರದಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ಸಲ್ಲಿಸಲು ಉಪಯೋಗಿಸಬಹುದು.
    </div>

    <div class="ack-box">
      <div>
        <div style="font-size: 11px; color: #0369a1; font-weight: 600;">ಅರ್ಜಿ / ರಶೀದಿ ಗುರುತು ಸಂಖ್ಯೆ (Draft Acknowledgment):</div>
        <div style="font-size: 20px; font-weight: 800; color: #0c4a6e; letter-spacing: 0.05em;">${this.escapeHtml(data.ackNumber)}</div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #0284c7;">
        <div>ದಿನಾಂಕ: <strong>${generatedDate}</strong></div>
        <div>ಸ್ಥಿತಿ: <strong>ಕರಡು ಸಿದ್ಧವಾಗಿದೆ (Draft Prepared)</strong></div>
      </div>
    </div>

    <div class="section-title">೧. ಅರ್ಜಿದಾರರ ಮಾಹಿತಿ (Applicant Details)</div>
    <table class="data-table">
      <tr>
        <th style="width: 35%; color: #4b5563;">ಅರ್ಜಿದಾರರ ಹೆಸರು (Name):</th>
        <td style="font-weight: 700;">${this.escapeHtml(data.applicantName)}</td>
      </tr>
      ${data.consumerId ? `
      <tr>
        <th style="color: #4b5563;">ಗ್ರಾಹಕರ ಐಡಿ / RR ಸಂಖ್ಯೆ (Consumer ID):</th>
        <td style="font-family: monospace; font-size: 14px;">${this.escapeHtml(data.consumerId)}</td>
      </tr>` : ''}
      ${data.escomName ? `
      <tr>
        <th style="color: #4b5563;">ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ (ESCOM):</th>
        <td>${this.escapeHtml(data.escomName)}</td>
      </tr>` : ''}
      ${data.aadhaarNumber ? `
      <tr>
        <th style="color: #4b5563;">ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar Number):</th>
        <td style="font-family: monospace;">${this.escapeHtml(data.aadhaarNumber)}</td>
      </tr>` : ''}
      ${data.rationCardNumber ? `
      <tr>
        <th style="color: #4b5563;">ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ (Ration Card):</th>
        <td style="font-family: monospace;">${this.escapeHtml(data.rationCardNumber)}</td>
      </tr>` : ''}
      ${data.annualIncome ? `
      <tr>
        <th style="color: #4b5563;">ವಾರ್ಷಿಕ ಆದಾಯ (Annual Income):</th>
        <td>₹ ${this.escapeHtml(data.annualIncome)}</td>
      </tr>` : ''}
      ${data.casteCategory ? `
      <tr>
        <th style="color: #4b5563;">ಜಾತಿ ಪ್ರವರ್ಗ (Category):</th>
        <td>${this.escapeHtml(data.casteCategory)}</td>
      </tr>` : ''}
    </table>

    ${data.auditFindings && data.auditFindings.length > 0 ? `
    <div class="section-title">೨. ಕಾಗದ-ಪರಿಶೀಲನೆ ವರದಿ (Kagada-Check Document Audit)</div>
    <table class="data-table">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 8px 12px;">ದಾಖಲೆ (Document)</th>
          <th style="padding: 8px 12px;">ಸ್ಥಿತಿ (Status)</th>
          <th style="padding: 8px 12px;">ಪರಿಶೀಲನಾ ವಿವರ (Verification Note)</th>
        </tr>
      </thead>
      <tbody>
        ${auditItems}
      </tbody>
    </table>` : ''}

    <div class="section-title">೩. ಸ್ವಯಂ ಘೋಷಣೆ (Citizen Declaration)</div>
    <p style="font-size: 12px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;">
      ನಾನು ಮೇಲೆ ನೀಡಿರುವ ಎಲ್ಲಾ ಮಾಹಿತಿಗಳು ನನ್ನ ಸಂಪೂರ್ಣ ತಿಳುವಳಿಕೆ ಮತ್ತು ನಂಬಿಕೆಯಂತೆ ಸತ್ಯ ಮತ್ತು ಸರಿಯಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುತ್ತೇನೆ. ತಪ್ಪಾದ ಮಾಹಿತಿ ನೀಡಿದ್ದಲ್ಲಿ ಕಾನೂನು ಪ್ರಕಾರ ಕ್ರಮ ಕೈಗೊಳ್ಳಲು ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
    </p>

    <div style="margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div style="font-size: 12px; color: #64748b;">
        <div>ಸ್ಥಳ (Place): ಬೆಂಗಳೂರು (Bengaluru)</div>
        <div>ದಿನಾಂಕ (Date): ${generatedDate}</div>
      </div>
      <div style="text-align: center; border-top: 1px dotted #94a3b8; width: 220px; padding-top: 8px; font-size: 12px; color: #475569;">
        ಅರ್ಜಿದಾರರ ಸಹಿ / ಹೆಬ್ಬೆರಳ ಗುರುತು<br>(Applicant Signature)
      </div>
    </div>

    <div class="footer">
      ಜನವಾಣಿ (JanVaani) — ಕನ್ನಡ ಧ್ವನಿ-ಮೂಲ ನಾಗರಿಕ ಸಹಾಯಕ • Powered by Sarvam AI Indic LLM & Speech<br>
      Generated on ${new Date().toISOString()} • Safe Public Service Sandbox
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const draftPdfService = new DraftPdfService();
