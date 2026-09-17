import React from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = React.useContext(AppContext)
  const rating = Number(calculateRating(course))

  return (
    <Link
      to={`/course/${course._id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group flex flex-col h-full overflow-hidden bg-card-bg border border-card-border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-glow-blue hover:-translate-y-1 hover:border-accent-blue/50"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video">
        <img
          src={course.courseThumbnail}
          alt={course.courseTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <h3 className="text-base font-bold font-space-grotesk text-text-primary line-clamp-2 transition-colors">
          {course.courseTitle}
        </h3>

        <p className="text-xs text-text-secondary font-medium transition-colors">
          {course.educator?.name || 'Unknown Instructor'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < Math.floor(rating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-xs font-semibold text-text-primary transition-colors">
            {rating}
          </span>
          <span className="text-xs text-text-secondary transition-colors">
            ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Price */}
        <p className="mt-auto pt-2 text-xl font-bold font-space-grotesk text-accent-blue transition-colors">
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
