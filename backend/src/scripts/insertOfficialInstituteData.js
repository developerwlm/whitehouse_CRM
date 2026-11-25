const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User, Trainer, Course, Batch, SyllabusWeek } = require('../models');

// 1. OFFICIAL TRAINERS LIST FROM SHEET
const TRAINERS_LIST = [
  {
    name: 'Murugan',
    email: 'murugan@whitehouse.org.in',
    phone: '9876543101',
    specializations: ['Graphic Designing'],
    qualification: 'Senior Graphic & Brand Designer',
    experienceYears: 6,
    bio: 'Specialist in branding, typography, Adobe Creative Suite, and print/digital design.',
  },
  {
    name: 'Naveen',
    email: 'naveen@whitehouse.org.in',
    phone: '9876543102',
    specializations: ['Video Editing', 'VFX & Animation'],
    qualification: 'Lead Video Editor & Compositor',
    experienceYears: 7,
    bio: 'Professional film & commercial video editor, DaVinci Resolve colorist, and VFX supervisor.',
  },
  {
    name: 'Vignesh',
    email: 'vignesh@whitehouse.org.in',
    phone: '9876543103',
    specializations: ['Video Editing'],
    qualification: 'Post-Production Specialist',
    experienceYears: 4,
    bio: 'Expert in narrative pacing, multi-cam editing, Premiere Pro, and fast-paced commercial reels.',
  },
  {
    name: 'Shyamnesh',
    email: 'shyamnesh@whitehouse.org.in',
    phone: '9876543104',
    specializations: ['Full Stack Development', 'AI Video Editing'],
    qualification: 'Senior Full Stack Architect & AI Workflow Lead',
    experienceYears: 8,
    bio: 'Full stack engineer (MERN, Cloud) and cutting-edge generative AI video pipeline instructor.',
  },
  {
    name: 'Ramki',
    email: 'ramki@whitehouse.org.in',
    phone: '9876543105',
    specializations: ['VFX & Animation', 'Drone Cinematics'],
    qualification: 'DGCA Certified Drone Cinematographer & 3D Artist',
    experienceYears: 6,
    bio: 'Specialist in cinematic aerial photography, drone tracking, CGI integration, and 3D animation.',
  },
  {
    name: 'Tamil',
    email: 'tamil@whitehouse.org.in',
    phone: '9876543106',
    specializations: ['Digital Marketing', 'Performance Marketing'],
    qualification: 'Growth & Digital Strategist',
    experienceYears: 5,
    bio: 'Hands-on performance marketer specializing in Meta Ads, Google SEM, and conversion optimization.',
  },
  {
    name: 'CMO / Head Trainer',
    email: 'cmo@whitehouse.org.in',
    phone: '9876543107',
    specializations: ['Digital Marketing', 'Performance Marketing'],
    qualification: 'Chief Marketing Officer',
    experienceYears: 10,
    bio: 'Executive marketing strategist heading institute growth campaigns, brand partnerships, and ad operations.',
  },
];

// 2. OFFICIAL COURSES & BATCHES FROM SHEET
const COURSES_DATA = [
  {
    name: 'Digital Marketing',
    courseCode: 'DM-301',
    durationMonths: 3,
    durationWeeks: 12,
    totalHours: 120,
    fee: 30000,
    description: 'Master complete digital marketing: SEO, Social Media Marketing, Meta Ads, Google Ads, Email Marketing, Content Strategy, and Analytics.',
    trainerNames: ['CMO / Head Trainer', 'Tamil', 'ARUN'],
    batches: [
      {
        batchId: 'BATCH-DM-M01',
        name: 'Digital Marketing - Morning Batch',
        classTimings: { startTime: '10:00 AM', endTime: '12:00 PM' },
        leadTrainer: 'Tamil',
      },
      {
        batchId: 'BATCH-DM-E01',
        name: 'Digital Marketing - Evening Batch',
        classTimings: { startTime: '06:30 PM', endTime: '08:30 PM' },
        leadTrainer: 'CMO / Head Trainer',
      },
    ],
  },
  {
    name: 'Performance Marketing',
    courseCode: 'PM-201',
    durationMonths: 2,
    durationWeeks: 8,
    totalHours: 80,
    fee: 25000,
    description: 'High-performance paid advertising: Meta Ads Manager, Google Performance Max, ROAS scaling, audience funneling, and conversion API tracking.',
    trainerNames: ['CMO / Head Trainer', 'Tamil', 'ARUN'],
    batches: [
      {
        batchId: 'BATCH-PM-E01',
        name: 'Performance Marketing - Evening Batch',
        classTimings: { startTime: '06:00 PM', endTime: '08:00 PM' },
        leadTrainer: 'Tamil',
      },
    ],
  },
  {
    name: 'Graphic Designing',
    courseCode: 'GD-201',
    durationMonths: 2,
    durationWeeks: 8,
    totalHours: 80,
    fee: 25000,
    description: 'Professional visual design: Adobe Photoshop, Illustrator, InDesign, visual hierarchy, logo branding, social media creatives, and print prep.',
    trainerNames: ['Murugan'],
    batches: [
      {
        batchId: 'BATCH-GD-E01',
        name: 'Graphic Designing - Evening Batch',
        classTimings: { startTime: '05:00 PM', endTime: '08:00 PM' },
        leadTrainer: 'Murugan',
      },
    ],
  },
  {
    name: 'Video Editing',
    courseCode: 'VE-201',
    durationMonths: 2,
    durationWeeks: 8,
    totalHours: 80,
    fee: 25000,
    description: 'Cinematic video editing and post-production: Premiere Pro, DaVinci Resolve color grading, audio post-production, fast-paced reels, and short films.',
    trainerNames: ['Naveen', 'Vignesh'],
    batches: [
      {
        batchId: 'BATCH-VE-E01',
        name: 'Video Editing - Evening Batch',
        classTimings: { startTime: '06:00 PM', endTime: '08:00 PM' },
        leadTrainer: 'Naveen',
      },
    ],
  },
  {
    name: 'Full Stack Development',
    courseCode: 'FSD-301',
    durationMonths: 3,
    durationWeeks: 12,
    totalHours: 120,
    fee: 35000,
    description: 'Complete modern full-stack web engineering: HTML5, Tailwind CSS, JavaScript ES6+, React.js, Node.js, Express, MongoDB, RESTful APIs, and cloud hosting.',
    trainerNames: ['Shyamnesh'],
    batches: [
      {
        batchId: 'BATCH-FSD-M01',
        name: 'Full Stack Development - Morning Batch',
        classTimings: { startTime: '10:00 AM', endTime: '12:00 PM' },
        leadTrainer: 'Shyamnesh',
      },
      {
        batchId: 'BATCH-FSD-E01',
        name: 'Full Stack Development - Evening Batch',
        classTimings: { startTime: '06:30 PM', endTime: '08:30 PM' },
        leadTrainer: 'Shyamnesh',
      },
    ],
  },
  {
    name: 'AI Video Editing',
    courseCode: 'AIVE-201',
    durationMonths: 2,
    durationWeeks: 8,
    totalHours: 80,
    fee: 28000,
    description: 'Future of video creation using AI: Runway Gen-3, Midjourney image-to-video, ElevenLabs voice cloning, Sora, auto-captions, and AI VFX integration.',
    trainerNames: ['Shyamnesh'],
    batches: [
      {
        batchId: 'BATCH-AIVE-E01',
        name: 'AI Video Editing - Evening Batch',
        classTimings: { startTime: '06:00 PM', endTime: '08:00 PM' },
        leadTrainer: 'Shyamnesh',
      },
    ],
  },
  {
    name: 'VFX & Animation',
    courseCode: 'VFX-301',
    durationMonths: 3,
    durationWeeks: 12,
    totalHours: 120,
    fee: 35000,
    description: 'Visual effects & 3D animation: Adobe After Effects, Blender, 3D modeling, lighting, green screen rotoscopy, motion graphics, and CGI composition.',
    trainerNames: ['Naveen', 'Ramki'],
    batches: [
      {
        batchId: 'BATCH-VFX-M01',
        name: 'VFX & Animation - Morning Batch',
        classTimings: { startTime: '10:00 AM', endTime: '12:00 PM' },
        leadTrainer: 'Naveen',
      },
      {
        batchId: 'BATCH-VFX-E01',
        name: 'VFX & Animation - Evening Batch',
        classTimings: { startTime: '06:30 PM', endTime: '08:30 PM' },
        leadTrainer: 'Ramki',
      },
    ],
  },
  {
    name: 'Drone Cinematics',
    courseCode: 'DC-101',
    durationMonths: 1,
    durationWeeks: 4,
    totalHours: 40,
    fee: 18000,
    description: 'Aerial drone cinematography: flight maneuvers, camera angles, DGCA safety guidelines, dynamic aerial tracking, and cinematic 4K grading.',
    trainerNames: ['Ramki'],
    batches: [
      {
        batchId: 'BATCH-DC-E01',
        name: 'Drone Cinematics - Evening Batch',
        classTimings: { startTime: '06:00 PM', endTime: '08:00 PM' },
        leadTrainer: 'Ramki',
      },
    ],
  },
];

const insertOfficialData = async () => {
  try {
    await connectDB();
    console.log('\n============================================================');
    console.log(' WHITEHOUSE INSTITUTE - OFFICIAL COURSES & TRAINERS SYNC');
    console.log('============================================================\n');

    // 1. Process Trainers
    const trainerUserMap = {};

    // Also look up existing users in DB (like Arun, Mathesh, etc.)
    const existingUsers = await User.find();
    existingUsers.forEach((u) => {
      trainerUserMap[u.name.toLowerCase()] = u;
      trainerUserMap[u.email.toLowerCase()] = u;
    });

    for (const t of TRAINERS_LIST) {
      let user = await User.findOne({ email: t.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: t.name,
          email: t.email.toLowerCase(),
          password: 'Trainer@123',
          role: 'trainer',
          phone: t.phone,
          assignedCourses: t.specializations,
          isActive: true,
        });
        console.log(`[+] Created Faculty Trainer: ${t.name} (${t.email})`);
      } else {
        user.name = t.name;
        user.phone = t.phone;
        user.assignedCourses = t.specializations;
        user.isActive = true;
        await user.save();
        console.log(`[*] Updated Faculty Trainer: ${t.name} (${t.email})`);
      }

      trainerUserMap[t.name.toLowerCase()] = user;
      trainerUserMap[t.email.toLowerCase()] = user;

      // Update or create Trainer profile
      await Trainer.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          specializations: t.specializations,
          experienceYears: t.experienceYears,
          qualification: t.qualification,
          bio: t.bio,
          rating: 4.9,
          status: 'Active',
        },
        { upsert: true, new: true }
      );
    }

    // 2. Process Courses & Batches
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    for (const c of COURSES_DATA) {
      // Find matching trainers
      const assignedTrainerIds = [];
      for (const tName of c.trainerNames) {
        const found = trainerUserMap[tName.toLowerCase()];
        if (found) {
          assignedTrainerIds.push(found._id);
        }
      }

      // Upsert Course
      let course = await Course.findOne({
        $or: [{ courseCode: c.courseCode }, { name: c.name }],
      });

      if (!course) {
        course = await Course.create({
          courseCode: c.courseCode,
          name: c.name,
          durationMonths: c.durationMonths,
          durationWeeks: c.durationWeeks,
          totalHours: c.totalHours,
          fee: c.fee,
          description: c.description,
          assignedTrainers: assignedTrainerIds,
          isActive: true,
        });
        console.log(`[+] Created Course: ${c.name} (${c.courseCode}) - ${c.durationMonths} Months`);
      } else {
        course.courseCode = c.courseCode;
        course.name = c.name;
        course.durationMonths = c.durationMonths;
        course.durationWeeks = c.durationWeeks;
        course.totalHours = c.totalHours;
        course.fee = c.fee;
        course.description = c.description;
        course.assignedTrainers = assignedTrainerIds;
        course.isActive = true;
        await course.save();
        console.log(`[*] Updated Course: ${c.name} (${c.courseCode}) - ${c.durationMonths} Months`);
      }

      // Generate syllabus weeks if not present
      const existingWeeks = await SyllabusWeek.countDocuments({ courseId: course._id });
      if (existingWeeks < c.durationWeeks) {
        for (let w = existingWeeks + 1; w <= c.durationWeeks; w++) {
          await SyllabusWeek.create({
            courseId: course._id,
            weekNumber: w,
            title: `Week ${w}: Module & Studio Practicum`,
            description: `Core practical skills and project deliverables for Week ${w}`,
            isPracticalProject: w === Math.floor(c.durationWeeks / 2) || w === c.durationWeeks - 1,
            isFinalAssessment: w === c.durationWeeks,
            order: w,
          });
        }
      }

      // Process Batches for this course
      const endDate = new Date(startDate.getTime() + c.durationWeeks * 7 * 86400000);

      for (const b of c.batches) {
        let trainerUser = trainerUserMap[b.leadTrainer.toLowerCase()] || assignedTrainerIds[0];
        if (!trainerUser && assignedTrainerIds.length > 0) {
          trainerUser = { _id: assignedTrainerIds[0] };
        }

        const trainerId = trainerUser?._id || trainerUser;

        let batch = await Batch.findOne({ batchId: b.batchId });
        if (!batch) {
          batch = await Batch.create({
            batchId: b.batchId,
            name: b.name,
            courseId: course._id,
            trainerId,
            startDate,
            endDate,
            classTimings: b.classTimings,
            trainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            studentCapacity: 25,
            currentEnrollment: 0,
            status: 'Ongoing',
          });
          console.log(`    [+] Scheduled Batch: ${b.name} (${b.classTimings.startTime} - ${b.classTimings.endTime})`);
        } else {
          batch.name = b.name;
          batch.courseId = course._id;
          if (trainerId) batch.trainerId = trainerId;
          batch.classTimings = b.classTimings;
          batch.startDate = startDate;
          batch.endDate = endDate;
          batch.status = 'Ongoing';
          await batch.save();
          console.log(`    [*] Updated Batch: ${b.name} (${b.classTimings.startTime} - ${b.classTimings.endTime})`);
        }
      }
    }

    console.log('\n============================================================');
    console.log(' ALL 8 COURSES, 7 TRAINERS, AND 11 BATCHES INSERTED IN DB!');
    console.log('============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n[Error inserting official data]:', err);
    process.exit(1);
  }
};

insertOfficialData();
