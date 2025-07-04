
import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import NairaIcon from '@/components/ui/icons/NairaIcon';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  business_profiles?: {
    name: string;
    verified: boolean;
  };
}

interface ProductDisplayProps {
  product: Product;
  onPurchaseClick: () => void;
}

const ProductDisplay = ({ product, onPurchaseClick }: ProductDisplayProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Image */}
      <div>
        {product.image_url ? (
          <GlassCard className="overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          </GlassCard>
        ) : (
          <GlassCard className="h-96 flex items-center justify-center bg-muted/50">
            <Package className="h-24 w-24 text-muted-foreground" />
          </GlassCard>
        )}
      </div>

      {/* Product Details */}
      <div>
        <GlassCard>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center p-4 bg-background/50 rounded-lg">
              <NairaIcon className="h-6 w-6 text-primary mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">₦{product.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onPurchaseClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Purchase Now - ₦{product.price.toFixed(2)}
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProductDisplay;
