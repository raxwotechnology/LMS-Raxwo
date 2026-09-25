import mongoose from "mongoose";
import dns from "dns";

// Attempt to set custom public DNS servers to resolve MongoDB Atlas SRV records
// when running in environments with restrictive local DNS resolvers (e.g. cloud host containers, ISPs)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (dnsErr) {
  // Custom DNS setting may not be permitted in some container environments; proceed with default
}

let isConnecting = false;

export const connectDB = async () => {
  // If already connected, return immediately (serverless reuse)
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  // Prevent multiple parallel connection attempts
  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      if (mongoose.connection.readyState >= 1) return true;
      attempts++;
    }
  }

  isConnecting = true;
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://p04waptC2duu0v3K:RR589422@cluster0.yzqehug.mongodb.net/lms-main?appName=Cluster0";
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // 15 seconds timeout
      retryWrites: true,
      w: 'majority',
    });
    
    console.log(" Database Connected Successfully");
    isConnecting = false;
    return true;
  } catch (err) {
    isConnecting = false;
    console.error(" DB connect error:", err.message);
    console.error("\n Connection or DNS Resolution Issue Detected!");
    console.error("If using MongoDB Atlas SRV records, check your DNS or connection string.");
    console.error("\n Troubleshooting Checklist:");
    console.error("   1. Verify MONGO_URI / MONGODB_URI environment variable is set in your host settings (e.g. Render environment variables)");
    console.error("   2. Ensure 0.0.0.0/0 (all IP addresses) is allowed in MongoDB Atlas Network Access IP Access List");
    console.error("   3. Check database user username & password in MONGO_URI");
    console.error("\n Server will continue running so port health checks pass, but DB operations will fail until connected.");
    return false;
  }
};

