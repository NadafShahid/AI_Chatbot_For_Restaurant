  import { MapPin } from "lucide-react";

  export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Diamond Restaurant</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin size={14} />
                    <span>Sangli, Maharashtra</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-sm max-w-md mb-4">
                Experience the finest dining in Sangli. Fresh ingredients, authentic flavors, 
                and exceptional service – delivered to your table or doorstep.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-orange-500">Home</a></li>
                <li><a href="/menu" className="text-gray-400 hover:text-orange-500">Menu</a></li>
                <li><a href="/profile" className="text-gray-400 hover:text-orange-500">My Orders</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-orange-500">Login / Sign Up</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin size={18} className="text-orange-500 mt-1" />
                  <span>Sangli, Maharashtra, India</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="text-sm">📞 +91 98765 43210</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="text-sm">📧 support@diamondrestro.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {currentYear} Diamond Restaurant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }
