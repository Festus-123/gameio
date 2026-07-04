"use client";

// different games components

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type LINKS = {
    name: string, path: string, img?: string
}

const Home = () => {
    const links: LINKS[] = [
        {name: "Snake", path: "/snake", },
        {name: "Tic Tac Toe", path: "/tic-tac-toe"},
        {name: "Matching tiles", path: "/matching-tiles"},
        {name: "Bon Apetite", path: "/bon-apetite"}
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