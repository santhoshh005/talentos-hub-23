export function display(value: string | undefined | null): string {
  const v = (value ?? "").toString().trim();
  return v.length > 0 ? v : "NA";
}

export function displayList(values: string[] | undefined | null): string[] {
  const arr = (values ?? []).map((v) => v.trim()).filter(Boolean);
  return arr.length > 0 ? arr : ["NA"];
}