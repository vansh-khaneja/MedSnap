'use client'
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const MedicalDetailsForm = ({ userData, onDetailsAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bloodGroup: '',
    allergies: [],
    emergencyContact: ''
  });
  const [allergyInput, setAllergyInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'allergies') {
      setAllergyInput(value);
      if (value.endsWith(',')) {
        const newAllergy = value.slice(0, -1).trim();
        if (newAllergy && !formData.allergies.includes(newAllergy)) {
          setFormData(prev => ({
            ...prev,
            allergies: [...prev.allergies, newAllergy]
          }));
        }
        setAllergyInput('');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && allergyInput.trim()) {
      e.preventDefault();
      const newAllergy = allergyInput.trim();
      if (!formData.allergies.includes(newAllergy)) {
        setFormData(prev => ({
          ...prev,
          allergies: [...prev.allergies, newAllergy]
        }));
      }
      setAllergyInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      // Modified data cleaning logic
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          // Handle arrays (like allergies)
          if (value.length > 0) {
            acc[key] = value;
          }
        } else if (typeof value === 'string') {
          // Handle string values
          if (value.trim() !== '') {
            acc[key] = value.trim();
          }
        } else if (value) {
          // Handle any other non-null/undefined values
          acc[key] = value;
        }
        return acc;
      }, {});
  
      if (Object.keys(cleanedData).length === 0) {
        throw new Error('Please fill in at least one field');
      }
  
      const docRef = doc(db, 'patients', userData.aadharNumber);
      await setDoc(docRef, {
        medicalDetails: cleanedData,
        updatedAt: serverTimestamp()
      }, { merge: true });
  
      // Call the callback with the new data
      onDetailsAdded(cleanedData);
      setIsOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save medical details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const loadExistingData = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'patients', userData.aadharNumber));
          if (docSnap.exists() && docSnap.data().medicalDetails) {
            const details = docSnap.data().medicalDetails;
            setFormData(prev => ({ ...prev, ...details }));
          }
        } catch (err) {
          console.error('Error loading data:', err);
        }
      };
      loadExistingData();
    }
  }, [isOpen, userData.aadharNumber]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Plus className="w-3 h-3" />
          Medical Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <Alert variant="destructive" className="py-2 text-sm">{error}</Alert>}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bloodGroup" className="text-sm">Blood Group</Label>
              <Input
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                placeholder="e.g., A+"
                className="h-8 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyContact" className="text-sm">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="Name & number"
                className="h-8 mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="allergies" className="text-sm">Allergies</Label>
            <Input
              id="allergies"
              name="allergies"
              value={allergyInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type and press enter"
              className="h-8 mt-1"
            />
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs"
                  >
                    {allergy}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-blue-900"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        allergies: prev.allergies.filter(a => a !== allergy)
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size="sm"
              disabled={loading}
              className="flex items-center gap-1"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalDetailsForm;