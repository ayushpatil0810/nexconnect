import { getDb } from "./lib/mongodb";

async function run() {
  const db = await getDb();
  const users = await db.collection("user").find().limit(1).toArray();
  console.log("USER:", users[0]);
  
  const profiles = await db.collection("profiles").find().limit(1).toArray();
  console.log("PROFILE:", profiles[0]);
  process.exit(0);
}
run();
