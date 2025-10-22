export default function Footer() {
  return (
    <footer className="bg-[#0A0E1A] border-t border-[#2D9B96] py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          {/* Logo y nombre */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/logo-icon.png" 
              alt="El Signo Amarillo" 
              className="w-8 h-8 drop-shadow-[0_0_8px_rgba(244,196,48,0.5)]"
            />
            <span className="text-xl font-bold text-[#F4C430]">El Signo Amarillo</span>
          </div>

          {/* Disclaimer sobre Mitos y Leyendas */}
          <p className="text-[#A0A0A0] text-sm max-w-2xl mx-auto">
            <strong className="text-[#4ECDC4]">Mitos y Leyendas</strong> y sus respectivas artes de cartas son propiedad de sus creadores.
          </p>

          {/* Proyecto no oficial */}
          <p className="text-[#A0A0A0] text-xs max-w-2xl mx-auto">
            Este es un proyecto <strong className="text-[#4ECDC4]">no oficial</strong> y <strong className="text-[#4ECDC4]">sin fines de lucro</strong>, creado por fans para fans.
          </p>

          {/* Mensaje de la comunidad */}
          <p className="text-[#4ECDC4] text-sm italic max-w-2xl mx-auto">
            Hecho con la intención de aportar a la comunidad de jugadores del formato Imperio
          </p>
        </div>
      </div>
    </footer>
  );
}

