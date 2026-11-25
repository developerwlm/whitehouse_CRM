const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const leadAssignmentRoutes = require('./routes/leadAssignmentRoutes');
const counsellingRoutes = require('./routes/counsellingRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const progressRoutes = require('./routes/progressRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const examinationRoutes = require('./routes/examinationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const feeRoutes = require('./routes/feeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const placementRoutes = require('./routes/placementRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const metaRoutes = require('./routes/metaRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    institute: 'Whitehouse Skill Development Institute, Madurai',
    app: 'Whitehouse CRM MERN Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Direct Public Website Enquiry integration (matches https://whitehouse.org.in/contact)
const { publicWebsiteEnquiry } = require('./controllers/leadController');
app.post('/api/enquiries', publicWebsiteEnquiry);
app.post('/api/enquiry', publicWebsiteEnquiry);

// REST API Groups (All 26 sections from master architecture)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/lead-assignments', leadAssignmentRoutes);
app.use('/api/counselling', counsellingRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Serve Frontend Client (Direct port 5000 support so http://localhost:5000 renders the CRM)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.redirect(`http://localhost:5173${req.url}`);
  });
}

// Error handling middleware
app.use(errorHandler);

module.exports = app;
