import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set public DNS servers for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (e) {}

const backupBaseDir = path.join(__dirname, '../backup');

export const restoreDatabaseBackup = async (folderName) => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://admin:NqZa3jDAsLzLjFYQ@cluster0.quxftbn.mongodb.net/lms";

  if (!fs.existsSync(backupBaseDir)) {
    console.error(" Backup directory not found.");
    process.exit(1);
  }

  // Pick target backup folder (specified or latest)
  let targetFolder = folderName;
  if (!targetFolder) {
    const folders = fs.readdirSync(backupBaseDir).filter(f => fs.statSync(path.join(backupBaseDir, f)).isDirectory());
    if (folders.length === 0) {
      console.error(" No backup folders found in backend/backup");
      process.exit(1);
    }
    folders.sort();
    targetFolder = folders[folders.length - 1]; // latest folder
  }

  const targetPath = path.join(backupBaseDir, targetFolder);
  console.log(` Restoring backup from: ${targetPath}`);
  console.log(` Target Database URI: ${uri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(" Connected to Target MongoDB Successfully.");

    const files = fs.readdirSync(targetPath).filter(f => f.endsWith('.json'));
    let restoredTotal = 0;

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(targetPath, file);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const documents = JSON.parse(rawData);

      if (documents.length > 0) {
        const collection = mongoose.connection.db.collection(collectionName);
        // Clear existing data before restoring
        await collection.deleteMany({});
        // Re-insert documents
        await collection.insertMany(documents);
        console.log(` Restored [${collectionName}]: ${documents.length} document(s)`);
        restoredTotal += documents.length;
      } else {
        console.log(` Skipped [${collectionName}]: 0 documents`);
      }
    }

    console.log(`\n Restore Completed Successfully!`);
    console.log(` Total Documents Restored: ${restoredTotal}`);

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(" Restore Failed:", err.message);
    process.exit(1);
  }
};

const folderArg = process.argv[2];
restoreDatabaseBackup(folderArg);
