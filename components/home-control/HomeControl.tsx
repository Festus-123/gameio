"use client";

import Link from "next/link";
import { FaHome } from "react-icons/fa";

const HomeControl = () => {
    return (
        <div
            className="text-white rounded-full border-double border-white border-2 drop-shadow-xl p-4 text-2xl md:text-4xl">
            <Link
                href={"/"}>
                    <FaHome />
            </Link>
        </div>
    );
}

export default HomeControl;