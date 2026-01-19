
import React, { useEffect }  from 'react'
import { useState } from 'react'
import { dummyStudentEnrolled } from '../../assets/assets'
import { toast } from 'react-toastify'

const StudentsEnrolled = () => {

  const {backendURL,getToken} =useContext(AppContext)
  const[enrolledStudents,setEnrolledStudents]=useState(null);
  
  const fetchEnrolledStudents=async()=>{
   try{
    const token = await getToken()
    const {data}=await axios.get(`${backendURL}/api/educator/enrolled-students`,{headers:{Authorization:`Bearer ${token}`}})
    if(data.success){
      setEnrolledStudents(data.enrolledStudents.reverse())
    }else{
      toast.error(data.message)
    }
   }catch(error){
  toast.error(error.message)
   }
  }

  useEffect(()=>{
    if(isEducator){
      fetchEnrolledStudents()
    }
   
  },[isEducator])
  return enrolledStudents ? (
    <div className='min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='flex flex-col items-center max-w-4xl w*full overflow-hidden rounded-md bg-white border-gray-500/20'>
        <table>
          <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
            <tr>
              <th className='px-4py-3 font-semibold text-center hidden sm:table-cell'>#</th>
              <th className='px-4 py-3 font-semibold'>Student Name</th>
              <th className='px-4 py-3 font-semibold'>Course Title</th>
              <th className='px-4 py-3 font-semibold'>Date</th>
            </tr>
          </thead>
          <tbody className='text-sm text-gray-500'>
            {enrolledStudents.map((item, index) => (
              <tr key={item.id} className='border-b border-gray-500/20'>
                <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
                <td className='px-4 py-3 py-3 flex items-center space-x-3'><img src={item.student.imageUrl} alt={item.studentName} className='w-8 h-8 rounded-full' /><span className='truncate'>{item.studentName}</span></td>
                <td className='px-4 py-3'>{item.courseTitle}</td>
                <td className='px-4 py-3'>{new Date(item.purchaseDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <div>Loading...</div>
  )
}

export default StudentsEnrolled
