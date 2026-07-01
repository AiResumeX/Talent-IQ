import { useState } from 'react'


import { Routes } from 'react-router';
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";


function App() {
  return (
    <>
    <Routes>
         <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />

    </Routes>
         <Toaster toastOptions={{ duration: 3000 }} />
    </>
  )
}


export default App
