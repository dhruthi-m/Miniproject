// Quick Backend Diagnostic & Health Inspector
const path = require('path');

async function testBackend() {
  console.log('====================================================');
  console.log('  MindWave Backend Diagnostic & Verification Test');
  console.log('====================================================\n');

  // 1. Health check
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) {
      const data = await res.json();
      console.log('✅ 1. Express API Server: ONLINE (Port 5000)');
      console.log('      • Status:', data.status);
      console.log('      • Project:', data.project);
      console.log('      • Server Time:', data.timestamp);
    } else {
      console.log('❌ 1. Express API Server: Status', res.status);
    }
  } catch (err) {
    console.log('❌ 1. Express API Server: OFFLINE');
    console.log('      Error:', err.message);
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

    console.log('\n✅ 2. SQLite Database (backend/mindwave.db): CONNECTED');
    console.log(`      • Registered Users:     ${userCount}`);
    console.log(`      • Saved Journals:       ${journalCount}`);
    console.log(`      • Mood Tracking Logs:   ${moodCount}`);
    console.log(`      • Clinical Screenings:  ${assessmentCount}`);
    console.log(`      • AI Chatbot Messages:  ${chatCount}`);

    // Print latest saved journal
    const latestJournal = db.prepare('SELECT id, title, sentiment_label, created_at FROM journal_records ORDER BY id DESC LIMIT 1').get();
    if (latestJournal) {
      console.log('\n✅ 3. Latest Journal Record in Database:');
      console.log(`      • ID: ${latestJournal.id} | Title: "${latestJournal.title}"`);
      console.log(`      • Sentiment: ${latestJournal.sentiment_label} | Date: ${latestJournal.created_at}`);
    }

    // Print latest saved assessment
    const latestAssessment = db.prepare('SELECT id, assessment_type, score, result_category, created_at FROM assessments ORDER BY id DESC LIMIT 1').get();
    if (latestAssessment) {
      console.log('\n✅ 4. Latest Clinical Assessment in Database:');
      console.log(`      • ID: ${latestAssessment.id} | Type: ${latestAssessment.assessment_type}`);
      console.log(`      • Score: ${latestAssessment.score} | Category: ${latestAssessment.result_category} | Date: ${latestAssessment.created_at}`);
    }

    console.log('\n====================================================');
    console.log('  RESULT: All Backend Systems are Active & Healthy! ');
    console.log('====================================================');
  } catch (dbErr) {
    console.log('❌ Database Test Failed:', dbErr.message);
  }
}

testBackend();

