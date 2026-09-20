# Error Tracking & Logging Directory

This directory is dedicated to recording, organizing, and analyzing client-side and server-side errors, including HTTP **4XX (Client-side)** and **5XX (Server-side)** exceptions, along with hourly/daily calculated error rates.

## Directory Structure

All logs are stored and organized under the `logs/` directory by date (`YYYY-MM-DD/`) and compiled weekly in structured formats:

```
errors/
├── README.md                      # This main documentation and guidelines
├── templates/
│   ├── daily-report-template.md   # Template for the daily error analytics markdown
│   └── error-schema.json          # JSON schema for validating error objects
├── logs/
│   ├── YYYY-MM-DD/                # Folders grouped by date (e.g. 2026-07-12)
│   │   ├── summary.json           # Daily stats (Total requests, 4xx/5xx counts and rates)
│   │   ├── 4xx-errors.json        # Detailed log of client-side/validation errors
│   │   ├── 5xx-errors.json        # Detailed log of server-side exceptions
│   │   └── daily-report.md        # Compiled daily human-readable markdown report
│   └── weekly-reports/            # Consolidated weekly analytics
│       ├── weekly-report-YYYY-MM-DD_to_YYYY-MM-DD.md
│       └── weekly-summary-YYYY-MM-DD_to_YYYY-MM-DD.json
└── scripts/
    ├── log-processor.cjs          # Automated script to process and compile daily error stats
    └── weekly-aggregator.cjs      # Aggregates 7 days of logs into weekly reports
```

---

## Error Classification & Rates

To ensure strict engineering categorization, all exceptions are cataloged into one of two divisions:

### 1. 4XX Class (Client-Side & Operations)
*   **Definition**: Errors triggered by user input issues, missing resources, or validation failures.
*   **Common Errors**: 
    *   `400 Bad Request`: Corrupted PDF files, invalid fields.
    *   `403 Forbidden`: Encrypted/password-protected PDFs.
    *   `404 Not Found`: API endpoints or asset references.
    *   `429 Too Many Requests`: Triggered rate limiter.
*   **Formula for 4XX Error Rate**:
    $$\text{4XX Error Rate} = \left( \frac{\text{Total 4XX Errors}}{\text{Total Server/API Requests}} \right) \times 100\%$$

### 2. 5XX Class (Server & Service Degradation)
*   **Definition**: Fatal exceptions in backend APIs, cloud functions, or processing engines.
*   **Common Errors**:
    *   `500 Internal Server Error`: Memory limit exceeded in worker, unhandled syntax crashes.
    *   `503 Service Unavailable`: Third-party APIs (e.g., OCR, external LLM) failure.
    *   `504 Gateway Timeout`: Processing heavy files exceeding maximum Cloudflare/Serverless timeouts.
*   **Formula for 5XX Error Rate**:
    $$\text{5XX Error Rate} = \left( \frac{\text{Total 5XX Errors}}{\text{Total Server/API Requests}} \right) \times 100\%$$

---

## Logging & Processing Scripts

### 1. Recording Daily Errors
To record an error or update the summary files for any specific date, run the daily log-processor utility script:

```bash
node errors/scripts/log-processor.cjs --code=500 --message="Failed to parse PDF trailer" --url="/api/merge" --requests=1500
```

### 2. Aggregating Weekly Analytics
To consolidate daily logs into a high-level weekly report with trend breakdown and architectural recommendations, run:

```bash
node errors/scripts/weekly-aggregator.cjs --days=7
```

---

## 🤖 GitHub Actions Automation Workflows

We have provided two pre-configured GitHub Actions inside `.github/workflows/` to automate these processes:

### 1. `Record Error to GitHub Logs` (`record-error.yml`)
Allows triggering an error log via a webhook or Workflow Dispatch input. 
*   **Inputs**: `code`, `message`, `url`, `requests`, `date`.
*   **Outcome**: Runs the log-processor and automatically commits the organized JSON files and daily Markdown reports back to your GitHub repository.

### 2. `Weekly Error Log Aggregation` (`weekly-analytics.yml`)
Runs automatically every Sunday at midnight (UTC) or can be executed manually.
*   **Outcome**: Aggregates the previous 7 days of logs into `/errors/logs/weekly-reports/` and commits them to your repository to maintain long-term trend data.
