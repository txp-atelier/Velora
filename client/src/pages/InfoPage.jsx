import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronDown, FileQuestion } from "lucide-react";
import { INFO_PAGES } from "../data/infoContent";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";

export default function InfoPage() {
  const { slug } = useParams();
  const page = INFO_PAGES[slug];

  if (!page) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        message="That page doesn't exist or may have moved."
        action={<Button variant="primary" to="/">Go home</Button>}
      />
    );
  }

  return (
    <div className="info-page">
      <h1>{page.title}</h1>
      {page.updated && <p className="text-secondary page-subtitle">{page.updated}</p>}

      {page.type === "faq" ? (
        <FaqAccordion items={page.items} />
      ) : (
        <div className="info-sections">
          {page.sections.map((s) => (
            <section key={s.heading} className="info-section">
              <h2>{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
      )}

      <p className="info-contact-note">
        Still have questions? Reach us at <a href="mailto:support@velora.in">support@velora.in</a> or see our{" "}
        <Link to="/info/faqs">FAQs</Link>.
      </p>
    </div>
  );
}

function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className={`faq-item card ${open ? "open" : ""}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => setOpenIndex(open ? -1 : i)}
              aria-expanded={open}
            >
              <span>{item.q}</span>
              <ChevronDown size={18} className="faq-chevron" />
            </button>
            {open && <p className="faq-answer">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
