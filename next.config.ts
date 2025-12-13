import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar output standalone para despliegues en contenedores (Cloud Run, Docker, etc.)
  // También funciona perfectamente con Vercel
  output: 'standalone',
  
  // Configuración de ESLint para builds de producción
  eslint: {
    // Durante el build, ignorar errores de ESLint (solo mostrar warnings)
    // Esto permite que el build se complete incluso con errores de linting
    ignoreDuringBuilds: true,
  },
  
  // Configuración de TypeScript
  typescript: {
    // Durante el build, ignorar errores de TypeScript
    // Solo usar en producción si es necesario, idealmente arreglar los errores
    ignoreBuildErrors: false, // Mantener false para detectar errores reales de TypeScript
  },
};

export default nextConfig;
