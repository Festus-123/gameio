"use client";

// different games components

import { usePathname } from "next/navigation";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

import bounce from "../assets/logos/bounce.png";
import snake from "../assets/logos/snake.png";

type LINKS = {
    name: string, path: string, img: StaticImageData
}

const Home = () => {
    const links: LINKS[] = [
        {name: "Snake", path: "/snake", img: snake },
        {name: "Tic Tac Toe", path: "/tic-tac-toe", img: snake},
        {name: "Matching tiles", path: "/matching-tiles", img: snake},
        {name: "Bounce", path: "/bounce", img: bounce}
    ]

    const pathname = usePathname();

    return (
        <div
            className="w-full h-screen grid grid-cols-2 md:grid-cols-4 items-center place-items-center overflow-hidden bg-blue-700">
            
            { links.map((item, index) => (
                <div
                    key={index}
                    className="p-4">
                        <Link
                            href={item.path}
                            className={`${item.path === pathname && "scale-120" } hover:scale-110`}>
                                <Image 
                                    src={item.img}
                                    alt={item.name}
                                    width={100}
                                    height={100}
                                    className="rounded-full border-3 border-[repeating-linear-gradient(90deg,#22c55e,#22c55e_10px,#166534_10px,#166534_20px)]"
                                />
                                <h1
                                    className="text-2xl md:text-4xl text-shadow-lg font-black text-shadow-white/40">
                                    {item.name}
                                </h1>
                        </Link>


                </div>
            ))}

        </div>
    );
}

export default Home;