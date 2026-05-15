import { useState } from "react";
import { skinImages } from "../assets/images";

type HomeScreenProps = {
    playerName: string;
    setPlayerName: (value: string) => void;
    selectedSkin: string;
    setSelectedSkin: (value: string) => void;
    onPlay: () => void;
};

const SKINS = [
    "default",
    "fighter",
    "interceptor",
];

export function HomeScreen({
    playerName,
    setPlayerName,
    selectedSkin,
    setSelectedSkin,
    onPlay,
}: HomeScreenProps) {
    const [showError, setShowError] = useState<boolean>(false)

    return (
        <div className="w-screen h-screen bg-linear-to-b from-black to-gray-950 flex items-center justify-center text-white">
            <div className="flex flex-col justify-center items-center bg-black/40 border border-gray-800 backdrop-blur-md rounded-3xl px-12 py-10 shadow-2xl"
            >
                <h1 className="mb-10 text-6xl font-black text-white tracking-wide">Space Arena</h1>
                <div className="relative">
                    {showError && <span className="text-red-500 absolute bottom-full">Invalid Name!</span>}
                    <input
                        value={playerName}
                        maxLength={15}
                        onChange={(e) => {
                            setPlayerName(e.target.value.trimStart())
                            if (playerName) setShowError(false)
                        }}
                        placeholder="Player Name"
                        className="w-80 px-4 py-3 mb-4 rounded bg-gray-900 border border-gray-700"
                    />
                </div>
                <div className="flex gap-2 mb-6">
                    {
                        SKINS.map((skin) => {
                            const image = skinImages[skin];
                            const isSelected = selectedSkin === skin;

                            return (
                                <button
                                    key={skin}
                                    onClick={() => setSelectedSkin(skin)}
                                    className={`relative w-24 h-24 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center 
                                    ${isSelected ? ` border-blue-500 bg-blue-500/20 scale-110` :
                                            `border-gray-700 bg-black/40 hover:border-gray-500`
                                        }`}
                                >
                                    <img
                                        src={image.src}
                                        alt={skin}
                                        className="w-16 h-16 object-contain"
                                    />
                                </button>
                            );
                        })
                    }
                </div>

                <div className="flex justify-center items-center">
                    <button
                        onClick={() => {
                            if (playerName === "") {
                                setShowError(true)
                                return
                            }
                            onPlay()
                        }}
                        className="px-10 py-4 text-lg font-semibold rounded-2xl bg-green-500 hover:bg-green-600 transition-colors"
                    >
                        Play
                    </button>
                </div>
            </div>
        </div>
    );
}