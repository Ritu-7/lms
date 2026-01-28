import React from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = React.useContext(AppContext)
  const rating = Number(calculateRating(course))

  return (
    <Link
      to={`/course/${course._id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group bg-white border border-gray-200 rounded-xl 
                 overflow-hidden flex flex-col h-full
                 shadow-sm hover:shadow-lg transition shadow-[0_4px_15px_rgba(0,0,0,0.15)] hover:scale-105 transition"
    >
      {/* Thumbnail */}
      <img
        src={course.courseThumbnail}
        alt="Course Thumbnail"
        className="w-full h-44 object-cover"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        <h3 className="text-sm font-semibold line-clamp-2 min-h-[40px]">
          {course.courseTitle}
        </h3>

        <p className="text-xs text-gray-500">
          {course.educator?.name || 'Unknown Instructor'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 text-xs">
          <span>{rating}</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, starIndex) => (
              <img
                key={starIndex}
                src={
                  starIndex < Math.floor(rating)
                    ? assets.star
                    : assets.star_blank
                }
                alt="star"
                className="w-3.5 h-3.5"
              />
            ))}
          </div>
          <span className="text-gray-500">
            ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Price */}
        <p className="mt-auto text-base font-semibold text-gray-800">
          {currency}
          {(
            course.coursePrice -
            (course.discount * course.coursePrice) / 100
          ).toFixed(2)}
        </p>
      </div>
    </Link>
  )
}

export default CourseCard
