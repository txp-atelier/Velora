import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h4>About Velora</h4>
          <p>Velora is India's trusted marketplace for electronics, fashion, home essentials, and more. We connect quality sellers with smart shoppers.</p>
        </div>
        <div className="footer-col">
          <h4>Help</h4>
          <ul>
            <li><Link to="/dashboard">Track Your Order</Link></li>
            <li><Link to="/info/returns">Returns & Refunds</Link></li>
            <li><Link to="/info/faqs">FAQs</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Policies</h4>
          <ul>
            <li><Link to="/info/privacy">Privacy Policy</Link></li>
            <li><Link to="/info/terms">Terms of Service</Link></li>
            <li><Link to="/info/shipping">Shipping Policy</Link></li>
            <li><Link to="/info/seller-guidelines">Seller Guidelines</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>support@velora.in</li>
            <li>1800-VELORA (Mon–Sat, 9am–6pm)</li>
            <li>Madurai, Tamil Nadu, India</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Velora. All rights reserved.</p>
      </div>
    </footer>
  );
}
