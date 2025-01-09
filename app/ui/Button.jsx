export default function Button({ onClick, children }) {
  return (
    <button
      className={`btn btn-accent btn-outline w-full md:btn-wide tracking-wider text-slate-700`}
      disabled={false}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
