type DeathScreenProps = {
    score: number;

    onReturnHome: () => void;

    isShopOpen: boolean;
    setIsShopOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function DeathScreen({
    score,
    onReturnHome,
    isShopOpen,
    setIsShopOpen,
}: DeathScreenProps) {

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white">

            <h1 className="mb-6 text-5xl font-bold text-red-500">
                You Died
            </h1>

            <p className="mb-8 text-2xl">
                Score: {score}
            </p>

            <button
                onClick={() => {

                    onReturnHome();

                    if (isShopOpen) {
                        setIsShopOpen(false);
                    }

                }}
                className="px-8 py-3 rounded bg-blue-600 hover:bg-blue-500"
            >
                Return Home
            </button>

        </div>
    );
}