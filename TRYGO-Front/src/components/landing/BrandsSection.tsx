
import { FC } from 'react';

const BrandsSection: FC = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <p className="text-center text-gray-500 mb-8">Trusted by founders from</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          {["Google", "Microsoft", "Amazon", "Airbnb", "Uber"].map((brand) => (
            <div key={brand} className="text-gray-400 text-xl font-bold">{brand}</div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
