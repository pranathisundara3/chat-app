import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext.jsx';

const Profilepage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [_selectedImage, setSelectedImage] = useState(null)
  const navigate = useNavigate()
  const [name, _setName] = useState(() => authUser?.fullName || authUser?.fullname || 'Martin Johnson')
  const [bio, _setBio] = useState(() => authUser?.bio || "Hi Everyone I'm using Quickchat")
  
  const handleSubmit=async(e)=>{
    e.preventDefault();

    const payload = {
      fullName: name,
      bio,
    }

    if (_selectedImage) {
      const reader = new FileReader();
      reader.readAsDataURL(_selectedImage);
      reader.onload = async () => {
        const base64Image = reader.result;
        await updateProfile({ ...payload, profilePic: base64Image })
        navigate('/')
      };
      return;
    }

    await updateProfile(payload)
    navigate('/')
  }
  return(
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
     <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
      <form  onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
        <h3 className='text-lg'>Profile details</h3>
        <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
          <input onChange={(e) => setSelectedImage(e.target.files[0])} type="file" id='avatar' accept='image/png, image/jpeg' hidden />
          <img src={_selectedImage ? URL.createObjectURL(_selectedImage) : assets.avatar_icon} alt="" className={`w-12 h-12 ${_selectedImage ? 'rounded-full' : ''}`} />
          upload profile picture
        </label>
        <input onChange={(e)=> _setName(e.target.value)} value={name} type="text" placeholder='Full Name' className='p-3 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white' />
      <textarea onChange={(e)=> _setBio(e.target.value)} value={bio} placeholder="write profile bio" required className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" rows={4}></textarea>
    
    <button type="submit" className='bg-gradient-to-r from-purple-400 to-purple-600 text-white p-2 rounded-full text-lg cursor pointer'>Save</button>
      </form>
      <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10  ${_selectedImage && 'rounded-full' }`}
      src={authUser?.profilePic || assets.logo_icon} alt="" />
     </div>
    </div>
  )
}
export default Profilepage