const crypto = require('crypto');

const generateLeadId = () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LEAD-${dateStr}-${random}`;
};

const generateStudentId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WH-${year}-${random}`;
};

const generateAdmissionNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${dateStr}-${random}`;
};

const generateReceiptNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${random}`;
};

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WH-CERT-${year}-${random}`;
};

const generateBatchId = (courseCode = 'GEN') => {
  const random = Math.floor(100 + Math.random() * 900);
  return `BATCH-${courseCode.toUpperCase()}-${random}`;
};

const generateVerificationCode = (text) => {
  return crypto.createHash('sha256').update(text + Date.now().toString()).digest('hex').substring(0, 16).toUpperCase();
};

module.exports = {
  generateLeadId,
  generateStudentId,
  generateAdmissionNumber,
  generateReceiptNumber,
  generateCertificateId,
  generateBatchId,
  generateVerificationCode,
};
