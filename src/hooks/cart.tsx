import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const index = products.findIndex(({ id }) => product.id === id);

      if (index < 0) {
        return setProducts([...products, { ...product, quantity: 1 }]);
      }

      const updatedProducts = products.map((mappedProduct, findIndex) => {
        if (index !== findIndex) {
          return mappedProduct;
        }
        return { ...mappedProduct, quantity: mappedProduct.quantity + 1 };
      });

      return setProducts(updatedProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id !== id) {
          return product;
        }
        return { ...product, quantity: product.quantity + 1 };
      });

      return setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id !== id) {
          return product;
        }
        const newQuantity = product.quantity - 1;
        return { ...product, quantity: newQuantity > 0 ? newQuantity : 0 };
      });

      return setProducts(updatedProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
