// Quick Backend Diagnostic & Health Inspector
const http = require('http');

async function testBackend() {
  console.log('====================================================');
  console.log(' MindWave Backend Diagnostic & Verification Test');
  console.log('====================================================\n');

  // 1. Health check
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) {
      const data = await res.json();
      console.log(' 1. Server Health Check: ONLINE');
      console.log('    Status:', data.status, '| Version:', data.version);
    } else {
      console.log('❌ 1. Server Health Check: Returned status', res.status);
    }
  } catch (err) {
    console.log('❌ 1. Server Health Check: FAILED to connect to http://localhost:5000');
    console.log('    Error:', err.message);
    return;
  }

  // 2. Database Inspection
  try {
    const db = require('./backend/src/db/database');
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const journalCount = db.prepare('SELECT COUNT(*) as c FROM journal_records').get().c;
    const moodCount = db.prepare('SELECT COUNT(*) as c FROM mood_records').get().c;
    const assessmentCount = db.prepare('SELECT COUNT(*) as c FROM assessments').get().c;
    const chatCount = db.prepare('SELECT COUNT(*) as c FROM chat_records').get().c;

    console.log('\n 2. Database Connection (SQLite mindwave.db): ACTIVE');
    console.log(`    • Registered Users: ${userCount}`);
    console.log(`    • Journal Entries: ${journalCount}`);
    console.log(`    • Mood Logs: ${moodCount}`);
    console.log(`    • Clinical Screenings: ${assessmentCount}`);
    console.log(`    • Chatbot Messages: ${chatCount}`);

    // Print latest saved journal
    const latestJournal = db.prepare('SELECT id, title, sentiment_label, created_at FROM journal_records ORDER BY id DESC LIMIT 1').get();
    if (latestJournal) {
      console.log('\n 3. Latest Saved Journal Record in DB:');
      console.log(`    • ID: ${latestJournal.id} | Title: "${latestJournal.title}"`);
      console.log(`    • Sentiment: ${latestJournal.sentiment_label} | Date: ${latestJournal.created_at}`);
    }

    // Print latest saved assessment
    const latestAssessment = db.prepare('SELECT id, assessment_type, score, result_category, created_at FROM assessments ORDER BY id DESC LIMIT 1').get();
    if (latestAssessment) {
      console.log('\n 4. Latest Clinical Assessment in DB:');
      console.log(`    • ID: ${latestAssessment.id} | Type: ${latestAssessment.assessment_type}`);
      console.log(`    • Score: ${latestAssessment.score} | Category: ${latestAssessment.result_category} | Date: ${latestAssessment.created_at}`);
    }

    console.log('\n====================================================');
    console.log(' ALL BACKEND SUBSYSTEMS ARE HEALTHY & OPERATIONAL');
    console.log('====================================================');
  } catch (dbErr) {
    console.log('❌ Database Test Failed:', dbErr.message);
  }
}

testBackend();

