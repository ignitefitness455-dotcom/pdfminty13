# Error Analytics & Rate Report: {{DATE}}

This report was generated automatically. It summarizes all client-side (4XX) and server-side (5XX) errors recorded on **{{DATE}}**, calculating exact error rates based on total session traffic.

---

## 📊 Daily Summary Stats

| Metric | Count / Value | Status |
| :--- | :--- | :--- |
| **Total Requests Ingested** | {{TOTAL_REQUESTS}} | - |
| **Total Errors Logged** | {{TOTAL_ERRORS}} | - |
| **4XX Errors** | {{4XX_COUNT}} | {{4XX_STATUS_INDICATOR}} |
| **4XX Error Rate** | **{{4XX_RATE}}%** | - |
| **5XX Errors** | {{5XX_COUNT}} | {{5XX_STATUS_INDICATOR}} |
| **5XX Error Rate** | **{{5XX_RATE}}%** | - |

---

## 🚫 Part 1: Client-Side & Validation Errors (4XX)

*These are client-side exceptions (e.g. invalid files, password-locked documents, or rate limits).*

### 4XX Error Details
{{4XX_DETAILS_LIST}}

---

## ⚡ Part 2: Server-Side Exceptions (5XX)

*These are critical errors indicating server failure, memory limits, or internal processing issues.*

### 5XX Error Details
{{5XX_DETAILS_LIST}}

---

## ⏰ Chronological Error Timeline

| Time (UTC) | Class | Code/Type | API / Endpoint / URL | Message |
| :--- | :--- | :--- | :--- | :--- |
{{CHRONOLOGICAL_TIMELINE_ROWS}}

---
*End of automated report.*
