# Intelligence Sprint 2 — Domain-Agnostic Accuracy

Keep the deterministic-first contract: no new AI calls, RecruiterReport stays a pure renderer, engines remain pure. The goal is honest, high-fidelity matching across **any** domain — IT, Salesforce, SAP, Data, Cloud, DevOps, HR/TA, Finance, Healthcare, Mechanical, Sales, Marketing — not a Salesforce-only patch.

Root causes we're fixing (each one hits every domain):

1. **Skill tokenization splits multi-word skills** — `Sales Cloud` → `Sales`+`Cloud`; `Machine Learning` → `Machine`+`Learning`; `Project Management` → `Project`+`Management`. Happens in every domain.
2. **Alias table is small and IT-only** — SAP, Salesforce, Oracle, ServiceNow, Workday, Adobe, Data/ML, Finance/HR terms aren't normalized, so identical concepts don't match.
3. **Matching has no domain ontology** — related-tech map covers only ~10 IT stacks. A candidate with `Kotlin` vs a JD asking `Android` never matches.
4. **Entity extraction is brittle** — `currentCompany` requires literal `at|@|Technologies|…`; falls apart on "Accenture — Senior Developer (2020–Present)". `currentDesignation` misses domain-specific titles.
5. **Domain inference haystack is tiny** — only JD title + resume designation. Never sees the actual skill lists, so it whiffs whenever the title is generic.
6. **Seniority disagreement** — header shows "Not Found" while summary computes "Senior" from years. Same data, two answers.
7. **Pipeline timings render as `0 ms`** — not credible.

---

## 1. Multi-word skill tokenizer (domain-agnostic)

`src/lib/skill-normalizer.ts`:

- New helper `extractSkillPhrases(rawText)`: before splitting on `,;|•\n`, run a **longest-match pass** over the alias table's keys against the raw string. Matched phrases are emitted as single tokens; remaining text is then split normally. This one change fixes `Sales Cloud`, `Machine Learning`, `Power BI`, `Project Management`, `Talent Acquisition`, `Business Analysis`, `Change Management`, `Financial Modeling`, `Supply Chain`, `Product Management`, `Data Engineering`, `Full Stack Development`, etc.
- Apply it inside `normalizeSkillList` and inside JD/Resume field collection so multi-word skills survive both pipes.

## 2. Expand `CANONICAL_ALIASES` across every major domain

Same file. Add blocks (canonical shown in parens):

- **Salesforce**: apex, apex triggers, lwc → `Lightning Web Components (LWC)`, aura, visualforce, soql, sosl, sales cloud, service cloud, experience cloud/community cloud, omnistudio/vlocity, cpq, mulesoft, copado, flows, validation rules, sfdc/salesforce.com → `Salesforce Platform`, salesforce administration.
- **SAP / ERP**: sap abap, sap fico, sap mm, sap sd, sap hana, s/4hana, oracle erp, netsuite, dynamics 365, workday, servicenow.
- **Data / Analytics / ML**: pyspark, apache spark, hadoop, airflow, dbt, snowflake, databricks, redshift, bigquery, looker, qlik, ssrs/ssis/ssas, xgboost, hugging face, langchain, llm, rag, vector db, pinecone.
- **Cloud / DevOps**: eks, ecs, ec2, s3, lambda, cloudformation, argo cd, prometheus, grafana, datadog, splunk, new relic, github actions, gitlab ci, bitbucket pipelines, ansible, helm, istio.
- **Mobile**: swiftui, jetpack compose, kotlin multiplatform, xamarin, expo.
- **QA / Testing**: cypress, playwright, selenium webdriver, rest assured, postman, jmeter, appium, testng, cucumber, bdd, tdd.
- **Security**: burp suite, nessus, wireshark, siem, splunk es, iso 27001, soc 2, gdpr, hipaa, pci dss.
- **HR / TA / Recruitment**: naukri, linkedin recruiter, monster, dice, hirist, iimjobs, taleo, greenhouse, lever, workable, smartrecruiters, icims, boolean, x-ray search, employee onboarding, stakeholder management, offer negotiation, background verification/bgv.
- **Finance / Accounting**: quickbooks, tally, sap fico, ifrs, gaap, sox, financial modeling, forecasting, budgeting, variance analysis, accounts payable/receivable → `Accounts Payable`/`Accounts Receivable`.
- **Sales / Marketing**: salesforce sales cloud, hubspot, marketo, pardot, seo, sem, google ads, meta ads, ga4, gtm, content marketing, lead generation, account management, crm.
- **Healthcare / Pharma**: emr, ehr, epic, cerner, hl7, fhir, gcp (good clinical practice — disambiguate from cloud GCP by context), clinical trials, regulatory affairs.
- **Mechanical / Manufacturing**: autocad, solidworks, catia, ansys, plc, scada, six sigma, lean manufacturing, gd&t.
- **Common product/PM**: agile, scrum, kanban, safe, jira, confluence, product roadmap, stakeholder management, user stories.

Every entry follows the existing key/value shape — no code churn.

## 3. Matching Engine — broader `RELATED_TECHNOLOGIES`

`src/lib/matching-engine.ts`: extend the adjacency map so cross-labeled skills match at confidence 80 (`related`). Symmetric, domain-agnostic edges:

- Salesforce Platform ↔ Apex, LWC, Aura, Visualforce, SOQL, Sales Cloud, Service Cloud, Experience Cloud, Flows.
- Sales Cloud ↔ Service Cloud ↔ Experience Cloud ↔ Salesforce Platform.
- Android ↔ Kotlin/Java; iOS ↔ Swift/SwiftUI; React Native ↔ React.
- SAP ↔ SAP ABAP/FICO/MM/SD/HANA.
- Data Engineering ↔ Spark, Airflow, dbt, Snowflake, Databricks.
- Machine Learning ↔ PyTorch, TensorFlow, scikit-learn, Pandas, NumPy.
- LLM ↔ LangChain, RAG, OpenAI, Hugging Face.
- CI/CD ↔ Jenkins, GitHub Actions, GitLab CI, Copado, Argo CD.
- Recruitment ↔ Sourcing, Screening, Boolean Search, LinkedIn Recruiter, Naukri, ATS, Greenhouse, Lever.
- REST API ↔ SOAP API ↔ GraphQL ↔ gRPC (weakly related, still 80).
- Product Management ↔ Agile, Scrum, Roadmap, Jira.
- Finance ↔ QuickBooks, Tally, SAP FICO, Financial Modeling.

Every edge is declared once; the engine already symmetrizes at lookup.

## 4. Resume Parser — universal entity extraction

`src/lib/resume-analyzer.server.ts`:

- **`extractCurrentCompany`** rewrite (domain-agnostic):
  1. Pull first entry of `employmentHistory`; split on ` — | – | - | at | @ | \| | , `. Return the segment matching company heuristics: contains `Inc|Ltd|Pvt|LLP|LLC|GmbH|Technologies|Solutions|Systems|Labs|Consulting|Services|Group|Bank|Hospital|University|Motors|Pharma`, OR is a 2–4 word Title-Case proper noun with no verbs.
  2. Fallback: match against a `KNOWN_COMPANIES` seed list (Accenture, Infosys, TCS, Wipro, Cognizant, Capgemini, Deloitte, IBM, HCL, Tech Mahindra, LTIMindtree, Persistent, Amazon, Microsoft, Google, Meta, Salesforce, Oracle, SAP, JPMorgan, Goldman Sachs, HSBC, Citi, HDFC, ICICI, Reliance, Tata, Mahindra, Apollo, Fortis, Pfizer, GSK…). Extend liberally; deterministic and cheap.
  3. Fallback: line immediately following the current designation.
- **`extractCurrentDesignation`**: broaden `DESIGNATION_HINTS` to cover every domain — add `salesforce developer|admin|consultant|architect`, `sap consultant`, `data scientist|engineer|analyst`, `devops|sre|platform engineer`, `product manager|owner`, `talent acquisition|recruiter|sourcer`, `financial analyst|accountant|controller`, `staff nurse|physician|surgeon`, `mechanical|electrical|civil|design engineer`, `qa|sdet|automation engineer`, `security analyst|engineer|architect`.
- Both extractors run on the AI-parsed output too via `mergeParsedResume`, so a weak AI answer gets rescued by deterministic logic (not the other way around).

## 5. Recruiter Intelligence — better domain inference

`src/lib/recruiter-intelligence.ts`:

- **Rewrite `inferDomain`** with a bigger haystack: JD title + industry + department + resume designation + **top 15 JD required skills + top 15 resume skills**. Skills are the strongest domain signal — this alone lifts inference across every profile type.
- **Add domain rules** ordered most-specific → generic (first match wins):
  - Salesforce CRM: `salesforce|sfdc|apex|lightning|visualforce|soql|sales cloud|service cloud|omnistudio|cpq`
  - SAP / ERP: `\bsap\b|s/4hana|abap|fico|oracle erp|netsuite|dynamics 365|workday`
  - Data Engineering: `spark|hadoop|airflow|dbt|snowflake|databricks|redshift|bigquery|kafka`
  - AI / Machine Learning: existing + `llm|langchain|rag|pytorch|tensorflow|hugging face`
  - Cloud & DevOps, Backend, Frontend, Full-Stack, Mobile — existing.
  - Cybersecurity: existing + `siem|owasp|burp|nessus|pentest`
  - Talent Acquisition: existing + `sourcing|boolean|greenhouse|lever|naukri`
  - Fintech / Banking, Healthcare, Retail, Manufacturing, Legal, Marketing — extend patterns to hit skill lists.
  - Fallback: JD title if present, else `General`.
- **Seniority coherence**: when JD `seniorityLevel === "Not Found"`, header/badge uses `seniorityFromYears(candidateYears)` — the same value the summary already uses. One source of truth. Also surface `inferredSeniority` explicitly on the returned intelligence object so the UI can render it directly.

## 6. Scoring Engine — regression guard

`src/lib/scoring-engine.ts`: keep the 70/30 weights. Add a dev-only diagnostic (`console.warn`) when `matchedRequired/totalRequired ≥ 0.7` but `matchPercentage < 40` — surfaces future accuracy regressions during QA without altering user output.

## 7. Pipeline — real timings, honest UI

- `src/lib/pipeline.server.ts`: wrap each stage's `await` in `performance.now()` (already partially done) and round to 1 decimal ms.
- `src/components/report/RecruiterReport.tsx` transparency section: render `ms < 1 ? "<1 ms" : "${ms} ms"`. No engine logic in the component — still a pure renderer.

## 8. UI — pure renderer changes only

`src/components/report/RecruiterReport.tsx`:
- Header shows `intelligence.inferredDomain` when JD `domain === "Not Found"`.
- Header seniority badge shows `intelligence.inferredSeniority` when JD `seniorityLevel === "Not Found"`.
- Current Company/Designation read directly from parsed resume (now populated by #4).
- Timings formatted per #7.

## Verification — cross-domain sanity

After rebuild, spot-check with resumes from 4 different domains (Salesforce, Data Engineer, Talent Acquisition, Financial Analyst). For each:

- Header: Domain, Seniority, Current Company, Current Designation all populated (no "Not Found" when the resume has the data).
- Multi-word skills (`Sales Cloud`, `Machine Learning`, `Power BI`, `Talent Acquisition`, `Financial Modeling`) appear as single tokens in Matching / Additional / Missing lists — never split.
- Match score lands in a realistic band (strong JD overlap → 80–92%; partial overlap → 50–70%; poor overlap → <40%). No more 33% floor when 12+ skills overlap.
- Pipeline timings show real ms or `<1 ms`, never `0 ms`.

## Non-goals

- No new engines, no new AI layer, no PDF changes (renderer inherits automatically).
- Evidence Engine unchanged (already 9/10).
- No refactor of RecruiterReport beyond field wiring + timing format.
