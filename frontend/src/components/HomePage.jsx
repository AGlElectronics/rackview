import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop',
      title: 'Infrastructure Enthusiast',
      description: 'Building resilient, automated systems in my personal data center.',
      button: { text: 'Explore The Setup', link: '/gear' }
    },
    {
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop',
      title: '10 Gigabit Core',
      description: 'High-speed networking and 24/7 uptime reliability.',
      highlight: 'Speed meets Stability.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating) {
        setSlideIndex((prev) => (prev + 1) % slides.length);
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isAnimating, slides.length]);

  const goToSlide = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideIndex(index);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  return (
    <div className="home-page">
      <div className="slideshow-container">
        <div className="slides-stack">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`mySlides ${index === slideIndex ? 'active' : ''} ${index === (slideIndex - 1 + slides.length) % slides.length ? 'fade-out' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="slide-content">
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                {slide.button && (
                  <Link to={slide.button.link} className="btn-start">
                    {slide.button.text}
                  </Link>
                )}
                {slide.highlight && (
                  <span>{slide.highlight}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <a className="prev" onClick={prevSlide}>&#10094;</a>
        <a className="next" onClick={nextSlide}>&#10095;</a>

        <div className="dots-container">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === slideIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            ></span>
          ))}
        </div>
      </div>

      <section className="intro-section">
        <h2>Welcome to the Lab</h2>
        <p>Documenting the journey from a single Raspberry Pi to a fully functional home data center.</p>
        
        <div className="feature-links">
          <Link to="/gear" className="feature-link">
            <h3>⚙️ Hardware</h3>
            <p>Check out the specs on my servers, storage, and network equipment.</p>
          </Link>
          <Link to="/network-map" className="feature-link">
            <h3>🔗 Network Map</h3>
            <p>Visualize network topology and device connections.</p>
          </Link>
        </div>
      </section>

      <footer>
        <p>&copy; {new Date().getFullYear()} MyHomelab.</p>
      </footer>
    </div>
  );
}

export default HomePage;
