import { generateJdContent } from "./src/lib/jd-studio.server";
import { config } from "dotenv";

config();

async function test() {
  try {
    const res = await generateJdContent({
      positionTitle: "Software Engineer",
      department: "Engineering",
      level: "Senior",
      location: "Remote",
      employmentType: "Full-time",
      requiredExperience: "5+ years",
      roleDescription: "A Software Engineer designs, develops, tests...",
      mustHaveSkills: "React, Angular, Node.js",
      tone: "Clear & professional",
    });
    console.log("Success:");
    console.log(res);
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
}

test();
