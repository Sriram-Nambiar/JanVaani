# Karnataka State Mock Government Servers Hub (ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಸೇವಾ ಕೇಂದ್ರಗಳು)

This folder hosts the simulated Karnataka State Government digital servers and service endpoints used by JanVaani:

## 🏛️ Simulated Government Servers & Department Endpoints:
1. **Seva Sindhu Welfare Portal (`/api/whatsapp/agent/submit-seva-sindhu`)**
   - Department: Center for e-Governance (CeG) / DPAR
   - Schemes: Gruha Lakshmi (₹2,000 DBT), Gruha Jyothi (200 units power), Caste & Income Certificates (RD001-RD003)
2. **Bhoomi Land Records Server (`/api/bhoomi/rtc/*`)**
   - Department: Karnataka Revenue Department (ಕಂದಾಯ ಇಲಾಖೆ)
   - Services: RTC Pahani verification, survey/hissa lookup, mutation status, encumbrance check
3. **Anna Bhagya Food & Civil Supplies Server (`/api/annabhagya/*`)**
   - Department: Food, Civil Supplies and Consumer Affairs
   - Services: 10kg grain entitlement & ₹34/kg monthly cash DBT transfer calculator
4. **Shakti Scheme Free Bus Travel Server (`/api/shakti/*`)**
   - Department: Transport Department (KSRTC, BMTC, NWKRTC, KKRTC)
   - Services: Free bus travel smart pass generation & RTC zero-ticket route eligibility
5. **Gruha Jyothi Energy Meter Server (`/api/meter/*`)**
   - Department: Energy Department (BESCOM, HESCOM, MESCOM, GESCOM, CHESCOM)
   - Services: 200 units free power consumption calculation & slab audit
6. **Yuva Nidhi Employment DBT Server (`/api/yuva-nidhi/*`)**
   - Department: Skill Development & Livelihood Department
   - Services: Graduate (₹3,000) & Diploma (₹1,500) monthly unemployment allowance checks
7. **JanaSpandana 1902 Grievance Server (`/api/whatsapp/grievance/*`)**
   - Department: Chief Minister's Public Grievance Redressal Cell
   - Services: 1902 citizen grievance docket lodging, inquiry timeline & voice appeals
8. **Grama One Rural Citizen Kiosk Server (`/api/kiosk/*`)**
   - Department: Directorate of Electronic Delivery of Citizen Services (EDCS)
   - Services: Rural counter queue token issuance & Kannada auditory announcements
9. **Official Certificate QR Verification Server (`/api/verify/*`)**
   - Department: CeG / Nadakacheri
   - Services: HMAC-SHA256 digital signature authenticity verification
10. **Kannada Audio Receipt Server (`/api/whatsapp/receipt/audio/*`)**
    - Services: Offline Grama One counter audio receipts with Sarvam Bulbul TTS synthesis

## 🌐 Web UI Portal Site:
The integrated web interface for all these servers is rendered by:
`apps/web/src/mock-servers/MockServersSite.tsx`
Accessible in the JanVaani UI via the "🏛️ Mock Government Services Portal" tab.
