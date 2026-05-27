/**
 * Converts an array of objects to a CSV string.
 * Handles nested objects by flattening one level deep.
 */
export const toCSV = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return "";

  const flatten = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
      } else if (value instanceof Date) {
        result[fullKey] = value.toISOString();
      } else if (Array.isArray(value)) {
        result[fullKey] = JSON.stringify(value);
      } else {
        result[fullKey] = value === null || value === undefined ? "" : String(value);
      }
    }
    return result;
  };

  const flatRows = rows.map((r) => flatten(r));
  const headers = Array.from(new Set(flatRows.flatMap((r) => Object.keys(r))));

  const escape = (val: string): string => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines = [
    headers.map(escape).join(","),
    ...flatRows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];

  return lines.join("\n");
};

export const sendCSV = (
  res: import("express").Response,
  filename: string,
  data: Record<string, unknown>[]
): void => {
  const csv = toCSV(data);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};
