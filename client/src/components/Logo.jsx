export default function Logo({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M27 30 L50 74 L73 30" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="17" r="7" fill="#F97316" />
    </svg>
  );
}
