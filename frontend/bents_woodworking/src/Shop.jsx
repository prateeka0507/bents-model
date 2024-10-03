import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from './components/ui/button.jsx'
import { Card, CardContent, CardFooter } from './components/ui/card.jsx'
import { Loader2, ExternalLink } from 'lucide-react'

function ProductCard({ product }) {
  const imageUrl = product.image_data 
    ? `data:image/jpeg;base64,${product.image_data}`
    : '/path/to/default/image.jpg';

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-0 flex-grow flex flex-col">
        <div className="w-full aspect-square">
          <img src={imageUrl} alt={product.title} className="w-full h-full object-contain" />
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
          <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2">
            View Product
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Delay the fetch by 10 seconds

        const response = await axios.get('https://bents-model-backend.vercel.app/api/products');
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return (
      <div className="text-center mt-8 text-red-500" role="alert">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 py-4 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center">
          Recommended Products
        </h1>
      </header>
      <main>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
