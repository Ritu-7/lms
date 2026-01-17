

import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/students/SearchBar'
import { useParams, useNavigate } from 'react-router-dom'
import CourseCard from '../../components/students/CourseCard'
import Footer from '../../components/students/Footer'
import { assets } from '../../assets/assets'

const CourseList = () => {
  const { allCourses } = useContext(AppContext)
  const { input } = useParams()
  const navigate = useNavigate()

  const [filteredCourse, setFilteredCourse] = useState([])

  useEffect(() => {
    if (!allCourses || allCourses.length === 0) return

    const tempCourses = [...allCourses]

    if (input) {
      setFilteredCourse(
        tempCourses.filter(course =>
          (course.courseTitle || '')
            .toLowerCase()
            .includes(input.toLowerCase())
        )
      )
    } else {
      setFilteredCourse(tempCourses)
    }
  }, [allCourses, input])

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left">

        {/* Header */}
        <div className="flex md:flex-row flex-col gap-6 items-center justify-between w-full">

          {/* Left */}
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">
              Course List
            </h1>
            <p className="text-gray-500">
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate('/')}
              >
                Home
              </span>
              <span  className="text-blue-600 cursor-pointer"
                onClick={() => navigate('/course-list")}>')}>
                 / Course List</span>
            </p>
          </div>

          {/* Right */}
          <SearchBar data={input} />
        </div>

        {/* Search Tag */}
        {input && (
          <div className="inline-flex items-center gap-4 px-4 py-2 border mt-8 mb-8 text-gray-600">
            <p>{input}</p>
            <img
              src={assets.cross_icon}
              alt="remove"
              className="cursor-pointer w-4"
              onClick={() => navigate('/course-list')}
            />
          </div>
        )}

        {/* Courses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-4">
          {filteredCourse.map((course, index) => (
            <CourseCard key={index} course={course} />
          ))}
        </div>

      </div>

      <Footer />
    </>
  )
}

export default CourseList

