
import postgres from 'postgres';
import 'dotenv/config';

async function test() {
  console.log("Testing connection to:", process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 10 });
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await sql.end();
  }
}

test();
