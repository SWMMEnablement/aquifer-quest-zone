const WaterWaves = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
      <svg
        className="relative w-full h-24 md:h-32"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        {/* Back wave - slowest */}
        <path
          className="animate-wave"
          style={{ animationDuration: '8s' }}
          fill="hsl(195 80% 65% / 0.3)"
          d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z"
        />
        {/* Middle wave */}
        <path
          className="animate-wave"
          style={{ animationDuration: '6s', animationDelay: '-2s' }}
          fill="hsl(200 75% 45% / 0.5)"
          d="M0,80 C240,40 480,100 720,60 C960,20 1200,80 1440,40 L1440,120 L0,120 Z"
        />
        {/* Front wave - fastest */}
        <path
          className="animate-wave"
          style={{ animationDuration: '4s', animationDelay: '-1s' }}
          fill="hsl(var(--background))"
          d="M0,90 C180,70 360,110 540,80 C720,50 900,100 1080,70 C1260,40 1380,90 1440,70 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
};

export default WaterWaves;
