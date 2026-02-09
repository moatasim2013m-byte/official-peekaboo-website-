// Credit card brand icons for payment buttons
// Visa and Mastercard SVG icons - lightweight inline components

export const VisaIcon = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <rect fill="#1565C0" width="48" height="48" rx="6" />
    <polygon fill="#FFFFFF" points="19.5,31 21.9,17 25.6,17 23.2,31" />
    <path
      fill="#FFFFFF"
      d="M33.6,17.3c-0.7-0.3-1.9-0.6-3.3-0.6c-3.6,0-6.2,1.8-6.2,4.4c0,1.9,1.8,3,3.2,3.7c1.4,0.7,1.9,1.1,1.9,1.7
      c0,0.9-1.1,1.3-2.2,1.3c-1.5,0-2.3-0.2-3.5-0.7l-0.5-0.2L22.5,30c0.9,0.4,2.5,0.7,4.1,0.7c3.9,0,6.4-1.8,6.4-4.5
      c0-1.5-1-2.7-3.1-3.6c-1.3-0.6-2.1-1-2.1-1.7c0-0.6,0.7-1.2,2.1-1.2c1.2,0,2.1,0.2,2.8,0.5l0.3,0.1L33.6,17.3z"
    />
    <path
      fill="#FFFFFF"
      d="M38.4,17h-2.8c-0.9,0-1.5,0.2-1.9,1.1l-5.4,12.2h3.8l0.8-2h4.6l0.4,2H41L38.4,17z M33.6,25.8
      c0.3-0.8,1.5-3.7,1.5-3.7c0,0,0.3-0.8,0.5-1.3l0.3,1.2l0.9,3.8H33.6z"
    />
    <path
      fill="#FFFFFF"
      d="M16.5,17l-3.6,9.5l-0.4-1.9c-0.7-2.2-2.8-4.6-5.1-5.8l3.3,12.1h3.9l5.8-14H16.5z"
    />
    <path
      fill="#FFC107"
      d="M10.3,17H4.4L4.3,17.3c4.6,1.1,7.6,3.8,8.9,7.1l-1.3-6.2C11.7,17.3,11.1,17.1,10.3,17z"
    />
  </svg>
);

export const MastercardIcon = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <rect fill="#3F51B5" width="48" height="48" rx="6" />
    <circle fill="#E91E63" cx="19" cy="24" r="10" />
    <circle fill="#FF9800" cx="29" cy="24" r="10" />
    <path
      fill="#FF5722"
      d="M24,16.9c-2.4,1.7-4,4.5-4,7.6s1.5,5.9,4,7.6c2.4-1.7,4-4.5,4-7.6S26.4,18.6,24,16.9z"
    />
  </svg>
);

// Combined component for displaying both card icons
export const PaymentCardIcons = ({ className = "" }) => (
  <span 
    className={`inline-flex items-center gap-1 shrink-0 ${className}`}
    aria-hidden="true"
  >
    <VisaIcon className="h-[18px] w-auto sm:h-5" />
    <MastercardIcon className="h-[18px] w-auto sm:h-5" />
  </span>
);

export default PaymentCardIcons;
