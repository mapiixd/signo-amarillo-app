export default function Footer() {
  return (
    <footer className="bg-[#0A0E1A] border-t border-[#2D9B96] py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          

          {/* Acciones: Donaciones y Contacto */}
          <div className="pt-4 space-y-3">
            {/* Link de donaciones */}
            <a
              href="https://link.mercadopago.cl/signoamarillo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D9B96]/20 hover:bg-[#2D9B96]/30 border border-[#2D9B96] rounded-lg text-[#4ECDC4] hover:text-[#2D9B96] transition-colors duration-200 text-sm font-medium"
            >
              <span>💝</span>
              <span>Donaciones voluntarias</span>
              <span className="text-xs opacity-70">(Hosting, CDN, dominio, etc.)</span>
            </a>

            {/* Contacto de soporte */}
            <p className="text-[#A0A0A0] text-xs max-w-2xl mx-auto">
              Para reportar errores o sugerir mejoras:{' '}
              <a
                href="mailto:soporte.signoamarillo@gmail.com"
                className="text-[#4ECDC4] hover:text-[#2D9B96] transition-colors underline"
              >
                soporte.signoamarillo@gmail.com
              </a>
            </p>
          </div>

          {/* Mensaje de la comunidad y Disclaimers legales */}
            {/* Mensaje de la comunidad */}
            <p className="text-[#4ECDC4] text-sm italic max-w-2xl mx-auto">
              Hecho para ayudar a la comunidad de jugadores del formato Imperio.
            </p>

            {/* Proyecto no oficial */}
            <p className="text-[#A0A0A0] text-xs max-w-2xl mx-auto">
              Este es un proyecto <strong className="text-[#4ECDC4]">no oficial</strong> y <strong className="text-[#4ECDC4]">sin fines de lucro</strong>, creado por fans para fans.
            </p>

            {/* Disclaimer sobre Mitos y Leyendas */}
            <p className="text-[#A0A0A0] text-xs max-w-2xl mx-auto">
              <strong className="text-[#4ECDC4]">Mitos y Leyendas</strong> y sus respectivas artes de cartas son propiedad de sus creadores.
            </p>

            {/* Copyright */}
            <p className="text-[#A0A0A0] text-xs max-w-2xl mx-auto pt-2">
              © {new Date().getFullYear()} El Signo Amarillo. Todos los derechos reservados.
            </p>
        </div>
      </div>
    </footer>
  );
}

