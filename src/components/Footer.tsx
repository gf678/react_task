// src/components/Footer.tsx
const Footer = () => { 
  return (
    <footer className="px-4 pb-6 pt-2"> 
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div> 
          <p className="font-medium text-gray-800">Board Hub</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            2026 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <a
            href="#"
            className="transition hover:text-pink-500"
          >
            Terms
          </a>
          <a
            href="#"
            className="transition hover:text-pink-500"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
