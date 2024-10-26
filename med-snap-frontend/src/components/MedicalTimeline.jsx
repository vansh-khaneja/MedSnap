import React from 'react';
import { Calendar, Activity, Syringe } from 'lucide-react';

const MedicalTimeline = ({ medicalHistory }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" />
          Medical History
        </h2>
        
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-100" />

          {/* Timeline items */}
          <div className="space-y-3">
            {medicalHistory.map((event, index) => (
              <div key={index} className="relative flex items-start ml-6 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                {/* Timeline dot */}
                <div className="absolute -left-6 mt-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center text-sm mb-1">
                    <Calendar className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-600">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-1 mb-1">
                    <span className="font-medium">Issue:</span> {event.issue}
                  </p>
                  <div className="flex items-start text-sm text-gray-600">
                    <Syringe className="w-3 h-3 mr-1 mt-0.5 text-blue-500 flex-shrink-0" />
                    <p className="line-clamp-2">
                      {event.treatment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;