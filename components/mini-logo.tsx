import Image from "next/image";
import Link from "next/link";
import HeartI from "@/public/images/Logo.svg";


export default function MiniLogo(){
  return (
    <div className="text-center text-xl font-bold text-gray-800">
      <Link href={"/"} className="flex items-center flex-col">
        <Image 
        src={HeartI}
        alt="MediAlert"
        loading="eager"
        className="w-16"
        />
        <h1>MedAlert</h1>  
      </Link>
    </div>
  );
}