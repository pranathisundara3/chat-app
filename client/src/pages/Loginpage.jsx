import React, { useState } from 'react'
import assets from '../assets/assets'
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';

const Loginpage = () => {

  const[_currState, _setCurrState] = useState("sign up")
  const[fullName, setFullName] = useState("")
  const[email, setEmail] = useState("")
  const[password, setPassword] = useState("")
  const[bio, setBio] = useState("")
  const[isDataSubmitted, setIsDataSubmitted] = useState(false)
  
  const{login} = useContext(AuthContext);
  const onSubmitHandler=(event)=>{
    event.preventDefault();

  if(_currState === "sign up" && !isDataSubmitted){
    setIsDataSubmitted(true)
    return;
  }
  login(_currState=== "sign up" ? "signup" : "login", {fullName, email, password, bio})
}
  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
  <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
  {/*------right-----*/}
  <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-8 flex flex-col gap-6 rounded-lg shadow-lg w-80 max-w-md'>
   <h2 className='font-medium text-2xl flex justify-between items-center '>
    {_currState}
    {isDataSubmitted && <img onClick={()=> setIsDataSubmitted(false)} src={assets.arrow_icon} alt="" className='w-5 cursor-pointer'/>
    }
   
   </h2>
   {_currState === "sign up" && !isDataSubmitted && (
   <input onChange={(e)=> setFullName(e.target.value)} value={fullName} type="text" className='p-3 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white' placeholder="Full Name" required/>
    
   )}

   {!isDataSubmitted && (
    <>
  <input onChange={(e)=> setEmail(e.target.value)} value={email} type="email"  placeholder="Email Address" required className='p-3 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white'/> 
   <input onChange={(e)=> setPassword(e.target.value)} value={password} type="password"  placeholder="Password" required className='p-3 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white'/> 
   </>
   
   )}
   {
    _currState === "sign up" && !isDataSubmitted && (
      <textarea onChange={(e)=> setBio(e.target.value)} value={bio} rows={4} className='p-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='provide a short bio...' required></textarea>
     
   )}

   <button type='submit' className='py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-md cursor-pointer font-semibold hover:shadow-lg transition'>
    {_currState=== "sign up" ? "Create Account" : "Login Now"}

   </button>
   <div className='flex items-center gap-2 text-sm text-gray-400'>
   <input type="checkbox" />
   <p>Agree to the terms of use &privacy policy.</p>
    </div>
    <div className='flex flex-col gap-2'>
      {_currState === "sign up" ? (
        <p className='text-sm text-gray-600'>Alread have an account?
     <span onClick={()=>{ _setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
     ) : (
        <p className='text-sm text-gray-600'>create an account<span onClick={()=> _setCurrState("sign up")} className='font-medium text-violet-500 cursor-pointer'> Click here </span></p>
      )}
    </div>
    </form>
    </div>
  )
}
export default Loginpage