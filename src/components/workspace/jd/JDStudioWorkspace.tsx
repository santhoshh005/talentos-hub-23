import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Copy, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runJDStudioGeneration, runJDFromResumeGeneration } from "@/lib/jd-studio.functions";
import { extractResumeText } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function JDStudioWorkspace() {
  const [positionTitle, setPositionTitle] = useState("");
  const [customPosition, setCustomPosition] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [level, setLevel] = useState("Senior");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [requiredExperience, setRequiredExperience] = useState("5+ years");
  const [roleDescription, setRoleDescription] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [tone, setTone] = useState("Clear & professional");

  const [copied, setCopied] = useState(false);

  const [mode, setMode] = useState<"manual" | "resume">("manual");
  const [dragActive, setDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState("");
  const [uploadedResumeText, setUploadedResumeText] = useState("");
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const finalPositionTitle = customPosition.trim() || positionTitle;

  const [finalJD, setFinalJD] = useState("");

  const { mutate: mutateFromResume, isPending: isPendingFromResume } = useMutation({
    mutationFn: async () => {
      return runJDFromResumeGeneration({
        data: {
          resumeText: uploadedResumeText,
          tone,
        },
      });
    },
    onSuccess: (data) => {
      setFinalJD(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate job description.");
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return runJDStudioGeneration({
        data: {
          positionTitle: finalPositionTitle,
          department,
          level,
          location,
          employmentType,
          requiredExperience,
          roleDescription,
          mustHaveSkills,
          tone,
        },
      });
    },
    onSuccess: (data) => {
      setFinalJD(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate job description.");
    },
  });

  const processResumeFile = useCallback(async (nextFile: File) => {
    const lower = nextFile.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      toast.error("Upload a PDF or DOCX resume.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      toast.error("Resume file must be under 10 MB.");
      return;
    }
    setIsExtracting(true);
    setUploadedResumeName(nextFile.name);
    setUploadedResumeText("");
    try {
      const text = await extractResumeText(nextFile);
      setUploadedResumeText(text);
      toast.success("Resume ready for JD Generation");
    } catch (caught) {
      console.error("[JD Studio] resume extract failed:", caught);
      toast.error("Could not read that resume file.");
      setUploadedResumeName("");
      setUploadedResumeText("");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const onDropResume = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) void processResumeFile(dropped);
    },
    [processResumeFile],
  );

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalPositionTitle || !location || !roleDescription || !mustHaveSkills) return;
    mutate();
  };

  const handleCopy = () => {
    if (finalJD) {
      navigator.clipboard.writeText(finalJD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Pane - Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold">1. Position Details & Requirements</h3>
          <div className="flex rounded-lg bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "manual"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setMode("resume")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "resume"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              From Resume
            </button>
          </div>
        </div>

        {mode === "manual" ? (
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label
                htmlFor="position-title"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Select Position <span className="text-red-500">*</span>
              </label>
              <Select name="positionTitle" value={positionTitle} onValueChange={setPositionTitle}>
                <SelectTrigger id="position-title">
                  <SelectValue placeholder="Choose a position title..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="custom-position"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Or Enter Custom Position Title <span className="text-red-500">*</span>
              </label>
              <input
                id="custom-position"
                name="customPosition"
                type="text"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                placeholder="e.g. Staff Backend Engineer"
                className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="department"
                  className="mb-1 block text-sm font-medium text-muted-foreground"
                >
                  Department
                </label>
                <Select name="department" value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="level"
                  className="mb-1 block text-sm font-medium text-muted-foreground"
                >
                  Level
                </label>
                <Select name="level" value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Staff/Principal">Staff/Principal</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Location <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, USA"
                className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="employment-type"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Employment type
              </label>
              <Select
                name="employmentType"
                value={employmentType}
                onValueChange={setEmploymentType}
              >
                <SelectTrigger id="employment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="required-experience"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Required Experience <span className="text-red-500">*</span>
              </label>
              <Select
                name="requiredExperience"
                value={requiredExperience}
                onValueChange={setRequiredExperience}
              >
                <SelectTrigger id="required-experience">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1 years">0-1 years</SelectItem>
                  <SelectItem value="1-3 years">1-3 years</SelectItem>
                  <SelectItem value="3-5 years">3-5 years</SelectItem>
                  <SelectItem value="5+ years">5+ years</SelectItem>
                  <SelectItem value="8+ years">8+ years</SelectItem>
                  <SelectItem value="10+ years">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="role-description"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Role Description / Overview <span className="text-red-500">*</span>
              </label>
              <textarea
                id="role-description"
                name="roleDescription"
                required
                rows={3}
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Brief summary of project goals, team culture, or core expectations for this role..."
                className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="must-have-skills"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Must-have skills <span className="text-red-500">*</span>
              </label>
              <input
                id="must-have-skills"
                name="mustHaveSkills"
                type="text"
                required
                value={mustHaveSkills}
                onChange={(e) => setMustHaveSkills(e.target.value)}
                placeholder="Go, Node.js, Kafka, AWS"
                className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              {mustHaveSkills && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mustHaveSkills
                    .split(",")
                    .filter((s) => s.trim())
                    .map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {skill.trim()}{" "}
                        <span
                          className="ml-1 cursor-pointer hover:text-white"
                          onClick={() => {
                            const parts = mustHaveSkills.split(",").filter((s) => s.trim());
                            parts.splice(i, 1);
                            setMustHaveSkills(parts.join(", "));
                          }}
                        >
                          ×
                        </span>
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="tone"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Tone
              </label>
              <Select name="tone" value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear & professional">Clear & professional</SelectItem>
                  <SelectItem value="Warm & welcoming">Warm & welcoming</SelectItem>
                  <SelectItem value="Highly technical & precise">
                    Highly technical & precise
                  </SelectItem>
                  <SelectItem value="Startup & dynamic">Startup & dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={
                  isPending ||
                  !finalPositionTitle ||
                  !location ||
                  !roleDescription ||
                  !mustHaveSkills
                }
                className="w-full bg-gradient-to-r from-primary to-accent py-6 font-semibold text-white shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Description...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Generate Job Description
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDropResume}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                dragActive
                  ? "border-accent bg-accent/10"
                  : "border-white/10 bg-black/20 hover:border-accent/50",
              )}
            >
              {isExtracting ? (
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              ) : uploadedResumeName ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-sm text-muted-foreground">
                {uploadedResumeName ? (
                  <>
                    Loaded{" "}
                    <span className="font-semibold text-foreground">{uploadedResumeName}</span>
                  </>
                ) : (
                  "Drop a candidate's resume (PDF/DOCX) here"
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => resumeInputRef.current?.click()}
                className="mt-2 border-white/10 bg-white/5"
              >
                Choose File
              </Button>
              <input
                ref={resumeInputRef}
                id="resume-upload-jd"
                name="resumeUploadJd"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                aria-label="Upload resume"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  event.target.value = "";
                  if (selected) void processResumeFile(selected);
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Target Tone
              </label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear & professional">Clear & professional</SelectItem>
                  <SelectItem value="Warm & welcoming">Warm & welcoming</SelectItem>
                  <SelectItem value="Highly technical & precise">
                    Highly technical & precise
                  </SelectItem>
                  <SelectItem value="Startup & dynamic">Startup & dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                type="button"
                onClick={() => mutateFromResume()}
                disabled={isPendingFromResume || !uploadedResumeText}
                className="w-full bg-gradient-to-r from-primary to-accent py-6 font-semibold text-white shadow-lg shadow-primary/20"
              >
                {isPendingFromResume ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Resume &
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Auto-Generate from Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane - Output Preview */}
      <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold text-foreground">Preview</h3>
          {finalJD && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!finalJD}
              className="border-white/10 bg-white/5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Markdown"}
            </Button>
          )}
        </div>

        <div className="prose prose-invert prose-sm max-w-none flex-1 overflow-y-auto pr-4">
          {finalJD ? (
            <div className="prose prose-invert max-w-none text-sm text-muted-foreground prose-headings:text-foreground prose-a:text-accent">
              <ReactMarkdown>{finalJD}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Sparkles className="mb-4 h-12 w-12 opacity-20" />
              <p>Fill out the requirements and click Generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
