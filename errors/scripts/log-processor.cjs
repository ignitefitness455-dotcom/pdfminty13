/**
 * Automated Error Log Processor
 * 
 * Usage:
 *   node errors/scripts/log-processor.js --code=500 --message="OutOfMemory: PDF rendering failed" --url="/api/merge" [--requests=1200]
 *   node errors/scripts/log-processor.js --code=403 --message="InvalidPasswordException: Document is encrypted" --url="/api/unlock"
 */

const fs = require('fs');
const path = require('path');

// Helper to parse arguments
function parseArgs() {
  const args = {};
  process.argv.forEach((val, index) => {
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

// Set up configuration
const code = parseInt(args.code || '500', 10);
const message = args.message || 'Unknown error occurred during processing';
const url = args.url || 'N/A';
const stack = args.stack || 'No stack trace provided';
const userAgent = args.userAgent || 'Mozilla/5.0 (Node Log Processor)';
const dateStr = args.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Define paths
const errorsDir = path.join(__dirname, '..');
const logsDir = path.join(errorsDir, 'logs', dateStr);
const templatesDir = path.join(errorsDir, 'templates');

// Ensure directories exist
if (!fs.existsSync(path.join(errorsDir, 'logs'))) {
  fs.mkdirSync(path.join(errorsDir, 'logs'));
}
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Categorize error code
const errorClass = (code >= 400 && code < 500) ? '4XX' : '5XX';
const is4xx = errorClass === '4XX';

// Read or create daily summary
const summaryPath = path.join(logsDir, 'summary.json');
let summary = {
  date: dateStr,
  totalRequests: parseInt(args.requests || '1000', 10), // Base default requests to compute a realistic rate
  totalErrors: 0,
  count4xx: 0,
  count5xx: 0,
  rate4xx: '0.00',
  rate5xx: '0.00'
};

if (fs.existsSync(summaryPath)) {
  try {
    summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    // If requests are passed, allow updating the denominator
    if (args.requests) {
      summary.totalRequests = parseInt(args.requests, 10);
    }
  } catch (err) {
    console.error('Failed to parse existing summary.json, resetting.');
  }
}

// Generate new unique error record
const errorId = 'err_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString().slice(-6);
const timestamp = new Date().toISOString();
const newErrorRecord = {
  id: errorId,
  timestamp,
  statusCode: code,
  errorClass,
  message,
  stack,
  url,
  userAgent
};

// Append to proper logs file (4xx or 5xx)
const logFileName = is4xx ? '4xx-errors.json' : '5xx-errors.json';
const logFilePath = path.join(logsDir, logFileName);
let errorList = [];

if (fs.existsSync(logFilePath)) {
  try {
    errorList = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${logFileName}, resetting.`);
  }
}

errorList.unshift(newErrorRecord);
fs.writeFileSync(logFilePath, JSON.stringify(errorList, null, 2), 'utf8');

// Also update the other counter if it exists, to get real totals
const otherLogFileName = is4xx ? '5xx-errors.json' : '4xx-errors.json';
const otherLogFilePath = path.join(logsDir, otherLogFileName);
let otherErrorList = [];
if (fs.existsSync(otherLogFilePath)) {
  try {
    otherErrorList = JSON.parse(fs.readFileSync(otherLogFilePath, 'utf8'));
  } catch (err) {}
}

// Update summary stats
summary.count4xx = is4xx ? errorList.length : otherErrorList.length;
summary.count5xx = is4xx ? otherErrorList.length : errorList.length;
summary.totalErrors = summary.count4xx + summary.count5xx;

// Avoid division by zero
const denominator = Math.max(summary.totalRequests, summary.totalErrors, 1);
summary.rate4xx = ((summary.count4xx / denominator) * 100).toFixed(2);
summary.rate5xx = ((summary.count5xx / denominator) * 100).toFixed(2);

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

// Combine 4xx and 5xx lists chronologically for the timeline
const chronologicalErrors = [...errorList, ...otherErrorList].sort((a, b) => {
  return new Date(b.timestamp) - new Date(a.timestamp);
});

// Compile details list for Markdown rendering
function makeDetailsList(list) {
  if (list.length === 0) return '_No errors recorded in this class for this day._\n';
  return list.map((err, i) => {
    return `#### ${i + 1}. [HTTP ${err.statusCode}] - ${err.message}\n` +
           `* **Time**: \`${new Date(err.timestamp).toLocaleTimeString()}\`\n` +
           `* **Endpoint / URL**: \`${err.url}\`\n` +
           `* **Details / Stack Trace**:\n` +
           `  \`\`\`\n  ${err.stack.replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
  }).join('\n');
}

// Compile timeline rows for Markdown rendering
function makeTimelineRows(list) {
  if (list.length === 0) return '| - | - | - | - | - |\n';
  return list.map(err => {
    const timeOnly = new Date(err.timestamp).toLocaleTimeString();
    const cleanMsg = err.message.length > 80 ? err.message.slice(0, 77) + '...' : err.message;
    const badge = err.errorClass === '4XX' ? '🟢 4XX' : '🔴 5XX';
    return `| ${timeOnly} | ${badge} | \`${err.statusCode}\` | \`${err.url}\` | ${cleanMsg} |`;
  }).join('\n');
}

// Read template and render final Markdown report
const templatePath = path.join(templatesDir, 'daily-report-template.md');
const reportPath = path.join(logsDir, 'daily-report.md');

if (fs.existsSync(templatePath)) {
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  const status4xx = summary.count4xx > 20 ? '⚠️ High Load' : '✅ Stable';
  const status5xx = summary.count5xx > 5 ? '🚨 Critical Action Required' : (summary.count5xx > 0 ? '⚠️ Warning' : '✅ Operational');

  // Replace tokens
  const rendered = templateContent
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{TOTAL_REQUESTS\}\}/g, summary.totalRequests)
    .replace(/\{\{TOTAL_ERRORS\}\}/g, summary.totalErrors)
    .replace(/\{\{4XX_COUNT\}\}/g, summary.count4xx)
    .replace(/\{\{4XX_STATUS_INDICATOR\}\}/g, status4xx)
    .replace(/\{\{4XX_RATE\}\}/g, summary.rate4xx)
    .replace(/\{\{5XX_COUNT\}\}/g, summary.count5xx)
    .replace(/\{\{5XX_STATUS_INDICATOR\}\}/g, status5xx)
    .replace(/\{\{5XX_RATE\}\}/g, summary.rate5xx)
    .replace(/\{\{4XX_DETAILS_LIST\}\}/g, makeDetailsList(is4xx ? errorList : otherErrorList))
    .replace(/\{\{5XX_DETAILS_LIST\}\}/g, makeDetailsList(is4xx ? otherErrorList : errorList))
    .replace(/\{\{CHRONOLOGICAL_TIMELINE_ROWS\}\}/g, makeTimelineRows(chronologicalErrors));

  fs.writeFileSync(reportPath, rendered, 'utf8');
  console.log(`Successfully compiled organized error record for date: ${dateStr}`);
} else {
  console.error('Daily report template not found at templates/daily-report-template.md');
}
