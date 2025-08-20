const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Back2U
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Helping people reconnect with their lost belongings through community support and smart technology.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-primary-500 transition-all duration-300 hover:-translate-y-1">
                📧
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-primary-500 transition-all duration-300 hover:-translate-y-1">
                📞
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-primary-500 transition-all duration-300 hover:-translate-y-1">
                🐦
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-primary-500 transition-all duration-300 hover:-translate-y-1">
                📘
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-300 hover:text-primary-500 transition-colors">Home</a></li>
              <li><a href="#lost-items" className="text-gray-300 hover:text-primary-500 transition-colors">Browse Lost Items</a></li>
              <li><a href="#found-items" className="text-gray-300 hover:text-primary-500 transition-colors">Browse Found Items</a></li>
              <li><a href="#report" className="text-gray-300 hover:text-primary-500 transition-colors">Report an Item</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Support</h4>
            <ul className="space-y-2">
              <li><a href="#help" className="text-gray-300 hover:text-primary-500 transition-colors">Help Center</a></li>
              <li><a href="#faq" className="text-gray-300 hover:text-primary-500 transition-colors">FAQ</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-primary-500 transition-colors">Contact Us</a></li>
              <li><a href="#safety" className="text-gray-300 hover:text-primary-500 transition-colors">Safety Tips</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-12 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">2,500+</div>
              <div className="text-gray-300 text-sm">Items Returned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">10,000+</div>
              <div className="text-gray-300 text-sm">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">50+</div>
              <div className="text-gray-300 text-sm">Cities Covered</div>
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            © 2025 Back2U. All rights reserved. Made with ❤️ for the community.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
