import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import SearchBar from "../../components/students/SearchBar";
import { useParams, useNavigate } from "react-router-dom";
import CourseCard from "../../components/students/CourseCard";
import Footer from "../../components/students/Footer";
import { motion } from "framer-motion";

const CourseList = () => {
  const { allCourses } = useContext(AppContext);
  const { input } = useParams();
  const navigate = useNavigate();

  const filteredCourses = allCourses.filter(course => {
    if (input) {
      return (course.courseTitle || "").toLowerCase().includes(input.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-space-grotesk text-slate-900 dark:text-white">
              Course Catalog
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate("/")}>Home</span>
              <span className="mx-2">/</span>
              <span className="text-slate-900 dark:text-slate-200">Catalog</span>
            </p>
          </div>

          <div className="w-full md:w-auto">
            <SearchBar data={input} />
          </div>
        </div>

        {/* Search Tag */}
        {input && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 mb-8 border border-blue-100 dark:border-blue-900/30"
          >
            <span className="text-sm font-semibold">Results for: "{input}"</span>
            <button 
              className="hover:text-blue-900 dark:hover:text-blue-200"
              onClick={() => navigate("/course-list")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Courses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, idx) => (
              <motion.div 
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400">
              <p>No courses found matching your search.</p>
              <button 
                onClick={() => navigate("/course-list")}
                className="mt-4 text-blue-600 font-semibold hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseList;
