# SmartCart - Alternative App Store Submission Guide

This guide provides step-by-step instructions for submitting **SmartCart** to the **Samsung Galaxy Store**, **Aptoide**, and the **Amazon Appstore**, while ensuring you are paid directly and securely through your **Payoneer** account (avoiding gift card or check issues).

---

## Part 1: Setting up Virtual US Bank Details in Payoneer

To receive direct deposits (EFT/ACH) from stores like Amazon and Samsung (which do not support direct payouts to local Serbian banks or charge massive wire fees), we will link your **Payoneer virtual US Bank Account**. Amazon will pay USD straight into your Payoneer account, which you can then withdraw to your local Serbian bank account or spend via your Payoneer card.

### Step-by-Step Navigation to Find Virtual Bank Details:
1. **Log in** to your Payoneer account console.
2. At the top or side menu, find the **"Get Paid"** or **"Receive"** tab.
3. Click on **"Receiving Accounts"** (on some accounts this might be called **"Global Payment Service"**).
4. Here, you will see lists of countries. Look for the **United States (USD)** account.
   - *If you don't see USD, click "Request Account" and choose United States.*
5. Click **"View Details"** on the United States receiving account.
6. Copy the following details:
   - **Bank Name** (usually First Century Bank, Community Federal Savings Bank, or similar)
   - **Bank Address / State**
   - **Routing Number** (9-digit ABA routing number)
   - **Account Number** (your unique checking account number)
   - **Account Type** (usually **Checking**)

These details act as a virtual US bank account registered in your name, which you will provide when completing payouts on the developer portals.

---

## Part 2: Route 1 - Samsung Galaxy Store (Easiest & Free)

Samsung Galaxy Store is completely free to publish. It natively supports web-based PWAs in many regions, or you can submit an APK/AAB package.

### Step-by-Step Submission:
1. Go to the [Samsung Galaxy Store Seller Portal](https://seller.samsungapps.com/) and register for a free account.
2. Once registered, click **"Add New Application"**.
3. Select **"Android"**. (Even though it is a PWA, we will list it as an Android-distributed app).
4. Enter the **Application Title**: `SmartCart: Budget Grocery List`
5. In the **App Information** tab, fill out:
   - **Default Language**: English
   - **Short Description**: `Smart shopping list with real-time budget tracking and spending statistics.`
   - **Full Description**: (Copy the description from `STORE_LISTING.md` in your project root).
   - **Support Email**: `iseerhinoceros@gmail.com`
6. Under **Privacy Policy URL**, paste your active App URL linked to the privacy path, for example:
   `https://[YOUR_PRODUCTION_DOMAIN]/privacy/index.html`
7. Under **Category**, select **"Finance"** or **"Shopping / Productivity"**.
8. Upload screenshots and icons (you can use the high-quality files generated in your `/public` folder, e.g., `icon-512.png` and `screenshot.jpg`).
9. **Binary Upload / APK**: 
   - To generate a high-quality signed Android APK for Samsung (and Aptoide below) in 2 minutes without writing any native code, use [PWABuilder](https://www.pwabuilder.com/).
   - Paste your production app URL into PWABuilder. It will read your `manifest.json`, check offline capabilities, and provide a download link for a **ready-to-upload Android APK and AAB (App Bundle) zip**.
   - Download the package, unzip it, and upload the signed `.apk` file into the Samsung binary section.
10. Submit for review! Samsung usually approves within 2-4 business days.

---

## Part 3: Route 2 - Aptoide (Free & Maximum Freedom)

Aptoide is a massive independent Android marketplace with over 400 million users. It is 100% free, has no registration fee, and has very low bureaucratic review times.

### Step-by-Step Submission:
1. Go to [Aptoide Publisher](https://publishing.aptoide.com/) and sign up for a Developer/Publisher Account.
2. Click **"Create a Store"**. You can brand your store name (e.g. `SmartCart Store` or `Iseerhinoceros Apps`).
3. Click **"Upload App"**.
4. Upload the **APK** that you generated using PWABuilder (from Part 2, Step 9).
5. Aptoide will parse your APK package name (`com.smartcart.app` or similar) and read metadata from your manifest automatically.
6. Customize the App Page Details:
   - **Title**: `SmartCart: Budget Grocery List`
   - **Short Description**: `Keep track of your grocery budget in real-time.`
   - **Full Description**: (Copy the contents from `STORE_LISTING.md`).
   - **Keywords**: `shopping list, budget tracker, grocery list, privacy-first list`
7. Drag & drop your assets from the `/public` directory:
   - **App Icon**: Use `icon-512.png`.
   - **Screenshots**: Use `screenshot.jpg`.
8. Check **Content Rating** as "Everyone" (Safe for kids).
9. Submit the application. Aptoide uses automated "Aptoide Anti-Malware System" (AAMS) which checks the package. Once scanned and verified clean, the app goes live on your store almost **instantly** (within a few hours).

---

## Part 4: Route 3 - Amazon Appstore (High Volume, Smart Payment Linking)

Amazon Appstore is pre-installed on all Fire OS tablets, Amazon Fire TVs, and integrated natively into Windows 11 as well as standard Android devices via the Amazon Appstore app.

### Step-by-Step PWA Submission (Amazon cloud-compiles this for you! No manual APK build needed):
1. Register for a free account at [Amazon Developer Console](https://developer.amazon.com/).
2. On your dashboard, click **"Add a New App"**.
3. Select **"Mobile Web" (PWA / HTML5 Web App)**. 
   - *This is the easiest route. Amazon will take your live URL and wrap it inside an optimized web container for distribution, making updates automatic! When you push new code to your server, Amazon users get the update instantly!*
4. Enter the **App Name**: `SmartCart`
5. Enter your **Production URL / PWA URL**: 
   `https://[YOUR_PRODUCTION_DOMAIN]/`
6. In the **Product Info** tab, fill out the descriptions and keywords using the compiled assets in `STORE_LISTING.md`.
7. In **Images & Multimedia**:
   - Upload your app icon (Amazon requires a 51x51 icon, a 114x114 icon, and a 512x512 icon. You can use the standard icons in `/public`).
   - Upload promotional screenshots (use `screenshot.jpg` from `/public`).
8. In **Content Rating**, fill out the self-evaluation. Mark "No" to mature content, alcohol, or graphic violence to receive an **"Everyone"** rating.
9. Under **Privacy Policy URL**, paste:
   `https://[YOUR_PRODUCTION_DOMAIN]/privacy/index.html`

### Payout Setup – Direct Deposit to Payoneer (IMPORTANT):
When you are setting up your developer profile, Amazon will ask for your tax and payment settings. This is where you configure Payoneer to get paid directly without gift cards:
1. Navigate to **"Settings" -> "Payment Information"** in the Amazon Developer Console.
2. Select **"Yes"** to "Do you want to receive payments?".
3. Under **Bank Country**, select **"United States"** (this is where your virtual Payoneer bank is located).
4. Under **Payment Method**, select **"EFT / Direct Deposit"** (Electronic Funds Transfer).
5. Input the USD virtual bank details you copied from Payoneer in **Part 1**:
   - **Bank Name**: (e.g. *First Century Bank* / *Community Federal Savings Bank*)
   - **Account Holder Name**: (Matches your exact legal name on Payoneer)
   - **Routing Number**: (Your 9-digit US ABA routing number)
   - **Account Number**: (Your unique checking account number)
   - **Account Type**: **Checking**
6. Complete the quick online **Amazon Tax Questionnaire** (W-8BEN for non-US residents). W-8BEN indicates you are a Serbian tax resident, keeping your tax withholding at 0% or low treaty rates depending on services, and ensures correct legal reporting.

Amazon will now deposit your royalties/upgrades in USD directly into your Payoneer account. There are **no fees** from Amazon side for EFT, and Payoneer only charges a tiny standard incoming transaction fee (typically 1%). You get cash directly to Serbian banks, zero gift card traps!

---

## Summary Checklist of Required Public Link Parameters

Ensure your live web deployment URL hosts these two paths properly so reviewers can instantly pass your app:
-  **Main App PWA Entry**: `https://[YOUR_PRODUCTION_DOMAIN]/` (Amazon PWA loader)
-  **Privacy Policy Page**: `https://[YOUR_PRODUCTION_DOMAIN]/privacy/index.html` (Required by Samsung, Aptoide, and Amazon)
