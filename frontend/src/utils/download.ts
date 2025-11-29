import { utils, writeFile, type WorkSheet } from 'xlsx';

export const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
};

interface ExcelSheet {
  name: string;
  rows: Array<Record<string, unknown>>;
  header?: string[];
}

export const downloadExcel = (sheets: ExcelSheet[], filename: string) => {
  const workbook = utils.book_new();

  sheets.forEach(({ name, rows, header }) => {
    const worksheet: WorkSheet = utils.json_to_sheet(rows, header ? { header } : undefined);
    utils.book_append_sheet(workbook, worksheet, name);
  });

  const normalizedName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  writeFile(workbook, normalizedName);
};
