import React from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import CourseCard from './CourseCard'

const CoursesSection = () => {
  const { allCourses } = React.useContext(AppContext)

  return (
    <div className="py-16 px-8 md:px-40">
      <h2 className="text-3xl font-bold text-gray-800">
        Learn from the best
      </h2>

      <p className="text-sm md:text-base text-gray-500 mt-3">
        Discover our top-rated courses across various categories.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 my-16 md:grid-cols-2 lg:grid-cols-4">
        {allCourses?.slice(0, 4).map(course => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>

      {/* Button */}
      <div className="text-center">
        <Link
          to="/course-list"
          className="inline-block border px-10 py-3 rounded
                     text-gray-600 hover:bg-gray-100 transition"
        >
          Show all courses
        </Link>
      </div>
    </div>
  )
}

export default CoursesSection
