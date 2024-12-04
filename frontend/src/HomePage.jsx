import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Truck, Shield, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";

const sampleProducts = [
  {
    _id: 1,
    name: "Pro Laptop X1",
    category: "Laptops", 
    price: 1299,
    rating: 4.8,
    description: "High-performance laptop with cutting-edge features",
    images: ["https://i.ibb.co/wSHKSNw/laptop.jpg"]
  },
  {
    _id: 2,
    name: "SmartPhone Ultra",
    category: "Phones",
    price: 899,
    rating: 4.9,
    description: "Next-generation smartphone with advanced camera system",
    images: ["https://i.ibb.co/z83Rk5t/phone.jpg"]
  },
  {
    _id: 3, 
    name: "Tablet Pro Max",
    category: "Tablets",
    price: 649,
    rating: 4.7,
    description: "Professional tablet for creators and designers",
    images: ["https://i.ibb.co/1QG82K2/tablet.jpg"]
  },
  {
    _id: 4,
    name: "Wireless Earbuds Pro",
    category: "Audio",
    price: 199,
    rating: 4.6,
    description: "Premium wireless earbuds with active noise cancellation",
    images: ["https://i.ibb.co/vqvCqtB/earbuds.jpg"]
  },
  {
    _id: 5,
    name: "Smart Watch Elite",
    category: "Wearables",
    price: 299,
    rating: 4.5,
    description: "Advanced smartwatch with health monitoring features", 
    images: ["https://i.ibb.co/WcpLL0r/watch.jpg"]
  },
  {
    _id: 6,
    name: "Gaming Console X",
    category: "Gaming",
    price: 499,
    rating: 4.9,
    description: "Next-gen gaming console for immersive gaming experience",
    images: ["https://i.ibb.co/vPqxZYt/console.jpg"]
  }
];

const features = [
  {
    icon: <Shield className="w-16 h-16" />,
    title: "Premium Quality",
    description: "Only the finest tech products from trusted brands worldwide"
  },
  {
    icon: <Truck className="w-16 h-16" />,
    title: "Fast Delivery",
    description: "Free shipping on orders over $100 with same-day delivery"
  },
  {
    icon: <Phone className="w-16 h-16" />,
    title: "24/7 Support",
    description: "Expert assistance available around the clock for your needs"
  }
];

const ProductCard = ({ product }) => (
  <Card className="group transition-all duration-300 hover:shadow-xl">
    <CardContent className="p-6">
      <div className="aspect-square w-full overflow-hidden bg-indigo-50 mb-6">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3">
        <Badge className="bg-indigo-100 text-indigo-900 hover:bg-indigo-200">
          {product.category}
        </Badge>
        <h3 className="font-mono text-xl text-indigo-900">
          {product.name}
        </h3>
        <p className="text-2xl font-mono text-indigo-900">
          ${product.price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-600 fill-current" />
          <span className="font-mono text-sm">{product.rating}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white border-b-2 border-indigo-900">
        <div className="container mx-auto px-8">
          <div className="flex h-24 items-center justify-between">
            <h1 
              className="text-3xl font-mono text-indigo-900 cursor-pointer tracking-tight"
              onClick={() => navigate('/')}
            >
              Gadget Galaxy
            </h1>
            <div className="flex items-center gap-6">
              <Button 
                variant="outline"
                className="rounded-none border-2 border-indigo-900 text-indigo-900 hover:bg-indigo-50 font-mono"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                className="rounded-none bg-indigo-900 hover:bg-indigo-800 font-mono"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <section className="py-32 border-b-2 border-indigo-900 bg-gradient-to-br from-indigo-50 to-white">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-6xl font-mono text-indigo-900 leading-tight">
                  Premium Tech Excellence
                </h2>
                <p className="text-xl font-mono text-indigo-600">
                  Discover cutting-edge technology curated for you.
                </p>
                <Button 
                  size="lg"
                  className="text-lg px-8 py-6 bg-indigo-900 hover:bg-indigo-800 font-mono rounded-none"
                  onClick={() => navigate('/register')}
                >
                  Explore Collection
                </Button>
              </div>
              <div className="hidden lg:block">
  <img 
    src="https://i.ibb.co/p2Lmchh/hero-image.jpg" 
    alt="Hero" 
    className="w-full h-auto rounded-lg shadow-2xl"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Hero+Image';
    }}
  />
</div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-8">
            <h2 className="text-4xl font-mono text-center mb-16 text-indigo-900">
              Why Choose Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {features.map((feature, index) => (
                <div key={index} className="text-center space-y-4 p-8 border-2 border-indigo-900">
                  <div className="text-indigo-900 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-mono text-indigo-900">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-indigo-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-indigo-50">
          <div className="container mx-auto px-8">
            <h2 className="text-4xl font-mono mb-16 text-indigo-900">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleProducts.slice(0, 6).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-indigo-900 text-white py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-mono">GG</h3>
              <p className="font-mono text-indigo-200">Your tech partner</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono">Quick Links</h4>
              <ul className="space-y-2 text-indigo-200 font-mono">
                <li>About Us</li>
                <li>Contact</li>
                <li>Support</li>
                <li>Terms</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono">Categories</h4>
              <ul className="space-y-2 text-indigo-200 font-mono">
                <li>Smartphones</li>
                <li>Laptops</li>
                <li>Audio</li>
                <li>Accessories</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono">Newsletter</h4>
              <p className="text-indigo-200 font-mono">Stay updated with our latest offers</p>
              <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-100 rounded-none font-mono">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;