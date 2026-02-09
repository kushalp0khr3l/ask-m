import logoImage from '../assets/logo.jpg';

export function WelcomeScreen() {
    return (
        <div className="h-full flex items-center justify-center px-4 md:px-8 pt-40 pb-40">
            <div className="max-w-3xl w-full text-center space-y-6 md:space-y-8">
                {/* Welcome Message */}
                <div className="space-y-3 md:space-y-4">
                    <div className="inline-flex items-center justify-center mb-3 md:mb-4">
                        <img src={logoImage} alt="Ask-M Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                    </div>
                    <h1 className="text-3xl md:text-5xl text-white">
                        Hello KU Student.
                    </h1>
                    <p className="text-lg md:text-2xl text-[#A0A0A0]">
                        What are we studying today?
                    </p>
                </div>
            </div>
        </div>
    );
}