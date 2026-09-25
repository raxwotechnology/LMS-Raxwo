import Image from 'next/image';

export default function BrandPanel() {
  const currentYear = new Date().getFullYear();

  return (
    <aside className="relative hidden split:flex split:w-[44%] min-h-screen bg-brand-navy flex-col justify-between p-8 xl:p-14 overflow-hidden select-none">
      {/* Top: Logo + Brand Title */}
      <div className="flex items-center gap-3.5 z-10">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1.5 shadow-md shrink-0">
          <Image
            src="/logo.png"
            alt="Wisdom Institute Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <span className="text-white font-bold text-lg xl:text-xl tracking-wider uppercase">
          Wisdom Institute
        </span>
      </div>

      {/* Middle: Headline & Supporting Text */}
      <div className="my-auto py-12 max-w-md z-10">
        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/90 mb-6 backdrop-blur-sm">
          Official Student Portal
        </div>
        <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
          Your classes, results and schedule in one place.
        </h1>
        <p className="text-brand-soft/80 text-base leading-relaxed">
          Manage your academic journey with seamless access to course enrollments,
          attendance records, and examination performance.
        </p>
      </div>

      {/* Bottom: Copyright */}
      <div className="text-xs text-white/60 z-10">
        © {currentYear} Wisdom Institute. All rights reserved.
      </div>

      {/* Decorative Stepped-Line SVG echoing the logo chevrons and geometry */}
      <div
        className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none opacity-15 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Echoing the geometric stepped angles and chevrons */}
          <path
            d="M50 250 L120 180 L180 240 L260 160"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M80 280 L150 210 L210 270 L290 190"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M110 310 L180 240 L240 300 L320 220"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Stepped chevron markers */}
          <path
            d="M230 110 L250 90 L270 110"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M230 135 L250 115 L270 135"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </aside>
  );
}
