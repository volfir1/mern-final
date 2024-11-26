import react from "react";
import "ldrs/tailChase";

// Default values shown
const LoadingFallBack = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <l-tail-chase
        size="40"
        speed="1.75"
        color="rgb(239 68 68)"
      ></l-tail-chase>
      ;
    </div>
  );
};

export default LoadingFallBack;
