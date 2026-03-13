import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new Database('survey.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    data TEXT
  )
`);

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const getAuth = () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: SCOPES
  });
};

// Flatten survey data for spreadsheet
function flattenSurveyData(data: any) {
  const flat: any[] = [];
  
  // 1. Company Info
  flat.push(new Date().toISOString());
  flat.push(data.company.name || '');
  flat.push(data.company.phone || '');
  flat.push(data.company.respondent || '');

  const sum = (arr: any[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

  // 2. Vehicles
  const vKeys = ['under3_5t', 'under5t', 'under7_5t', 'under8t', 'under11t', 'over11t', 'towed'];
  const vVals = vKeys.map(k => data.vehicles[k] || 0);
  flat.push(...vVals);
  flat.push(sum(vVals)); // total

  // 3. Drivers
  const ages = ['a10', 'a20', 'a30', 'a40', 'a50', 'a60'];
  const genders = ['male', 'female'];
  const lKeys = ['ordinary', 'limited5t', 'semiMedium', 'limited8t', 'medium', 'large', 'towing'];
  
  ages.forEach(age => {
    genders.forEach(gender => {
      const dVals = lKeys.map(l => data.drivers[age][gender][l] || 0);
      flat.push(...dVals);
      // Exclude towing (index 6) from horizontal total
      flat.push(sum(dVals.slice(0, 6))); // total
    });
  });

  // 4. Recruitment
  const rGenders = ['male', 'female', 'any'];
  rGenders.forEach(gender => {
    const rVals = lKeys.map(l => data.recruitment[gender][l] || 0);
    flat.push(...rVals);
    flat.push(sum(rVals.slice(0, 6))); // total
  });

  return flat;
}

app.post('/api/submit', async (req, res) => {
  try {
    const data = req.body;
    
    // Save to SQLite
    const stmt = db.prepare('INSERT INTO responses (data) VALUES (?)');
    stmt.run(JSON.stringify(data));

    // Save to Google Sheets if configured
    const auth = getAuth();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    if (auth && spreadsheetId) {
      const sheets = google.sheets({ version: 'v4', auth });
      const flatData = flattenSurveyData(data);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1', // Adjust as needed
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [flatData]
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit survey' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
