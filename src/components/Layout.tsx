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
        container: "min-h-screen bg-gray-50 flex flex-col",
        main: "flex-1 overflow-y-auto overflow-x-hidden",
        content: "p-2"
      };
    }
    
    // Orta ekranlar (tablet)
    if (width < 1024) {
      return {
        container: "min-h-screen bg-gray-50 flex flex-col",
        main: "flex-1 overflow-y-auto overflow-x-hidden",
        content: "p-4"
      };
    }
    
    // Büyük ekranlar (desktop)
    if (width < 1440) {
      return {
        container: "min-h-screen bg-gray-50 flex flex-col",
        main: "flex-1 overflow-y-auto overflow-x-hidden",
        content: "p-6"
      };
    }
    
    // Çok büyük ekranlar (4K+)
    return {
      container: "min-h-screen bg-gray-50 flex flex-col",
      main: "flex-1 overflow-y-auto overflow-x-hidden",
      content: "p-8"
    };
  };

  const classes = getResponsiveClasses();

  return (
    <div className={classes.container}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
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