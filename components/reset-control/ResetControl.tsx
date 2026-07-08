"use client";
import { FaRedo } from "react-icons/fa";

const ResetControl = ({ onclick }: {onclick: () => void}) => {
    return (
        <div
            onClick={onclick}
            className="cursor-pointer text-white rounded-full border-double border-white border-2 drop-shadow-xl p-4 text-2xl md:text-4xl">
            <FaRedo />
        </div>
    );
}

export default ResetControl;