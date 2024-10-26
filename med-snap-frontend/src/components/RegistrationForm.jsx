'use client'

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, storage } from '@/app/firebase'
import { collection, addDoc, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Camera, Brain, Clock, FileText, AlertTriangle, Activity, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"

const Webcam = dynamic(() => import('react-webcam'), { ssr: false })

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'user'
}

export default function EnhancedRegistrationForm() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    aadharNumber: ''
  })
  
  const [loginAadhar, setLoginAadhar] = useState('')
  const [detectedAadhar, setDetectedAadhar] = useState('')
  
  const webcamRef = useRef(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [isRegistrationCamera, setIsRegistrationCamera] = useState(false)
  
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'aadharNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 12)
      setFormData(prev => ({ ...prev, [name]: cleaned }))
    } else if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10)
      setFormData(prev => ({ ...prev, [name]: cleaned }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLoginAadharChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12)
    setLoginAadhar(cleaned)
  }

  const formatAadhar = (aadhar) => {
    return aadhar.replace(/(\d{4})/g, '$1 ').trim()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB')
        return
      }
      setPhoto(file)
      setCapturedPhoto(null)
      setError('')
    }
  }

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setCapturedPhoto(imageSrc)
      
      if (isRegistrationCamera) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
            setPhoto(file)
          })
      }
      
      setShowCamera(false)
      setError('')
    }
  }

  const handlePhotoLogin = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setDetectedAadhar('')
    
    try {
      const base64Data = capturedPhoto.split(',')[1]
      const blob = atob(base64Data)
      const array = new Uint8Array(blob.length)
      for (let i = 0; i < blob.length; i++) {
        array[i] = blob.charCodeAt(i)
      }
      const imageFile = new File([array], 'face.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('http://127.0.0.1:5000/search-face', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Face search failed')
      }

      const data = await response.json()
      
      if (data && data.adhaar) {
        setDetectedAadhar(data.adhaar.toString())
        setLoginAadhar(data.adhaar.toString())
        setSuccess('Face matched! Please proceed with Aadhar login.')
      } else {
        setError('No matching face found.')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Face verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    if (formData.aadharNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhar number')
      return
    }
    if (!photo) {
      setError('Please upload a photo or capture one using camera')
      return
    }

    setLoading(true)

    try {
      const aadharQuery = query(
        collection(db, 'users'), 
        where('aadharNumber', '==', formData.aadharNumber)
      )
      const querySnapshot = await getDocs(aadharQuery)
      
      if (!querySnapshot.empty) {
        setError('This Aadhar number is already registered')
        setLoading(false)
        return
      }

      const photoFileName = `${Date.now()}-${photo.name}`
      const storageRef = ref(storage, `photos/${photoFileName}`)
      await uploadBytes(storageRef, photo)
      const photoUrl = await getDownloadURL(storageRef)

      await addDoc(collection(db, 'users'), {
        fullName: formData.fullName,
        phone: formData.phone,
        aadharNumber: formData.aadharNumber,
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      })
      await setDoc(doc(db, 'patients', formData.aadharNumber), {
        medicalDetails: {},
        fullName: formData.fullName,
        phone: formData.phone,
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      })

      const registerFormData = new FormData()
      registerFormData.append('image', photo)
      registerFormData.append('some_number', formData.aadharNumber)

      const apiResponse = await fetch('http://127.0.0.1:5000/upload-face', {
        method: 'POST',
        body: registerFormData
      })

      if (!apiResponse.ok) {
        throw new Error('Face registration failed')
      }

      const apiData = await apiResponse.json()
      
      if (apiData.message === "Face uploaded successfully") {
        setFormData({ fullName: '', phone: '', aadharNumber: '' })
        setPhoto(null)
        setCapturedPhoto(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setSuccess('Registration successful! Please login.')
        setTimeout(() => setActiveTab('login'), 2000)
      } else {
        throw new Error('Face registration failed')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred during registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!loginAadhar) {
      setError('Please enter your Aadhar number')
      return
    }

    if (loginAadhar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhar number')
      return
    }

    setLoading(true)

    try {
      const q = query(
        collection(db, 'users'), 
        where('aadharNumber', '==', loginAadhar)
      )
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setError('No user found with this Aadhar number')
      } else {
        const userData = querySnapshot.docs[0].data()
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => {
          navigate('/dashboard', { state: { userData } })
        }, 1000)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const CameraComponent = () => (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          videoConstraints={videoConstraints}
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={capturePhoto} className="flex-1">
          Capture Photo
        </Button>
        <Button 
          onClick={() => {
            setShowCamera(false)
            setIsRegistrationCamera(false)
            setDetectedAadhar('')
          }} 
          variant="outline" 
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-6xl px-4 py-8">
        <Card className="w-full mx-auto shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold">AI-Powered Medical Portal</CardTitle>
            <CardDescription className="text-lg mt-2">
              Revolutionizing emergency care with AI-driven patient history summarization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="md:border-r md:pr-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="mb-4">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}
                    {detectedAadhar && (
                      <Alert className="mb-4">
                        <AlertTitle>Detected Aadhar</AlertTitle>
                        <AlertDescription>{formatAadhar(detectedAadhar)}</AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="loginAadhar">Aadhar Number</Label>
                        <Input
                          id="loginAadhar"
                          value={formatAadhar(loginAadhar)}
                          onChange={handleLoginAadharChange}
                          placeholder="Enter 12-digit Aadhar number"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login with Aadhar'}
                      </Button>
                    </form>
                    <div className="relative flex items-center gap-4 my-4">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="text-gray-500 text-sm">OR</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    {!showCamera && !capturedPhoto && (
                      <Button
                        onClick={() => {
                          setShowCamera(true)
                          setIsRegistrationCamera(false)
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Camera className="mr-2 h-4 w-4" /> Login with Face
                      </Button>
                    )}
                    {showCamera && <CameraComponent />}
                    {capturedPhoto && !isRegistrationCamera && (
                      <div className="space-y-4">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          <img
                            src={capturedPhoto}
                            alt="Captured"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handlePhotoLogin} className="flex-1" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Face'}
                          </Button>
                          <Button
                            onClick={() => {
                              setCapturedPhoto(null)
                              setShowCamera(true)
                              setDetectedAadhar('')
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Retake
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="register">
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="mb-4">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={handleRegistration} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter 10-digit phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aadharNumber">Aadhar Number</Label>
                        <Input
                          id="aadharNumber"
                          name="aadharNumber"
                          value={formatAadhar(formData.aadharNumber)}
                          onChange={handleInputChange}
                          placeholder="Enter 12-digit Aadhar number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Photo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setShowCamera(true)
                              setIsRegistrationCamera(true)
                            }}
                            variant="outline"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {showCamera && isRegistrationCamera && <CameraComponent />}
                      {capturedPhoto && isRegistrationCamera && (
                        <div className="space-y-2">
                          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <img
                              src={capturedPhoto}
                              alt="Captured"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setCapturedPhoto(null)
                              setPhoto(null)
                              setShowCamera(true)
                              setIsRegistrationCamera(true)
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Retake Photo
                          </Button>
                        </div>
                      )}
                      {photo && !capturedPhoto && (
                        <Alert>
                          <AlertTitle>Photo selected</AlertTitle>
                          <AlertDescription>{photo.name}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="space-y-6">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center mb-4">
                      AI-Powered Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Brain className="mr-2 h-5 w-5" />
                            Smart Patient History Analysis
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          Our AI analyzes patient history to provide quick, relevant insights for emergency care.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-5 w-5" />
                            Rapid Emergency Response
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          Instantly access critical patient information to make informed decisions quickly.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            Structured Medical Summaries
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          Get concise, organized summaries of patient medical histories for efficient review.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}