import Image from "next/image";
import Link from "next/link";

const Hero = ({ title, subtitle }) => {
  return (
    <div className="px-10 lg:-mt-[110px] hero min-h-screen flex justify-evenly items-center">
      <div className="flex flex-col hero-content text-center lg:text-left">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="py-6">{subtitle}</p>
        </div>
      </div>
      <div>
        <Image
          src={"/logo.png"}
          width={400}
          height={400}
          className="hidden lg:block -mt-16"
        />
      </div>
    </div>
  );
};

export default Hero;
