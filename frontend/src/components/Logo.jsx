export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-lg font-extrabold text-black">
        ₹
      </div>
      <div className="leading-none">
        <span className="text-lg font-extrabold tracking-tight text-white">Fees</span>
        <span className="text-lg font-extrabold tracking-tight text-brand-accent">Up</span>
      </div>
    </div>
  );
}
