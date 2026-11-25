const ExcelJS = require('exceljs');

/**
 * Builds an Excel workbook buffer from a sheet name, headers, and rows
 * @param {Object} options
 * @param {string} options.sheetName
 * @param {Array<{ header: string, key: string, width?: number }>} options.columns
 * @param {Array<Object>} options.data
 * @returns {Promise<Buffer>}
 */
const exportToExcelBuffer = async ({ sheetName = 'Report', columns = [], data = [] }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Whitehouse CRM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Navy #0f172a
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Add data rows
  data.forEach((item, index) => {
    const row = worksheet.addRow(item);
    row.height = 20;
    const isEven = index % 2 === 0;
    row.eachCell((cell) => {
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Parses an Excel buffer for bulk leads import
 * @param {Buffer} buffer
 * @returns {Promise<Array<Object>>}
 */
const parseLeadsExcelBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheets found in uploaded file');

  const headers = [];
  const leads = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = (cell.value || '').toString().trim().toLowerCase();
      });
    } else {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value ? cell.value.toString().trim() : '';
        }
      });

      // Normalize common column names
      const name = rowData['customer name'] || rowData['name'] || rowData['student name'] || '';
      const mobile = rowData['mobile'] || rowData['mobile number'] || rowData['phone'] || rowData['contact'] || '';
      const email = rowData['email'] || rowData['email id'] || '';
      const course = rowData['course'] || rowData['interested course'] || rowData['program'] || 'VFX & Animation';
      const source = rowData['source'] || rowData['lead source'] || 'Manual entry';
      const remarks = rowData['remarks'] || rowData['note'] || rowData['comments'] || '';

      if (name && mobile) {
        leads.push({
          customerName: name,
          mobileNumber: mobile.replace(/\D/g, '').slice(-10),
          whatsappNumber: (rowData['whatsapp'] || mobile).replace(/\D/g, '').slice(-10),
          email,
          interestedCourse: course,
          leadSource: source,
          remarks,
        });
      }
    }
  });

  return leads;
};

module.exports = {
  exportToExcelBuffer,
  parseLeadsExcelBuffer,
};
