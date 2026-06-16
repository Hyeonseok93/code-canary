const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/[0.02] h-16 mt-auto flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-[9px] font-black text-neutral-800 uppercase tracking-[0.6em] select-none">
          © {new Date().getFullYear()} Code Canary Intelligence
        </p>
      </div>
    </footer>
  );
};

export default Footer;
