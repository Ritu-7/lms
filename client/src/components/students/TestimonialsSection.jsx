import React from 'react'
import { assets, dummyTestimonial } from '../../assets/assets'

const TestimonialsSection = () => {
  return (
    <div className="pb-14 px-8 md:px-40">
      <h2 className="text-3xl font-bold text-gray-800">
        Testimonials
      </h2>

      <p className="md:text-base text-gray-600 mt-3">
        Here are some testimonials from our students.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 my-16 md:grid-cols-2 lg:grid-cols-4">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl
                       p-5 flex flex-col items-center text-center h-full
                       shadow-sm hover:shadow-md transition"
          >
            {/* Avatar */}
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className="w-14 h-14 rounded-full object-cover"
            />

            <h3 className="mt-3 font-semibold text-sm">
              {testimonial.name}
            </h3>

            <p className="text-xs text-gray-500">
              {testimonial.role}
            </p>

            {/* Stars */}
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, starIndex) => (
                <img
                  key={starIndex}
                  src={
                    starIndex < Math.floor(testimonial.rating)
                      ? assets.star
                      : assets.star_blank
                  }
                  alt="star"
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>

            {/* Feedback */}
            <p className="mt-4 text-sm text-gray-600 line-clamp-3">
              {testimonial.feedback}
            </p>

            <a
              href="#"
              className="mt-auto text-sm text-blue-500 hover:underline"
            >
              Read More
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection
