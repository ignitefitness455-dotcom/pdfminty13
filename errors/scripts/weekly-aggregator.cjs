/**
 * Weekly Error Log Aggregator
 * 
 * Usage:
 *   node errors/scripts/weekly-aggregator.cjs [--days=7]
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  process.argv.forEach((val) => {
    if (val.startsWith('--')) {
      const parts = val.slice(2).split('=');
      const key = parts[0];
      const value = parts.slice(1).join('=');
      args[key] = value;
    }
  });
  return args;
}

const args = parseArgs();
const daysToAggregate = parseInt(args.days || '7', 10);

const errorsDir = path.join(__dirname, '..');
const logsDir = path.join(errorsDir, 'logs');
const weeklyReportsDir = path.join(logsDir, 'weekly-reports');

// Ensure weekly reports directory exists
if (!fs.existsSync(weeklyReportsDir)) {
  fs.mkdirSync(weeklyReportsDir, { recursive: true });
}

// Read all subdirectories in logs/ (excluding weekly-reports)
if (!fs.existsSync(logsDir)) {
  console.log('No logs directory found. Please log some errors first.');
  process.exit(0);
}

const dirs = fs.readdirSync(logsDir).filter(file => {
  const fullPath = path.join(logsDir, file);
  return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(file);
});

// Sort directories descending (most recent first) and slice to range
dirs.sort((a, b) => new Date(b) - new Date(a));
const activeDirs = dirs.slice(0, daysToAggregate);

if (activeDirs.length === 0) {
  console.log('No daily error log folders found to aggregate.');
  process.exit(0);
}

let totalRequests = 0;
let totalErrors = 0;
let count4xx = 0;
let count5xx = 0;
const dailyStats = [];

activeDirs.forEach(dateFolder => {
  const summaryPath = path.join(logsDir, dateFolder, 'summary.json');
  if (fs.existsSync(summaryPath)) {
    try {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      totalRequests += summary.totalRequests || 0;
      totalErrors += summary.totalErrors || 0;
      count4xx += summary.count4xx || 0;
      count5xx += summary.count5xx || 0;
      dailyStats.push(summary);
    } catch (err) {
      console.error(`Failed to parse summary for ${dateFolder}:`, err.message);
    }
  }
});

// Calculate overall rates
const denominator = Math.max(totalRequests, totalErrors, 1);
const overallRate4xx = ((count4xx / denominator) * 100).toFixed(2);
const overallRate5xx = ((count5xx / denominator) * 100).toFixed(2);

// Generate Weekly Report filename based on date range
const startDate = activeDirs[activeDirs.length - 1];
const endDate = activeDirs[0];
const weekLabel = `${startDate}_to_${endDate}`;

const weeklySummary = {
  aggregatedRange: {
    start: startDate,
    end: endDate,
    daysProcessed: activeDirs.length
  },
  totalRequests,
  totalErrors,
  count4xx,
  count5xx,
  overallRate4xx,
  overallRate5xx,
  dailyBreakdown: dailyStats
};

// Write Weekly JSON Summary
fs.writeFileSync(
  path.join(weeklyReportsDir, `weekly-summary-${weekLabel}.json`),
  JSON.stringify(weeklySummary, null, 2),
  'utf8'
);

// Generate Markdown Weekly Report
const mdReportRows = dailyStats.map(day => {
  return `| ${day.date} | ${day.totalRequests} | ${day.totalErrors} | ${day.count4xx} (${day.rate4xx}%) | ${day.count5xx} (${day.rate5xx}%) |`;
}).join('\n');

const markdownReport = `# Weekly Error Analytics & Rate Report

### Date Range: \`${startDate}\` to \`${endDate}\` (Processed Days: ${activeDirs.length})

This consolidated report aggregates client-side (4XX) and server-side (5XX) errors and rates across all active daily periods.

---

## 📈 Aggregated Metrics Overview

| Metric | Cumulative Value | Overall Status / Notes |
| :--- | :--- | :--- |
| **Total Ingested Requests** | **${totalRequests}** | Estimated traffic across analyzed periods |
| **Total Exceptions/Errors** | **${totalErrors}** | Aggregate volume of failures |
| **Total 4XX Errors** | **${count4xx}** | Client errors (400, 403, 404, 429) |
| **Overall 4XX Error Rate** | **${overallRate4xx}%** | Calculated against total requests |
| **Total 5XX Errors** | **${count5xx}** | Server exceptions (500, 502, 503, 504) |
| **Overall 5XX Error Rate** | **${overallRate5xx}%** | Calculated against total requests |

---

## 📅 Daily Breakdown & Trend Line

Below is the day-to-day analytics matrix:

| Date | Total Requests | Total Errors | 4XX Count (Rate) | 5XX Count (Rate) |
| :--- | :--- | :--- | :--- | :--- |
${mdReportRows}

---

## 💡 Architectural Maintenance Recommendations

1. ${parseFloat(overallRate5xx) > 1.0 ? '🔴 **Warning**: Your 5XX server error rate is above 1.0%. Check logs for OutOfMemoryException or Gateway timeouts to optimize heavy processing functions.' : '✅ **Excellent**: Server stability (5XX Rate) is within healthy operational standards (< 1.0%).'}
2. ${parseFloat(overallRate4xx) > 5.0 ? '⚠️ **Notice**: High volume of 4XX client errors detected. Users may be repeatedly uploading corrupted files or running into encryption password blocks.' : '✅ **Stable**: Client validation failure rates are low.'}
3. Run weekly log archiving to keep the git history clean from redundant daily dumps.

*Report generated at ${new Date().toISOString()}*
`;

fs.writeFileSync(
  path.join(weeklyReportsDir, `weekly-report-${weekLabel}.md`),
  markdownReport,
  'utf8'
);

console.log(`Weekly analytics consolidated successfully! Written to errors/logs/weekly-reports/weekly-report-${weekLabel}.md`);
