import { runResumeIntelligencePipeline } from "/dev-server/src/lib/pipeline.server";
const resume=`Hemanth Kumar
Bangalore, India | hemanth@example.com | +91 9876543210
Technical Recruiter with 6.8 years of experience at Accenture.
Skills: Java, Spring Boot, AWS, Kubernetes, Docker, React, SQL, Python
Experience:
Accenture — Senior Technical Recruiter (2021 - Present) hiring Java, AWS, Kubernetes engineers.
Xevyte — Technical Recruiter (2019 - 2021) sourcing Python and React developers.`;
const jd=`Job Title: Senior Java Developer
We need 5+ years experience in Java, Spring Boot, AWS, Docker, Kubernetes and SQL.
Preferred: React, Python.`;
const r=await runResumeIntelligencePipeline({resumeText:resume,jobDescription:jd});
console.log(JSON.stringify(r.ok? {scoring:r.scoring, matching:r.matching.similarity, rec:r.intelligence.recommendation}: r,null,2));
