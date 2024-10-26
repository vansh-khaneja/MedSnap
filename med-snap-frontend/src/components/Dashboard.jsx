'use client'

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { storage, db } from '@/app/firebase'
import { doc, getDoc } from 'firebase/firestore'

import { ref, uploadBytes, getDownloadURL, listAll, uploadBytesResumable } from 'firebase/storage'
import { FileText, Upload, User, Activity, AlertTriangle,Camera } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import MedicalDetailsForm from './MedicalDetailsForm'
import DetailedBodyMap from './DetailedBodyMap'
import MedicalChatbot from './MedicalChatbot'
const LoadingSpinner = ({ size = 'medium' }) => (
  <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary
    ${size === 'large' ? 'w-12 h-12' : 'w-6 h-6'}`}
  />
)

const Dashboard = () => {
  const location = useLocation()
  const userData = location.state?.userData

  const [isLoading, setIsLoading] = useState(true)
  const [fileLoading, setFileLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [medicalDetails, setMedicalDetails] = useState(null)
  const [conditions, setConditions] = useState({})
  const [medicalHistory, setMedicalHistory] = useState([])
  const [currentMedications, setCurrentMedications] = useState("")


  useEffect(() => {
    if (userData?.aadharNumber) {
      loadInitialData()
    }
  }, [userData])

  const loadInitialData = async () => {
    try {
      if (!userData?.aadharNumber) return
      await Promise.all([
        loadUserFiles(),
        loadMedicalDetails()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMedicalDetails = async () => {
    try {
      if (!userData?.aadharNumber) return null
      const docRef = doc(db, 'patients', userData.aadharNumber)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data?.medicalDetails) {
          setMedicalDetails(data.medicalDetails)
          if (data.medicalDetails.currentMedications) {
            setCurrentMedications(data.medicalDetails.currentMedications)
          }
          if (data.medicalDetails.medicalHistory) {
            const historyArray = Object.entries(data.medicalDetails.medicalHistory).map(([key, entry]) => ({
              date: entry.date,
              issue: entry.issue,
              treatment: entry.treatment
            }))
            setMedicalHistory(historyArray.sort((a, b) => new Date(b.date) - new Date(a.date)))
          }
          if (data.medicalDetails.organs) {
            const transformedConditions = {}
            Object.entries(data.medicalDetails.organs).forEach(([location, condition]) => {
              const formattedLocation = location
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .toLowerCase()
                .trim()
              transformedConditions[formattedLocation] = condition
            })
            setConditions(transformedConditions)
          }
          return data.medicalDetails
        }
      }
      return null
    } catch (error) {
      console.error('Error loading medical details:', error)
      setError('Failed to load medical details')
      return null
    }
  }

  const loadUserFiles = async () => {
    try {
      const filesRef = ref(storage, `discharge-summaries/${userData?.aadharNumber}`)
      const filesList = await listAll(filesRef)
      const filesData = await Promise.all(
        filesList.items.map(async (item) => {
          const url = await getDownloadURL(item)
          return {
            name: item.name,
            url,
            path: item.fullPath,
            date: new Date(parseInt(item.name.split('-')[0]))
          }
        })
      )
      setFiles(filesData.sort((a, b) => b.date - a.date))
    } catch (error) {
      console.error('Error loading files:', error)
      setError('Failed to load discharge summaries')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setFileLoading(true)
      setError('')
      setSuccessMessage('')

      if (file.type === 'application/pdf') {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('aadhar_number', userData.aadharNumber)

        try {
          const response = await fetch('http://127.0.0.1:5000/message', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Failed to process PDF file')
          }

          const data = await response.json()
          console.log('Server response:', data)
        } catch (error) {
          console.error('Error sending to server:', error)
          setError('Failed to process PDF with server')
          setFileLoading(false)
          return
        }
      }

      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const fileRef = ref(storage, `discharge-summaries/${userData?.aadharNumber}/${fileName}`)

      const uploadTask = uploadBytesResumable(fileRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          setError('Failed to upload file')
          setFileLoading(false)
        },
        async () => {
          setSuccessMessage('File uploaded and processed successfully!')
          await Promise.all([
            loadUserFiles(),
            loadMedicalDetails()
          ])
          setFileLoading(false)
          setUploadProgress(0)
          setTimeout(() => {
            setSuccessMessage('')
          }, 3000)
        }
      )
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload file')
      setFileLoading(false)
    }
  }

  const handleDetailsAdded = (newDetails) => {
    setMedicalDetails(newDetails)
    if (newDetails?.organs) {
      const transformedConditions = {}
      Object.entries(newDetails.organs).forEach(([location, condition]) => {
        const formattedLocation = location
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .toLowerCase()
          .trim()
        transformedConditions[formattedLocation] = condition
      })
      setConditions(transformedConditions)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-muted-foreground animate-pulse">Loading your medical dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {userData?.photoUrl ? (
                    <img
                      src={userData.photoUrl}
                      alt={userData.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Welcome, {userData?.fullName}</CardTitle>
                  <CardDescription>Patient ID: {userData?.aadharNumber}</CardDescription>
                </div>
              </div>
              <MedicalDetailsForm 
                userData={userData}
                onDetailsAdded={handleDetailsAdded}
              />
            </div>
          </CardHeader>
          <CardContent>
            {medicalDetails && Object.entries(medicalDetails).length > 0 && (
              <div className="flex items-center gap-6 text-sm">
                {medicalDetails.bloodGroup && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground">Blood Group:</span>
                    <span className="ml-2 font-medium">{medicalDetails.bloodGroup}</span>
                  </div>
                )}
                {medicalDetails.allergies && medicalDetails.allergies.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground">Allergies:</span>
                    <div className="flex gap-1 ml-2">
                      {medicalDetails.allergies.map((allergy, index) => (
                        <span key={index} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {medicalDetails.emergencyContact && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground">Emergency:</span>
                    <span className="ml-2 font-medium">{medicalDetails.emergencyContact}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-6">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

 

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Body Condition Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="h-[400px]">
                  <DetailedBodyMap conditions={conditions} />
                </div>
              </div>
              <div className="flex-1 md:border-l md:pl-8">
                <h3 className="font-medium mb-4">Current Conditions:</h3>
                <ScrollArea className="h-[300px] pr-4">
                  {Object.entries(conditions).map(([location, condition], index) => (
                    <div key={index} className="flex items-start gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium capitalize">{location}:</span>
                        <p className="text-sm text-muted-foreground">{condition}</p>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(conditions).length === 0 && (
                    <p className="text-center text-muted-foreground">No conditions recorded</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {medicalHistory.map((record, index) => (
                  <div key={index} className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-primary">{record.date}</span>
                    </div>
                    <p className="text-sm font-medium mb-1">{record.issue}</p>
                    <p className="text-sm text-muted-foreground">{record.treatment}</p>
                  </div>
                ))}
                {medicalHistory.length === 0 && (
                  <p className="text-center text-muted-foreground">No medical history recorded</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-primary" />
        Current Medications
      </CardTitle>
      <div className="flex gap-2">
        <label className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Upload Prescription
          <input
  type="file"
  className="hidden"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileLoading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('aadhar_number', userData.aadharNumber)

      const response = await fetch('http://127.0.0.1:5000/prescribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process prescription');
      }

      const data = await response.json();
      // Refresh medical details after successful upload
      await loadMedicalDetails();
      setSuccessMessage('Prescription processed successfully');
    } catch (error) {
      console.error('Error processing prescription:', error);
      setError('Failed to process prescription');
    } finally {
      setFileLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }}
/>
        </label>
     
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {fileLoading && (
      <div className="mb-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )}
    <ScrollArea className="h-[300px] pr-4">
      {currentMedications ? (
        <div className="space-y-2">
          {currentMedications.split('**')
            .filter((_, index) => index % 2 === 1)
            .map((med, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{med.trim()}</div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No current medications recorded</p>
      )}
    </ScrollArea>
  </CardContent>
</Card>
        </div>
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Discharge Summaries</CardTitle>
              <label className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload New
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {fileLoading && (
              <div className="mb-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Uploading: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            <ScrollArea className="h-[300px]">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors mb-2"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
              {files.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No discharge summaries found
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <MedicalChatbot patientName={userData?.fullName} />
    </div>
  )
}

export default Dashboard