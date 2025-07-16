import React from "react";

const TopBar = ({ marquee = {}, content = {} }) => {
  const { data: marqueeData = {} } = marquee;
  const { data: contentData = {} } = content;
  const { active = false, speed = 30 } = marqueeData;
  const { texto = "" } = contentData;

  if (!texto) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden overflow-x-hidden">
      <div className="w-full mx-auto">
        {active ? (
          <div className="overflow-hidden">
            <div
              className="animate-marquee"
              style={{
                animationDuration: `${speed / 2}s`,
              }}
            >
              <div
                className="text-sm font-medium leading-relaxed text-center"
                dangerouslySetInnerHTML={{ __html: texto }}
              />
              <div
                className="text-sm font-medium leading-relaxed text-center"
                dangerouslySetInnerHTML={{ __html: texto }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-2 px-4">
            <div
              className="text-sm font-medium leading-relaxed whitespace-nowrap"
              dangerouslySetInnerHTML={{ __html: texto }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
