import React from 'react'
import Hero from '../../components/students/Hero'
import PlatformOverview from '../../components/students/PlatformOverview'
import Companies from '../../components/students/Companies'
import CoursesSection from '../../components/students/CoursesSection'
import TestimonialsSection from '../../components/students/TestimonialsSection'
import PricingSection from '../../components/students/PricingSection'
import CallToAction from '../../components/students/CallToAction'
import Footer from '../../components/students/Footer'

const Home = () => {
  return (
    <div className='flex flex-col items-stretch text-center bg-bg-primary transition-colors duration-500 min-h-screen'>
      <Hero />
      <PlatformOverview />
      <Companies />
      <CoursesSection/>
      <PricingSection />
      <TestimonialsSection />
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home