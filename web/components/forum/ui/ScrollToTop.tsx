import React, { useState, useEffect, useRef } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import '../style/ScrollToTop.css';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (window.pageYOffset > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }, 100); // debounce 100ms
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="scroll-to-top"
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
        >
          <div className="scroll-icon-wrapper">
            <FiChevronUp size={28} />
          </div>
          <div className="scroll-ripple"></div>
        </button>
      )}
    </>
  );
};

export default ScrollToTop; 