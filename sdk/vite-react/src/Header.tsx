import React, { useState } from 'react';
import pageData from './page.json';

const Header: React.FC = () => {
	const { header } = pageData;
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800 text-white shadow-xl w-full">
			<div className="px-4 sm:px-6 lg:px-8 2xl:px-16 py-4">
				<div className="flex justify-between items-center max-w-7xl 2xl:max-w-none mx-auto">
					<div className="flex items-center gap-3">
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="drop-shadow-lg"
						>
							<rect
								width="32"
								height="32"
								rx="8"
								fill="url(#gradient)"
							/>
							<path
								d="M16 8L8 14V22L16 28L24 22V14L16 8Z"
								fill="white"
								opacity="0.9"
							/>
							<defs>
								<linearGradient
									id="gradient"
									x1="0"
									y1="0"
									x2="32"
									y2="32"
									gradientUnits="userSpaceOnUse"
								>
									<stop stopColor="#8b5cf6" />
									<stop
										offset="1"
										stopColor="#ec4899"
									/>
								</linearGradient>
							</defs>
						</svg>
						<span className="text-xl font-bold tracking-tight">
							{header.logo}
						</span>
					</div>

					{/* Hamburger Menu Button */}
					<button
						className="lg:hidden text-white p-2"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						aria-label="Toggle menu"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{isMenuOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>

					{/* Desktop Navigation - aligned to right with gap */}
					<nav className="hidden lg:flex gap-8 items-center mr-8 2xl:mr-16">
						{header.navigation.map((item: any, index: number) => (
							<a
								key={index}
								href={item.href}
								className="text-white no-underline hover:text-white font-medium transition-colors relative group"
								style={{ color: 'white', textDecoration: 'none' }}
								onClick={(e) => {
									if (item.href.startsWith('#')) {
										e.preventDefault();
										const element = document.querySelector(item.href);
										if (element) {
											element.scrollIntoView({ behavior: 'smooth' });
										}
									}
								}}
							>
								{item.label}
								<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
							</a>
						))}
					</nav>
				</div>
			</div>

			{/* Mobile Menu Dropdown */}
			{isMenuOpen && (
				<div className="lg:hidden bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800">
					<nav className="flex flex-col px-4 py-4 space-y-3 max-w-7xl 2xl:max-w-none mx-auto">
						{header.navigation.map((item: any, index: number) => (
							<a
								key={index}
								href={item.href}
								className="text-white no-underline hover:text-purple-200 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-800/50"
								style={{ color: 'white', textDecoration: 'none' }}
								onClick={(e) => {
									setIsMenuOpen(false);
									if (item.href.startsWith('#')) {
										e.preventDefault();
										const element = document.querySelector(item.href);
										if (element) {
											element.scrollIntoView({ behavior: 'smooth' });
										}
									}
								}}
							>
								{item.label}
							</a>
						))}
					</nav>
				</div>
			)}

			<div className="text-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gradient-to-b from-transparent to-black/20">
				<h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[140px] leading-[0.9] mb-8 text-white">
					{header.title}
				</h1>
				<p className="text-base sm:text-lg md:text-xl text-white/90 flex flex-col mx-auto px-4">
					{header.subtitle}
				</p>
			</div>
		</header>
	);
};

export default Header;
