import Course from '../models/Course.js';

// get All courses 

export const getAllCourse=async(req,res)=>{
    try {
        const courses = await Course.find({isPublished : true}).select(['-courseContent','-enrolledstudents']).populate({path:'educator'})

        res.json({success:true,data:courses});
    }
    catch(error){
    res.json({success:false,message:error.message})
    }
}

// get course by ID

export const getCourseId = async(req,res)=>{
    const{id} = req.params

    try{
        const courseData =  await Course.findById(id).populate({path:'educator'})
       

        courseData.courseContent.forEach(chapter=>{
            chapter.chapterContent.forEach(lecture=>{
                if(!lecture.isPreviewFree){
                    lecture.lectureUrl = "";
                }
            })
        })
        res.json({success:true,data:courseData})
    }
    catch(error){
   res,json({success:false,message:error.message})  
    }
}

