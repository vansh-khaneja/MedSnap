'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/app/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import DetailedBodyMap from './DetailedBodyMap'

const StaticBodyMap = () => {
  const [conditions, setConditions] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMedicalDetails()
  }, [])

  const loadMedicalDetails = async () => {
    try {
      const docRef = doc(db, 'patients', "301234238967")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data?.medicalDetails?.organs) {
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
      }
    } catch (error) {
      console.error('Error loading medical details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
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
      </div>
    </div>
  )
}

export default StaticBodyMap;