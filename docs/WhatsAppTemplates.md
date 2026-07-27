# WhatsApp Message Templates (for Meta approval)

FeesUp sends business-initiated WhatsApp messages, which Meta requires to use **pre-approved
templates**. Submit the three below in your PayPerWA / WhatsApp Business dashboard. Approval is
usually a few hours to a couple of days — **submit early**, as it's the only step outside our
control.

## Submission settings (all three)
- **Category:** Utility (these are transactional fee reminders, not marketing)
- **Language:** English
- **Placeholders (same order in all three):**
  1. `{{1}}` = parent name
  2. `{{2}}` = student name
  3. `{{3}}` = amount (e.g. ₹2,000)
  4. `{{4}}` = month (e.g. July 2026)
  5. `{{5}}` = payment link

> The order above must match `backend/src/config/reminderTemplates.js` (variables are sent in
> this exact order). If you change the wording, keep the placeholder order identical.

---

## 1. Pre-due reminder
- **Template name:** `fee_pre_due_reminder`
- **Body:**
```
Hi {{1}}, a friendly reminder that {{2}}'s tuition fee of {{3}} for {{4}} is due soon. You can pay here: {{5}}. Thank you!
```

## 2. Due-date reminder
- **Template name:** `fee_due_reminder`
- **Body:**
```
Hi {{1}}, {{2}}'s tuition fee of {{3}} for {{4}} is due today. Pay here: {{5}}. Thank you!
```

## 3. Overdue reminder
- **Template name:** `fee_overdue_reminder`
- **Body:**
```
Hi {{1}}, {{2}}'s tuition fee of {{3}} for {{4}} is overdue. Please pay at your earliest convenience: {{5}}. Thank you!
```

---

## Sample values (for the approval preview)
- `{{1}}` = Rohit Sharma
- `{{2}}` = Aarav
- `{{3}}` = ₹2,000
- `{{4}}` = July 2026
- `{{5}}` = https://rzp.io/i/abc123

## Tips for smooth approval
- Keep the tone utility/transactional; avoid promotional language.
- Don't start or end with only a placeholder; keep the surrounding text (as above).
- Once approved, the template **names** must match exactly what's in
  `reminderTemplates.js`. If Meta forces a different name, update that file accordingly.
- After approval, set `MESSAGING_PROVIDER=payperwa` plus `PAYPERWA_API_KEY` / `PAYPERWA_BASE_URL`
  and confirm the request shape in `PayPerWAMessagingProvider.js` against PayPerWA's docs.
