import * as XLSX from 'xlsx';

/**
 * Extract sheet names from an uploaded spreadsheet file
 */
export async function extractSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(new Error('Failed to parse spreadsheet'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract headers and sample rows from a specific sheet
 */
export async function extractSheetData(
  file: File,
  sheetName: string,
  maxRows: number = 10
): Promise<{
  headers: string[];
  sampleRows: Record<string, string>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.includes(sheetName)) {
          reject(new Error(`Sheet "${sheetName}" not found`));
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          resolve({ headers: [], sampleRows: [] });
          return;
        }

        const headers = Object.keys(jsonData[0] as Record<string, unknown>);
        const sampleRows = jsonData.slice(0, maxRows).map((row) => {
          const record: Record<string, string> = {};
          headers.forEach((header) => {
            record[header] = String((row as Record<string, unknown>)[header] || '');
          });
          return record;
        });

        resolve({ headers, sampleRows });
      } catch (error) {
        reject(new Error('Failed to parse spreadsheet data'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File, maxRows: number = 10): Promise<{
  headers: string[];
  sampleRows: Record<string, string>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          resolve({ headers: [], sampleRows: [] });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const sampleRows = lines.slice(1, maxRows + 1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const record: Record<string, string> = {};
          headers.forEach((header, i) => {
            record[header] = values[i] || '';
          });
          return record;
        });

        resolve({ headers, sampleRows });
      } catch (error) {
        reject(new Error('Failed to parse CSV'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
