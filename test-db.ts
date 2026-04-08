import "dotenv/config";
import mysql from "mysql2/promise";

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  try {
    const connection = await mysql.createConnection(url);
    console.log("Database connection successful");
    await connection.end();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
