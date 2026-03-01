import React from 'react';

const Loading = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
    <span className="ml-3 text-primary-600 font-medium">Loading...</span>
  </div>
);

export default Loading;
