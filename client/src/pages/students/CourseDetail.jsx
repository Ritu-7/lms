// import React, { useState, useEffect, useContext } from 'react'
// import { useParams } from 'react-router-dom'
// import { AppContext } from '../../context/AppContext'
// import Loading from '../../components/students/Loading'
// import Footer from '../../components/students/Footer'
// import { assets } from '../../assets/assets'
// import humanizeDuration from 'humanize-duration'
// import YouTube from 'react-youtube'

// const CourseDetail = () => {
//   const { id } = useParams()

//   const {
//     allCourses,
//     calculateRating,
//     calculateChapterTime,
//     calculateCourseDuration,
//     calculateNoOfLectures,
//     currency
//   } = useContext(AppContext)

//   const [courseData, setCourseData] = useState(null)
//   const [openSection, setOpenSection] = useState({})
//   const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
//   const [playerData, setPlayerData] = useState(null)

//   useEffect(() => {
//     if (allCourses?.length) {
//       const course = allCourses.find(c => c._id === id)
//       setCourseData(course)
//     }
//   }, [allCourses, id])

//   const toggleSection = (index) => {
//     setOpenSection(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }))
//   }

//   // Rating logic
//   const rating = courseData ? (Number(calculateRating(courseData)) || 0) : 0
//   const fullStars = Math.floor(rating)
//   const hasHalfStar = rating - fullStars >= 0.5

//   return courseData ? (
//     <>
//       <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 pt-20 text-left">

//         {/* Background Overlay */}
//         <div className="absolute top-0 left-0 w-full h-section-height -z-10 bg-gradient-to-b from-cyan-100/70"></div>

//         {/* LEFT COLUMN */}
//         <div className="max-w-xl z-10 text-gray-500">

//           <h1 className="md:text-3xl text-xl font-semibold text-gray-800">
//             {courseData.courseTitle}
//           </h1>

//           <p
//             className="pt-4 md:text-base text-sm"
//             dangerouslySetInnerHTML={{
//               __html: courseData.courseDescription?.slice(0, 200)
//             }}
//           />

//           {/* Rating Display */}
//           <div className="flex items-center gap-2 pt-3 text-sm">
//             <span className="font-medium text-gray-800">
//               {rating.toFixed(1)}
//             </span>

//             <div className="flex gap-1">
//               {[...Array(5)].map((_, index) => {
//                 if (index < fullStars) {
//                   return <img key={index} src={assets.star} className="w-4 h-4" />
//                 }
//                 if (index === fullStars && hasHalfStar) {
//                   return <img key={index} src={assets.star_half} className="w-4 h-4" />
//                 }
//                 return <img key={index} src={assets.star_blank} className="w-4 h-4" />
//               })}
//             </div>

//             <span className="text-blue-600">
//               ({courseData.courseRatings.length} ratings)
//             </span>

//             <span>
//               {courseData.enrolledStudents.length} students
//             </span>
//           </div>

//           <p className="text-sm mt-1">
//             Course by <span className="text-blue-600 underline">GreatStack</span>
//           </p>

//           {/* COURSE STRUCTURE */}
//           <div className="pt-8 text-gray-800">
//             <h2 className="text-xl font-semibold">Course Structure</h2>

//             <div className="pt-5">
//               {courseData.courseContent.map((chapter, index) => (
//                 <div key={index} className="border bg-white mb-2 rounded">

//                   <div
//                     onClick={() => toggleSection(index)}
//                     className="flex items-center justify-between px-4 py-3 cursor-pointer"
//                   >
//                     <div className="flex items-center gap-2">
//                       <img
//                         src={assets.down_arrow_icon}
//                         alt="arrow"
//                         className={`w-4 transition-transform ${openSection[index] ? 'rotate-180' : ''}`}
//                       />
//                       <p className="font-medium">{chapter.chapterTitle}</p>
//                     </div>

//                     <p className="text-sm">
//                       {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
//                     </p>
//                   </div>

//                   <div
//                     className={`overflow-hidden transition-all duration-300 ${openSection[index] ? 'max-h-96' : 'max-h-0'}`}
//                   >
//                     <ul className="pl-8 py-2 border-t text-sm">
//                       {chapter.chapterContent.map((lecture, i) => (
//                         <li key={i} className="flex gap-2 py-1">
//                           <img src={assets.play_icon} className="w-4 h-4 mt-1" />
//                           <div className="flex justify-between w-full pr-4">
//                             <p>{lecture.lectureTitle}</p>
//                             <div className='flex gap-2'>
//                               {lecture.isPreviewFree && (
//                                 <span 
//                                   onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split('/').pop() })} 
//                                   className="text-blue-600 cursor-pointer underline"
//                                 >
//                                   Preview
//                                 </span>
//                               )}
//                               <span>
//                                 {humanizeDuration(lecture.lectureDuration * 60000, { units: ['h', 'm'] })}
//                               </span>
//                             </div>
//                           </div>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>

//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* FULL DESCRIPTION */}
//           <div className="py-20 text-sm">
//             <h3 className="text-xl font-semibold text-gray-800">
//               Course Description
//             </h3>
//             <p
//               className="pt-3 rich-text"
//               dangerouslySetInnerHTML={{
//                 __html: courseData.courseDescription
//               }}
//             />
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="max-w-course-card shadow-custom-card bg-white min-w-[300px] sm:min-w-[420px] rounded-t z-10">
          
//           {playerData ? (
//             <div className="relative">
//               <YouTube 
//                 videoId={playerData.videoId} 
//                 opts={{ playerVars: { autoplay: 1 } }} 
//                 iframeClassName='w-full aspect-video' 
//               />
//               <button 
//                 onClick={() => setPlayerData(null)}
//                 className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs"
//               >
//                 Close Preview
//               </button>
//             </div>
//           ) : (
//             <img src={courseData.courseThumbnail} alt="Course Thumbnail" />
//           )}

//           <div className="p-5">
//             <div className='flex items-center gap-2'>
//               <img className='w-3.5' src={assets.time_left_clock_icon} alt="clock icon" />
//               <p className="text-red-500 text-sm">
//                 <span className="font-medium">5 days</span> left at this price!
//               </p>
//             </div>

//             <div className="flex gap-3 items-center pt-2">
//               <p className="text-2xl font-semibold">
//                 {currency}
//                 {(courseData.coursePrice - (courseData.discount * courseData.coursePrice / 100)).toFixed(2)}
//               </p>
//               <p className="line-through text-gray-500">
//                 {currency}{courseData.coursePrice}
//               </p>
//               <p className='md:text-lg text-gray-500'>{courseData.discount}% off</p>
//             </div>

//             <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
//               <div className='flex items-center gap-1'>
//                 <img src={assets.star} alt="star icon" />
//                 <p>{rating.toFixed(1)}</p>
//               </div>

//               <div className='h-4 w-px bg-gray-500/40'></div>

//               <div className='flex items-center gap-1'>
//                 <img src={assets.time_clock_icon} alt="clock icon" />
//                 <p>{calculateCourseDuration(courseData)}</p> 
//               </div>

//               <div className='h-4 w-px bg-gray-500/40'></div>

//               <div className='flex items-center gap-1'>
//                 <img src={assets.lesson_icon} alt="lesson icon" />
//                 <p>{calculateNoOfLectures(courseData)} lessons</p>
//               </div>
//             </div>

//             <button className="mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium">
//               {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
//             </button>

//             <div className="pt-6">
//               <p className="text-lg font-medium">What's in the course?</p>
//               <ul className="list-disc ml-4 text-sm text-gray-500">
//                 <li>Lifetime access with free updates</li>
//                 <li>Step-by-step hands-on guidance</li>
//                 <li>Beginner to advanced level concepts</li>
//                 <li>Downloadable resources and code files</li>
//                 <li>Certificate of completion</li>
//               </ul>
//             </div>
//           </div>
//         </div>

//       </div>
//       <Footer />
//     </>
//   ) : (
//     <Loading />
//   )
// }

// export default CourseDetail
import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/students/Loading'
import Footer from '../../components/students/Footer'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import axios from 'axios'
import { toast } from 'react-toastify'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    allCourses,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency,
    backendUrl,
    getToken,
    userData, 
  } = useContext(AppContext)

  const [courseData, setCourseData] = useState(null)
  const [openSection, setOpenSection] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [playerData, setPlayerData] = useState(null)

  // --- RAZORPAY INTEGRATION LOGIC ---

  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.error("Please login to enroll");
      }

      if (isAlreadyEnrolled) {
        return toast.warn('Already Enrolled')
      }

      const token = await getToken()
      const fetchCourseData = async()=>{
        try{
          const {data} = await axios.post(backendURL+'/api/user/purchase',{courseId:courseData._id}{
            headers:{Authorization:`Bearer ${token}`}
          }  )
          if(data.success){ 
           const {session_url}=datawindow.location.replace(session_url)
        }else{
          toast.error(data.message)
        }
      }
      catch(error){
        toast.error(error.message)
      }};
      // 1. Create Order on Backend
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase-course`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        initPay(data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
      amount: order.amount,
      currency: order.currency,
      name: courseData.courseTitle,
      description: 'Course Enrollment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const token = await getToken()
          // 2. Verify Payment on Backend
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-payment`,
            response,
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (data.success) {
            toast.success(data.message)
            setIsAlreadyEnrolled(true)
            navigate('/my-enrollments')
          }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message)
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  // --- EXISTING LOGIC ---

  useEffect(() => {
    if (allCourses?.length) {
      const course = allCourses.find(c => c._id === id)
      setCourseData(course)
    }
  }, [allCourses, id])

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
    }
  }, [userData, courseData])

  const toggleSection = (index) => {
    setOpenSection(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const rating = courseData ? (Number(calculateRating(courseData)) || 0) : 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5

  return courseData ? (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 pt-20 text-left">

        <div className="absolute top-0 left-0 w-full h-section-height -z-10 bg-gradient-to-b from-cyan-100/70"></div>

        {/* LEFT COLUMN */}
        <div className="max-w-xl z-10 text-gray-500">

          <h1 className="md:text-3xl text-xl font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>

          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription?.slice(0, 200)
            }}
          />

          <div className="flex items-center gap-2 pt-3 text-sm">
            <span className="font-medium text-gray-800">
              {rating.toFixed(1)}
            </span>

            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => {
                if (index < fullStars) {
                  return <img key={index} src={assets.star} className="w-4 h-4" alt="" />
                }
                if (index === fullStars && hasHalfStar) {
                  return <img key={index} src={assets.star_half} className="w-4 h-4" alt="" />
                }
                return <img key={index} src={assets.star_blank} className="w-4 h-4" alt="" />
              })}
            </div>

            <span className="text-blue-600">
              ({courseData.courseRatings.length} ratings)
            </span>

            <span>
              {courseData.enrolledStudents.length} students
            </span>
          </div>

          <p className="text-sm mt-1">
            Course by <span className="text-blue-600 underline">GreatStack</span>
          </p>

          <div className="pt-8 text-gray-800">
            <h2 className="text-xl font-semibold">Course Structure</h2>

            <div className="pt-5">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border bg-white mb-2 rounded">

                  <div
                    onClick={() => toggleSection(index)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={assets.down_arrow_icon}
                        alt="arrow"
                        className={`w-4 transition-transform ${openSection[index] ? 'rotate-180' : ''}`}
                      />
                      <p className="font-medium">{chapter.chapterTitle}</p>
                    </div>

                    <p className="text-sm">
                      {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${openSection[index] ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <ul className="pl-8 py-2 border-t text-sm">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex gap-2 py-1">
                          <img src={assets.play_icon} className="w-4 h-4 mt-1" alt="" />
                          <div className="flex justify-between w-full pr-4">
                            <p>{lecture.lectureTitle}</p>
                            <div className='flex gap-2'>
                              {lecture.isPreviewFree && (
                                <span 
                                  onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split('/').pop() })} 
                                  className="text-blue-600 cursor-pointer underline"
                                >
                                  Preview
                                </span>
                              )}
                              <span>
                                {humanizeDuration(lecture.lectureDuration * 60000, { units: ['h', 'm'] })}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="py-20 text-sm">
            <h3 className="text-xl font-semibold text-gray-800">
              Course Description
            </h3>
            <p
              className="pt-3 rich-text"
              dangerouslySetInnerHTML={{
                __html: courseData.courseDescription
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="max-w-course-card shadow-custom-card bg-white min-w-[300px] sm:min-w-[420px] rounded-t z-10">
          
          {playerData ? (
            <div className="relative">
              <YouTube 
                videoId={playerData.videoId} 
                opts={{ playerVars: { autoplay: 1 } }} 
                iframeClassName='w-full aspect-video' 
              />
              <button 
                onClick={() => setPlayerData(null)}
                className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs"
              >
                Close Preview
              </button>
            </div>
          ) : (
            <img src={courseData.courseThumbnail} alt="Course Thumbnail" />
          )}

          <div className="p-5">
            <div className='flex items-center gap-2'>
              <img className='w-3.5' src={assets.time_left_clock_icon} alt="clock icon" />
              <p className="text-red-500 text-sm">
                <span className="font-medium">5 days</span> left at this price!
              </p>
            </div>

            <div className="flex gap-3 items-center pt-2">
              <p className="text-2xl font-semibold">
                {currency}
                {(courseData.coursePrice - (courseData.discount * courseData.coursePrice / 100)).toFixed(2)}
              </p>
              <p className="line-through text-gray-500">
                {currency}{courseData.coursePrice}
              </p>
              <p className='md:text-lg text-gray-500'>{courseData.discount}% off</p>
            </div>

            <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
              <div className='flex items-center gap-1'>
                <img src={assets.star} alt="star icon" />
                <p>{rating.toFixed(1)}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p> 
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            <button 
              onClick={enrollCourse}
              className="mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium"
            >
              {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
            </button>

            <div className="pt-6">
              <p className="text-lg font-medium">What's in the course?</p>
              <ul className="list-disc ml-4 text-sm text-gray-500">
                <li>Lifetime access with free updates</li>
                <li>Step-by-step hands-on guidance</li>
                <li>Beginner to advanced level concepts</li>
                <li>Downloadable resources and code files</li>
                <li>Certificate of completion</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  )
}

export default CourseDetail;