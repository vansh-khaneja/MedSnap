'use client'
import React, { useState } from 'react';

const frontBodyParts = [
  { name: "brain", center: [155, 55], labelSide: "right" },
  { name: "heart", center: [160, 125], labelSide: "right" },
  { name: "chest", center: [142, 120], labelSide: "right" },
  { name: "right arm", center: [104, 180], labelSide: "right" },
  { name: "left arm", center: [207, 180], labelSide: "left" },
  { name: "right leg", center: [130, 270], labelSide: "right" },
  { name: "left leg", center: [170, 270], labelSide: "left" },
  { name: "stomach", center: [147, 155], labelSide: "right" },
  { name: "liver", center: [128, 150], labelSide: "left" },
  { name: "right kidney", center: [132, 180], labelSide: "right" },
  { name: "left kidney", center: [164, 180], labelSide: "left" },
];

const backBodyParts = [
  { name: "cervical spine", center: [160, 87], labelSide: "right" },
  { name: "shoulder blades", center: [164, 110], labelSide: "right" },
  { name: "thoracic spine", center: [165, 155], labelSide: "right" },
  { name: "lumbar spine", center: [162, 184], labelSide: "right" },
  { name: "left hip", center: [150, 195], labelSide: "right" },
  { name: "right hip", center: [175, 195], labelSide: "left" },
  { name: "left gluteus", center: [137, 207], labelSide: "right" },
  { name: "right gluteus", center: [185, 207], labelSide: "left" },
  { name: "left hamstring", center: [135, 261], labelSide: "right" },
  { name: "right hamstring", center: [178, 261], labelSide: "left" },
  { name: "left calf", center: [140, 349], labelSide: "right" },
  { name: "right calf", center: [176, 349], labelSide: "left" },
];

const PulsingDot = ({ x, y }) => (
  <g>
    <circle cx={x} cy={y} r="9" fill="#FF4646" opacity="0.2" className="animate-pulse" />
    <circle cx={x} cy={y} r="6.5" fill="#FF4646" opacity="0.3" className="animate-pulse" />
    <circle cx={x} cy={y} r="4.5" fill="#FF4646" opacity="0.8" />
  </g>
);

const HoverLabel = ({ x, y, name, condition }) => {
  const labelWidth = 100;
  const labelHeight = condition ? 40 : 24;
  const verticalOffset = -30;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={verticalOffset} stroke="#FF4646" strokeWidth="1.5" />
      <g transform={`translate(${-labelWidth/2}, ${verticalOffset - labelHeight})`}>
        <rect
          width={labelWidth}
          height={labelHeight}
          rx="4"
          fill="#1A1A1A"
          stroke="#1A1A1A"
          strokeWidth="1"
          filter="drop-shadow(0 1px 1px rgb(0 0 0 / 0.1))"
        />
        <text
          x={labelWidth/2}
          y={condition ? 16 : labelHeight/2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="11"
          className="capitalize"
        >
          {name}
        </text>
        {condition && (
          <text
            x={labelWidth/2}
            y={30}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FF4646"
            fontSize="10"
          >
            {condition}
          </text>
        )}
      </g>
    </g>
  );
};

const BodyView = ({ viewType, bodyParts, hoveredPart, setHoveredPart, conditions }) => {
  const imageSrc = viewType === 'front' 
    ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freepik__3d-model-a-simple-outline-drawing-of-a-human-body-__28485-YAxwYmW2rI3SzluLddz3YlgPCh1gE6.png"
    : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freepik__3d-model-a-simple-outline-drawing-of-a-human-body-__28486-r01oS2CpeYZi2ygIiM3M1XcoY0OcSA.png";

  return (
    <div className="relative">
      <div className="text-center text-sm font-medium mb-1 text-gray-600">
        {viewType === 'front' ? 'Front View' : 'Back View'}
      </div>
      <div className="h-80"> {/* Increased height container */}
        <img 
          src={imageSrc}
          alt={`Human body - ${viewType} view`}
          className="h-full w-full object-contain"
        />
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 300 450"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id={`shadow-${viewType}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
            </filter>
          </defs>
          {bodyParts.map((part) => {
            const isHovered = hoveredPart === part.name;
            const condition = conditions[part.name];
            return (
              <g 
                key={part.name}
                onMouseEnter={() => setHoveredPart(part.name)}
                onMouseLeave={() => setHoveredPart(null)}
              >
                {condition && (
                  <circle
                    cx={part.center[0]}
                    cy={part.center[1]}
                    r="13"
                    fill="transparent"
                  />
                )}
                {condition && (
                  <PulsingDot 
                    x={part.center[0]} 
                    y={part.center[1]}
                  />
                )}
                {isHovered && condition && (
                  <HoverLabel 
                    x={part.center[0]} 
                    y={part.center[1]} 
                    name={part.name}
                    condition={condition}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const DetailedBodyMap = ({ conditions }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        <BodyView 
          viewType="front"
          bodyParts={frontBodyParts}
          hoveredPart={hoveredPart}
          setHoveredPart={setHoveredPart}
          conditions={conditions}
        />
        <BodyView 
          viewType="back"
          bodyParts={backBodyParts}
          hoveredPart={hoveredPart}
          setHoveredPart={setHoveredPart}
          conditions={conditions}
        />
      </div>
    </div>
  );
};

export default DetailedBodyMap;