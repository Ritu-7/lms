import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import uniqid from 'uniqid';
import Quill from 'quill';
import axios from 'axios';
import 'quill/dist/quill.snow.css';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/students/Loading';

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { backendURL, getToken } = useContext(AppContext);
  
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [courseFeatures, setCourseFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');

  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureVideoUrl: '',
    isPreview: false
  });

  // Fetch Course Data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`${backendURL}/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          const course = data.data;
          setCourseData(course);
          setChapters(course.courseContent || []);
          setCourseFeatures(course.courseFeatures || []);
          if (quillRef.current) {
            quillRef.current.root.innerHTML = course.courseDescription;
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error('Failed to fetch course data.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, backendURL, getToken]);

  // Initialize Quill Editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Write course description here...'
      });
      if (courseData?.courseDescription) {
        quillRef.current.root.innerHTML = courseData.courseDescription;
      }
    }
  }, [courseData]);

  // Feature Operations
  const handleFeature = (action, index) => {
    if (action === 'add') {
      if (featureInput.trim()) {
        setCourseFeatures([...courseFeatures, featureInput.trim()]);
        setFeatureInput('');
      }
    } else if (action === 'remove') {
      setCourseFeatures(courseFeatures.filter((_, i) => i !== index));
    }
  };

  // Chapter Operations
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? Math.max(...chapters.map(c => c.chapterOrder)) + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter(c => c.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(chapters.map(c => c.chapterId === chapterId ? { ...c, collapsed: !c.collapsed } : c));
    }
  };

  // Lecture Operations
  const addLecture = () => {
    setChapters(chapters.map(c => {
      if (c.chapterId === currentChapterId) {
        return {
          ...c,
          chapterContent: [...c.chapterContent, {
            lectureId: uniqid(),
            ...lectureDetails,
            lectureDuration: Number(lectureDetails.lectureDuration),
            lectureOrder: c.chapterContent.length > 0 ? Math.max(...c.chapterContent.map(l => l.lectureOrder)) + 1 : 1,
          }]
        };
      }
      return c;
    }));
    setShowPopup(false);
    setLectureDetails({ lectureTitle: '', lectureDuration: '', lectureVideoUrl: '', isPreview: false });
  };
  
  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedCourseData = {
        ...courseData,
        courseDescription: quillRef.current.root.innerHTML,
        courseContent: chapters,
        courseFeatures,
      };

      const formData = new FormData();
      formData.append('courseData', JSON.stringify(updatedCourseData));
      if (image) {
        formData.append('thumbnail', image);
      }
      
      const token = await getToken();
      const { data } = await axios.put(`${backendURL}/api/educator/edit-course/${courseId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Course updated successfully!');
        navigate('/educator/my-courses');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start md:p-8 p-4 pt-8 bg-gray-50'>
      <form onSubmit={handleSubmit} className='w-full max-w-3xl space-y-5'>
        
        {/* Course Title */}
        <div className='flex flex-col gap-1'>
          <p className='text-gray-600 font-medium'>Course Title</p>
          <input type='text' value={courseData?.courseTitle || ''} onChange={(e) => setCourseData({...courseData, courseTitle: e.target.value})} placeholder='Type Here' className='outline-none border border-gray-400 rounded-md p-2' required />
        </div>

        {/* Quill Editor */}
        <div className='flex flex-col gap-1'>
          <p className='text-gray-600 font-medium mb-2'>Course Description</p>
          <div ref={editorRef} className='h-40 bg-white'></div>
        </div>

        {/* Price & Discount */}
        <div className='flex gap-4'>
          <div className='flex-1'>
            <p className='text-gray-600 font-medium'>Price</p>
            <input type='number' value={courseData?.coursePrice || 0} onChange={(e) => setCourseData({...courseData, coursePrice: e.target.value})} className='w-full border border-gray-400 rounded-md p-2' placeholder='0' />
          </div>
          <div className='flex-1'>
            <p className='text-gray-600 font-medium'>Discount (%)</p>
            <input type='number' value={courseData?.discount || 0} onChange={(e) => setCourseData({...courseData, discount: e.target.value})} className='w-full border border-gray-400 rounded-md p-2' placeholder='0' />
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className='flex items-center gap-4'>
          <label className='cursor-pointer bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2'>
            <img src={assets.file_upload_icon} alt="" className='w-4' />
            Upload Thumbnail
            <input type='file' onChange={(e) => setImage(e.target.files[0])} accept="image/*" hidden />
          </label>
          <img className='h-12 rounded' src={image ? URL.createObjectURL(image) : courseData?.courseThumbnail} alt="" />
        </div>

        {/* Course Features */}
        <div className='space-y-2'>
          <p className='text-gray-600 font-medium'>Course Features</p>
          <div className='flex gap-2'>
            <input type='text' value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder='Add a feature' className='flex-1 border border-gray-400 rounded-md p-2' />
            <button type='button' onClick={() => handleFeature('add')} className='bg-blue-600 text-white px-4 py-2 rounded'>Add</button>
          </div>
          <ul className='space-y-2'>
            {courseFeatures.map((feature, index) => (
              <li key={index} className='flex justify-between items-center bg-gray-100 p-2 rounded'>
                <span>{feature}</span>
                <button type='button' onClick={() => handleFeature('remove', index)} className='text-red-500'>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Chapters Section */}
        <div className='space-y-4'>
          {chapters.map((chapter, index) => (
            <div key={chapter.chapterId} className="bg-white border rounded-lg overflow-hidden">
              <div className='flex justify-between items-center p-4 bg-gray-100'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => handleChapter('toggle', chapter.chapterId)}>
                  <img src={assets.dropdown_icon} alt="" width={12} className={`${chapter.collapsed ? "-rotate-90" : ""} transition-transform`} />
                  <span className='font-semibold'>{index + 1}. {chapter.chapterTitle}</span>
                </div>
                <img src={assets.cross_icon} className='cursor-pointer w-3' onClick={() => handleChapter('remove', chapter.chapterId)} alt="remove" />
              </div>
              {!chapter.collapsed && (
                <div className='p-4 space-y-2'>
                  {chapter.chapterContent.map((lec, i) => (
                    <div key={i} className='flex justify-between text-sm border-b pb-2'>
                      <span>{i + 1}. {lec.lectureTitle} ({lec.lectureDuration} min)</span>
                      <span className='text-blue-500 cursor-pointer'>Edit</span>
                    </div>
                  ))}
                  <div className='text-blue-600 cursor-pointer text-sm font-medium' onClick={() => { setCurrentChapterId(chapter.chapterId); setShowPopup(true); }}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className='cursor-pointer text-center p-3 border-2 border-dashed border-gray-400 rounded-lg text-gray-600' onClick={() => handleChapter('add')}>
            + Add Chapter
          </div>
        </div>

        <button type='submit' className='bg-black text-white px-8 py-2.5 rounded font-bold uppercase'>
          UPDATE COURSE
        </button>
      </form>

      {/* Lecture Popup Modal */}
      {showPopup && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white p-6 rounded-lg w-full max-w-md relative'>
            <h2 className='text-xl font-bold mb-4'>Add Lecture</h2>
            <div className='space-y-3'>
              <input type='text' placeholder='Lecture Title' className='w-full border p-2 rounded' value={lectureDetails.lectureTitle} onChange={e => setLectureDetails({...lectureDetails, lectureTitle: e.target.value})} />
              <input type='number' placeholder='Duration (min)' className='w-full border p-2 rounded' value={lectureDetails.lectureDuration} onChange={e => setLectureDetails({...lectureDetails, lectureDuration: e.target.value})} />
              <input type='text' placeholder='Video URL' className='w-full border p-2 rounded' value={lectureDetails.lectureVideoUrl} onChange={e => setLectureDetails({...lectureDetails, lectureVideoUrl: e.target.value})} />
              <label className='flex items-center gap-2'>
                <input type='checkbox' checked={lectureDetails.isPreview} onChange={e => setLectureDetails({...lectureDetails, isPreview: e.target.checked})} />
                Free Preview?
              </label>
              <button onClick={addLecture} className='w-full bg-blue-600 text-white py-2 rounded'>Add</button>
            </div>
            <img onClick={() => setShowPopup(false)} src={assets.cross_icon} className='absolute top-4 right-4 cursor-pointer w-4' alt="close" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCourse;
