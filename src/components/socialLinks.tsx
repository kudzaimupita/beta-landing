import { FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const SocialLinks = () => {
    return (
        <div className="flex justify-center space-x-6 mt-10">
            <a href="https://x.com/servly_app" className="text-white hover:text-purple-400 transition-colors">
                <FaXTwitter />
            </a>
            <a href="https://www.linkedin.com/company/servlyapp/" className="text-white hover:text-purple-400 transition-colors">
                <FaLinkedin />
            </a>
            <a href="https://www.instagram.com/servlyapp/" className="text-white hover:text-purple-400 transition-colors">
                <FaInstagram />
            </a>
        </div>
    );
};

export default SocialLinks;