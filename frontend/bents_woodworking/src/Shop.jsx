import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from './components/ui/button.jsx'
import { Card, CardContent, CardFooter } from './components/ui/card.jsx'
import { Loader2, ExternalLink } from 'lucide-react'

function ProductCard({ product }) {
  return (
    <Card className="w-full flex flex-col h-full">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex flex-col items-center mb-4">
          <img
            src={product.image || '/path/to/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="font-semibold text-lg text-center mb-2">{product.title}</h3>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-center p-4">
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          View Product <ExternalLink size={12} className="ml-1" />
        </a>
      </CardFooter>
    </Card>
  )
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5002/documents')
        // Assuming the backend returns an array of arrays with [id, title, tags, link]
        const formattedProducts = response.data.map(product => ({
          id: product[0],
          title: product[1],
          tags: product[2],
          link: product[3],
          image: product[4], // This should be the image data URL from the backend
        }))
        setProducts(formattedProducts)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch products. Please try again later.')
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  )
}
