import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "./ui/Button";

// Real lifestyle photography (people actually using/wearing the product),
// not stock-gradient product cutouts — the look Indian marketplaces
// (Meesho, Amazon.in, Myntra) use, rather than a SaaS-style hero card.
//
// Most slides use brand-supplied creative that already has its own
// headline/CTA baked into the image — those render `preDesigned`: no scrim
// or Velora text overlay on top (which would double up against the image's
// own copy), and the image is letterboxed (blurred cover backdrop + a sharp
// `contain` copy on top) rather than cropped, since we don't control where
// the brand placed its text and can't risk cutting it off at odd aspect
// ratios. Only the Fashion slide is a plain lifestyle photo, so it keeps
// the full-bleed `cover` + scrim + Velora copy treatment.
const slides = [
  {
    eyebrow: "Fashion",
    title: "Saree & Ethnic Wear",
    badge: "Flat 50% OFF",
    subtitle: "Festive styles everyone's shopping this week",
    cta: "Shop Ethnic Wear",
    link: "/?category=Fashion",
    tint: "tint-rose",
    image: "https://vaarahisilks.com/cdn/shop/articles/Home_Banner_B_1920_x_960_FHD_a97ef6ee-702c-45ad-9f8c-ca7d7cef9378.webp?v=1761669641",
    focus: "62% 22%",
    mirror: true,
  },
  {
    eyebrow: "Electronics",
    title: "Audio & Gadgets Fest",
    link: "/?category=Electronics",
    image: "https://www.fireboltt.com/cdn/shop/articles/imgpsh_fullsize_anim.png?v=1668531575",
    preDesigned: true,
    alt: "Fire-Boltt, India's No.1 smartwatch brand, with Mahendra Singh Dhoni — shop electronics",
  },
  {
    eyebrow: "Home & Kitchen",
    title: "Kitchen Must-Haves",
    link: "/?category=Home%20%26%20Kitchen",
    image: "https://bossindia.com/wp-content/uploads/2025/11/Blog-psbb.jpg",
    preDesigned: true,
    alt: "The ultimate guide to must-have kitchen appliances — shop kitchen essentials",
  },
  {
    eyebrow: "Sports",
    title: "Gear Up & Go",
    link: "/?category=Sports",
    image: "https://a2cricket.com/cdn/shop/files/A2_Player_Banner_v2_1800x.png?v=1785488129",
    preDesigned: true,
    alt: "A2 Cricket — trusted by 40+ international & national players, shop sports gear",
  },
  {
    eyebrow: "Beauty",
    title: "Glow Up Sale",
    link: "/?category=Beauty",
    image: "https://lovechild.in/cdn/shop/files/Serum_Skin_Tint_Banners-01.jpg?v=1784701608&width=5760",
    preDesigned: true,
    alt: "Lovechild Skip Everything 4-in-1 Serum Skin Tint, best seller — shop beauty essentials",
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
          <div key={slide.title} className="spotlight-slide">
            {slide.preDesigned ? (
              <>
                {/* Blurred cover copy fills the frame; the sharp image sits on top
                    with `contain` so brand creative is never cropped, at any
                    aspect ratio the banner happens to render at. */}
                <img className="spotlight-bg-blur" src={slide.image} alt="" aria-hidden="true" loading="lazy" />
                <img className="spotlight-bg-img contain" src={slide.image} alt={slide.alt} loading="lazy" />
                <span className="spotlight-edge-fade left" aria-hidden="true" />
                <span className="spotlight-edge-fade right" aria-hidden="true" />
                <Link className="spotlight-slide-link" to={slide.link} aria-label={slide.title} />
              </>
            ) : (
              <>
                <img
                  className="spotlight-bg-img"
                  src={slide.image}
                  alt=""
                  style={{ objectPosition: slide.focus, transform: slide.mirror ? "scaleX(-1)" : undefined }}
                  loading="lazy"
                />
                <div className={`spotlight-scrim ${slide.tint}`} aria-hidden="true" />
                <div className="spotlight-content">
                  <span className="spotlight-badge">{slide.badge}</span>
                  <span className="spotlight-eyebrow">{slide.eyebrow}</span>
                  <h2>{slide.title}</h2>
                  <p className="spotlight-subtitle">{slide.subtitle}</p>
                  <Button variant="accent" className="spotlight-cta" to={slide.link}>
                    {slide.cta} <ArrowRight size={16} className="spotlight-cta-arrow" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button className="spotlight-arrow prev" onClick={prev} aria-label="Previous slide">
        <ArrowLeft size={20} />
      </button>
      <button className="spotlight-arrow next" onClick={next} aria-label="Next slide">
        <ArrowRight size={20} />
      </button>

      <div className="spotlight-dots" role="tablist" aria-label="Slides">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            className={`spotlight-dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
          />
        ))}
      </div>
    </section>
  );
}
