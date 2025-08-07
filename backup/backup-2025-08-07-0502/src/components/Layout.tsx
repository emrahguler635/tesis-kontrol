import React, { ReactNode, useEffect, useState } from 'react'
import { Navbar } from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ekran boyutuna göre dinamik padding ve spacing
  const getResponsiveClasses = () => {
    const { width, height } = screenSize;
    
    // Küçük ekranlar (mobil)
    if (width < 768) {
      return {
        container: "h-screen w-screen bg-gray-50 flex flex-col relative overflow-hidden",
        main: "flex-1 overflow-y-auto overflow-x-hidden relative z-10",
        content: "p-2 h-full overflow-y-auto"
      };
    }
    
    // Orta ekranlar (tablet)
    if (width < 1024) {
      return {
        container: "h-screen w-screen bg-gray-50 flex flex-col relative overflow-hidden",
        main: "flex-1 overflow-y-auto overflow-x-hidden relative z-10",
        content: "p-4 h-full overflow-y-auto"
      };
    }
    
    // Büyük ekranlar (desktop)
    if (width < 1440) {
      return {
        container: "h-screen w-screen bg-gray-50 flex flex-col relative overflow-hidden",
        main: "flex-1 overflow-y-auto overflow-x-hidden relative z-10",
        content: "p-6 h-full overflow-y-auto"
      };
    }
    
    // Çok büyük ekranlar (4K+)
    return {
      container: "h-screen w-screen bg-gray-50 flex flex-col relative overflow-hidden",
      main: "flex-1 overflow-y-auto overflow-x-hidden relative z-10",
      content: "p-8 h-full overflow-y-auto"
    };
  };

  const classes = getResponsiveClasses();

  return (
    <div className={classes.container}>
      {/* Belediye Binası Arka Plan Resmi */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/belediye.jpg?v=1.0&cb=1&nocache=1&force=1&refresh=1&cache=1&timestamp=1&version=2.0)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translate3d(0,0,0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100vw',
          height: '100vh',
          opacity: '0.15',
          filter: 'blur(0.5px)'
        }}
      />
      
      {/* Force load image once */}
      <img 
        src={`/belediye.jpg?v=1.0&cb=1&nocache=1&force=1&refresh=1&cache=1&timestamp=1&version=2.0`}
        alt="" 
        style={{ 
          position: 'absolute', 
          top: '-9999px', 
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: '0'
        }} 
      />
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/80 z-5"></div>
      
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <main className={classes.main}>
          <div className={classes.content}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 