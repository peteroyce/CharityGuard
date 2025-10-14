const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env file");
    }
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

function importCsv(filePath) {
  return new Promise((resolve, reject) => {
    let imported = 0;
    let errors = 0;
    let batch = [];
    const BATCH_SIZE = 500;
    let processing = false;

    const processBatch = async () => {
      if (batch.length === 0 || processing) return;
      processing = true;

      try {
        // Direct MongoDB collection access - bypasses all Mongoose model issues
        const collection = mongoose.connection.collection('irsorgs');
        await collection.insertMany(batch, { 
          ordered: false // Continue on duplicates
        });
        imported += batch.length;
        console.log(`✅ Inserted batch, total imported: ${imported}`);
      } catch (err) {
        // Handle duplicate key errors (11000)
        if (err.code === 11000 || err.message.includes('duplicate')) {
          // Count successful inserts
          const successCount = batch.length - (err.insertedIds ? Object.keys(err.insertedIds).length : 0);
          imported += Math.max(successCount, batch.length);
          console.log(`✅ Batch completed (some duplicates), total: ${imported}`);
        } else {
          errors += batch.length;
          console.error("❌ Insert error:", err.message);
        }
      }
      
      batch = [];
      processing = false;
    };

    console.log(`📖 Reading CSV file: ${path.basename(filePath)}`);
    
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
        const ein = (row.EIN || '').trim();
        const name = (row.NAME || '').trim();

        if (!ein || !name) {
          errors++;
          return;
        }

        // Create document object
        batch.push({
          ein,
          name,
          address: (row.STREET || '').trim(),
          city: (row.CITY || '').trim(),
          state: (row.STATE || '').trim(),
          zip: (row.ZIP || '').trim(),
          nteeCode: (row.NTEE_CD || '').trim(),
          deductibility: (row.DEDUCTIBILITY || '').trim(),
          status: (row.STATUS || '').trim(),
          classification: (row.CLASSIFICATION || '').trim(),
          ruling: (row.RULING || '').trim(),
          foundation: (row.FOUNDATION || '').trim(),
          activity: (row.ACTIVITY || '').trim(),
          organization: (row.ORGANIZATION || '').trim(),
          affiliation: (row.AFFILIATION || '').trim(),
          subsection: (row.SUBSECTION || '').trim(),
          taxPeriod: (row.TAX_PERIOD || '').trim(),
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Process batch when it reaches batch size
        if (batch.length >= BATCH_SIZE && !processing) {
          stream.pause();
          await processBatch();
          stream.resume();
        }
      })
      .on('end', async () => {
        // Process any remaining records
        await processBatch();
        console.log(`🎉 Finished ${path.basename(filePath)}. Imported: ${imported}, Errors: ${errors}`);
        resolve(imported);
      })
      .on('error', (error) => {
        console.error("❌ CSV reading error:", error);
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log("🚀 Starting IRS Data Import...");
    console.log("⏰ Time:", new Date().toLocaleString());
    
    await connectDB();
    
    const dataDir = path.join(__dirname, '../data/irs/');
    
    if (!fs.existsSync(dataDir)) {
      console.log("❌ ERROR: Data directory does not exist:", dataDir);
      process.exit(1);
    }
    
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    console.log("📁 CSV files found:", files);
    
    if (files.length === 0) {
      console.log("❌ ERROR: No CSV files found in", dataDir);
      process.exit(1);
    }

    let total = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n📊 Processing file ${i + 1}/${files.length}: ${file}`);
      
      const fileStartTime = Date.now();
      const count = await importCsv(path.join(dataDir, file));
      const fileEndTime = Date.now();
      
      console.log(`✅ Completed ${file}: ${count} records in ${Math.round((fileEndTime - fileStartTime) / 1000)}s`);
      total += count;
    }
    
    const endTime = Date.now();
    const totalTimeMinutes = Math.round((endTime - startTime) / 1000 / 60 * 100) / 100;
    
    console.log(`\n🎉 ALL IMPORTS COMPLETE!`);
    console.log(`📊 TOTAL RECORDS IMPORTED: ${total.toLocaleString()}`);
    console.log(`⏱️  TOTAL TIME: ${totalTimeMinutes} minutes`);
    console.log(`⚡ AVERAGE SPEED: ${Math.round(total / totalTimeMinutes)} records/minute`);

    // Create index for performance
    try {
      const collection = mongoose.connection.collection('irsorgs');
      await collection.createIndex({ ein: 1 }, { unique: true, background: true });
      console.log("📇 Created unique index on EIN field");
    } catch (indexError) {
      console.log("⚠️  Index may already exist:", indexError.message);
    }

    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed.");
    console.log("✨ Import process completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("💥 Script error:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Closing MongoDB connection...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

main().catch(console.error);