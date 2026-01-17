import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/students/Footer'
import Rating from '../../components/students/Rating'

const Player = () => {
  const { enrolledCourses, calculateChapterTime } = useContext(AppContext)
  const { courseId } = useParams() // Fixed typo from cousreId
  const [courseData, setCourseData] = useState(null)
  const [openSection, setOpenSection] = useState({})
  const [playerData, setPlayerData] = useState(null)

  const getCourseData = () => {
    enrolledCourses.forEach((course) => {
      if (course._id === courseId) {
        setCourseData(course)
        // Optional: Set the first lecture as default video
        if (course.courseContent.length > 0 && course.courseContent[0].chapterContent.length > 0) {
            // Uncomment below if you want the first video to load automatically
            // setPlayerData({...course.courseContent[0].chapterContent[0], chapter: 1, lecture: 1})
        }
      }
    })
  }

  const toggleSection = (index) => {
    setOpenSection(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData()
    }
  }, [enrolledCourses, courseId])

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 flex-grow'>
        
        {/* Left Column: Course Structure */}
        <div className='text-gray-800'>
          <h2 className='text-xl font-semibold mb-5'>Course Structure</h2>
          <div className="space-y-3">
            {courseData && courseData.courseContent.map((chapter, index) => (
              <div key={index} className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
                <div
                  onClick={() => toggleSection(index)}
                  className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={assets.down_arrow_icon}
                      alt="arrow"
                      className={`w-3 transition-transform duration-300 ${openSection[index] ? 'rotate-180' : ''}`}
                    />
                    <p className="font-semibold text-sm md:text-base">{chapter.chapterTitle}</p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
                  </p>
                </div>

                <div className={`overflow-hidden transition-all duration-500 ${openSection[index] ? 'max-h-[1000px]' : 'max-h-0'}`}>
                  <ul className="bg-gray-50/50 border-t border-gray-100">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className="flex items-start gap-3 px-6 py-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                        <img src={assets.play_icon} className="w-4 h-4 mt-0.5 opacity-60" alt="play" />
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-gray-700">{lecture.lectureTitle}</p>
                            <span className="text-xs text-gray-400">
                                {humanizeDuration(lecture.lectureDuration * 60000, { units: ['h', 'm'] })}
                            </span>
                          </div>
                          {lecture.lectureUrl && (
                            <button 
                              onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                              className="text-blue-600 text-xs font-bold hover:underline"
                            >
                              Watch
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className='flex flex-col items-center justify-center gap-3 py-10 mt-10 border-t border-gray-200'>
            <h1 className='text-lg font-bold text-gray-800'>Rate this Course</h1>
            <Rating initialRating={ 0} />
          </div>
        </div>

        {/* Right Column: Player */}
        <div className="md:sticky md:top-10 h-fit">
          {playerData ? (
            <div className='bg-black rounded-xl overflow-hidden shadow-2xl'>
              <YouTube 
                videoId={playerData.lectureUrl.split('/').pop()} 
                iframeClassName='w-full aspect-video' 
                opts={{ width: '100%', playerVars: { autoplay: 1 } }}
              />
              <div className='p-5 bg-white border-t border-gray-100 flex justify-between items-center'>
                <p className="font-semibold text-gray-800">
                  <span className="text-blue-600 mr-2">{playerData.chapter}.{playerData.lecture}</span>
                  {playerData.lectureTitle}
                </p>
                <button className='text-sm font-bold px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors'>
                  Mark Complete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
               <img 
                 src={courseData ? courseData.courseThumbnail : ''} 
                 className="rounded-xl shadow-lg w-full object-cover aspect-video" 
                 alt="Course Thumbnail"
               />
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                 <p className="text-blue-800 text-sm font-medium">Select a lecture from the list to start learning.</p>
               </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Player 