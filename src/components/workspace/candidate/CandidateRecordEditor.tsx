import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CandidateRecord, EmploymentEntry, EducationEntry } from "@/lib/candidate-schemas";

type Updater = <K extends keyof CandidateRecord>(key: K, value: CandidateRecord[K]) => void;

export function CandidateRecordEditor({
  record,
  update,
}: {
  record: CandidateRecord;
  update: Updater;
}) {
  return (
    <div className="space-y-4">
      <Section title="Identity">
        <TwoCol>
          <TextField
            label="Candidate name"
            value={record.fullName}
            onChange={(v) => update("fullName", v)}
          />
          <TextField
            label="Headline"
            value={record.headline}
            onChange={(v) => update("headline", v)}
          />
        </TwoCol>
        <TextareaField
          label="Professional summary"
          value={record.summary}
          onChange={(v) => update("summary", v)}
          rows={3}
        />
      </Section>

      <Section title="Contact">
        <TwoCol>
          <TextField label="Email" value={record.email} onChange={(v) => update("email", v)} />
          <TextField label="Mobile" value={record.mobile} onChange={(v) => update("mobile", v)} />
        </TwoCol>
        <TwoCol>
          <TextField
            label="LinkedIn"
            value={record.linkedin}
            onChange={(v) => update("linkedin", v)}
          />
          <TextField label="GitHub" value={record.github} onChange={(v) => update("github", v)} />
        </TwoCol>
        <TextField
          label="Portfolio"
          value={record.portfolio}
          onChange={(v) => update("portfolio", v)}
        />
      </Section>

      <Section title="Current employment">
        <TwoCol>
          <TextField
            label="Current company"
            value={record.currentCompany}
            onChange={(v) => update("currentCompany", v)}
          />
          <TextField
            label="Current designation"
            value={record.currentDesignation}
            onChange={(v) => update("currentDesignation", v)}
          />
        </TwoCol>
        <TextField
          label="Employment type"
          value={record.employmentType}
          onChange={(v) => update("employmentType", v)}
        />
      </Section>

      <Section title="Previous employment">
        <EmploymentList
          items={record.previousEmployment}
          onChange={(next) => update("previousEmployment", next)}
        />
      </Section>

      <Section title="Experience">
        <TwoCol>
          <TextField
            label="Total experience"
            value={record.totalExperience}
            onChange={(v) => update("totalExperience", v)}
          />
          <TextField
            label="Relevant experience"
            value={record.relevantExperience}
            onChange={(v) => update("relevantExperience", v)}
          />
        </TwoCol>
      </Section>

      <Section title="Skills">
        <ChipList
          label="Primary skills"
          items={record.primarySkills}
          onChange={(next) => update("primarySkills", next)}
          placeholder="Add a primary skill"
        />
        <ChipList
          label="Secondary skills"
          items={record.secondarySkills}
          onChange={(next) => update("secondarySkills", next)}
          placeholder="Add a secondary skill"
        />
      </Section>

      <Section title="Location">
        <TwoCol>
          <TextField
            label="Current location"
            value={record.currentLocation}
            onChange={(v) => update("currentLocation", v)}
          />
          <TextField
            label="Preferred location"
            value={record.preferredLocation}
            onChange={(v) => update("preferredLocation", v)}
          />
        </TwoCol>
      </Section>

      <Section title="Compensation">
        <TwoCol>
          <TextField
            label="Current CTC"
            value={record.currentCTC}
            onChange={(v) => update("currentCTC", v)}
          />
          <TextField
            label="Expected CTC"
            value={record.expectedCTC}
            onChange={(v) => update("expectedCTC", v)}
          />
        </TwoCol>
        <TwoCol>
          <TextField
            label="Notice period"
            value={record.noticePeriod}
            onChange={(v) => update("noticePeriod", v)}
          />
          <TextField
            label="Current offer"
            value={record.currentOffer}
            onChange={(v) => update("currentOffer", v)}
          />
        </TwoCol>
        <TextareaField
          label="Reason for change"
          value={record.reasonForChange}
          onChange={(v) => update("reasonForChange", v)}
          rows={2}
        />
      </Section>

      <Section title="Education">
        <EducationList items={record.education} onChange={(next) => update("education", next)} />
      </Section>

      <Section title="Certifications">
        <ChipList
          label="Certifications"
          items={record.certifications}
          onChange={(next) => update("certifications", next)}
          placeholder="Add a certification"
          hideLabel
        />
      </Section>

      <Section title="Documents">
        <TwoCol>
          <TextField label="PAN" value={record.pan} onChange={(v) => update("pan", v)} />
          <TextField
            label="Passport"
            value={record.passport}
            onChange={(v) => update("passport", v)}
          />
        </TwoCol>
        <TextField
          label="Visa status"
          value={record.visaStatus}
          onChange={(v) => update("visaStatus", v)}
        />
      </Section>

      <Section title="Recruiter notes">
        <TextareaField
          label="Notes for the client submission"
          value={record.recruiterNotes}
          onChange={(v) => update("recruiterNotes", v)}
          rows={4}
          placeholder="e.g. Strong on Spring Boot, open for relocation, needs salary negotiation…"
        />
      </Section>
    </div>
  );
}

// ---------------- primitives ----------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  // Sync from props if parent changes it
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={localValue}
        placeholder={placeholder}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(localValue)}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <textarea
        rows={rows}
        value={localValue}
        placeholder={placeholder}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(localValue)}
        className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}

function ChipList({
  label,
  items,
  onChange,
  placeholder,
  hideLabel,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      {!hideLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span
            key={`${it}-${i}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs"
          >
            {it}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-muted-foreground opacity-60 transition hover:opacity-100"
              aria-label={`Remove ${it}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <Button
          type="button"
          onClick={add}
          variant="outline"
          className="rounded-lg border-white/10 bg-white/[0.03]"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function EmploymentList({
  items,
  onChange,
}: {
  items: EmploymentEntry[];
  onChange: (v: EmploymentEntry[]) => void;
}) {
  const patch = (i: number, p: Partial<EmploymentEntry>) => {
    const next = items.map((e, idx) => (idx === i ? { ...e, ...p } : e));
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((e, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => move(i, -1)}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.04]"
              aria-label="Move up"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Role {i + 1}
            </span>
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                onClick={() =>
                  onChange([...items.slice(0, i + 1), { ...e }, ...items.slice(i + 1)])
                }
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.04]"
                aria-label="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <TextField
              label="Company"
              value={e.company}
              onChange={(v) => patch(i, { company: v })}
            />
            <TextField label="Title" value={e.title} onChange={(v) => patch(i, { title: v })} />
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <TextField
              label="Start"
              value={e.start}
              onChange={(v) => patch(i, { start: v })}
              placeholder="Jan 2020"
            />
            <TextField
              label="End"
              value={e.end}
              onChange={(v) => patch(i, { end: v })}
              placeholder="Dec 2022 or Present"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([...items, { company: "", title: "", start: "", end: "", isCurrent: false }])
        }
        className="w-full rounded-lg border-dashed border-white/10 bg-white/[0.02]"
      >
        <Plus className="h-4 w-4" /> Add previous role
      </Button>
    </div>
  );
}

function EducationList({
  items,
  onChange,
}: {
  items: EducationEntry[];
  onChange: (v: EducationEntry[]) => void;
}) {
  const patch = (i: number, p: Partial<EducationEntry>) => {
    onChange(items.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
  };
  return (
    <div className="space-y-2">
      {items.map((e, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Education {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <TextField label="Degree" value={e.degree} onChange={(v) => patch(i, { degree: v })} />
            <TextField
              label="Institution"
              value={e.institution}
              onChange={(v) => patch(i, { institution: v })}
            />
            <TextField label="Year" value={e.year} onChange={(v) => patch(i, { year: v })} />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, { degree: "", institution: "", year: "" }])}
        className="w-full rounded-lg border-dashed border-white/10 bg-white/[0.02]"
      >
        <Plus className="h-4 w-4" /> Add education
      </Button>
    </div>
  );
}
