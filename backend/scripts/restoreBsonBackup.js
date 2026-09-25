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

const bson = mongoose.mongo.BSON;

function parseBsonFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const docs = [];
  let index = 0;
  while (index < buffer.length) {
    const size = buffer.readInt32LE(index);
    if (size <= 0 || index + size > buffer.length) break;
    const doc = bson.deserialize(buffer.subarray(index, index + size));
    docs.push(doc);
    index += size;
  }
  return docs;
}

export const restoreBsonBackup = async (dirPath) => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://admin:NqZa3jDAsLzLjFYQ@cluster0.quxftbn.mongodb.net/lms";
  const targetDir = dirPath || path.join(__dirname, '../../lms_backup');

  if (!fs.existsSync(targetDir)) {
    console.error(` Directory not found: ${targetDir}`);
    process.exit(1);
  }

  console.log(` Restoring BSON backup from directory: ${targetDir}`);
  console.log(` Target Database URI: ${uri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(" Connected to Target MongoDB Successfully.");

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.bson'));
    let restoredTotal = 0;

    for (const file of files) {
      const collectionName = path.basename(file, '.bson');
      const filePath = path.join(targetDir, file);
      const docs = parseBsonFile(filePath);

      if (docs.length > 0) {
        const collection = mongoose.connection.db.collection(collectionName);
        await collection.deleteMany({});
        await collection.insertMany(docs);
        console.log(` Restored [${collectionName}]: ${docs.length} document(s)`);
        restoredTotal += docs.length;
      } else {
        console.log(` Skipped [${collectionName}]: 0 documents (empty file)`);
      }
    }

    console.log(`\n BSON Restore Completed Successfully!`);
    console.log(` Total Documents Restored: ${restoredTotal}`);

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(" BSON Restore Failed:", err.message);
    process.exit(1);
  }
};

const customDir = process.argv[2];
restoreBsonBackup(customDir);
