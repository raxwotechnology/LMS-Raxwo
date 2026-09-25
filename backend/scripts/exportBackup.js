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

const backupDir = path.join(__dirname, '../backup');

export const exportDatabaseBackup = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://admin:NqZa3jDAsLzLjFYQ@cluster0.quxftbn.mongodb.net/lms";
  
  console.log(" Connecting to Database for Backup...");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(" Connected to MongoDB Successfully.");
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(` Found ${collections.length} collection(s).`);

    let totalDocs = 0;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timeBackupDir = path.join(backupDir, `backup_${timestamp}`);
    fs.mkdirSync(timeBackupDir, { recursive: true });

    for (const col of collections) {
      const collectionName = col.name;
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      const filePath = path.join(timeBackupDir, `${collectionName}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
      console.log(` Exported collection [${collectionName}]: ${documents.length} document(s) -> ${filePath}`);
      totalDocs += documents.length;
    }

    console.log(`\n Backup Completed Successfully!`);
    console.log(` Total Collections: ${collections.length}`);
    console.log(` Total Documents: ${totalDocs}`);
    console.log(` Saved to directory: ${timeBackupDir}`);
    
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(" Backup Failed:", err.message);
    console.error("\n Possible Reasons:");
    console.error("   1. MongoDB Atlas Cluster is currently PAUSED. (Log into cloud.mongodb.com and click Resume).");
    console.error("   2. Invalid connection URI or credentials.");
    process.exit(1);
  }
};

exportDatabaseBackup();
