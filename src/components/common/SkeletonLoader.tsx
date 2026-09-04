import React from 'react';

interface SkeletonLoaderProps {
  type: 'grid' | 'list' | 'watch' | 'channel' | 'short';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 8 }) => {
  if (type === 'watch') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="w-full aspect-video bg-[#161B26] rounded-2xl" />
          <div className="w-3/4 h-6 bg-[#161B26] rounded-md" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#161B26]" />
              <div className="space-y-1.5">
                <div className="w-32 h-4 bg-[#161B26] rounded" />
                <div className="w-20 h-3 bg-[#161B26] rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-24 h-10 bg-[#161B26] rounded-full" />
              <div className="w-24 h-10 bg-[#161B26] rounded-full" />
            </div>
          </div>
          <div className="w-full h-32 bg-[#161B26] rounded-2xl mt-4" />
        </div>

        {/* Sidebar Related Videos */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-40 h-24 bg-[#161B26] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="w-full h-4 bg-[#161B26] rounded" />
                <div className="w-2/3 h-3 bg-[#161B26] rounded" />
                <div className="w-1/2 h-3 bg-[#161B26] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-4 p-3 rounded-2xl bg-[#161B26]/40">
            <div className="w-full sm:w-80 h-44 bg-[#161B26] rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="w-3/4 h-5 bg-[#161B26] rounded" />
              <div className="w-1/3 h-3 bg-[#161B26] rounded" />
              <div className="flex items-center gap-2 pt-2">
                <div className="w-6 h-6 rounded-full bg-[#161B26]" />
                <div className="w-28 h-3 bg-[#161B26] rounded" />
              </div>
              <div className="w-full h-3 bg-[#161B26] rounded mt-2" />
              <div className="w-5/6 h-3 bg-[#161B26] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default Grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="w-full aspect-video bg-[#161B26] rounded-2xl" />
          <div className="flex gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#161B26] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-full h-4 bg-[#161B26] rounded" />
              <div className="w-3/4 h-3 bg-[#161B26] rounded" />
              <div className="w-1/2 h-3 bg-[#161B26] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
