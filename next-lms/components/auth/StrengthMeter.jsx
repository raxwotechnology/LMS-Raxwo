export default function StrengthMeter({ password = '' }) {
  if (!password) {
    return null;
  }

  // Calculate password strength (1 to 4)
  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

    // Minimum score of 1 if password has any characters
    return Math.max(1, Math.min(4, score));
  };

  const strength = calculateStrength(password);

  const configs = {
    1: {
      label: 'Too weak',
      colorClass: 'bg-brand-error',
      textColorClass: 'text-brand-error',
    },
    2: {
      label: 'Weak',
      colorClass: 'bg-orange-500',
      textColorClass: 'text-orange-500',
    },
    3: {
      label: 'Good',
      colorClass: 'bg-yellow-500',
      textColorClass: 'text-yellow-600 dark:text-yellow-400',
    },
    4: {
      label: 'Strong',
      colorClass: 'bg-brand-success',
      textColorClass: 'text-brand-success',
    },
  };

  const current = configs[strength];

  return (
    <div className="w-full mt-2" aria-live="polite" aria-atomic="true">
      {/* 4 segments */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((segIndex) => (
          <div
            key={segIndex}
            className={`h-full rounded-full transition-colors duration-200 ${
              segIndex <= strength
                ? current.colorClass
                : 'bg-brand-border/60 dark:bg-brand-darkBorder/60'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex justify-between items-center mt-1.5 text-xs">
        <span className="text-brand-muted dark:text-brand-darkText/60">
          Password strength
        </span>
        <span className={`font-semibold ${current.textColorClass}`}>
          {current.label}
        </span>
      </div>
    </div>
  );
}
