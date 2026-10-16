# Creative Print Calculator — Commercial Digital Press & Signage Pricing

A commercial-grade print quotation and costing engine designed specifically for digital print houses, studios, and commercial printing presses operating 12×18, 13×19, and cut mill parent sheets (26×36, 26×38).

Built adhering strictly to the design aesthetics in `DESIGN-airtable.md` (clean editorial whitespace, dark ink typography, high-contrast signature cards, and responsive desktop/mobile layouts).

---

## Key Capabilities

### 1. Feed Rates Once (Master Rate Admin Panel)
- **PIN-Protected Admin**: Access via the top-right button (Default PIN: `1234`).
- **Two Dedicated Boxes per Substrate**:
  - `[ Blank Sheet Cost (₹) ]`
  - `[ Print Click Impression Cost (₹ Single / ₹ Double) ]`
  - Easily configure unique print costs for delicate/heavy substrates like **Clear Vinyl**, **Golden Vinyl**, **Gumming Sheets**, **NTR Synthetic**, and **Texture Papers**.
- **Parent Sheet Cutter Helper**:
  - Quickly calculate mill parent sheets (26×36, 26×38) into machine-ready sizes (12×18, 13×19) and add them to your catalog in 1 click.
- **Bulk Quantity Slabs**:
  - Automatic pricing tiers: higher setup rate for sample orders (1–10 sheets), retail pricing for 11–50, and wholesale discounts for 200+ sheets.
- **Full Backup & Restore**:
  - Export your rates to a `.json` backup file or restore them on any computer or phone.

---

### 2. Multi-Page Brochure / Booklet Engine (Edge Case Solved)
- **Separate Cover & Inner Specifications**:
  - **Cover**: 250 / 300 / 350 GSM Art Card with Double or Single sided printing and Matt/Gloss Thermal Lamination.
  - **Inner Pages**: 100 / 130 / 170 GSM Art Paper without lamination.
- **True Imposition Math**:
  - Automatic calculation of parent sheets based on finished size (e.g., A4 gives 4 pages per sheet; A5 gives 8 pages per sheet).
  - Accurate sheet count prevents overcharging or underquoting.
- **Binding Post-Press**:
  - Center Staple / Saddle Stitch, Perfect Binding, or Wiro / Spiral.

---

### 3. Single Sheet / Flyer / Vinyl Sticker Engine
- Visual **"Cuts from 1 Sheet"** selector (Full Sheet, Half / A4, Quarter / A5, 1/8th / A6, or Custom pieces per sheet).
- Single or Double sided printing.
- Thermal / Cold lamination.
- Trimming / Cutting charges (per job or per piece).

---

### 4. Commercial Output & Quotation Sharing
- **Signature Quotation Card**: Instant unit price (Incl. GST) and total order value.
- **1-Click WhatsApp Quotation**: Copies a clean, professional estimate ready to paste into WhatsApp chats.
- **Owner Cost & Profit Inspector**: Reveals raw material cost, print clicks, lamination, binding, wastage, and gross profit margin (unlocked via PIN).

---

## Deployment to GitHub & Vercel

### Step 1: Push to your GitHub Repository
If you haven't already created a repository on GitHub:
1. Go to [github.com/new](https://github.com/new) and create a repository named `creative-calculator` (keep it Public or Private).
2. Connect and push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/creative-calculator.git
git push -u origin main
```

*(Note: `.env.local` containing your private API key is automatically protected and excluded by `.gitignore`)*

---

### Step 2: Deploy to Vercel (1-Click)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New..."** -> **"Project"**.
3. Select your `creative-calculator` repository and click **Import**.
4. In the **Environment Variables** section, add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** *Your Gemini API Key*
5. Click **Deploy**.

Vercel will automatically host the responsive frontend and run `api/parse.js` and `api/settings.js` as high-speed serverless functions!
