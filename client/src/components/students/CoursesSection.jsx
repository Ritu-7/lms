import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import CourseCard from "./CourseCard";
import { motion } from "framer-motion";

const CoursesSection = () => {
  const { allCourses, platformHomeData } = useContext(AppContext);
  const courses = platformHomeData.featuredCourses.length > 0 ? platformHomeData.featuredCourses : allCourses.slice(0, 4);

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto transition-colors duration-500">
      <div className="text-center mb-16 space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold font-space-grotesk text-text-primary transition-colors"
        >
          Featured Learning Paths
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-secondary max-w-2xl mx-auto text-sm md:text-base transition-colors"
        >
          Hand-picked courses from our top instructors to help you jumpstart your career in AI, Tech, and Design.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
        {courses?.map((course, idx) => (
          <motion.div 
            key={course._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <CourseCard course={course} />
          </motion.div>
        ))}
      </div>

      {/* Button */}
      <div className="text-center">
        <Link
          to="/course-list"
          className="interactive-button inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-text-primary border border-card-border bg-card-bg hover:bg-text-primary/5 hover:border-accent-blue/50 group"
        >
          Browse All Courses
          <svg 
            className="h-4 w-4 transition-transform group-hover:translate-x-1 text-accent-blue" 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default CoursesSection;

