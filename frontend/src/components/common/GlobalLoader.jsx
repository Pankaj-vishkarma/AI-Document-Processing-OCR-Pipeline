import { Loader2 } from "lucide-react";

const GlobalLoader = () => {

    return (
        <div className="flex items-center justify-center h-[400px]">

            <Loader2
                className="animate-spin text-black"
                size={40}
            />

        </div>
    );
};

export default GlobalLoader;