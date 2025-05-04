import { onMounted, reactive, toRef } from "vue";

export function useExampleData<T extends Record<string, any>>() {
  const data = reactive<{ value: null | T[] }>({
    value: null,
  });

  onMounted(() => {
    fetch("http://localhost:5173/example_data.csv")
      .then((r) => r.text())
      .then((r) => (data.value = csvToArray<T>(r)));
  });

  return toRef(() => data.value);
}

export function dataGroup<T extends Record<string, any>, K extends keyof T>(
  input: T[],
  key: K,
) {
  return input.reduce(
    (acc, curr) => {
      const item = { ...curr };
      const groupedValue = item[key];
      delete item[key];

      acc[groupedValue] ??= [];
      acc[groupedValue].push(item);

      return acc;
    },
    {} as Record<T[K], T[]>,
  );
}

function csvToArray<T extends Record<string, any>>(input: string) {
  const lines = input.trim().split("\n");
  const headerLine = lines.shift()!;
  const headers = headerLine.split(",");

  return lines.map((line) => {
    const values = line.split(",");

    if (values.length !== headers.length) {
      throw Error("values.length !== headers.length");
    }

    return headers.reduce(
      (acc, header, idx) => {
        const value = values[idx];
        acc[header] = value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }) as T[];
}

// TODO: TASK → implement exporting to XML ---Done
export function toXml(input: Record<string, any>[]): string {
  const escapeXml = (unsafe: string) =>
    unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });

  const convertObjectToXml = (obj: Record<string, any>, index: number): string => {
    const fields = Object.entries(obj)
      .map(([key, value]) => {
        const escapedValue = escapeXml(String(value));
        return `  <${key}>${escapedValue}</${key}>`;
      })
      .join("\n");

    return `<item index="${index}">\n${fields}\n</item>`;
  };

  const xmlItems = input.map((item, index) => convertObjectToXml(item, index)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<items>\n${xmlItems}\n</items>`;
}
