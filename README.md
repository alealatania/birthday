# Alea — Royal Invitation (GitHub Pages)

The three images provided by you are retained as the website backgrounds. Page 2 adds **28 Nov 2026** next to the time. Only the printed guest name on Page 2 is replaced with a live name, sourced from `Guest!A:A` in your Google Sheet. The three pages have animated snowfall; Page 1 zooms into the icy gate on tap, Page 2's invitation button opens the RSVP screen, and Page 3 has clickable Yes/No/Maybe and adult-count controls matching the pictured buttons.

## 1. Publish the website

1. Create a public GitHub repository called `alea-birthday`.
2. Unzip and upload **the files inside this ZIP** to the root of the repository, including `assets/`.
3. In **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)` and Save.
4. Your resulting URL will look like `https://YOUR-USERNAME.github.io/alea-birthday/`.
5. Confirm Page 1 opens, tapping it shows Page 2, and the RSVP button opens Page 3.

## 2. Connect the spreadsheet

1. Open [your spreadsheet](https://docs.google.com/spreadsheets/d/1_Xtz7juN6lhf5G8JcHwm5EfpZIFi98Eye-BnobW5Sck/edit).
2. Open **Extensions → Apps Script**, add the complete `Code.gs` file. If you already have Apps Script logic, create a new project or integrate carefully so you do not overwrite other scripts.
3. In `Code.gs`, replace `WEBSITE_URL` with your actual published GitHub Pages URL.
4. Save, then click **Deploy → New deployment → Web app**, choose **Execute as: Me** and **Who has access: Anyone**, authorize the script and copy the **/exec** URL.
5. Paste that URL inside `config.js` as `appsScriptUrl: "https://script.google.com/macros/s/.../exec"`, then commit the updated file to GitHub.
6. In Apps Script, select **setupGuestLinks** from the function dropdown and click **Run**. Approve permissions if asked. This adds token and link columns to the `Guest` tab (C and D) without modifying children's names or parents in A/B.
7. Send each family their unique link from column D. Test with one guest and check that the `RSVP` tab records **Guest Name | RSVP | Adults | Submitted At** in columns A–D.

**Do not send preview links** that use `?guest=Name` to real guests; they display the name but cannot submit. Real invitations use `?id=...` and are verified against `Guest` column C.

## RSVP behavior

- Yes / Maybe: select 1 or 2 adults.
- No: adult count recorded as 0 automatically.
- Submitting again updates that child's existing RSVP row.
- Success is shown only after the app verifies a receipt on the Google Apps Script endpoint.
- Google Sheets stays private; the web app returns only a child's name for a valid unguessable invitation token and a yes/no receipt confirmation.
- The date is **28 Nov 2026**. The event is at **Pororo Park, PIM 1 Street Gallery**, **10.00–13.00**.

### Important security and publishing notes

Anyone with a personalized invitation link can respond on behalf of that guest, so share links privately. The Apps Script web app must be accessible to anyone for public invitees to submit without Google login. Google Apps Script and GitHub Pages are separate deployments; publishing the website alone does not enable RSVP saving.
