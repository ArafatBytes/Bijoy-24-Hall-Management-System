"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GallerySection() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesPerView, setImagesPerView] = useState(3);

  useEffect(() => {
    loadApprovedGalleries();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResize = () => {
    if (window.innerWidth < 768) {
      setImagesPerView(1);
    } else if (window.innerWidth < 1024) {
      setImagesPerView(2);
    } else {
      setImagesPerView(3);
    }
  };

  const loadApprovedGalleries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/approved`
      );

      if (response.ok) {
        const data = await response.json();
        setGalleries(data);
      } else {
        console.error("Failed to load approved galleries");
      }
    } catch (error) {
      console.error("Error loading approved galleries:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (galleries.length > imagesPerView) {
      setCurrentIndex((prev) =>
        prev + imagesPerView >= galleries.length ? 0 : prev + imagesPerView
      );
    }
  };

  const prevSlide = () => {
    if (galleries.length > imagesPerView) {
      setCurrentIndex((prev) =>
        prev - imagesPerView < 0
          ? Math.max(0, galleries.length - imagesPerView)
          : prev - imagesPerView
      );
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index * imagesPerView);
  };

  const visibleGalleries = galleries.slice(
    currentIndex,
    currentIndex + imagesPerView
  );
  const totalSlides = Math.ceil(galleries.length / imagesPerView);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-base-content/70">Loading gallery...</p>
          </div>
        </div>
      </section>
    );
  }

  if (galleries.length === 0) {
    return null; // Don't show section if no approved galleries
  }

  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            📸 Hall Gallery
          </h2>
          <p className="text-lg text-base-content/80 max-w-3xl mx-auto leading-relaxed">
            Discover the vibrant life at Bijoy 24 Hall through moments captured
            by our residents. From cultural events to daily life, these images
            tell the story of our community.
          </p>
        </motion.div>

        {/* Gallery Slider */}
        <div className="relative">
          {/* Main Gallery Container */}
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`grid gap-6 ${
                  imagesPerView === 1
                    ? "grid-cols-1"
                    : imagesPerView === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {visibleGalleries.map((gallery, index) => (
                  <motion.div
                    key={gallery.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Image Container */}
                    <div className="relative overflow-hidden">
                      <img
                        src={gallery.imageUrl}
                        alt={gallery.shortDescription}
                        className="w-full h-80 object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 m-4">
                            <p className="text-sm text-gray-800 font-medium">
                              {gallery.shortDescription.length > 80
                                ? gallery.shortDescription.substring(0, 80) +
                                  "..."
                                : gallery.shortDescription}
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              📅 {gallery.timeOfEvent}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800">
                          {gallery.shortDescription.length > 60
                            ? gallery.shortDescription.substring(0, 60) + "..."
                            : gallery.shortDescription}
                        </h3>
                        <p className="text-sm text-purple-600 font-medium">
                          🎉 {gallery.timeOfEvent}
                        </p>

                        {/* Student Attribution */}
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="text-gray-400">Posted by</span>
                          </p>
                          <p className="text-sm font-medium text-gray-700">
                            {gallery.student?.firstName}{" "}
                            {gallery.student?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {gallery.student?.studentId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          {galleries.length > imagesPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 z-10"
                aria-label="Previous images"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 z-10"
                aria-label="Next images"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Slide Indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  Math.floor(currentIndex / imagesPerView) === index
                    ? "bg-primary scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-base-content/70 mb-6">
            Want to share your memorable moments from Bijoy 24 Hall?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login" className="btn btn-primary btn-lg">
              Join Our Community
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
