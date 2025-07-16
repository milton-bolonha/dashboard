import React from "react";
import Slider from "react-slick";
import { StarIcon } from "@heroicons/react/24/solid";

const Testimonials = ({ title, testimonials }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 7000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="bg-gray-100 py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          {title}
        </h2>
        <Slider {...settings}>
          {testimonials?.map((testimonial, index) => (
            <div key={index} className="p-4 cursor-grab">
              <div className="bg-white p-8 rounded-lg shadow-lg h-full flex flex-col justify-center items-center text-center">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-6 w-6" />
                  ))}
                </div>
                <p className="text-gray-700 italic text-lg mb-4">
                  "{testimonial.quote}"
                </p>
                {/* Placeholder for author, if you add it later */}
                {/* <p className="font-semibold text-gray-900 mt-4">Author Name</p> */}
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Testimonials;
