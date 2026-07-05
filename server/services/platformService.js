import Course from "../models/Course.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Announcement from "../models/Announcement.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Certificate from "../models/Certificate.js";

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatCurrency = (amount) => Number(amount || 0).toFixed(2);

const buildTableRow = (id, cells, status) => ({ id, cells, status });

const getMonthLabels = (months) => {
  const labels = [];
  const current = new Date();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(current.getFullYear(), current.getMonth() - offset, 1);
    labels.push(monthDate.toLocaleString("en-US", { month: "short" }));
  }

  return labels;
};

export const getPublicHomeOverview = async () => {
  const [publishedCourses, educators, purchases, announcements] = await Promise.all([
    Course.find({ isPublished: true })
      .populate("educator", "name imageUrl email")
      .lean(),
    User.find({ role: "educator" }).lean(),
    Purchase.find({ status: { $in: ["completed", "success", "paid"] } })
      .populate("course", "courseTitle educator category")
      .populate("user", "name imageUrl email")
      .lean(),
    Announcement.find({ isPublished: true })
      .sort({ publishAt: -1, createdAt: -1 })
      .lean(),
  ]);

  const totalStudents = await User.countDocuments({ role: "student" });
  const totalEducators = educators.length;
  const totalCourses = publishedCourses.length;
  const totalEnrollments = purchases.length;
  const totalRevenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);

  const courseRatingEntries = publishedCourses.flatMap((course) =>
    (course.courseRatings || [])
      .filter((rating) => rating.review && rating.review.trim())
      .map((rating) => ({ course, rating }))
  );

  const reviewerIds = [...new Set(courseRatingEntries.map((entry) => entry.rating.userId).filter(Boolean))];
  const reviewers = await User.find({ clerkUserId: { $in: reviewerIds } }).lean();
  const reviewerMap = new Map(reviewers.map((user) => [user.clerkUserId, user]));

  const testimonials = courseRatingEntries.slice(0, 8).map((entry, index) => {
    const reviewer = reviewerMap.get(entry.rating.userId);
    return {
      id: `${entry.course._id.toString()}-${index}`,
      name: reviewer?.name || reviewer?.email || "",
      role: reviewer?.role || "student",
      image: reviewer?.imageUrl || "",
      rating: Number(entry.rating.rating || 0),
      feedback: entry.rating.review || "",
    };
  }).filter((item) => item.name && item.feedback);

  const topEducatorMap = new Map();
  for (const course of publishedCourses) {
    const educatorId = course.educator?._id?.toString();
    if (!educatorId) continue;
    const current = topEducatorMap.get(educatorId) || {
      id: educatorId,
      name: course.educator?.name || course.educator?.email || "",
      imageUrl: course.educator?.imageUrl || "",
      courseCount: 0,
      enrollmentCount: 0,
    };
    current.courseCount += 1;
    current.enrollmentCount += (course.studentsEnrolled || []).length;
    topEducatorMap.set(educatorId, current);
  }

  const topEducators = Array.from(topEducatorMap.values())
    .sort((left, right) => right.courseCount - left.courseCount || right.enrollmentCount - left.enrollmentCount)
    .slice(0, 6);

  const categoryMap = new Map();
  for (const course of publishedCourses) {
    const category = (course.category || "").trim();
    if (!category) continue;
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));

  const latestCourses = [...publishedCourses]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 8)
    .map((course) => ({
      _id: course._id,
      courseTitle: course.courseTitle,
      courseDescription: course.courseDescription,
      courseThumbnail: course.courseThumbnail,
      coursePrice: course.coursePrice,
      discount: course.discount,
      courseRatings: course.courseRatings || [],
      educator: course.educator,
      category: course.category || "",
    }));

  const featuredCourses = [...publishedCourses]
    .sort((left, right) => (right.studentsEnrolled?.length || 0) - (left.studentsEnrolled?.length || 0) || new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 4)
    .map((course) => ({
      _id: course._id,
      courseTitle: course.courseTitle,
      courseDescription: course.courseDescription,
      courseThumbnail: course.courseThumbnail,
      coursePrice: course.coursePrice,
      discount: course.discount,
      courseRatings: course.courseRatings || [],
      educator: course.educator,
      category: course.category || "",
    }));

  return {
    stats: {
      totalStudents,
      totalEducators,
      totalCourses,
      totalEnrollments,
      totalRevenue: formatCurrency(totalRevenue),
    },
    featuredCourses,
    latestCourses,
    topEducators,
    categories,
    testimonials,
    announcements: announcements.map((announcement) => ({
      id: announcement._id,
      title: announcement.title,
      message: announcement.message,
      audience: announcement.audience,
      publishAt: announcement.publishAt,
    })),
  };
};

export const getAdminOverview = async () => {
  const [students, educators, courses, purchases, announcements, assignments, certificates] = await Promise.all([
    User.find({ role: "student" }).sort({ createdAt: -1 }).lean(),
    User.find({ role: "educator" }).sort({ createdAt: -1 }).lean(),
    Course.find({}).populate("educator", "name imageUrl email role").sort({ createdAt: -1 }).lean(),
    Purchase.find({}).populate("course", "courseTitle category educator").populate("user", "name email imageUrl").sort({ createdAt: -1 }).lean(),
    Announcement.find({}).sort({ createdAt: -1 }).lean(),
    Assignment.find({}).populate("course", "courseTitle").populate("educator", "name email").sort({ createdAt: -1 }).lean(),
    Certificate.find({}).populate("course", "courseTitle").populate("user", "name email imageUrl").sort({ issueDate: -1, createdAt: -1 }).lean(),
  ]);

  const completedPurchases = purchases.filter((purchase) => ["completed", "success", "paid"].includes(purchase.status));
  const totalRevenue = completedPurchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);

  const analyticsMonths = 6;
  const monthLabels = getMonthLabels(analyticsMonths);
  const current = new Date();

  const trend = monthLabels.map((month, index) => {
    const monthDate = new Date(current.getFullYear(), current.getMonth() - (analyticsMonths - 1 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

    const monthCourses = courses.filter((course) => new Date(course.createdAt) >= monthDate && new Date(course.createdAt) < nextMonth).length;
    const monthEnrollments = completedPurchases.filter((purchase) => new Date(purchase.createdAt) >= monthDate && new Date(purchase.createdAt) < nextMonth).length;
    const monthRevenue = completedPurchases
      .filter((purchase) => new Date(purchase.createdAt) >= monthDate && new Date(purchase.createdAt) < nextMonth)
      .reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);

    return {
      month,
      students: students.filter((student) => new Date(student.createdAt) >= monthDate && new Date(student.createdAt) < nextMonth).length,
      courses: monthCourses,
      enrollments: monthEnrollments,
      revenue: Number(monthRevenue.toFixed(2)),
    };
  });

  const studentCount = students.length;
  const educatorCount = educators.length;
  const adminCount = await User.countDocuments({ role: "admin" });

  const analyticsBreakdown = [
    { name: "Students", value: studentCount },
    { name: "Educators", value: educatorCount },
    { name: "Admins", value: adminCount },
  ].filter((entry) => entry.value > 0);

  const courseMap = new Map();
  for (const purchase of completedPurchases) {
    const courseId = purchase.course?._id?.toString() || purchase.course?.toString();
    if (!courseId) continue;
    const currentCourse = courseMap.get(courseId) || {
      courseTitle: purchase.course?.courseTitle || "Untitled Course",
      enrollments: 0,
    };
    currentCourse.enrollments += 1;
    courseMap.set(courseId, currentCourse);
  }

  const topCourses = Array.from(courseMap.values())
    .sort((left, right) => right.enrollments - left.enrollments)
    .slice(0, 5)
    .map((course) => ({
      name: course.courseTitle,
      enrollments: course.enrollments,
    }));

  const studentRows = students.slice(0, 10).map((student) =>
    buildTableRow(
      student._id.toString(),
      [student.name || student.email || "", student.email || "", `${student.enrolledCourses?.length || 0}`, student.role === "admin" ? "Administrator" : "Student", "Active"],
      "Active"
    )
  );

  const educatorRows = educators.slice(0, 10).map((educator) => {
    const educatorCourses = courses.filter((course) => course.educator?._id?.toString() === educator._id.toString());
    const specialties = [...new Set(educatorCourses.map((course) => course.category).filter(Boolean))];
    return buildTableRow(
      educator._id.toString(),
      [educator.name || educator.email || "", educator.email || "", specialties[0] || "Unspecified", "Approved", "Active"],
      "Active"
    );
  });

  const courseRows = courses.slice(0, 10).map((course) =>
    buildTableRow(
      course._id.toString(),
      [course.courseTitle || "", course.educator?.name || course.educator?.email || "", `${course.studentsEnrolled?.length || 0}`, course.isPublished ? "Published" : "Draft", `$${Number(course.coursePrice || 0).toFixed(2)}`],
      course.isPublished ? "Published" : "Draft"
    )
  );

  const categoryMap = new Map();
  courses.forEach((course) => {
    const category = (course.category || "").trim();
    if (!category) return;
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const categoryRows = Array.from(categoryMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([name, count]) => buildTableRow(name, [name, `${count}`, "Active"], "Active"));

  const enrollmentRows = completedPurchases.slice(0, 10).map((purchase) =>
    buildTableRow(
      purchase._id.toString(),
      [purchase.user?.name || purchase.user?.email || "", purchase.course?.courseTitle || "", "Paid", purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : "", "Active"],
      "Active"
    )
  );

  const paymentRows = purchases.slice(0, 10).map((purchase) =>
    buildTableRow(
      purchase._id.toString(),
      [purchase.user?.name || purchase.user?.email || "", `$${Number(purchase.amount || 0).toFixed(2)}`, purchase.status || "pending", "Razorpay"],
      purchase.status === "completed" ? "Active" : "Pending"
    )
  );

  const announcementsRows = announcements.slice(0, 10).map((announcement) =>
    buildTableRow(
      announcement._id.toString(),
      [announcement.title, announcement.audience, announcement.isPublished ? "Published" : "Draft", announcement.publishAt ? new Date(announcement.publishAt).toLocaleDateString() : ""],
      announcement.isPublished ? "Published" : "Draft"
    )
  );

  const assignmentIds = assignments.map((assignment) => assignment._id);
  const submissionCounts = await AssignmentSubmission.aggregate([
    { $match: { assignment: { $in: assignmentIds } } },
    { $group: { _id: "$assignment", submissions: { $sum: 1 }, graded: { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } } } },
  ]);
  const submissionMap = new Map(submissionCounts.map((entry) => [entry._id.toString(), entry]));

  const assignmentRows = assignments.slice(0, 10).map((assignment) => {
    const counts = submissionMap.get(assignment._id.toString()) || { submissions: 0, graded: 0 };
    return buildTableRow(
      assignment._id.toString(),
      [
        assignment.title,
        assignment.course?.courseTitle || "Untitled Course",
        assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "",
        `${counts.submissions} / ${counts.graded}`,
        assignment.status || "draft",
      ],
      assignment.status === "published" ? "Published" : assignment.status === "archived" ? "Archived" : "Draft"
    );
  });

  const certificateRows = certificates.slice(0, 10).map((certificate) =>
    buildTableRow(
      certificate._id.toString(),
      [
        certificate.user?.name || certificate.studentName || "Learner",
        certificate.course?.courseTitle || certificate.courseTitle || "Untitled Course",
        certificate.certificateId,
        certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "",
        certificate.status || "active",
      ],
      "Active"
    )
  );

  return {
    stats: {
      totalStudents: studentCount,
      totalEducators: educatorCount,
      totalCourses: courses.length,
      totalEnrollments: completedPurchases.length,
      totalRevenue: formatCurrency(totalRevenue),
      activeUsers: studentCount + educatorCount,
    },
    students: studentRows,
    educators: educatorRows,
    courses: courseRows,
    categories: categoryRows,
    enrollments: enrollmentRows,
    assignments: assignmentRows,
    certificates: certificateRows,
    announcements: announcementsRows,
    payments: paymentRows,
    reports: [],
    analytics: {
      trend,
      breakdown: analyticsBreakdown,
      topCourses,
    },
    settingsSections: ["General", "Security", "Permissions", "Notifications", "Branding", "Billing"],
  };
};