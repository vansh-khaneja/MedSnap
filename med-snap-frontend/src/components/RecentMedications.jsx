import React from 'react';
import { Pill } from 'lucide-react';

const RecentMedications = () => {
  const medications = [
    {
      id: 1,
      name: "Amlodipine",
      dosage: "5mg",
      frequency: "Once daily",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
    },
    {
      id: 3,
      name: "Aspirin",
      dosage: "75mg",
      frequency: "Once daily",
    },
    {
      id: 4,
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Every morning",
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-lg font-semibold flex items-center mb-3">
          <Pill className="w-5 h-5 mr-2 text-blue-500" />
          Current Medications
        </h2>

        <div className="space-y-2">
          {medications.map((med) => (
            <div 
              key={med.id} 
              className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-gray-900">{med.name}</h3>
                <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentMedications;