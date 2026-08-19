import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "./ui/Button";

const slides = [
  {
    eyebrow: "Electronics",
    title: "boAt Audio Fest",
    accent: "Ends in 2 days",
    subtitle: "Up to 60% off on headphones & earbuds",
    cta: "Shop Audio",
    link: "/?category=Electronics",
    bg: "spot-indigo",
    image: "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp",
  },
  {
    eyebrow: "Fashion",
    title: "Seasonal Style Drop",
    accent: "Flash sale",
    subtitle: "Extra 20% off new-season fashion",
    cta: "Explore Fashion",
    link: "/?category=Fashion",
    bg: "spot-rose",
    image: "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/2.webp",
  },
  {
    eyebrow: "New In",
    title: "New Arrivals",
    accent: "Just landed",
    subtitle: "Fresh tech and home picks, just landed",
    cta: "See What's New",
    link: "/?sort=newest",
    bg: "spot-emerald",
    image: "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp",
  },
  {
    eyebrow: "Home",
    title: "Home Essentials",
    accent: "Up to 50% off",
    subtitle: "Kitchen & living upgrades from ₹499",
    cta: "Shop Home",
    link: "/?category=Home%20%26%20Kitchen",
    bg: "spot-sky",
    image: "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/3.webp",
  },
  {
    eyebrow: "Sports",
    title: "Fitness Goals",
    accent: "New season",
    subtitle: "Sports gear starting at ₹699",
    cta: "Get Active",
    link: "/?category=Sports",
    bg: "spot-orange",
    image: "https://cdn.dummyjson.com/product-images/sports-accessories/football/1.webp",
  },
];

export default function HomeBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      className="home-banner"
      aria-label="Promotional banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="spotlight-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div key={slide.title} className={`spotlight-slide ${slide.bg}`}>
            <div className="spotlight-top">
              <span className="spotlight-eyebrow">{slide.eyebrow}</span>
              <span className="spotlight-page">
                {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>
            <div className="spotlight-body">
              <div className="spotlight-content">
                <h2>{slide.title}</h2>
                <p className="spotlight-accent">{slide.accent}</p>
                <p className="spotlight-subtitle">{slide.subtitle}</p>
                <Button variant="accent" className="spotlight-cta" to={slide.link}>
                  {slide.cta} <ArrowRight size={16} className="spotlight-cta-arrow" />
                </Button>
              </div>
              <div className="spotlight-visual">
                <span className="spotlight-halo" aria-hidden="true" />
                <img className="spotlight-slide-img" src={slide.image} alt="" loading="lazy" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="spotlight-nav">
        <button className="spotlight-nav-btn prev" onClick={prev} aria-label="Previous slide">
          <ArrowLeft size={18} />
        </button>
        <button className="spotlight-nav-btn next" onClick={next} aria-label="Next slide">
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
