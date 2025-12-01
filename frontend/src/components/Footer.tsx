import React from "react";

const Footer = () => {
    return (
        <footer className="bg-black text-white pt-12 pb-0 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 text-sm text-gray-400">

                    {/* Copyright */}
                    <div className="mb-4 md:mb-0">
                        <p>© 2025 StackNStay</p>
                    </div>

                    {/* Language Codes */}
                    <div className="flex items-center gap-6 tracking-wider font-medium">
                        <span className="hover:text-white cursor-pointer transition-colors">GER</span>
                        <span className="hover:text-white cursor-pointer transition-colors">SPA</span>
                        <span className="hover:text-white cursor-pointer transition-colors">SWE</span>
                        <span className="text-white cursor-pointer font-bold">ENG</span>
                        <span className="hover:text-white cursor-pointer transition-colors">RUS</span>
                    </div>
                </div>
            </div>

            {/* Gradient Bar */}
            <div className="w-full h-4 bg-gradient-to-r from-emerald-400 via-purple-500 to-emerald-400"></div>
        </footer>
    );
};

export default Footer;
