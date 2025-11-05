"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import GallerySection from "../components/GallerySection";
import {
  getCurrentUser,
  removeTokenFromStorage,
  isAuthenticated,
} from "../utils/auth";
import { getAvatarImageUrl } from "../utils/profileImage";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      setCurrentUser(user);

      // If user is a student, fetch their profile data
      if (user && user.userType === "Student") {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/students/current`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setStudent(data);
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
    }
  };

  const handleLogout = () => {
    removeTokenFromStorage();
    setCurrentUser(null);
    setStudent(null);
    window.location.href = "/";
  };

  const handleProfileClick = () => {
    if (currentUser?.userType === "Student") {
      window.location.href = "/student/dashboard";
    } else if (currentUser?.userType === "Admin") {
      window.location.href = "/admin/dashboard";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const features = [
    {
      icon: "🏠",
      title: "Digital Room Allotment",
      description:
        "Automated room allocation system with real-time availability tracking",
    },
    {
      icon: "📝",
      title: "Complaint Management",
      description:
        "Streamlined complaint submission and resolution tracking system",
    },
    {
      icon: "💳",
      title: "Fee Management",
      description:
        "Transparent fee collection with digital receipts and payment tracking",
    },
    {
      icon: "📊",
      title: "Admin Dashboard",
      description:
        "Comprehensive management interface for hall operations and analytics",
    },
  ];

  const stats = [
    { number: "500+", label: "Students" },
    { number: "100+", label: "Rooms" },
    { number: "24/7", label: "Support" },
    { number: "99%", label: "Uptime" },
  ];

  return (
    <main className="min-h-screen bg-base-100">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="navbar bg-base-100/95 backdrop-blur-md fixed top-0 z-50 shadow-sm"
      >
        <div className="navbar-start">
          <div className="text-xl font-bold text-primary">Bijoy 24 Hall</div>
        </div>
        <div className="navbar-end">
          {currentUser ? (
            // Logged in - Show profile image and logout
            <div className="flex items-center gap-3">
              <div
                className="avatar cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
                title="Go to Dashboard"
              >
                <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={getAvatarImageUrl(student?.profileImageUrl)}
                    alt="Profile"
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </div>
          ) : (
            // Not logged in - Show login and register buttons
            <div className="flex gap-2">
              <a href="/login" className="btn btn-ghost btn-sm">
                Login
              </a>
              <a href="/register" className="btn btn-primary btn-sm">
                Register
              </a>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center bg-no-repeat">
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-maroon-900/60"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-10 left-10 w-32 h-32 bg-maroon-500/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-20 right-20 w-48 h-48 bg-maroon-400/10 rounded-full blur-xl"
          />
        </div>

        {/* Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-tight">
              <span className="block">Bijoy 24 Hall</span>
              <span className="block text-3xl md:text-4xl lg:text-5xl text-maroon-200 font-normal mt-2">
                Management System
              </span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Experience the future of hall management at Patuakhali Science and
              Technology University. Our digital platform revolutionizes student
              accommodation with seamless room allotment, transparent fee
              management, and efficient complaint resolution.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Student Portal
            </motion.a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-outline btn-lg text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-primary shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Admin Dashboard
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-maroon-200 text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              About Bijoy 24 Hall
            </h2>
            <p className="text-lg text-base-content/80 max-w-4xl mx-auto leading-relaxed">
              Bijoy 24 Hall stands as a premier residential facility at
              Patuakhali Science and Technology University (PSTU), Bangladesh.
              Named to commemorate the historic Victory Day of Bangladesh, this
              modern hall provides a comfortable and conducive living
              environment for students pursuing higher education in science and
              technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-primary mb-4">
                Our Heritage
              </h3>
              <p className="text-base-content/80 mb-6 leading-relaxed">
                Located in the heart of PSTU campus in Dumki, Patuakhali, Bijoy
                24 Hall serves as more than just accommodation. It&apos;s a
                community where future scientists, engineers, and technologists
                build lifelong friendships and memories. The hall maintains the
                highest standards of safety, cleanliness, and academic
                environment.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Modern infrastructure with 24/7 security</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>High-speed internet and study facilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Recreational and sports facilities</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-base-100 p-8 rounded-2xl shadow-lg"
            >
              <h3 className="text-2xl font-bold text-primary mb-4">
                Digital Transformation
              </h3>
              <p className="text-base-content/80 mb-6 leading-relaxed">
                Our management system represents a significant leap forward in
                hall administration, replacing traditional paper-based processes
                with efficient digital solutions. This ensures transparency,
                reduces bureaucracy, and enhances the overall student
                experience.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-sm text-base-content/70">
                    Digital Process
                  </div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-base-content/70">
                    Online Access
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <GallerySection />

      {/* Features Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Modern Features
            </h2>
            <p className="text-lg text-base-content/80 max-w-3xl mx-auto">
              Experience seamless hall management with our comprehensive digital
              platform designed for the modern student.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-base-200 p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-base-content/80 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join the digital revolution in hall management. Register today and
              experience the future of student accommodation.
            </p>
            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-accent btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Register Now
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">
                Bijoy 24 Hall
              </h3>
              <p className="text-base-content/80 leading-relaxed">
                Patuakhali Science and Technology University
                <br />
                Dumki, Patuakhali-8602
                <br />
                Bangladesh
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <a
                  href="/login"
                  className="block text-base-content/80 hover:text-primary transition-colors"
                >
                  Student Login
                </a>
                <a
                  href="/register"
                  className="block text-base-content/80 hover:text-primary transition-colors"
                >
                  Registration
                </a>
                <a
                  href="/login"
                  className="block text-base-content/80 hover:text-primary transition-colors"
                >
                  Admin Portal
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">Contact</h3>
              <div className="space-y-2 text-base-content/80">
                <p>📞 +880-XXX-XXXXXXX</p>
                <p>📧 bijoy24hall@pstu.ac.bd</p>
                <p>🌐 www.pstu.ac.bd</p>
              </div>
            </div>
          </div>
          <div className="border-t border-base-content/20 mt-8 pt-8 text-center">
            <p className="text-base-content/60">
              © 2025 Bijoy 24 Hall Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
