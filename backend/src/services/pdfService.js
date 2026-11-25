const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generates an official payment receipt PDF
 * @returns {Promise<Buffer>}
 */
const generateReceiptPDFBuffer = async ({ payment, student, studentFee }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const navy = '#0f172a';
      const blue = '#1e40af';
      const gray = '#64748b';
      const border = '#cbd5e1';

      // Header Banner
      doc.rect(40, 40, 515, 75).fill(navy);
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('WHITEHOUSE SKILL DEVELOPMENT INSTITUTE', 50, 55, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Pasumalai,Madurai-625004, Tamil Nadu | Ph: +91 98765 43210', 50, 80, { align: 'center' });
      doc.fontSize(12).font('Helvetica-Bold').text('OFFICIAL FEE PAYMENT RECEIPT', 50, 96, { align: 'center' });

      // Receipt Meta
      doc.fillColor(navy).fontSize(10).font('Helvetica');
      doc.text(`Receipt No: ${payment.receiptNumber}`, 45, 135);
      doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`, 370, 135);
      doc.text(`Payment Mode: ${payment.paymentMode}`, 45, 155);
      doc.text(`Transaction Ref: ${payment.transactionReference || 'N/A'}`, 370, 155);

      // Divider
      doc.strokeColor(border).lineWidth(1).moveTo(40, 175).lineTo(555, 175).stroke();

      // Student Information Box
      doc.rect(40, 185, 515, 60).fill('#f8fafc');
      doc.fillColor(blue).fontSize(11).font('Helvetica-Bold').text('STUDENT PARTICULARS', 50, 195);
      doc.fillColor(navy).fontSize(10).font('Helvetica');
      doc.text(`Student Name: ${student.name}`, 50, 212);
      doc.text(`Student ID: ${student.studentId}`, 300, 212);
      doc.text(`Course: ${student.courseName || (studentFee.courseId && studentFee.courseId.name) || 'Certified Program'}`, 50, 228);
      doc.text(`Mobile: ${student.mobile}`, 300, 228);

      // Payment Details Table
      doc.strokeColor(border).lineWidth(1).moveTo(40, 260).lineTo(555, 260).stroke();

      // Table Header
      doc.rect(40, 270, 515, 25).fill('#e2e8f0');
      doc.fillColor(navy).fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, 278);
      doc.text('Amount (INR)', 450, 278, { align: 'right' });

      // Table Row
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
      doc.text(`Course Tuition Fee Installment / Payment (${payment.paymentMode})`, 50, 310);
      doc.font('Helvetica-Bold').fillColor(navy).text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, 450, 310, { align: 'right' });

      doc.strokeColor(border).lineWidth(1).moveTo(40, 335).lineTo(555, 335).stroke();

      // Fee Summary Box
      const summaryY = 355;
      doc.rect(300, summaryY, 255, 110).fill('#f1f5f9');
      doc.fillColor(navy).font('Helvetica').fontSize(9);
      doc.text('Total Course Fee:', 310, summaryY + 12);
      doc.text(`Rs. ${studentFee.totalCourseFee.toLocaleString('en-IN')}`, 450, summaryY + 12, { align: 'right' });

      doc.text('Discount / Concession:', 310, summaryY + 28);
      doc.text(`Rs. ${(studentFee.discount || 0).toLocaleString('en-IN')}`, 450, summaryY + 28, { align: 'right' });

      doc.font('Helvetica-Bold');
      doc.text('Final Payable Fee:', 310, summaryY + 44);
      doc.text(`Rs. ${studentFee.finalFee.toLocaleString('en-IN')}`, 450, summaryY + 44, { align: 'right' });

      doc.font('Helvetica');
      doc.text('Total Amount Paid:', 310, summaryY + 62);
      doc.text(`Rs. ${studentFee.totalPaid.toLocaleString('en-IN')}`, 450, summaryY + 62, { align: 'right' });

      doc.font('Helvetica-Bold').fillColor(blue);
      doc.text('Outstanding Balance:', 310, summaryY + 82);
      doc.text(`Rs. ${studentFee.outstandingBalance.toLocaleString('en-IN')}`, 450, summaryY + 82, { align: 'right' });

      // Remarks
      doc.font('Helvetica').fontSize(9).fillColor(gray);
      doc.text(`Remarks / Notes: ${payment.remarks || 'Payment received with thanks.'}`, 45, summaryY + 20, { width: 240 });
      doc.text(`Received By: ${payment.receivedByName || 'Accounts Department'}`, 45, summaryY + 60);

      // Signatures
      doc.strokeColor(border).lineWidth(1).moveTo(40, 520).lineTo(555, 520).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(gray);
      doc.text('Student / Payee Signature', 80, 560);
      doc.text('Authorized Signatory & Seal', 400, 560);
      doc.text('Whitehouse Skill Development Institute', 380, 575);

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('This is an electronically generated official institute receipt. Queries: accounts@whitehouseinstitute.in', 40, 750, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates an official Certificate of Completion PDF with QR Code verification
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDFBuffer = async ({ certificate, student, baseUrl = 'http://localhost:5173' }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Landscape A4: 841.89 x 595.28
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const verifyUrl = `${baseUrl}/verify-certificate/${certificate.certificateId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      // Outer Decorative Border
      doc.rect(20, 20, 802, 555).lineWidth(4).strokeColor('#0f172a').stroke();
      doc.rect(26, 26, 790, 543).lineWidth(1.5).strokeColor('#0284c7').stroke();

      // Institute Crest / Heading
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(26).text('WHITEHOUSE SKILL DEVELOPMENT INSTITUTE', 40, 65, { align: 'center' });
      doc.fillColor('#0284c7').fontSize(12).font('Helvetica').text('MADURAI, TAMIL NADU - ISO 9001:2015 CERTIFIED INSTITUTION', 40, 98, { align: 'center' });

      // Title
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(200, 125).lineTo(642, 125).stroke();
      doc.fillColor('#1e3a8a').fontSize(22).font('Helvetica-Bold').text('CERTIFICATE OF COMPLETION', 40, 140, { align: 'center' });
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(200, 170).lineTo(642, 170).stroke();

      // Body text
      doc.fillColor('#475569').fontSize(13).font('Helvetica').text('This is proudly presented to', 40, 195, { align: 'center' });

      // Student Name
      doc.fillColor('#0f172a').fontSize(28).font('Helvetica-Bold').text(student.name.toUpperCase(), 40, 225, { align: 'center' });

      // Student ID & details
      doc.fillColor('#64748b').fontSize(11).font('Helvetica').text(`Student Registration ID: ${student.studentId}`, 40, 265, { align: 'center' });

      // Description
      doc.fillColor('#334155').fontSize(13).font('Helvetica').text(
        `for successfully completing the comprehensive professional training program in`,
        60,
        290,
        { align: 'center', width: 722 }
      );

      // Course Name
      doc.fillColor('#0369a1').fontSize(20).font('Helvetica-Bold').text(
        certificate.courseName.toUpperCase(),
        40,
        320,
        { align: 'center' }
      );

      // Completion details & Grade
      const completionDateStr = new Date(certificate.completionDate).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
        day: 'numeric',
      });
      doc.fillColor('#475569').fontSize(11).font('Helvetica').text(
        `Awarded with Grade: ${certificate.grade || 'First Class'} | Completed on: ${completionDateStr}`,
        40,
        355,
        { align: 'center' }
      );

      // QR Code Box
      doc.image(qrBuffer, 380, 385, { width: 80 });
      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Scan to Verify Credential', 340, 470, { align: 'center', width: 160 });
      doc.text(`ID: ${certificate.certificateId}`, 340, 482, { align: 'center', width: 160 });

      // Signatures
      // Left: Lead Trainer
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(70, 475).lineTo(230, 475).stroke();
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Lead Course Trainer', 70, 485, { align: 'center', width: 160 });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Whitehouse Institute', 70, 500, { align: 'center', width: 160 });

      // Right: Managing Director
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(610, 475).lineTo(770, 475).stroke();
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Managing Director', 610, 485, { align: 'center', width: 160 });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Whitehouse Skill Development', 610, 500, { align: 'center', width: 160 });

      // Bottom Security Footer
      doc.fontSize(8).fillColor('#94a3b8').text('This credential is registered in the Whitehouse Institute Academic Verification Registry. Tampering invalidates this document.', 40, 545, { align: 'center', width: 762 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateReceiptPDFBuffer,
  generateCertificatePDFBuffer,
};
