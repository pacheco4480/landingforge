"use client";

import * as React from "react";

export function FaqAccordion({
  items,
  sectionId,
}: {
  items: Array<{ question: string; answer: string }>;
  sectionId: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="mt-8 divide-y divide-[var(--public-border)] border-y border-[var(--public-border)]">
      {items.map((item, index) => {
        const answerId = `faq-${sectionId}-${index}-answer`;
        const open = openIndex === index;
        return (
          <article className="py-1" key={`${sectionId}-${index}`}>
            <h3>
              <button
                aria-controls={answerId}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center justify-between gap-6 py-4 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--public-primary)]"
                id={`faq-${sectionId}-${index}-question`}
                onClick={() => setOpenIndex(open ? null : index)}
                type="button"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="text-xl text-[var(--public-primary)]"
                >
                  {open ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              aria-labelledby={`faq-${sectionId}-${index}-question`}
              hidden={!open}
              id={answerId}
            >
              <p className="max-w-3xl pr-10 pb-5 leading-7 text-[var(--public-muted)]">
                {item.answer}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
