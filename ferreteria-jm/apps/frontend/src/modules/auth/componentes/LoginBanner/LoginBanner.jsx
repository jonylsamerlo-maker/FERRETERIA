import { useEffect, useState } from "react";
import "./LoginBanner.css";

const LOGIN_IMAGES = [
  {
    src: "/img/login/login-herramientas.webp",
    alt: "Herramientas de ferreteria",
  },
  {
    src: "/img/login/login-pinturas.webp",
    alt: "Pinturas y accesorios",
  },
  {
    src: "/img/login/login-ofertas.webp",
    alt: "Ofertas de ferreteria",
  },
  {
    src: "/img/login/login-proyectos.webp",
    alt: "Proyectos para el hogar",
  },
];

function LoginBanner() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intervalId = null;

    const startRotation = () => {
      if (intervalId !== null) return;

      intervalId = window.setInterval(() => {
        setActiveImage((currentImage) => (
          (currentImage + 1) % LOGIN_IMAGES.length
        ));
      }, 10000);
    };

    const stopRotation = () => {
      if (intervalId === null) return;

      window.clearInterval(intervalId);
      intervalId = null;
    };

    const handleReducedMotionChange = (event) => {
      if (event.matches) {
        stopRotation();
        return;
      }

      startRotation();
    };

    handleReducedMotionChange(reducedMotionQuery);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      stopRotation();
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  return (
    <aside className="login-banner" aria-label="Promociones de Ferreteria JM">
      {LOGIN_IMAGES.map((image, index) => (
        <img
          key={image.src}
          className={`login-banner__image${index === activeImage ? " login-banner__image--active" : ""}`}
          src={image.src}
          alt={image.alt}
        />
      ))}
    </aside>
  );
}

export default LoginBanner;
