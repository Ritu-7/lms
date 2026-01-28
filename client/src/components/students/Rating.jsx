import React, { useState } from 'react'

const Rating = ({ initialRating, onRate }) => {
  const [rating, setRating] = useState(initialRating || 0)

  const handleRating = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  }


  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        // FIX: The '(' must be on the same line as 'return'
        return (
          <span 
            key={index} 
            className={`cursor-pointer text-2xl sm:text-3xl transition-all duration-150 hover:scale-120 ${
              starValue <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`} 
            onClick={() => handleRating(starValue)}
          >
            &#9733;
          </span>
        );
      })}
    </div>
  )
}

export default Rating